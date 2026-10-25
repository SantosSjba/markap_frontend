# Agregar funcionalidades

1. Elegir el módulo de negocio propietario. Crear una feature solo si tiene responsabilidad propia. Reutilizar UI desde `shared/presentation`; no duplicar servicios de sesión, HTTP, archivos o catálogos.
2. Definir los modelos y operaciones del repositorio en `domain/`. Mantener esta capa independiente del navegador y de Vue.
3. Declarar la clave tipada del repositorio en `application/ports/` usando `createServiceKey<Repositorio>()`. La clave importa el contrato de dominio, nunca el adaptador.
4. Implementar el contrato en `infrastructure/` con el cliente HTTP compartido. Preservar el `applicationSlug` del módulo y normalizar respuestas mediante mappers cuando sea necesario.
5. Registrar el adaptador en `app/providers/repositories.ts` con `provideService(app, clave, adaptador)`. El compilador verifica la compatibilidad.
6. Crear composables en `presentation/composables/`. Capturar `const repository = useService(clave)` de forma síncrona al entrar al composable. Una acción diferida debe cerrar sobre ese repositorio. No resolver dependencias dentro de `queryFn`, eventos, timers ni después de un `await`.
7. Usar Vue Query para el estado remoto. Definir claves estables e invalidar las consultas dependientes después de mutaciones. Usar Pinia para sesión y estado compartido de interfaz.
8. Crear componentes, vistas y validación de formularios en `presentation/`. La vista consume los hooks y modelos; no importa Axios ni implementaciones HTTP.
9. Registrar rutas diferidas en el router del módulo. Actualizar el contrato de rutas solo cuando el cambio de producto lo requiera; revisar permisos, redirects y metadatos.
10. Agregar pruebas de comportamiento relevantes y ejecutar `pnpm verify`.

## Ejemplo de puerto

```ts
// features/clientes/application/ports/clients.port.ts
import { createServiceKey } from '@shared/application/ports/service-key'
import type { ClientsRepository } from '../../domain/repositories/clients.repository'

export const clientsRepositoryKey = createServiceKey<ClientsRepository>('mi-modulo.clientes')
```

```ts
// presentation/composables/useClients.ts
export function useClients() {
  const repository = useService(clientsRepositoryKey)
  return useQuery({ queryKey: ['mi-modulo', 'clientes'], queryFn: () => repository.list() })
}
```

No crear capas vacías, clases sin comportamiento o repositorios genéricos para cumplir un esquema de carpetas. Compartir código cuando representa la misma responsabilidad y contrato; semejanzas visuales entre dos procesos de negocio no implican que deban compartir reglas.
