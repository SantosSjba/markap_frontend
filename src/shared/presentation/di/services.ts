import { inject, type App, type InjectionKey } from 'vue'
import type { ServiceKey } from '../../application/ports/service-key'
export function provideService<T>(app: App, key: ServiceKey<T>, service: NoInfer<T>): void {
  app.provide(key.token as InjectionKey<T>, service)
}
export function useService<T>(key: ServiceKey<T>): T {
  const service = inject(key.token as InjectionKey<T>, undefined)
  if (service === undefined)
    throw new Error(
      `Servicio no registrado: ${key.name}. Instala los proveedores de la aplicación.`,
    )
  return service
}
