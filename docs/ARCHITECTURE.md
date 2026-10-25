# Arquitectura del frontend

La aplicación usa Vue 3 con una arquitectura modular por funcionalidad y puertos/adaptadores. Cada área de negocio conserva sus rutas y pantallas. La estructura separa reglas y contratos de negocio, integración con servicios externos y comportamiento de interfaz. Vue Query y los composables pertenecen a presentación porque dependen del ciclo de vida de Vue.

## Estructura

```text
src/
├── main.ts                         # Entrada de Vite
├── app/
│   ├── bootstrap.ts                # Orden de inicialización y manejo global de errores
│   ├── App.vue                     # Contenedor de rutas
│   ├── providers/                  # Registro de adaptadores y conexión HTTP/sesión
│   ├── router/                     # Composición de rutas, guards e historial
│   └── layouts/                    # Layouts y navegación que coordinan módulos
├── modules/
│   └── <área>/
│       ├── config/                 # Configuración propia del área
│       ├── domain/                 # Contratos y modelos compartidos por sus features
│       ├── application/            # Puertos y claves de consulta independientes de Vue
│       ├── infrastructure/         # Implementaciones de repositorios
│       ├── presentation/           # Layout, rutas, stores y composables del área
│       └── features/
│           └── <funcionalidad>/
│               ├── domain/         # DTO, reglas, interfaces de repositorio
│               ├── application/ports/
│               ├── infrastructure/ # HTTP y mappers de respuestas
│               └── presentation/
│                   ├── views/
│                   ├── components/
│                   ├── composables/
│                   └── validation/ # Esquemas de formulario
└── shared/
    ├── domain/                     # Funciones puras transversales
    ├── application/ports/          # Contratos de servicios transversales
    ├── infrastructure/             # HTTP, caché de consultas y utilidades del navegador
    ├── presentation/               # UI, composables, DI y descargas
    └── utils/                      # Formato, errores y operaciones de caché reutilizadas
```

Se crean únicamente las carpetas que tienen contenido. Los módulos pequeños no necesitan una carpeta `features/` adicional. `notifications` es un módulo de negocio; los componentes de perfil pertenecen a `settings`.

## Dependencias

- **Dominio**: modelos, reglas puras e interfaces. No importa Vue, Pinia, Axios, componentes ni implementaciones HTTP.
- **Aplicación**: define puertos tipados y contratos de coordinación independientes de frameworks. No importa infraestructura ni presentación.
- **Infraestructura**: implementa los contratos mediante Axios o Socket.IO y normaliza las respuestas con mappers cuando corresponde. No importa presentación.
- **Presentación**: usa composables como fachada de consultas, mutaciones y acciones. Obtiene repositorios a través de puertos con `useService`; no importa adaptadores concretos del módulo.
- **Composición**: `app/providers` conecta puertos y adaptadores. `app/router` integra rutas y guards. Los layouts que coordinan módulos viven en `app`.
- **Shared**: no depende de módulos de negocio. Las utilidades compartidas de navegador y caché pueden ser utilizadas por presentación; no se trasladan al dominio.

`pnpm check:architecture` verifica importaciones locales, fronteras de capa, captura síncrona de servicios y ciclos estáticos. Los imports de tipos también respetan las capas; los imports dinámicos no se consideran ciclos de inicialización.

## Patrones aplicados

**Repository y Adapter.** El contrato describe operaciones del negocio y el adaptador encapsula endpoints, parámetros de ámbito y transformación de respuestas. No se introduce un repositorio CRUD genérico: ventas, contabilidad y producción tienen operaciones distintas.

**Inversión de dependencias y composition root.** Las claves `ServiceKey<T>` son independientes de Vue. `provideService` y `useService` adaptan esos contratos al contexto de una aplicación Vue. El registro en `app/providers/repositories.ts` es explícito y comprobado por TypeScript. Las pruebas pueden registrar implementaciones falsas sin cambiar vistas ni hooks.

**Composition API y fachadas de presentación.** Los composables agrupan consultas, mutaciones, invalidación de caché y feedback. Las vistas manejan composición visual e interacción. Las acciones que se ejecutan después de setup capturan sus dependencias al crear el composable; nunca llaman `inject` desde un callback asíncrono.

**Mapper.** Los mappers de infraestructura normalizan diferencias entre respuestas HTTP y modelos consumidos por la interfaz, sin cambiar el contrato de los componentes.

**Responsabilidad única.** Navegación y esquemas de formularios están en presentación; cálculos monetarios están en dominio; la descarga de archivos y los efectos del navegador están fuera del dominio.

## Estado y sincronización

- Vue Query es responsable de datos del servidor, claves de caché, estados de carga y mutaciones. Los hooks conservan las invalidaciones entre features relacionadas.
- Pinia conserva sesión, preferencias y estado compartido de interfaz. No se duplica un listado remoto en un store si Vue Query ya lo administra.
- La URL de API, el origen de sockets y las descargas legacy se derivan de `shared/config/env.config.ts`.
- El cliente HTTP recibe callbacks de sesión desde `app/providers/http-session.ts`. No importa el store de autenticación. Un 401 delega la limpieza y navegación a la composición de la aplicación.
- La sesión local se restaura antes de instalar el router. La actualización del perfil continúa en segundo plano.
- Los puertos de archivos y directorios conservan `applicationSlug`, parámetros de consulta y expiración. La autorización continúa siendo responsabilidad del backend.

## Convenciones

- Componentes y vistas: `PascalCase.vue`. Composables: `useNombre.ts`. Contratos: `*.types.ts`, `*.repository.ts`, `*.port.ts`. Adaptadores HTTP: `*.api.repository.ts` o `*.api.adapter.ts`.
- Imports dentro de una feature: relativos. Imports transversales: `@shared/*`, `@app/*`, `@modules/*`. `@/*` sigue disponible para recursos generales.
- Imports directos al archivo que se consume. No crear barrels globales con `export *` que mezclen componentes, infraestructura y reglas. Los agregadores pequeños de UI o rutas pueden mantener una API explícita.
- Los esquemas Yup existentes permanecen en presentación para conservar los formularios. Este cambio de arquitectura no migra simultáneamente la librería de validación.
- Cada módulo expone sus rutas desde `presentation/router`; el router global acepta un historial para probarlo sin navegador. Las pantallas siguen cargándose de forma diferida.
- ExcelJS se importa al solicitar una exportación. Los paneles de depuración se habilitan solo en desarrollo.

## Verificación

```sh
pnpm check:architecture # Capas, imports y ciclos
pnpm typecheck         # Aplicación, Vite y tests
pnpm test              # Regresión, puertos, sesión HTTP y contrato de rutas
pnpm build             # Tipos de producción y bundle
pnpm verify            # Todos los controles y build
```

El contrato `tests/contracts/routes.json` se capturó antes de la reorganización. Las pruebas comparan paths, nombres, metadatos y redirects de las 313 rutas y cargan todos sus componentes diferidos. Si un cambio de producto modifica rutas, hay que revisar y actualizar el contrato explícitamente.

Las pruebas de transporte usan adaptadores simulados. No reemplazan pruebas integrales con una API, datos reales y los permisos de cada rol.

## Referencias

- [Vue: composables](https://vuejs.org/guide/reusability/composables)
- [Vue: gestión del estado](https://vuejs.org/guide/scaling-up/state-management)
- [Vue: rendimiento y carga diferida](https://vuejs.org/guide/best-practices/performance)
- [Pinia: stores y uso fuera de componentes](https://pinia.vuejs.org/core-concepts/)
