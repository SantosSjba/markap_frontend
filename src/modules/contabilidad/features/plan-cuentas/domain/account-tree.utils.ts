import type { ContabilidadAccountDTO } from '../domain/account.types'

export function flattenAccountTree(tree: ContabilidadAccountDTO[]): ContabilidadAccountDTO[] {
  const out: ContabilidadAccountDTO[] = []
  const walk = (nodes: ContabilidadAccountDTO[]) => {
    for (const node of nodes) {
      out.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return out
}

export type VisibleAccountRow = ContabilidadAccountDTO & {
  depth: number
  hasChildren: boolean
}

export function buildVisibleAccountRows(
  tree: ContabilidadAccountDTO[],
  expandedIds: Set<string>,
  searchActive: boolean,
): VisibleAccountRow[] {
  if (searchActive) {
    return flattenAccountTree(tree).map((row) => ({
      ...row,
      depth: Math.max(0, row.level - 1),
      hasChildren: Boolean(row.children?.length),
    }))
  }

  const rows: VisibleAccountRow[] = []

  const walk = (nodes: ContabilidadAccountDTO[], depth: number) => {
    for (const node of nodes) {
      const hasChildren = Boolean(node.children?.length)
      rows.push({ ...node, depth, hasChildren })
      if (hasChildren && expandedIds.has(node.id)) {
        walk(node.children!, depth + 1)
      }
    }
  }

  walk(tree, 0)
  return rows
}

export function collectExpandableIds(tree: ContabilidadAccountDTO[]): string[] {
  const ids: string[] = []
  const walk = (nodes: ContabilidadAccountDTO[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        ids.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(tree)
  return ids
}
