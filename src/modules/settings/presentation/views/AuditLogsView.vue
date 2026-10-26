<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import {useQuery} from '@tanstack/vue-query'
import {useService} from '@shared/presentation/di/services'
import {roleApplicationsRepositoryKey} from '../../application/ports/role-applications.port'
import {usersRepositoryKey} from '../../application/ports/users.port'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import {TableCell} from '@shared/presentation/ui/table'
import AuditLogDetailPanel from '../components/audit/AuditLogDetailPanel.vue'
import {useAuditLogs} from '../composables/useAuditLogs'
import type {AuditLogItem} from '../../domain/repositories/audit-logs.repository'
const userId=ref(''),applicationId=ref(''),action=ref(''),tableName=ref(''),from=ref(''),to=ref(''),page=ref(1)
const filters=computed(()=>({userId:userId.value||undefined,applicationId:applicationId.value||undefined,action:action.value||undefined,tableName:tableName.value||undefined,from:from.value||undefined,to:to.value||undefined,page:page.value,limit:50}))
watch([userId,applicationId,action,tableName,from,to],()=>{page.value=1})
const logs=useAuditLogs(filters),selected=ref<AuditLogItem|null>(null)
const roles=useService(roleApplicationsRepositoryKey),users=useService(usersRepositoryKey)
const apps=useQuery({queryKey:['settings','audit-apps'],queryFn:()=>roles.getAllApplications()})
const people=useQuery({queryKey:['settings','audit-users'],queryFn:()=>users.getAll()})
const actions=['CREATE','UPDATE','DELETE','SOFT_DELETE','RESTORE','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_RESET','ACCESS_DENIED']
const columns=[{key:'occurredAt',label:'Fecha y hora'},{key:'userName',label:'Usuario'},{key:'action',label:'Acción'},{key:'applicationName',label:'Aplicación'},{key:'tableName',label:'Tabla'},{key:'recordId',label:'Registro'},{key:'ip',label:'IP'},{key:'detail',label:'Detalle'}]
const formatDate=(value:string)=>new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',dateStyle:'short',timeStyle:'medium'}).format(new Date(value))
const badge=(action:string)=>action==='CREATE'?'success':['DELETE','SOFT_DELETE'].includes(action)?'error':['ACCESS_DENIED','LOGIN_FAILED'].includes(action)?'warning':action==='UPDATE'?'primary':'neutral'
</script>
<template>
 <div class="space-y-5">
  <div class="flex items-center justify-between gap-3"><h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">Auditoría</h1><BaseButton variant="secondary" :loading="logs.isFetching.value" @click="logs.refetch()">Actualizar</BaseButton></div>
  <p class="text-sm text-gray-500 dark:text-gray-400">Historial de cambios y accesos. Fechas en hora de Lima.</p>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   <FormSelect v-model="userId" label="Usuario" :options="[{value:'',label:'Todos'},...(people.data.value ?? []).map(u=>({value:u.id,label:u.fullName}))]" />
   <FormSelect v-model="applicationId" label="Aplicación" :options="[{value:'',label:'Todas'},...(apps.data.value ?? []).map(a=>({value:a.id,label:a.name}))]" />
   <FormSelect v-model="action" label="Acción" :options="[{value:'',label:'Todas'},...actions.map(a=>({value:a,label:a}))]" />
   <FormInput v-model="tableName" label="Tabla" placeholder="Ej. users" /><FormInput v-model="from" type="date" label="Desde" /><FormInput v-model="to" type="date" label="Hasta" />
  </div>
  <p v-if="logs.isError.value" role="alert" class="text-error-500">No se pudo cargar la auditoría. Revisa los filtros o vuelve a intentar.</p>
  <DataTable :columns="columns" :data="logs.data.value?.items ?? []" :loading="logs.isPending.value" empty-text="No hay eventos con estos filtros.">
   <template #row="{row}"><TableCell>{{formatDate(row.occurredAt)}}</TableCell><TableCell>{{row.userName ?? 'Sistema / anónimo'}}</TableCell><TableCell><Badge :variant="badge(row.action)">{{row.action}}</Badge></TableCell><TableCell>{{row.applicationName ?? '—'}}</TableCell><TableCell>{{row.tableName ?? '—'}}</TableCell><TableCell class="max-w-40 truncate" :title="row.recordId">{{row.recordId ?? '—'}}</TableCell><TableCell>{{row.ip ?? '—'}}</TableCell><TableCell><BaseButton size="sm" variant="link" @click="selected=row">Ver detalle</BaseButton></TableCell></template>
  </DataTable>
  <div class="flex items-center justify-end gap-3 text-sm text-gray-500 dark:text-gray-400"><span>{{logs.data.value?.total ?? 0}} eventos · Página {{page}}</span><BaseButton variant="secondary" size="sm" :disabled="page<=1" @click="page--">Anterior</BaseButton><BaseButton variant="secondary" size="sm" :disabled="page*50 >= (logs.data.value?.total ?? 0)" @click="page++">Siguiente</BaseButton></div>
  <AuditLogDetailPanel :entry="selected" @close="selected=null" />
 </div>
</template>
