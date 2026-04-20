# Arquitectura del Frontend — Feature-Based (Clean + Modular)

Este documento describe la arquitectura del proyecto frontend MARKAP, basada en **Feature-Sliced Design (FSD)** y principios **Clean Architecture**, alineada con las aplicaciones y funciones del backend.

## Principios

- **Organización por características (features)**: El código se agrupa por dominio de negocio y por aplicación, no por tipo técnico.
- **Capas y dependencias**: Las dependencias solo apuntan hacia abajo. `shared` no importa `@modules/*`. Los módulos de producto no se cruzan (p. ej. Ventas ⟂ Alquileres) salvo contratos explícitos en `shared`.
- **API pública por módulo**: Cada feature/application expone solo lo necesario vía `index.ts` (public API).
- **Escalabilidad por aplicaciones**: El backend define aplicaciones (Alquileres, Ventas, etc.); el frontend las refleja como **`@modules/ventas`**, **`@modules/alquileres`**, etc.

## Capas (de abajo a arriba)

```
  ┌─────────────────────────────────────────────────────────┐
  │  app          → Entrada, router, guards, plugins, estilos │
  ├─────────────────────────────────────────────────────────┤
  │  modules (@modules/*) → Ventas, Alquileres, shell, settings, auth, selector apps, notificaciones │
  ├─────────────────────────────────────────────────────────┤
  │  layouts      → Shell global (MainLayout, AuthLayout, header, sidebar) en `shared/layouts`, alias `@layouts` │
  ├─────────────────────────────────────────────────────────┤
  │  shared       → UI kit, config, utils, composables, types (+ layouts físicos) │
  └─────────────────────────────────────────────────────────┘
```

### 1. `shared/`

Base reutilizable, sin lógica de negocio específica.

| Segmento   | Contenido |
|-----------|-----------|
| `ui/`     | Componentes de interfaz (botones, inputs, tablas, modales, etc.). |
| `config/` | Constantes, variables de entorno, flags. |
| `lib/`    | Utilidades (formatters, validators). |
| `composables/` | Hooks reutilizables (paginación, tema, notificaciones). |
| `types/`  | Tipos e interfaces comunes. |

**Regla**: Evitar acoplar `shared` a reglas de negocio de una app. Excepciones puntuales (p. ej. componentes de perfil que leen sesión vía `@modules/auth`) deben mantenerse acotadas.

---

### 2. `shared/layouts/` (alias `@layouts`)

Layouts y piezas del marco visual global (post-login hub y auth).

| Archivo / carpeta | Uso |
|-------------------|-----|
| `MainLayout`      | Layout principal con sidebar. |
| `SectionLayout`   | Sección con título y contenido. |
| `AuthLayout`      | Login / recuperar contraseña. |
| `components/`     | `AppHeader`, `AppSidebar`, `AppLayoutSidebar`. |

**Regla**: Pueden usar `shared` y, si hace falta, `@modules/auth` o `@modules/notifications` en header. No acoplar a otra app de negocio.

---

### 3. Módulos de producto y plataforma — alias `@modules/*`

Todo el dominio (Ventas, Alquileres, shell, settings, login, selector de apps, notificaciones) se importa como **`@modules/...`**. El mapa **carpeta física ↔ alias** está en [CLEAN_MODULES.md](./CLEAN_MODULES.md).

**Regla**: Pueden usar `shared` y `@layouts`. No importar `alquileres` desde `ventas` (ni al revés), salvo `shared` explícito.

---

### 4. Estructura por aplicación

- **Ventas** y **Alquileres**: submódulos de negocio bajo `modules/<app>/features/`, con capas **domain / application / infrastructure / presentation** por slice (ver [CLEAN_MODULES.md](./CLEAN_MODULES.md) y [ARCHITECTURE.md](../ARCHITECTURE.md) en la raíz del frontend).

#### Ventas — submódulos y alias `@ventas/*`

| Alias | Carpeta física |
|-------|----------------|
| `@ventas/sales/...` | `src/modules/ventas/features/ventas-sales/...` |
| `@ventas/finanzas/...` | `src/modules/ventas/features/ventas-finanzas/...` |
| `@ventas/reportes/...` | `src/modules/ventas/features/ventas-reportes/...` |
| `@ventas/configuracion/...` | `src/modules/ventas/features/ventas-configuracion/...` |

---

### 5. `core/` y `router/`

Arranque y ensamblaje global.

| Segmento      | Contenido |
|---------------|-----------|
| `core/api/`   | Cliente HTTP (axios) con interceptores y token de auth. |
| `src/router/` | Router principal: rutas de módulos + guards. |
| `core/guards/` | Guards de navegación (auth). |
| `core/plugins/` | Plugins globales (Pinia, Vue Query, etc.). |

El punto de entrada (`main.ts`) está en `src/` y usa `router` y `@core/plugins`.

**Regla**: Conoce todas las capas; ensambla la aplicación.

---

## Alias de rutas (Vite / TypeScript)

| Alias          | Ruta        |
|----------------|------------|
| `@/`           | `src/`     |
| `@core/`      | `src/core/` |
| `@shared/`    | `src/shared/` |
| `@layouts/`   | `src/shared/layouts/` |
| `@modules/ventas/*`, `@modules/alquileres/*`, `@modules/shell/*`, `@modules/settings/*` | Ver [CLEAN_MODULES.md](./CLEAN_MODULES.md) |
| `@modules/auth/*`, `@modules/applications/*` | `src/modules/auth`, `src/modules/applications` |
| `@shared/notifications` | `src/shared/notifications` |
| `@ventas/sales`, … | Submódulos Ventas (tabla arriba) |

---

## Regla de dependencias

- **shared** ← nadie (base).
- **layouts** (`@layouts`) ← shared (y opcionalmente `@modules/auth` / `@modules/notifications` en header).
- **modules** (`@modules/*`) ← shared, `@layouts` (y entre sí solo según reglas de dominio).
- **app** ← shared, `@layouts`, `@modules/*`.

Nunca: `shared` → `@modules/*` para lógica de negocio; un módulo de app no importa otro módulo de app salvo `shared`.

---

## Cómo extender el proyecto

Para agregar nuevas aplicaciones, funciones dentro de una app o features transversales, sigue la guía **[Cómo agregar nuevas funcionalidades](./ADDING_FEATURES.md)**.

## Módulos con capas (Clean + feature-driven)

Para el modelo **domain / application / infrastructure / presentation** dentro de cada subdominio (y la independencia **Ventas ⟂ Alquileres**), ver **[CLEAN_MODULES.md](./CLEAN_MODULES.md)**. **Ventas `agentes` y `clientes`** ya siguen ese esquema.

## Referencias

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Clean Architecture en frontend (FSD)](https://feature-sliced.design/blog/frontend-clean-architecture)
- Backend: aplicaciones y funciones en `prisma/seed.ts` y rutas API.
