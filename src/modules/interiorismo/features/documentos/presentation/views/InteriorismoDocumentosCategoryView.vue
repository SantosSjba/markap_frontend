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
} from '@shared/components'
import FormSelect from '@shared/components/forms/FormSelect.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import { markapAlert } from '@/shared/composables'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useInteriorProjectsList } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type {
  InteriorDocumentRow,
  InteriorDocumentType,
  ListInteriorDocumentsParams,
} from '../../domain/document.types'
import {
  useInteriorDocumentsList,
  useCreateInteriorDocument,
  useUpdateInteriorDocument,
  useDeleteInteriorDocument,
} from '../../application/useInteriorDocuments'
import { DOCUMENT_TYPE_FORM_OPTIONS, INTERIOR_DOCUMENT_NAV } from '../documentNav'

const route = useRoute()
const router = useRouter()

const ITEMS = 12

const docType = computed(() => (route.meta.docType as InteriorDocumentType) ?? 'CONTRATO')
const sectionTitle = computed(() => (route.meta.title as string) ?? 'Documentos')

const listParams = ref<ListInteriorDocumentsParams>({
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
const { data: projectsResult, isLoading: projectsLoading } = useInteriorProjectsList(projectsParams)
const projectOptions = computed(() =>
  (projectsResult.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  })),
)

const { data: result, isLoading } = useInteriorDocumentsList(listParams)

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
const createFileUrl = ref('')

const showEdit = ref(false)
const editingId = ref<string | null>(null)
const editTitle = ref('')
const editFileUrl = ref('')
const editDocType = ref<InteriorDocumentType>('CONTRATO')

const createMut = useCreateInteriorDocument()
const updateMut = useUpdateInteriorDocument()
const deleteMut = useDeleteInteriorDocument()

function resetCreate() {
  createProjectId.value = null
  createTitle.value = ''
  createFileUrl.value = ''
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
  await createMut.mutateAsync({
    projectId: createProjectId.value,
    docType: docType.value,
    title: createTitle.value.trim(),
    fileUrl: createFileUrl.value.trim() || null,
  })
  showCreate.value = false
  resetCreate()
}

function openEdit(row: InteriorDocumentRow) {
  editingId.value = row.id
  editTitle.value = row.title
  editFileUrl.value = row.fileUrl ?? ''
  editDocType.value = row.docType as InteriorDocumentType
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
      fileUrl: editFileUrl.value.trim() || null,
      docType: editDocType.value,
    },
  })
  showEdit.value = false
  editingId.value = null
}

async function removeRow(row: InteriorDocumentRow) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar documento?',
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteMut.mutateAsync(row.id)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function goProject(id: string) {
  void router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${id}`)
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
          Registro por proyecto: enlaces o URLs de archivo (contratos, renders, planos, facturas, actas y otros PDF).
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
        v-for="item in INTERIOR_DOCUMENT_NAV"
        :key="item.segment"
        :to="`${INTERIORISMO_BASE_PATH}/documentos/${item.segment}`"
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
              <button
                type="button"
                class="text-sm font-medium hover:underline text-left"
                :style="{ color: 'var(--color-primary)' }"
                @click="goProject((row as InteriorDocumentRow).projectId)"
              >
                {{ (row as InteriorDocumentRow).projectCode }}
              </button>
              <div class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                {{ (row as InteriorDocumentRow).projectName }}
              </div>
            </td>
            <td class="py-3 px-4 text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ (row as InteriorDocumentRow).title }}
            </td>
            <td class="py-3 px-4 text-sm">
              <a
                v-if="(row as InteriorDocumentRow).fileUrl"
                :href="(row as InteriorDocumentRow).fileUrl ?? '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 hover:underline"
                :style="{ color: 'var(--color-primary)' }"
              >
                <AppIcon icon="lucide:external-link" :size="16" />
                Abrir
              </a>
              <span v-else class="text-muted" :style="{ color: 'var(--color-text-secondary)' }">—</span>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ formatDate((row as InteriorDocumentRow).createdAt) }}
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <BaseButton variant="ghost" size="sm" type="button" class="mr-1" @click="openEdit(row as InteriorDocumentRow)">
                Editar
              </BaseButton>
              <BaseButton variant="outline" size="sm" type="button" @click="removeRow(row as InteriorDocumentRow)">
                Eliminar
              </BaseButton>
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
        <FormInput
          v-model="createFileUrl"
          label="URL del archivo"
          placeholder="https://…"
        />
        <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
          Categoría actual: <strong>{{ sectionTitle }}</strong>
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="showCreate = false">Cancelar</BaseButton>
          <BaseButton type="button" :disabled="createMut.isPending.value" @click="submitCreate">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="showEdit" title="Editar documento" size="lg">
      <div class="space-y-4">
        <FormSelect v-model="editDocType" label="Categoría" required :options="DOCUMENT_TYPE_FORM_OPTIONS" />
        <FormInput v-model="editTitle" label="Título" required />
        <FormInput v-model="editFileUrl" label="URL del archivo" placeholder="https://…" />
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
