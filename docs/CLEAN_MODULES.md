# Clean Architecture + módulos (feature-driven)

Este documento fija el **modelo objetivo** para escalar sin mezclar “capas técnicas” con “dominio real”. Complementa [ARCHITECTURE.md](./ARCHITECTURE.md) (alias `@app`, `@modules`, `@layouts`, etc.).

## Namespace `@modules/*` (import único)

En código **solo** se importa con `@modules/...`. En disco, por ahora:

| Prefijo import | Ubicación física actual |
|----------------|-------------------------|
| `@modules/ventas/*` | `src/modules/ventas/*` (features de negocio bajo `ventas/features/`) |
| `@modules/alquileres/*` | `src/modules/alquileres/*` (features bajo `alquileres/features/`) |
| `@modules/shell/*` | `src/modules/shell/*` |
| `@modules/settings/*` | `src/modules/settings/*` |
| `@modules/auth/*` | `src/modules/auth/*` |
| `@modules/applications/*` | `src/modules/applications/*` |
| Notificaciones | `src/shared/notifications/*` (barrel `@shared/notifications`) |

## Principio

- **Por dominio primero**: cada producto (`ventas`, `alquileres`, …) y cada subdominio (`agentes`, `clientes`, …) es un módulo con fronteras claras.
- **Por capas dentro del módulo**: domain → application → infrastructure → presentation.
- **Alquileres y Ventas son independientes**: no compartir `useAgents` ni servicios entre apps salvo que exista un contrato explícito en `shared/` (hoy no aplica a agentes).

## Capas por módulo

| Capa | Contenido típico |
|------|-------------------|
| **domain** | Tipos, constantes de negocio del slice, reglas puras (sin HTTP). |
| **application** | Casos de uso: composables que orquestan estado + llamadas al servicio. |
| **infrastructure** | HTTP (services), esquemas de validación acoplados a librerías (Yup), mappers. |
| **presentation** | Vistas Vue, componentes locales del slice, `router`. |

Regla: **API HTTP solo en infrastructure**; la UI solo en presentation; tipos “del negocio del slice” en domain.

## Estructura de ejemplo (referencia)

```text
ventas/
  ├── presentation/     # layout, home, router principal
  ├── features/
  │     └── agentes/
  │           domain/
  │           application/
  │           infrastructure/
  │           presentation/
  │           index.ts
  └── index.ts
```

## Estado actual del repo

- **Ventas**: submódulos bajo `ventas/features/` (`agentes`, `clientes`, `propiedades`, `ventas-sales`, `ventas-finanzas`, `ventas-reportes`, `ventas-configuracion`). Imports: `@modules/ventas/features/...` y alias `@ventas/sales`, `@ventas/finanzas`, etc. (resuelven a `features/...`).
- **Alquileres**: `alquileres/presentation/` = shell (layout, home, router), como `ventas/presentation/`. Submódulos bajo `alquileres/features/`; el slice `features/alquileres` = contratos (`rental`) + vistas de contratos. Imports: `@modules/alquileres` reúne feature + rutas + layout composable.

## Referencia rápida: ¿dónde va esto?

| Tipo | Capa / lugar |
|------|----------------|
| Llamada API | infrastructure |
| Lógica de casos de uso + Vue Query | application |
| Tipos del slice | domain |
| Vistas y router del slice | presentation |
| Design system genérico | shared |
