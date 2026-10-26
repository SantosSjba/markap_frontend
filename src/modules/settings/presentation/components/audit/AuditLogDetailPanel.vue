<script setup lang="ts">
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import {Table,TableBody,TableCell,TableHeader,TableRow} from '@shared/presentation/ui/table'
import type {AuditLogItem} from '../../../domain/repositories/audit-logs.repository'
defineProps<{entry:AuditLogItem|null}>()
const emit=defineEmits<{close:[]}>()
const display=(value:unknown)=>value===null?'—':typeof value==='object'?JSON.stringify(value,null,2):String(value)
</script>
<template>
 <BaseModal :model-value="!!entry" title="Detalle de auditoría" size="xl" @close="emit('close')">
  <div v-if="entry" class="space-y-4 text-gray-700 dark:text-gray-300">
   <p>{{entry.action}} · {{entry.userName ?? 'Sistema'}} · {{entry.tableName ?? 'Evento'}} · {{entry.recordId}}</p>
   <p class="text-sm">Origen: {{entry.source}} · IP: {{entry.ip ?? '—'}}</p>
   <Table v-if="entry.changes"><TableHeader><TableRow><TableCell is-header>Campo</TableCell><TableCell is-header>Antes</TableCell><TableCell is-header>Después</TableCell></TableRow></TableHeader><TableBody><TableRow v-for="(change,field) in entry.changes" :key="field"><TableCell>{{field}}</TableCell><TableCell class="whitespace-pre-wrap break-all">{{display(change.before)}}</TableCell><TableCell class="whitespace-pre-wrap break-all">{{display(change.after)}}</TableCell></TableRow></TableBody></Table>
   <pre v-else class="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">{{display(entry.snapshot ?? entry.metadata)}}</pre>
  </div>
 </BaseModal>
</template>
