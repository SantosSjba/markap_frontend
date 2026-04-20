# Arquitectura del frontend (Markap)

Este documento fija **convenciones** para que la Clean Architecture no se degrade con el tiempo.

## Layout global

```
src/
├── core/           # Infra transversal: API client, guards, plugins
├── modules/        # Funcionalidad por dominio de negocio (auth, ventas, alquileres, …)
├── shared/         # UI y utilidades reutilizables (layouts, notifications con capas, …)
└── router/         # Registro único de rutas (Vue Router)
```

El **router de aplicación** vive en `src/router/index.ts`. No hay duplicado bajo `core/routes`.

## Slice de módulo (obligatorio para features)

Cada submódulo (ej. `modules/ventas/features/clientes`) sigue:

```
clientes/
├── domain/           # Tipos, constantes, interfaces de puertos (repositorios)
│   └── index.ts      # Reexport opcional
├── application/      # Casos de uso + integración Vue Query (sin Vue Router)
│   └── index.ts
├── infrastructure/   # HTTP, schemas de formulario, sockets
│   └── schemas/      # Solo aquí
└── presentation/     # Vistas, router del slice, composables que usen Vue Router
    ├── views/
    ├── router/
    └── composables/  # Opcional (ej. layout con useRoute)
```

### Reglas de importación (resumen)

1. **domain** no importa nada de otras capas ni frameworks.
2. **infrastructure** implementa puertos definidos en domain; usa `@core/api` u otras librerías técnicas.
3. **application** orquesta casos de uso; puede usar el adaptador concreto desde infrastructure; **no** usa `useRouter` / navegación.
4. **presentation** consume **application**; solo `import type` desde **domain** si hace falta; **no** importa infrastructure (preferir barrel `@modules/...` o hooks).

## Barrels (`index.ts`)

- Raíz del submódulo: `export * from './domain'`, `export * from './application'`, `export * from './presentation'`, más servicios públicos si aplica (`clients.service`, etc.).
- Objetivo: consumir `import { X } from '@modules/ventas/features/clientes'` en lugar de rutas largas internas.

## Módulo Ventas

Las funcionalidades de negocio viven bajo **`modules/ventas/features/`**: `agentes`, `clientes`, `propiedades`, `ventas-sales`, `ventas-finanzas`, `ventas-reportes`, `ventas-configuracion`. La cáscara (layout, home, router principal) está en **`modules/ventas/presentation`** y el barrel raíz en **`modules/ventas/index.ts`**.

- Imports: `@modules/ventas/features/clientes`, etc.
- Alias de producto (sin cambiar): `@ventas/sales`, `@ventas/finanzas`, `@ventas/reportes`, `@ventas/configuracion` (apuntan a `features/...` vía `vite` / `tsconfig`).

## Ejemplo de puerto (Ventas — sales)

- Contrato: `features/ventas-sales/domain/repositories/ventas-sales.repository.ts` → `VentasSalesRepository`.
- Implementación HTTP: `features/ventas-sales/infrastructure/repositories/ventas-sales.api.repository.ts`.
- Mapeo API → dominio: `features/ventas-sales/infrastructure/mappers/ventas-sales-api.mapper.ts`.
- Registro: `ventasSalesApiRepository` / `ventasSalesRepository` en `ventas-sales.api.repository.ts` (barrel opcional en `index.ts`).
- Casos de uso: `useVentasSales` instancia/importa el adaptador desde `infrastructure/repositories/ventas-sales.api.repository`.

## Ejemplo de puerto (Alquileres — contratos)

- Contrato: `modules/alquileres/features/alquileres/domain/repositories/rentals.repository.ts` → `RentalsRepository`.
- Implementación HTTP: `modules/alquileres/features/alquileres/infrastructure/repositories/rentals.api.repository.ts`.
- Mapeo: `modules/alquileres/features/alquileres/infrastructure/mappers/rental.mapper.ts`.
- Registro del puerto: mismo archivo que la implementación (`rentalsRepository` exportado en `rentals.api.repository.ts`).
- URLs de adjuntos (HTTP puro): `modules/alquileres/features/alquileres/infrastructure/http/rental-attachment-url.ts`.

## Shared / notifications

`shared/notifications` está partido en **domain**, **infrastructure** (API + socket) y **application** (store Pinia), con barrel en `shared/notifications/index.ts`.

## Módulo Alquileres

**Nombre del módulo (`modules/alquileres`):** agrupa el **producto** Alquileres en Markap (ruta `/alquileres`, slug de API `alquileres`). Ese slug no es el dominio de “contratos”: el feature de contratos es **`rental` / `RentalsRepository` / `/rentals`**. Constantes de módulo (como en Ventas: `modules/ventas/config/`): **`modules/alquileres/config/`** — `routes.constants.ts` (`ALQUILERES_BASE_PATH`) y `app.constants.ts` (`ALQUILERES_APP_SLUG` para `applicationSlug` en API).

Las funcionalidades de negocio (clientes, propiedades, agentes, cobranzas, configuración, reportes) viven bajo **`modules/alquileres/features/<nombre>`**. Igual que en **Ventas**, el **shell** (layout, home, perfil, router principal) está en **`modules/alquileres/presentation/`**. El feature **`modules/alquileres/features/alquileres/`** agrupa dominio de contratos (`rental`), `application`/`infrastructure` y **solo** las vistas de flujo de contratos (listado, detalle, edición, etc.), análogo a cómo `ventas-sales` tiene su `presentation` de procesos sin absorber el layout de Ventas.

Imports públicos: `@modules/alquileres/features/clientes`, etc.

## Cómo añadir un submódulo nuevo

1. En **Alquileres** o **Ventas**, crear el slice bajo `modules/<app>/features/<nombre>/` con las cuatro capas e `index.ts` por capa si aplica.
2. Definir tipos en domain; API en infrastructure; hooks Vue Query en application; vistas y router en presentation.
3. Exportar todo desde el `index.ts` raíz del submódulo.
4. Registrar rutas en `modules/<app>/presentation/router/index.ts` importando el barrel (`@modules/<app>/features/...`). En Ventas, si el slice debe exponerse también como `@ventas/alias`, añadir la entrada en `vite.config.ts` y `tsconfig.app.json`.

## Herramientas

La regla de Cursor `.cursor/rules/clean-architecture-imports.mdc` refuerza estas convenciones en el editor.
