<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  BaseTabs,
  Badge,
  StatsCard,
  DataTable,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import type {
  InteriorBudgetDetail,
  InteriorBudgetLevelDto,
  InteriorBudgetLevelInput,
} from '../../domain/budget.types'
import {
  openInteriorBudgetPdf,
  useAddInteriorBudgetAttachment,
  useAddInteriorBudgetComment,
  useDuplicateInteriorBudget,
  useInteriorBudgetDetail,
  useUpdateInteriorBudget,
} from '../../application/useInteriorBudgets'
import { BUDGET_STATUS_LABELS, computeLinePreview, formatSol } from '../labels'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref('estructura')
const { data: detail, isLoading, isError } = useInteriorBudgetDetail(id)

const headerTitle = ref('')
const headerStatus = ref('DRAFT')
const headerIgv = ref(18)
const draftLevels = ref<InteriorBudgetLevelInput[]>([])

function detailToInputs(levels: InteriorBudgetLevelDto[]): InteriorBudgetLevelInput[] {
  return levels.map((lvl) => ({
    sortOrder: lvl.sortOrder,
    name: lvl.name,
    environments: lvl.environments.map((env) => ({
      sortOrder: env.sortOrder,
      name: env.name,
      categories: env.categories.map((cat) => ({
        sortOrder: cat.sortOrder,
        name: cat.name,
        items: cat.items.map((it) => ({
          sortOrder: it.sortOrder,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          utilityPct: it.utilityPct,
          igvPct: it.igvPct,
        })),
      })),
    })),
  }))
}

watch(
  () => detail.value,
  (d: InteriorBudgetDetail | undefined) => {
    if (!d) return
    headerTitle.value = d.title ?? ''
    headerStatus.value = d.status
    headerIgv.value = d.defaultIgvPct
    draftLevels.value = detailToInputs(d.levels)
  },
  { immediate: true },
)

const tabs = [
  { id: 'estructura', label: 'Estructura', icon: 'lucide:layers' },
  { id: 'adjuntos', label: 'Adjuntos', icon: 'lucide:paperclip' },
  { id: 'comentarios', label: 'Comentarios', icon: 'lucide:message-circle' },
  { id: 'historial', label: 'Historial', icon: 'lucide:history' },
]

const statusOptions = Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({ value, label }))
const statusLabel = (s: string) => BUDGET_STATUS_LABELS[s] ?? s

const updateMut = useUpdateInteriorBudget(id)
const dupMut = useDuplicateInteriorBudget()
const commentMut = useAddInteriorBudgetComment(id)
const attachMut = useAddInteriorBudgetAttachment(id)

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/presupuestos`)

const saveHeader = async () => {
  await updateMut.mutateAsync({
    title: headerTitle.value.trim() ? headerTitle.value.trim() : null,
    status: headerStatus.value,
    defaultIgvPct: Number(headerIgv.value),
  })
}

const saveStructure = async () => {
  await updateMut.mutateAsync({
    levels: draftLevels.value,
    defaultIgvPct: Number(headerIgv.value),
  })
}

const onDuplicate = async () => {
  const nb = await dupMut.mutateAsync(id.value)
  router.replace(`${INTERIORISMO_BASE_PATH}/presupuestos/${nb.id}`)
}

const commentBody = ref('')
const sendComment = async () => {
  const t = commentBody.value.trim()
  if (!t) return
  await commentMut.mutateAsync(t)
  commentBody.value = ''
}

const showAttach = ref(false)
const attachTitle = ref('')
const attachUrl = ref('')
const submitAttach = async () => {
  await attachMut.mutateAsync({ title: attachTitle.value, fileUrl: attachUrl.value })
  attachTitle.value = ''
  attachUrl.value = ''
  showAttach.value = false
}

const histCols = [
  { key: 'eventType', label: 'Evento', align: 'left' as const },
  { key: 'summary', label: 'Detalle', align: 'left' as const },
  { key: 'at', label: 'Fecha', align: 'left' as const },
]

function addLevel() {
  draftLevels.value.push({
    sortOrder: draftLevels.value.length,
    name: `Nivel ${draftLevels.value.length + 1}`,
    environments: [
      {
        sortOrder: 0,
        name: 'Ambiente',
        categories: [{ sortOrder: 0, name: 'Categoría', items: [] }],
      },
    ],
  })
}

function addEnvironment(li: number) {
  const lvl = draftLevels.value[li]
  if (!lvl) return
  lvl.environments.push({
    sortOrder: lvl.environments.length,
    name: `Ambiente ${lvl.environments.length + 1}`,
    categories: [{ sortOrder: 0, name: 'Categoría', items: [] }],
  })
}

function addCategory(li: number, ei: number) {
  const env = draftLevels.value[li]?.environments[ei]
  if (!env) return
  env.categories.push({
    sortOrder: env.categories.length,
    name: `Categoría ${env.categories.length + 1}`,
    items: [],
  })
}

function addItem(li: number, ei: number, ci: number) {
  const cat = draftLevels.value[li]?.environments[ei]?.categories[ci]
  if (!cat) return
  cat.items.push({
    sortOrder: cat.items.length,
    description: '',
    unit: 'und',
    quantity: 1,
    unitPrice: 0,
    utilityPct: 0,
    igvPct: Number(headerIgv.value),
  })
}

function linePreview(it: InteriorBudgetLevelInput['environments'][0]['categories'][0]['items'][0]) {
  return computeLinePreview(
    Number(it.quantity) || 0,
    Number(it.unitPrice) || 0,
    Number(it.utilityPct) || 0,
    Number(it.igvPct ?? headerIgv.value) || 0,
  ).lineTotal
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
            {{ detail?.code ?? 'Presupuesto' }}
          </h1>
          <Badge v-if="detail" variant="neutral">v{{ detail.version }}</Badge>
          <Badge v-if="detail" variant="info">{{ statusLabel(detail.status) }}</Badge>
        </div>
        <p v-if="detail" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          {{ detail.project.code }} · {{ detail.project.name }} — {{ detail.project.client.fullName }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" size="sm" @click="openInteriorBudgetPdf(id)">
          <AppIcon icon="lucide:file-down" :size="16" class="mr-1" />
          PDF
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          :loading="dupMut.isPending.value"
          @click="onDuplicate"
        >
          <AppIcon icon="lucide:copy" :size="16" class="mr-1" />
          Duplicar
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>
    <div v-else-if="isError || !detail" class="text-center py-16 text-sm" style="color: var(--color-text-secondary)">
      No se encontró el presupuesto.
      <div class="mt-4">
        <BaseButton variant="outline" @click="goBack">Volver</BaseButton>
      </div>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total" :value="formatSol(detail.grandTotal)">
          <template #icon><AppIcon icon="lucide:banknote" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Base imponible" :value="formatSol(detail.taxableTotal)">
          <template #icon><AppIcon icon="lucide:percent" :size="20" color="#2563eb" /></template>
        </StatsCard>
        <StatsCard title="IGV" :value="formatSol(detail.igvTotal)">
          <template #icon><AppIcon icon="lucide:receipt" :size="20" color="#16a34a" /></template>
        </StatsCard>
        <StatsCard title="Cliente" :value="detail.project.client.documentNumber">
          <template #icon><AppIcon icon="lucide:user" :size="20" color="#d97706" /></template>
        </StatsCard>
      </div>

      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Cabecera
        </h2>
        <div class="grid md:grid-cols-3 gap-4">
          <FormInput v-model="headerTitle" label="Título" />
          <FormSelect v-model="headerStatus" :options="statusOptions" label="Estado" />
          <FormInput v-model.number="headerIgv" label="IGV por defecto (%)" type="number" />
        </div>
        <BaseButton size="sm" variant="primary" :loading="updateMut.isPending.value" @click="saveHeader">
          Guardar cabecera
        </BaseButton>
      </section>

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <BaseTabs v-model="activeTab" :tabs="tabs" />
        <div class="p-5 space-y-6">
          <div v-show="activeTab === 'estructura'" class="space-y-6">
            <div class="flex justify-between items-center gap-2 flex-wrap">
              <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                Nivel → Ambiente → Categoría → Ítems. Los montos se recalculan al guardar.
              </p>
              <div class="flex gap-2">
                <BaseButton size="sm" variant="outline" @click="addLevel">+ Nivel</BaseButton>
                <BaseButton size="sm" variant="primary" :loading="updateMut.isPending.value" @click="saveStructure">
                  Guardar estructura
                </BaseButton>
              </div>
            </div>

            <div class="space-y-6 max-h-[560px] overflow-y-auto pr-1">
              <div
                v-for="(lvl, li) in draftLevels"
                :key="li"
                class="p-4 rounded-lg border space-y-3"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <div class="flex flex-wrap gap-2 items-center justify-between">
                  <FormInput v-model="lvl.name" class="flex-1 min-w-[200px]" label="Nivel" />
                  <BaseButton size="sm" variant="outline" @click="addEnvironment(li)">+ Ambiente</BaseButton>
                </div>

                <div
                  v-for="(env, ei) in lvl.environments"
                  :key="ei"
                  class="pl-3 border-l-2 space-y-3"
                  style="border-color: color-mix(in srgb, var(--color-primary) 35%, transparent)"
                >
                  <div class="flex flex-wrap gap-2 items-center justify-between">
                    <FormInput v-model="env.name" class="flex-1 min-w-[180px]" label="Ambiente" />
                    <BaseButton size="sm" variant="outline" @click="addCategory(li, ei)">
                      + Categoría
                    </BaseButton>
                  </div>

                  <div
                    v-for="(cat, ci) in env.categories"
                    :key="ci"
                    class="pl-3 border-l border-dashed space-y-3"
                    :style="{ borderColor: 'var(--color-border)' }"
                  >
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                      <FormInput v-model="cat.name" class="flex-1 min-w-[160px]" label="Categoría" />
                      <BaseButton size="sm" variant="outline" @click="addItem(li, ei, ci)">
                        + Ítem
                      </BaseButton>
                    </div>

                    <div v-if="!cat.items.length" class="text-xs" style="color: var(--color-text-muted)">
                      Sin ítems en esta categoría.
                    </div>

                    <div
                      v-for="(it, ii) in cat.items"
                      :key="ii"
                      class="grid grid-cols-12 gap-2 items-end pb-3 border-b last:border-0"
                      :style="{ borderColor: 'var(--color-border)' }"
                    >
                      <FormInput v-model="it.description" class="col-span-12 md:col-span-4" label="Descripción" />
                      <FormInput v-model="it.unit" class="col-span-6 md:col-span-1" label="Und." />
                      <FormInput v-model.number="it.quantity" class="col-span-6 md:col-span-2" label="Cant." type="number" />
                      <FormInput v-model.number="it.unitPrice" class="col-span-6 md:col-span-2" label="Precio" type="number" />
                      <FormInput v-model.number="it.utilityPct" class="col-span-6 md:col-span-1" label="Util.%" type="number" />
                      <FormInput v-model.number="it.igvPct" class="col-span-6 md:col-span-1" label="IGV%" type="number" />
                      <div class="col-span-12 md:col-span-1 text-xs font-medium" style="color: var(--color-text-secondary)">
                        Subtotal<br />
                        <span class="text-sm" style="color: var(--color-text-primary)">{{
                          formatSol(linePreview(it))
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'adjuntos'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton size="sm" variant="primary" @click="showAttach = true">Registrar adjunto</BaseButton>
            </div>
            <DataTable
              empty-text="Sin adjuntos."
              :columns="[
                { key: 'title', label: 'Título', align: 'left' },
                { key: 'url', label: 'Enlace', align: 'left' },
              ]"
              :data="
                detail.attachments.map((a) => ({
                  ...a,
                  url: a.fileUrl,
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).title }}</td>
                <td class="py-2 px-3 text-sm">
                  <a
                    :href="(row as any).fileUrl"
                    class="underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                    >{{ (row as any).fileUrl }}</a
                  >
                </td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'comentarios'" class="space-y-4">
            <FormTextarea v-model="commentBody" label="Nuevo comentario" :rows="3" />
            <BaseButton size="sm" variant="primary" :loading="commentMut.isPending.value" @click="sendComment">
              Publicar
            </BaseButton>
            <ul class="space-y-3">
              <li
                v-for="c in detail.comments"
                :key="c.id"
                class="p-3 rounded-lg border text-sm whitespace-pre-wrap"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <span class="text-xs block mb-1" style="color: var(--color-text-muted)">{{
                  new Date(c.createdAt).toLocaleString('es-PE')
                }}</span>
                {{ c.body }}
              </li>
            </ul>
          </div>

          <div v-show="activeTab === 'historial'">
            <DataTable
              empty-text="Sin historial."
              :columns="histCols"
              :data="
                detail.history.map((h) => ({
                  ...h,
                  at: new Date(h.createdAt).toLocaleString('es-PE'),
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).eventType }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).summary }}</td>
                <td class="py-2 px-3 text-xs whitespace-nowrap">{{ (row as any).at }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
    </template>

    <BaseModal v-model="showAttach" title="Registrar adjunto" size="md">
      <div class="space-y-3 pt-1">
        <FormInput v-model="attachTitle" label="Título" />
        <FormInput v-model="attachUrl" label="URL del archivo" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" @click="showAttach = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="attachMut.isPending.value" @click="submitAttach">
            Guardar
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
