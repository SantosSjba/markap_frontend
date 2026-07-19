<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  BasePagination,
  BaseModal,
  DataTable,
  SearchInput,
  AppIcon,
  ActionsDropdown,
  FileDropzone,
  FormInput,
  FormSelect,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { formatDateTime } from '@/shared/utils/formatters'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'
import { useArquitecturaProjectsList } from '@modules/arquitectura/features/proyectos/application/useArquitecturaProjects'
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
  openArquitecturaDocumentFile,
} from '../../application/useArquitecturaDocuments'
import { DOCUMENT_TYPE_FORM_OPTIONS, ARQUITECTURA_DOCUMENT_NAV } from '../documentNav'

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
const { data: projectsResult, isLoading: projectsLoading } = useArquitecturaProjectsList(projectsParams)
const projectOptions = computed(() =>
  (projectsResult.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} â€” ${p.name}`,
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
  { key: 'title', label: 'TÃ­tulo', align: 'left' as const, sortable: true },
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
    title: 'Â¿Eliminar documento?',
    text: 'Esta acciÃ³n no se puede deshacer.',
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

function getDocActions(row: ArquitecturaDocumentRow): { label: string; icon: string; onClick: () => void }[] {
  return [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openEdit(row) },
    { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void removeRow(row) },
  ]
}

const navActiveClass =
  'border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
const navIdleClass =
  'border-transparent text-[color:var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-text-secondary)_8%,transparent)]'
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1400px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">
          Documentos
        </p>
        <h1 class="text-xl font-bold mt-0.5" :style="{ color: 'var(--color-text-primary)' }">{{ sectionTitle }}</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Registro por proyecto: sube archivos (contratos, planos, renders, memoria descriptiva, facturas y actas).
        </p>
      </div>
      <BaseButton type="button" @click="openCreate">
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nuevo registro
      </BaseButton>
    </div>

    <div
      class="flex flex-wrap gap-2 p-1 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }"
    >
      <RouterLink
        v-for="item in ARQUITECTURA_DOCUMENT_NAV"
        :key="item.segment"
        :to="`${ARQUITECTURA_BASE_PATH}/documentos/${item.segment}`"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
        :class="route.path.endsWith(`/documentos/${item.segment}`) ? navActiveClass : navIdleClass"
      >
        {{ item.label }}
      </RouterLink>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <template v-else>
        <DataTable
          empty-text="No hay documentos en esta categorÃ­a. AÃ±ade uno o cambia los filtros."
          :columns="columns"
          :data="rows"
          row-key="id"
        >
          <template #toolbar>
            <div class="flex flex-wrap gap-3 flex-1 min-w-0 items-end">
              <div class="flex-1 min-w-[200px]">
                <SearchInput v-model="searchInput" placeholder="Buscar por tÃ­tulo, cÃ³digo o proyectoâ€¦" />
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
              <button
                type="button"
                class="text-sm font-medium hover:underline text-left"
                :style="{ color: 'var(--color-primary)' }"
                @click="goProject((row as ArquitecturaDocumentRow).projectId)"
              >
                {{ (row as ArquitecturaDocumentRow).projectCode }}
              </button>
              <div class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                {{ (row as ArquitecturaDocumentRow).projectName }}
              </div>
            </td>
            <td class="py-3 px-4 text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ (row as ArquitecturaDocumentRow).title }}
            </td>
            <td class="py-3 px-4 text-sm">
              <button
                v-if="hasFile(row as ArquitecturaDocumentRow)"
                type="button"
                class="inline-flex items-center gap-1 hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="openArquitecturaDocumentFile(row as ArquitecturaDocumentRow)"
              >
                <AppIcon icon="lucide:external-link" :size="16" />
                Abrir
              </button>
              <span v-else class="text-muted" :style="{ color: 'var(--color-text-secondary)' }">—</span>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ formatDate((row as ArquitecturaDocumentRow).createdAt) }}
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <ActionsDropdown :items="getDocActions(row as ArquitecturaDocumentRow)" />
            </td>
          </template>
        </DataTable>
        <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </div>

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
          <p class="text-sm font-medium mb-1.5" :style="{ color: 'var(--color-text-primary)' }">Archivo</p>
          <FileDropzone
            v-model="createFile"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx,.xls,.dwg"
            :max-size="25 * 1024 * 1024"
          />
        </div>
        <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
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
        <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
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
