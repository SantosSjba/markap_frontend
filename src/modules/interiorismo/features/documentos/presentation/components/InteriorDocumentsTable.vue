<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useOpenStoredFile } from '@shared/presentation/composables/useOpenStoredFile'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatFileSize, formatShortDate } from '@shared/utils/formatters'
import { fileKind } from '@shared/utils/file-kind'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorProjectOptions } from '../../../proyectos/presentation/composables/useInteriorProjects'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import type { InteriorDocumentRow, InteriorDocumentType, ListInteriorDocumentsParams } from '../../domain/document.types'
import { DOCUMENT_TYPE_FORM_OPTIONS, DOCUMENT_TYPE_LABELS, INTERIOR_DOCUMENT_NAV } from '../documentNav'
import {
  useDeleteInteriorDocument,
  useInteriorDocumentStats,
  useInteriorDocumentsList,
  useUpdateInteriorDocument,
} from '../composables/useInteriorDocuments'
import DocumentUploadModal from './DocumentUploadModal.vue'
/**
 * InteriorDocumentsTable — documentos de Interiorismo con pestañas por tipo (con conteo),
 * búsqueda, filtro de proyecto, subida múltiple, abrir, editar y eliminar. Con `projectId`
 * se usa dentro de la ficha del proyecto (sin columna ni filtro de proyecto).
 */

const props = defineProps<{ projectId?: string }>()
const type = defineModel<'ALL' | InteriorDocumentType>('type', { default: 'ALL' })
const router = useRouter()

// ── Filtros ──
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterProject = ref('')
const page = ref(1)
const pageSize = ref(10)
watch([debouncedSearch, filterProject, type], () => (page.value = 1))

const fixedProject = computed(() => props.projectId)
const effectiveProject = computed(() => fixedProject.value ?? (filterProject.value || undefined))
const params = computed<ListInteriorDocumentsParams>(() => ({
  page: page.value,
  limit: pageSize.value,
  docType: type.value === 'ALL' ? undefined : type.value,
  search: debouncedSearch.value.trim() || undefined,
  projectId: effectiveProject.value,
}))
const { data: result, isLoading, isFetching, isError, error, refetch } = useInteriorDocumentsList(params)
const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const { data: stats } = useInteriorDocumentStats(effectiveProject)
const tabs = computed(() => [
  { id: 'ALL' as const, label: `Todos · ${stats.value?.total ?? 0}`, icon: 'lucide:files' },
  ...INTERIOR_DOCUMENT_NAV.map((n) => ({ id: n.docType, label: `${n.label} · ${stats.value?.byType[n.docType] ?? 0}`, icon: n.icon })),
])

const { options: projectItems } = useInteriorProjectOptions()
const projectOptions = computed(() => [{ value: '', label: 'Todos los proyectos' }, ...projectItems.value])

const columns = computed(() => [
  { key: 'doc', label: 'Documento', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  ...(fixedProject.value ? [] : [{ key: 'project', label: 'Proyecto', align: 'left' as const }]),
  { key: 'date', label: 'Fecha', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
])
const asDoc = (r: unknown) => r as InteriorDocumentRow
const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize.value))
  return { currentPage: page.value, totalPages, totalItems: total.value, pageSize: pageSize.value, hasPrevPage: page.value > 1, hasNextPage: page.value < totalPages }
})

const kindOf = (d: InteriorDocumentRow) => fileKind(d.fileName, d.mimeType)

const TYPE_HELP: Record<InteriorDocumentType, string> = {
  CONTRATO: 'Contrato firmado con el cliente y sus adendas.',
  PLANO: 'Planos de distribución, cortes, detalles o archivos CAD (DWG/DXF).',
  RENDERIZADO: 'Imágenes 3D o renders de la propuesta de diseño.',
  PDF: 'Propuestas, presentaciones u otros PDF del proyecto.',
  FACTURA: 'Facturas y comprobantes emitidos o recibidos.',
  ACTA: 'Actas de reunión, de conformidad o de entrega.',
}
const HELP: HelpTooltipItem[] = [
  ...INTERIOR_DOCUMENT_NAV.map((n) => ({ icon: n.icon, term: n.label, text: TYPE_HELP[n.docType] })),
  { icon: 'lucide:info', term: 'Otros archivos', text: 'Cotizaciones y el Excel del presupuesto van en Presupuesto › Adjuntos; las fotos de obra, en Ejecución › Evidencias.' },
]

// ── Acciones ──
const { openStoredFile, hasStoredFile } = useOpenStoredFile(INTERIORISMO_APP_SLUG)
const open = (d: InteriorDocumentRow) => openStoredFile({ archivoId: d.archivoId, url: d.downloadUrl ?? d.fileUrl, filePath: d.fileUrl })
const uploadOpen = ref(false)

const editing = ref<InteriorDocumentRow | null>(null)
const editOpen = computed({ get: () => editing.value !== null, set: (v) => { if (!v) editing.value = null } })
const editDraft = ref({ title: '', docType: 'CONTRATO' as InteriorDocumentType })
const updateMut = useUpdateInteriorDocument()
function startEdit(d: InteriorDocumentRow) {
  editing.value = d
  editDraft.value = { title: d.title, docType: d.docType as InteriorDocumentType }
}
async function saveEdit() {
  if (!editing.value || !editDraft.value.title.trim()) return
  await updateMut.mutateAsync({ id: editing.value.id, payload: { title: editDraft.value.title.trim(), docType: editDraft.value.docType } })
  editing.value = null
}

const deleteMut = useDeleteInteriorDocument()
async function remove(d: InteriorDocumentRow) {
  const ok = await markapAlert.confirmDanger({ title: 'Eliminar documento', text: `«${d.title}» se eliminará.`, confirmText: 'Eliminar' })
  if (ok) await deleteMut.mutateAsync(d.id).catch(() => undefined)
}
const actionsFor = (d: InteriorDocumentRow) => {
  const items: { label: string; icon: string; onClick: () => void }[] = []
  if (hasStoredFile({ archivoId: d.archivoId, url: d.downloadUrl ?? d.fileUrl })) items.push({ label: 'Abrir', icon: 'lucide:external-link', onClick: () => void open(d) })
  if (!fixedProject.value) items.push({ label: 'Ir al proyecto', icon: 'lucide:folder-kanban', onClick: () => router.push({ path: `${INTERIORISMO_BASE_PATH}/proyectos/${d.projectId}`, query: { tab: 'documentos' } }) })
  if (canWrite.value) items.push({ label: 'Editar', icon: 'lucide:pencil', onClick: () => startEdit(d) })
  if (canAdmin.value) items.push({ label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void remove(d) })
  return items
}
</script>

<template>
  <div class="space-y-4">
    <SectionIntro
      v-if="fixedProject"
      title="Documentos del proyecto"
      subtitle="Contratos, planos, renders, facturas y actas, ordenados por tipo."
      help-title="¿Qué va en cada tipo?"
      :help="HELP"
    />
    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1 overflow-x-auto"><BaseTabs v-model="type" :tabs="tabs" variant="segmented" /></div>
      <HelpTooltip v-if="!fixedProject" title="¿Qué va en cada tipo?" :items="HELP" width="w-96" align="end" />
      <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:upload" @click="uploadOpen = true">Subir documentos</BaseButton>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="isError" class="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p class="text-sm font-medium text-error-500">{{ getApiErrorMessage(error) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable :columns="columns" :data="rows" row-key="id" :loading="isLoading || isFetching" :empty-text="type === 'ALL' ? 'Aún no hay documentos.' : `No hay ${DOCUMENT_TYPE_LABELS[type].toLowerCase()}s.`">
          <template #toolbar>
            <div class="min-w-0 flex-1"><SearchInput v-model="searchInput" :placeholder="fixedProject ? 'Buscar por título...' : 'Buscar por título o proyecto...'" /></div>
            <div v-if="!fixedProject" class="w-full min-w-0 sm:w-[260px]"><FormCombobox v-model="filterProject" :options="projectOptions" placeholder="Todos los proyectos" /></div>
          </template>
          <template #row="{ row }">
            <td class="px-4 py-3">
              <button type="button" class="flex items-center gap-3 text-left" @click="open(asDoc(row))">
                <span :class="['flex size-9 shrink-0 items-center justify-center rounded-lg', kindOf(asDoc(row)).tone]">
                  <AppIcon :icon="kindOf(asDoc(row)).icon" :size="18" />
                </span>
                <span class="min-w-0">
                  <span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{{ asDoc(row).title }}</span>
                  <span class="block truncate text-xs text-gray-400">
                    {{ asDoc(row).fileName ?? 'Enlace' }}<template v-if="asDoc(row).sizeBytes"> · {{ formatFileSize(asDoc(row).sizeBytes!) }}</template>
                  </span>
                </span>
              </button>
            </td>
            <td class="px-4 py-3"><Badge variant="neutral">{{ DOCUMENT_TYPE_LABELS[asDoc(row).docType as InteriorDocumentType] ?? asDoc(row).docType }}</Badge></td>
            <td v-if="!fixedProject" class="px-4 py-3 text-sm">
              <span class="block text-gray-800 dark:text-white/90">{{ asDoc(row).projectName }}</span>
              <span class="text-xs text-gray-400">{{ asDoc(row).projectCode }}</span>
            </td>
            <td class="px-4 py-3 text-sm whitespace-nowrap text-gray-500">{{ formatShortDate(asDoc(row).createdAt) }}</td>
            <td class="px-4 py-3 text-right"><ActionsDropdown :items="filterActions(actionsFor(asDoc(row)))" /></td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="(p: number) => (page = p)" @update:page-size="(s: number) => { pageSize = s; page = 1 }" />
        </div>
      </template>
    </div>

    <DocumentUploadModal v-model:open="uploadOpen" :project-id="projectId" :default-type="type === 'ALL' ? undefined : type" />

    <BaseModal v-model="editOpen" title="Editar documento" size="sm">
      <div class="space-y-4 p-1">
        <FormInput v-model="editDraft.title" label="Título" required />
        <FormSelect v-model="editDraft.docType" label="Tipo" :options="DOCUMENT_TYPE_FORM_OPTIONS" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="editOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:save" :loading="updateMut.isPending.value" @click="saveEdit">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
