# Mapa de módulos

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Sesión, acceso y recuperación de contraseña |
| `applications` | Aplicaciones disponibles y acceso |
| `settings` | Usuarios, roles, permisos, perfil y configuración |
| `notifications` | Notificaciones, contadores y conexión en tiempo real |
| `shell` | Inicio y pantallas generales |
| `alquileres` | Propiedades, agentes, clientes, contratos y cobranzas |
| `ventas` | Propiedades, clientes, procesos de venta, finanzas y cumplimiento |
| `arquitectura` | Proyectos, presupuestos, materiales, ejecución y cronograma |
| `interiorismo` | Proyectos, presupuestos, materiales, ejecución y calendario |
| `produccion` | Catálogo, compras, inventario, ventas y taller |
| `contabilidad` | Configuración contable, periodos, asientos, tributos y reportes |

Cada módulo mantiene sus modelos, puertos, adaptadores y presentación. Las features viven dentro del módulo propietario. Los layouts globales están en `src/app/layouts`; los layouts de negocio permanecen en la presentación de su módulo. La infraestructura compartida está en `src/shared/infrastructure` y la UI reutilizable en `src/shared/presentation`.

Consultar [ARCHITECTURE.md](ARCHITECTURE.md) para las reglas verificadas por el proyecto.
