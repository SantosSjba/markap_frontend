/** Contrato de registro independiente de Vue y de las implementaciones externas. */
export interface ServiceKey<T> {
  readonly token: symbol
  readonly name: string
  readonly __contract?: T
}
export function createServiceKey<T>(name: string): ServiceKey<T> {
  return { token: Symbol(name), name }
}
