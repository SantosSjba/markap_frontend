<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatDateTime } from '@shared/utils/formatters'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import { useArquitecturaProjectsList } from '../../../proyectos/presentation/composables/useArquitecturaProjects'
import type {
  ArquitecturaDocumentRow,
  ArquitecturaDocumentType,
  ListArquitecturaDocumentsParams,
} from '../../domain/document.types'
import {
  useArquitecturaDocumentsList,
  useUploadArquitecturaDocument,
  useUpdateArquitecturaDocument,
  useDeleteArquitecturaDocument,
  useOpenArquitecturaDocumentFile,
} from '../composables/useArquitecturaDocuments'
import { DOCUMENT_TYPE_FORM_OPTIONS, ARQUITECTURA_DOCUMENT_NAV } from '../documentNav'
const openArquitecturaDocumentFile = useOpenArquitecturaDocumentFile()

const route = useRoute()
const router = useRouter()

const ITEMS = 12

const docType = computed(() => (route.meta.docType as ArquitecturaDocumentType) ?? 'CONTRATO')
const sectionTitle = computed(() => (route.meta.title as string) ?? 'Documentos')

const listParams = ref<ListArquitecturaDocumentsParams>({
  page: 1,
  limit: ITEMS,
  docType: docType.value,
})
const searchInput = ref('')
const projectFilter = ref<string | null>(null)

watch(
  docType,
  (dt) => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      docType: dt,
    }
  },
  { immediate: true },
)

watch(searchInput, () => {
  listParams.value = {
    ...listParams.value,
    page: 1,
    search: searchInput.value.trim() || undefined,
  }
})

watch(projectFilter, () => {
  listParams.value = {
    ...listParams.value,
    page: 1,
    projectId: projectFilter.value?.trim() || undefined,
  }
})

const projectsParams = ref({ page: 1, limit: 200 })
const { data: projectsResult, isLoading: projectsLoading } =
  useArquitecturaProjectsList(projectsParams)
const projectOptions = computed(() =>
  (projectsResult.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  })),
)

const { data: result, isLoading } = useArquitecturaDocumentsList(listParams)

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const columns = [
  { key: 'project', label: 'Proyecto', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const, sortable: true },
  { key: 'file', label: 'Archivo / enlace', align: 'left' as const },
  { key: 'createdAt', label: 'Alta', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const showCreate = ref(false)
const createProjectId = ref<string | null>(null)
const createTitle = ref('')
const createFile = ref<File | null>(null)

const showEdit = ref(false)
const editingId = ref<string | null>(null)
const editTitle = ref('')
const editDocType = ref<ArquitecturaDocumentType>('CONTRATO')

const uploadMut = useUploadArquitecturaDocument()
const updateMut = useUpdateArquitecturaDocument()
const deleteMut = useDeleteArquitecturaDocument()

function resetCreate() {
  createProjectId.value = null
  createTitle.value = ''
  createFile.value = null
}

function openCreate() {
  resetCreate()
  showCreate.value = true
}

async function submitCreate() {
  if (!createProjectId.value?.trim()) {
    void markapAlert.toast.error('Selecciona un proyecto')
    return
  }
  if (!createTitle.value.trim()) {
    void markapAlert.toast.error('Indica un título')
    return
  }
  if (!createFile.value) {
    void markapAlert.toast.error('Selecciona un archivo')
    return
  }
  await uploadMut.mutateAsync({
    projectId: createProjectId.value,
    docType: docType.value,
    title: createTitle.value.trim(),
    file: createFile.value,
  })
  showCreate.value = false
  resetCreate()
}

function openEdit(row: ArquitecturaDocumentRow) {
  editingId.value = row.id
  editTitle.value = row.title
  editDocType.value = row.docType as ArquitecturaDocumentType
  showEdit.value = true
}

async function submitEdit() {
  if (!editingId.value) return
  if (!editTitle.value.trim()) {
    void markapAlert.toast.error('Indica un título')
    return
  }
  await updateMut.mutateAsync({
    id: editingId.value,
    payload: {
      title: editTitle.value.trim(),
      docType: editDocType.value,
    },
  })
  showEdit.value = false
  editingId.value = null
}

function hasFile(row: ArquitecturaDocumentRow) {
  return !!(row.archivoId || row.downloadUrl || (row.fileUrl && /^https?:\/\//i.test(row.fileUrl)))
}

async function removeRow(row: ArquitecturaDocumentRow) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar documento?',
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteMut.mutateAsync(row.id)
}

function formatDate(iso: string) {
  return formatDateTime(iso)
}

function goProject(id: string) {
  void router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${id}`)
}

function getDocActions(
  row: ArquitecturaDocumentRow,
): { label: string; icon: string; onClick: () => void }[] {
  return [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openEdit(row) },
    { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void removeRow(row) },
  ]
}

</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="sectionTitle"
      subtitle="Registro por proyecto: sube archivos (contratos, planos, renders, memoria descriptiva, facturas y actas)."
      eyebrow="Documentos"
    >
      <template #actions>
        <BaseButton type="button" @click="openCreate">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo registro
      </BaseButton>
      </template>
    </PageHeader>

    <div class="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <BaseButton
        v-for="item in ARQUITECTURA_DOCUMENT_NAV"
        :key="item.segment"
        :to="`${ARQUITECTURA_BASE_PATH}/documentos/${item.segment}`"
        size="sm"
        :variant="route.path.endsWith(`/documentos/${item.segment}`) ? 'primary' : 'ghost'"
      >
        {{ item.label }}
      </BaseButton>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <LoadingState v-if="isLoading" />
      <template v-else>
        <DataTable
          empty-text="No hay documentos en esta categoría. Añade uno o cambia los filtros."
          :columns="columns"
          :data="rows"
          row-key="id"
        >
          <template #toolbar>
            <div class="flex flex-wrap gap-3 flex-1 min-w-0 items-end">
              <div class="flex-1 min-w-[200px]">
                <SearchInput v-model="searchInput" placeholder="Buscar por título, código o proyecto…" />
              </div>
              <div class="flex flex-wrap items-end gap-2 w-full sm:w-auto sm:min-w-[280px]">
                <div class="flex-1 min-w-[200px]">
                  <FormSelect
                    v-model="projectFilter"
                    label="Proyecto"
                    placeholder="Todos los proyectos"
                    :options="projectOptions"
                    :loading="projectsLoading"
                  />
                </div>
                <BaseButton
                  v-if="projectFilter"
                  variant="ghost"
                  size="sm"
                  type="button"
                  class="mb-0.5"
                  @click="projectFilter = null"
                >
                  Limpiar
                </BaseButton>
              </div>
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <BaseButton @click="goProject((row as ArquitecturaDocumentRow).projectId)" variant="link" class="font-medium">{{ (row as ArquitecturaDocumentRow).projectCode }}</BaseButton>
              <div class="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                {{ (row as ArquitecturaDocumentRow).projectName }}
              </div>
            </td>
            <td class="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white/90">
              {{ (row as ArquitecturaDocumentRow).title }}
            </td>
            <td class="py-3 px-4 text-sm">
              <BaseButton v-if="hasFile(row as ArquitecturaDocumentRow)" @click="openArquitecturaDocumentFile(row as ArquitecturaDocumentRow)" variant="link" icon="lucide:external-link">Abrir</BaseButton>

              <span v-else class="text-muted text-gray-500 dark:text-gray-400">—</span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate((row as ArquitecturaDocumentRow).createdAt) }}
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <ActionsDropdown :items="getDocActions(row as ArquitecturaDocumentRow)" />
            </td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </BaseCard>

    <BaseModal v-model="showCreate" title="Nuevo documento" size="lg">
      <div class="space-y-4">
        <FormSelect
          v-model="createProjectId"
          label="Proyecto"
          placeholder="Seleccionar proyecto"
          required
          :options="projectOptions"
          :loading="projectsLoading"
        />
        <FormInput v-model="createTitle" label="Título" placeholder="Ej. Contrato de obra — revisión 2" required />
        <div>
          <p class="text-sm font-medium mb-1.5 text-gray-800 dark:text-white/90">Archivo</p>
          <FileDropzone
            v-model="createFile"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx,.xls,.dwg"
            :max-size="25 * 1024 * 1024"
          />
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400">
          Categoría actual: <strong>{{ sectionTitle }}</strong>
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="showCreate = false">Cancelar</BaseButton>
          <BaseButton type="button" :loading="uploadMut.isPending.value" @click="submitCreate">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="showEdit" title="Editar documento" size="lg">
      <div class="space-y-4">
        <FormSelect v-model="editDocType" label="Categoría" required :options="DOCUMENT_TYPE_FORM_OPTIONS" />
        <FormInput v-model="editTitle" label="Título" required />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          El archivo no se puede reemplazar desde aquí; elimina y crea uno nuevo si necesitas otro archivo.
        </p>

      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="showEdit = false">Cancelar</BaseButton>
          <BaseButton type="button" :disabled="updateMut.isPending.value" @click="submitEdit">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
