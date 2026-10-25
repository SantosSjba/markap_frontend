import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

const root = process.cwd()
const sourceRoot = path.join(root, 'src')
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(dir, entry.name)
  return entry.isDirectory() ? walk(target) : /\.(ts|vue)$/.test(entry.name) ? [target] : []
})
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile).config
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options
const files = walk(sourceRoot)
const graph = new Map()
const errors = []
const relative = file => path.relative(root, file).replaceAll(path.sep, '/')
function resolve(file, specifier) {
  const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule?.resolvedFileName
  if (resolved) return resolved
  let target = specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : null
  if (specifier.startsWith('@/')) target = path.join(sourceRoot, specifier.slice(2))
  for (const [alias, directory] of [['@app/', 'app'], ['@shared/', 'shared'], ['@modules/', 'modules']]) {
    if (specifier.startsWith(alias)) target = path.join(sourceRoot, directory, specifier.slice(alias.length))
  }
  return target && [target, `${target}.ts`, `${target}.vue`, `${target}/index.ts`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8')
  if (file.endsWith('.vue')) {
    const { descriptor } = parse(code, { filename: file })
    code = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n')
  }
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true)
  const origin = relative(file)
  const edges = []
  const inspect = node => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useService') {
      let owner = node.parent
      while (owner && !ts.isFunctionLike(owner)) owner = owner.parent
      const isComposable = owner?.name?.getText(source)?.startsWith('use')
      const isStore = owner?.parent && ts.isCallExpression(owner.parent) && owner.parent.expression.getText(source) === 'defineStore'
      const isAsync = owner?.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
      if ((owner && (!isComposable && !isStore || isAsync)) || (!owner && !file.endsWith('.vue'))) {
        errors.push(`${origin}: useService debe capturarse en setup, en un composable síncrono o al crear el store`)
      }
    }
    let specifier, typeOnly = false, dynamic = false
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier?.text
      typeOnly = node.isTypeOnly || node.importClause?.isTypeOnly ||
        (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && !node.importClause.name && node.importClause.namedBindings.elements.every(e => e.isTypeOnly))
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
      specifier = node.arguments[0].text
      dynamic = true
    }
    if (specifier) {
      const dependency = resolve(file, specifier)
      const target = dependency ? relative(dependency) : specifier
      const local = dependency?.startsWith(sourceRoot + path.sep)
      const fail = message => errors.push(`${origin}: ${message} (${specifier})`)
      if ((specifier.startsWith('.') || specifier.startsWith('@/') || /^@(app|shared|modules)\//.test(specifier)) && !dependency) fail('Importación local inexistente')
      if (origin.includes('/domain/') || origin.includes('/application/')) {
        if (local && /\/(presentation|infrastructure|app)\//.test(target)) fail('Dominio/aplicación depende de una capa externa')
        if (/^(vue|vue-router|pinia|axios|@tanstack\/|vee-validate|yup|socket.io)/.test(specifier)) fail('Dominio/aplicación depende del framework o transporte')
      }
      if (origin.startsWith('src/shared/') && local && target.startsWith('src/modules/')) fail('Shared depende de un módulo de negocio')
      if (origin.includes('/presentation/') && local && target.startsWith('src/modules/') && target.includes('/infrastructure/')) fail('Presentación depende de un adaptador concreto del módulo')
      if (origin.includes('/infrastructure/') && local && target.includes('/presentation/')) fail('Infraestructura depende de presentación')
      if (origin.includes('/presentation/views/') && (specifier === 'axios' || (local && target.endsWith('/api-client.ts')))) fail('La vista accede directamente al transporte')
      if (local && !typeOnly && !dynamic) edges.push(dependency)
    }
    ts.forEachChild(node, inspect)
  }
  inspect(source)
  graph.set(file, edges)
}
const visiting = new Set(), visited = new Set(), stack = []
function visit(file) {
  if (visiting.has(file)) {
    errors.push(`Ciclo: ${[...stack.slice(stack.indexOf(file)), file].map(relative).join(' -> ')}`)
    return
  }
  if (visited.has(file)) return
  visiting.add(file); stack.push(file)
  for (const target of graph.get(file) ?? []) visit(target)
  stack.pop(); visiting.delete(file); visited.add(file)
}
for (const file of files) visit(file)
if (errors.length) {
  console.error([...new Set(errors)].join('\n'))
  process.exitCode = 1
} else console.log(`Arquitectura válida: ${files.length} archivos, capas y dependencias sin ciclos estáticos.`)
