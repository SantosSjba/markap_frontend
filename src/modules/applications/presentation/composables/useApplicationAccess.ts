import {computed,toValue,type MaybeRefOrGetter} from 'vue'
import {useMyApplications} from './useApplications'
import {levelAllows} from '../../domain/access-level'
export function useApplicationAccess(slug:MaybeRefOrGetter<string>) {
 const apps=useMyApplications()
 const level=computed(()=>apps.data.value?.find(a=>a.slug===toValue(slug))?.accessLevel ?? null)
 const filterActions = <T extends {label:string;danger?:boolean}>(items:T[]):T[] => items.filter(item=> {
  if(item.danger || /eliminar|borrar|revocar/i.test(item.label)) return levelAllows(level.value,'ADMIN')
  if(/^(ver|detalle|historial|descargar|imprimir|exportar|abrir)/i.test(item.label.trim())) return levelAllows(level.value,'READ')
  return levelAllows(level.value,'WRITE')
 })
 return {filterActions,level,canRead:computed(()=>levelAllows(level.value,'READ')),canWrite:computed(()=>levelAllows(level.value,'WRITE')),canAdmin:computed(()=>levelAllows(level.value,'ADMIN'))}
}
