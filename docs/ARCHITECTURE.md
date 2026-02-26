# Arquitectura del Frontend — Feature-Based (Clean + Modular)

Este documento describe la arquitectura del proyecto frontend MARKAP, basada en **Feature-Sliced Design (FSD)** y principios **Clean Architecture**, alineada con las aplicaciones y funciones del backend.

## Principios

- **Organización por características (features)**: El código se agrupa por dominio de negocio y por aplicación, no por tipo técnico.
- **Capas y dependencias**: Las dependencias solo apuntan hacia abajo (capas inferiores). Shared no conoce Features; Features no conoce Applications.
- **API pública por módulo**: Cada feature/application expone solo lo necesario vía `index.ts` (public API).
- **Escalabilidad por aplicaciones**: El backend define aplicaciones (Alquileres, Ventas, Interiorismo, etc.); cada una tiene sus propias funciones. El frontend refleja esa estructura en la capa `applications`.

## Capas (de abajo a arriba)

```
  ┌─────────────────────────────────────────────────────────┐
  │  app          → Entrada, router, guards, plugins, estilos │
  ├─────────────────────────────────────────────────────────┤
  │  applications → Aplicaciones de negocio (shell, alquileres, settings) │
  ├─────────────────────────────────────────────────────────┤
  │  features     → Funcionalidades transversales (auth, applications, notifications) │
  ├─────────────────────────────────────────────────────────┤
  │  widgets      → Bloques de UI reutilizables (layouts, header, sidebar) │
  ├─────────────────────────────────────────────────────────┤
  │  shared       → UI kit, API client, config, lib, composables, types │
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

**Regla**: No importar desde `features`, `applications` ni `app`.

---

### 2. `widgets/`

Bloques grandes de UI reutilizables (layouts, cabecera, barra lateral).

| Widget / archivo | Uso |
|------------------|-----|
| `MainLayout`    | Layout principal con sidebar. |
| `SectionLayout` | Sección con título y contenido. |
| `AuthLayout`    | Layout para login/recuperar contraseña. |
| `AppHeader`, `AppSidebar` | Partes del layout. |

**Regla**: Pueden usar `shared` y, si hace falta, `features` (por ejemplo auth para usuario en header). No depender de `applications`.

---

### 3. `features/`

Funcionalidades transversales reutilizables en varias aplicaciones.

| Feature         | Responsabilidad |
|-----------------|------------------|
| `auth/`        | Login, logout, recuperar contraseña, store de sesión, guard. |
| `applications/`| Selector de aplicaciones, menús por aplicación, datos de apps. |
| `notifications/`| Notificaciones en tiempo real (store, servicio, socket). |

Estructura típica por feature:

- `api/` — llamadas al backend.
- `model/` o `stores/` — estado (Pinia).
- `composables/` — lógica reutilizable.
- `ui/` — vistas (login, selector de apps, etc.).
- `router/` — rutas del feature.

**Regla**: Pueden usar `shared` y `widgets`. No importar de `applications`.

---

### 4. `applications/`

Cada “aplicación” del negocio (como en el backend). Agrupa páginas, subfunciones y router.

| Aplicación   | Contenido |
|-------------|-----------|
| `shell/`    | Selector de aplicaciones, dashboard global, páginas 401/404. |
| `alquileres/`| App Alquileres: home, perfil, clientes, propiedades, agentes, contratos, reportes, etc. Cada subfunción puede tener `api/`, `model/`, `ui/`, `router/`. |
| `settings/` | Configuración global: perfil, usuarios, roles, roles por aplicación. |

Estructura recomendada por aplicación (ej. `alquileres/`):

- `layout/` — layout específico de la app (ej. `AlquileresLayout.vue`).
- `pages/` — vistas propias de la app (home, perfil, placeholders).
- `clientes/`, `propiedades/`, `agentes/`, `contratos/`, `reportes/` — una carpeta por función, cada una con:
  - `api/` o `services/`
  - `composables/` o `model/`
  - `ui/` (vistas)
  - y rutas que se integran en el router de la aplicación.
- `router/` — `index.ts` que monta todas las rutas de la aplicación (incluidas las de clientes, propiedades, etc.).

**Regla**: Pueden usar `shared`, `widgets` y `features`. No importar de otra aplicación (salvo convenios explícitos vía `shared` o `features`).

---

### 5. `app/`

Todo lo que hace arrancar la aplicación.

| Segmento      | Contenido |
|---------------|-----------|
| `api/`        | Cliente HTTP (axios) con interceptores y token de auth. |
| `routes/`     | Router principal: combinación de rutas de `features` y `applications`, guards. |
| `guards/`     | Guards de navegación (auth). |
| `plugins/`    | Plugins globales (Pinia, Vue Query, etc.). |
| `styles/`     | Estilos globales (opcional; también en `assets/`). |

El punto de entrada (`main.ts`) sigue en `src/` y usa el router y los plugins desde `app/`.

**Regla**: Conoce todas las capas; ensambla la aplicación.

---

## Alias de rutas (Vite / TypeScript)

| Alias          | Ruta        |
|----------------|------------|
| `@/`           | `src/`     |
| `@app/`       | `src/app/` |
| `@shared/`    | `src/shared/` |
| `@features/`  | `src/features/` |
| `@applications/` | `src/applications/` |
| `@widgets/`   | `src/widgets/` |

No se usan `@core` ni `@modules`; todo el código vive en las capas anteriores.

---

## Regla de dependencias

- **shared** ← nadie (base).
- **widgets** ← shared (y opcionalmente features para datos globales).
- **features** ← shared, widgets.
- **applications** ← shared, widgets, features.
- **app** ← shared, widgets, features, applications.

Nunca: `shared` → `features` o `applications`; `features` → `applications`.

---

## Cómo extender el proyecto

Para agregar nuevas aplicaciones, funciones dentro de una app o features transversales, sigue la guía **[Cómo agregar nuevas funcionalidades](./ADDING_FEATURES.md)**.

## Referencias

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Clean Architecture en frontend (FSD)](https://feature-sliced.design/blog/frontend-clean-architecture)
- Backend: aplicaciones y funciones en `prisma/seed.ts` y rutas API.
