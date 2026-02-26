# Cómo agregar nuevas funcionalidades

Esta guía describe los pasos para extender el frontend siguiendo la **Arquitectura por Features (Clean + Modular)**. Consulta [ARCHITECTURE.md](./ARCHITECTURE.md) para el contexto de capas y dependencias.

---

## Resumen rápido

| Quiero agregar… | Dónde | Pasos clave |
|-----------------|--------|-------------|
| Una **funcionalidad transversal** (ej. exportar PDF, firma digital) | `features/` | Nuevo slice, api + ui/composables, exportar en `index.ts`, registrar rutas si aplica en `app/routes`. |
| Una **nueva aplicación** (ej. Ventas, Contabilidad) | `applications/` | Nueva carpeta con layout, páginas, router; registrar en `app/routes`. |
| Una **nueva función dentro de una app** (ej. Cobranzas en Alquileres) | `applications/<app>/<funcion>/` | Carpeta con services, composables, views, router; integrar en el router de la app. |
| Un **componente reutilizable sin negocio** | `shared/` | Componente en `shared/components`, exportar en el index correspondiente. |
| Un **layout o bloque grande reutilizable** | `widgets/` | Nuevo componente en `widgets/`, exportar en `widgets/index.ts`. |

---

## 1. Agregar una nueva **aplicación** (ej. Ventas)

Las aplicaciones son productos/áreas de negocio (Alquileres, Ventas, etc.). Cada una tiene su propia URL base y menú.

### Pasos

1. **Crear la carpeta de la aplicación**
   ```
   src/applications/ventas/
   ├── views/           # Vistas propias (home, perfil, placeholders)
   ├── router/
   │   └── index.ts     # Rutas de la app
   └── (opcional) layout: VentasLayout.vue si es distinto al de Alquileres
   ```

2. **Definir el layout** (si aplica)  
   Crear `VentasLayout.vue` en `applications/ventas/views/` (o en `views/`) usando `@widgets` (sidebar, header) y el composable de menú de aplicaciones si ya existe uno por app.

3. **Crear el router**  
   En `applications/ventas/router/index.ts`:
   - Exportar un array de rutas (ej. `ventasRoutes`) con `path: '/ventas'`, `component: VentasLayout`, y `children` para cada sección.

4. **Registrar en el router principal**  
   En `app/routes/index.ts`:
   - Importar `ventasRoutes` desde `@applications/ventas/router`.
   - Añadir `...ventasRoutes` al array `routes` (orden según criterio de negocio).

5. **Backend y menú**  
   - Asegurar que la aplicación exista en el backend (seed de aplicaciones) y que el endpoint de “mis aplicaciones” devuelva Ventas si aplica.
   - Si el menú por aplicación se arma desde `features/applications`, no suele hacer falta tocar nada más; si hay configuración estática de menús, añadir la nueva app ahí.

---

## 2. Agregar una nueva **función dentro de una aplicación** (ej. Cobranzas en Alquileres)

Son subdominios dentro de una app: clientes, propiedades, contratos, reportes, **cobranzas**, etc.

### Pasos

1. **Crear la carpeta de la función**
   ```
   src/applications/alquileres/cobranzas/
   ├── services/
   │   └── cobranzas.service.ts   # Llamadas API (usar @app/api/apiClient)
   ├── composables/
   │   └── useCobranzas.ts        # Lógica (queries, mutations)
   ├── views/
   │   └── CobranzasView.vue      # Listado u otras vistas
   └── router/
       └── index.ts               # Rutas que se montan como children
   ```

2. **Implementar servicio y composables**  
   - En `services/`: usar `apiClient` desde `@app/api/apiClient`.  
   - En `composables/`: usar Vue Query u otra lógica; importar tipos desde `shared` o desde el mismo feature si son específicos.

3. **Definir las rutas de la función**  
   En `applications/alquileres/cobranzas/router/index.ts` exportar un array (ej. `cobranzasRoutes`) con rutas relativas (`path: ''`, `path: 'nuevo'`, etc.) y componentes con import dinámico de las vistas.

4. **Integrar en el router de la aplicación**  
   En `applications/alquileres/router/index.ts`:
   - Importar `cobranzasRoutes` desde `@applications/alquileres/cobranzas/router`.
   - Añadir un `children` bajo el path que corresponda (ej. `path: 'cobranzas'`, `component: SectionLayout`, `children: cobranzasRoutes`).

5. **Menú**  
   Si el menú de Alquileres se construye desde configuración o desde un composable (ej. en `features/applications` o en el layout de Alquileres), añadir la entrada “Cobranzas” con la ruta correcta.

---

## 3. Agregar un **feature transversal** (ej. exportar a PDF)

Features reutilizables en varias aplicaciones: auth, selector de aplicaciones, notificaciones, o cosas como “exportar PDF”, “visor de documentos”, etc.

### Pasos

1. **Crear el slice del feature**
   ```
   src/features/export-pdf/
   ├── api/
   │   └── export-pdf.service.ts   # Si hay llamadas al backend
   ├── composables/
   │   └── useExportPdf.ts
   ├── ui/
   │   └── ExportPdfButton.vue     # Opcional
   └── index.ts                    # Public API: exportar solo lo necesario
   ```

2. **Regla de dependencias**  
   El feature puede usar `@shared` y `@widgets`. No debe importar de `@applications`. Para llamadas HTTP usar `@app/api/apiClient`.

3. **Public API**  
   En `index.ts` exportar solo lo que otras capas necesiten (composables, componentes, tipos). Evitar exportar detalles internos.

4. **Uso en una aplicación**  
   En una vista o composable de `applications/alquileres/...` (o cualquier app):  
   `import { useExportPdf } from '@features/export-pdf'`.

5. **Rutas**  
   Si el feature tiene páginas propias (poco común), definir un array de rutas en `features/export-pdf/router/index.ts` y registrarlo en `app/routes/index.ts`.

---

## 4. Agregar **vistas o páginas** dentro de una app existente

- **Vista nueva en una función existente**  
  Añadir el `.vue` en `applications/<app>/<funcion>/views/` y una ruta en `applications/<app>/<funcion>/router/index.ts`.  
  Ejemplo: “Detalle Cobranza” → nueva ruta con `path: ':id'` y componente `DetalleCobranzaView.vue`.

- **Página nueva a nivel de aplicación**  
  Añadir el `.vue` en `applications/<app>/views/` y la ruta en `applications/<app>/router/index.ts`.  
  Ejemplo: “Dashboard de Ventas” → nueva ruta en `ventas/router/index.ts`.

---

## 5. Agregar **componentes reutilizables** (shared / widgets)

- **Sin lógica de negocio** (botón, input, tabla, card):  
  Crear en `shared/components/` (ui o forms) y exportar en el `index.ts` correspondiente.  
  No importar desde `features` ni `applications`.

- **Bloques grandes o layouts** (cabecera, sidebar, layout de sección):  
  Crear en `widgets/` y exportar en `widgets/index.ts`.  
  Pueden usar `@shared` y, si hace falta, `@features` (ej. auth para usuario).

---

## 6. Checklist al agregar algo nuevo

- [ ] Código en la capa correcta (shared / features / applications / widgets / app).
- [ ] Imports solo desde capas inferiores (ver ARCHITECTURE.md).
- [ ] Servicios usan `@app/api/apiClient` para HTTP.
- [ ] Rutas nuevas registradas en `app/routes` (si es app o feature con páginas) o en el router de la aplicación (si es función dentro de una app).
- [ ] Public API del feature/app: solo exportar lo necesario en `index.ts`.
- [ ] Menús o navegación actualizados si la nueva función/app debe verse en el sidebar o selector de aplicaciones.

---

## 7. Ejemplo mínimo: nueva función “Cobranzas” en Alquileres

1. Crear `src/applications/alquileres/cobranzas/views/CobranzasView.vue` (contenido inicial aunque sea un placeholder).
2. Crear `src/applications/alquileres/cobranzas/router/index.ts`:
   ```ts
   import type { RouteRecordRaw } from 'vue-router'
   export const cobranzasRoutes: RouteRecordRaw[] = [
     { path: '', name: 'alquileres-cobranzas', component: () => import('../views/CobranzasView.vue'), meta: { title: 'Cobranzas' } },
   ]
   ```
3. En `src/applications/alquileres/router/index.ts` importar `cobranzasRoutes` y en el array `children` añadir algo como:
   ```ts
   { path: 'cobranzas', component: SectionLayout, meta: { title: 'Cobranzas' }, children: cobranzasRoutes }
   ```
4. Añadir la entrada “Cobranzas” en el menú de la app Alquileres (donde se definan los ítems del sidebar).

Con esto la arquitectura se mantiene escalable y consistente con el resto del proyecto.
