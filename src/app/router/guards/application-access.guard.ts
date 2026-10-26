import type {NavigationGuard} from 'vue-router'
import {useQueryClient} from '@tanstack/vue-query'
import {useService} from '@shared/presentation/di/services'
import {applicationsRepositoryKey} from '@modules/applications/application/ports/applications.port'
import {applicationsQueryKeys} from '@modules/applications/application/applicationsQueryKeys'
import {markapAlert} from '@shared/presentation/composables/useMarkapAlert'
/** Captura los servicios de forma síncrona (contexto de inyección del guard) y devuelve la consulta */
function useMyApplicationsFetcher() {
 const repository=useService(applicationsRepositoryKey)
 const queryClient=useQueryClient()
 return ()=>queryClient.fetchQuery({queryKey:applicationsQueryKeys.myApps,queryFn:()=>repository.getMyApplications(),staleTime:30000})
}
export const applicationAccessGuard:NavigationGuard=async(to)=>{
 const slug=to.meta.applicationSlug as string | undefined
 if(!slug) return true
 try {
  const fetchMyApplications=useMyApplicationsFetcher()
  const apps=await fetchMyApplications()
  if(apps.some(a=>a.slug===slug && a.accessLevel)) return true
  void markapAlert.toast.error(`No tienes acceso a ${slug}`)
 } catch {void markapAlert.toast.error('No se pudo verificar el acceso a la aplicación')}
 return {path:'/applications'}
}
