<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney, splitCurrencyTotals, sumByCurrency } from '@shared/utils/money'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { ListInteriorCatalogMaterialsParams } from '../../domain/catalog.types'
import { useInteriorCatalogMaterialsList } from '../composables/useInteriorCatalogMaterials'
import {
  useInteriorMaterialSupplierDetail,
  useLinkInteriorSupplierCatalog,
  useUnlinkInteriorSupplierCatalog,
} from '../composables/useInteriorMaterialSuppliers'
import { formatQty } from '../labels'
import SupplierPurchaseModal from '../components/SupplierPurchaseModal.vue'
/**
 * Ficha del proveedor: cifras clave y pestañas Datos · Materiales · Compras · Proyectos
 * (partidas de presupuestos asignadas, con costo real, abonado y saldo).
 */

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const { data: s, isLoading, isError } = useInteriorMaterialSupplierDetail(id)

const TABS = [
  { id: 'datos', label: 'Datos', icon: 'lucide:building-2' },
  { id: 'materiales', label: 'Materiales', icon: 'lucide:layers' },
  { id: 'compras', label: 'Compras', icon: 'lucide:shopping-cart' },
  { id: 'proyectos', label: 'Proyectos', icon: 'lucide:folder-kanban' },
] as const
const activeTab = ref<(typeof TABS)[number]['id']>('datos')

const purchased = computed(() => splitCurrencyTotals(sumByCurrency(s.value?.purchases ?? [], (p) => p.currency, (p) => p.totalAmount)))
const projectBalance = computed(() =>
  splitCurrencyTotals(
    sumByCurrency(s.value?.projectItems ?? [], (i) => i.currency, (i) => (i.actualCost != null ? Math.max(0, i.actualCost - i.paid) : 0)),
  ),
)
const projectsCount = computed(() => new Set((s.value?.projectItems ?? []).map((i) => i.project.id)).size)

// ── Vincular materiales ──
const catalogParams = ref<ListInteriorCatalogMaterialsParams>({ page: 1, limit: 100 })
const { data: catalog } = useInteriorCatalogMaterialsList(catalogParams)
const linkedIds = computed(() => new Set((s.value?.catalogLinks ?? []).map((l) => l.catalogMaterialId)))
const linkOptions = computed(() =>
  (catalog.value?.data ?? []).filter((m) => !linkedIds.value.has(m.id)).map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` })),
)
const linkOpen = ref(false)
const linkDraft = ref({ materialId: '', sku: '' })
watch(linkOpen, (o) => {
  if (o) linkDraft.value = { materialId: '', sku: '' }
})
const linkMut = useLinkInteriorSupplierCatalog(id)
const unlinkMut = useUnlinkInteriorSupplierCatalog()
async function submitLink() {
  if (!linkDraft.value.materialId) return
  await linkMut.mutateAsync({ catalogMaterialId: linkDraft.value.materialId, supplierSku: linkDraft.value.sku.trim() || null })
  linkOpen.value = false
}
async function unlink(linkId: string, name: string) {
  const ok = await markapAlert.confirmDanger({ title: 'Desvincular material', text: `«${name}» dejará de figurar para este proveedor.`, confirmText: 'Desvincular' })
  if (ok) await unlinkMut.mutateAsync(linkId)
}

const purchaseOpen = ref(false)
const ROW_STATUS: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'neutral' },
  QUOTED: { label: 'Cotizado', variant: 'info' },
  PURCHASED: { label: 'Comprado', variant: 'success' },
  GIFT: { label: 'Obsequio', variant: 'warning' },
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores`)
const goMaterial = (materialId: string) => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${materialId}`)
const goProject = (projectId: string) => router.push({ path: `${INTERIORISMO_BASE_PATH}/proyectos/${projectId}`, query: { tab: 'compras' } })
const th = 'border-b border-gray-200 px-4 py-2.5 text-theme-xs font-medium uppercase tracking-wide whitespace-nowrap text-gray-500 dark:border-gray-800 dark:text-gray-400'
const td = 'border-b border-gray-100 px-4 py-3 text-sm dark:border-gray-800'
</script>

<template>
  <div>
    <PageHeader :title="s?.companyName ?? 'Proveedor'" :subtitle="s ? `RUC ${s.ruc}` : 'Ficha del proveedor'" back class="mb-6" @back="goBack">
      <template #actions>
        <div v-if="s && canWrite" class="flex flex-wrap items-center gap-2">
          <BaseButton variant="outline" size="sm" icon="lucide:shopping-cart" @click="purchaseOpen = true">Registrar compra</BaseButton>
          <BaseButton variant="primary" size="sm" icon="lucide:pencil" @click="router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${s.id}/editar`)">Editar</BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" class="py-24" />
    <p v-else-if="isError || !s" class="py-16 text-center text-sm text-gray-500">No se encontró el proveedor.</p>
    <div v-else class="space-y-6">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard compact title="Materiales" :value="String(s.catalogLinks.length)" subtitle="del catálogo">
          <template #icon><AppIcon icon="lucide:layers" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Comprado (catálogo)" :value="purchased.main" :subtitle="purchased.rest || `${s.purchases.length} compras`">
          <template #icon><AppIcon icon="lucide:receipt" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="En proyectos" :value="`${s.projectItems.length} partidas`" :subtitle="`${projectsCount} proyecto(s)`">
          <template #icon><AppIcon icon="lucide:folder-kanban" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Saldo por pagar" :value="projectBalance.main" :subtitle="projectBalance.rest || 'en proyectos'">
          <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
        </StatsCard>
      </div>

      <BaseTabs v-model="activeTab" :tabs="TABS" />

      <FormSectionCard v-if="activeTab === 'datos'" title="Contacto" icon="lucide:contact" show-icon>
        <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div><dt class="text-theme-xs text-gray-400">Razón social</dt><dd class="font-medium text-gray-800 dark:text-white/90">{{ s.companyName }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">RUC</dt><dd class="text-gray-800 dark:text-white/90">{{ s.ruc }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Contacto</dt><dd class="text-gray-800 dark:text-white/90">{{ s.contactName ?? '—' }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Teléfono · Email</dt><dd class="text-gray-800 dark:text-white/90">{{ [s.phone, s.email].filter(Boolean).join(' · ') || '—' }}</dd></div>
        </dl>
      </FormSectionCard>

      <div v-else-if="activeTab === 'materiales'" class="space-y-3">
        <div v-if="canWrite" class="flex justify-end"><BaseButton variant="outline" size="sm" icon="lucide:link" @click="linkOpen = true">Vincular material</BaseButton></div>
        <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <table class="w-full min-w-max border-collapse">
            <thead class="bg-gray-50 dark:bg-gray-900"><tr><th :class="[th, 'text-left']">Material</th><th :class="[th, 'text-left']">Categoría</th><th :class="[th, 'text-left']">SKU del proveedor</th><th :class="[th, 'w-12']" /></tr></thead>
            <tbody>
              <tr v-for="l in s.catalogLinks" :key="l.id" class="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                <td :class="td"><button type="button" class="text-left" @click="goMaterial(l.catalogMaterialId)"><span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{{ l.materialName }}</span><span class="text-xs text-gray-400">{{ l.materialCode }}</span></button></td>
                <td :class="td"><Badge variant="neutral">{{ l.category }}</Badge></td>
                <td :class="[td, 'text-gray-500']">{{ l.supplierSku ?? '—' }}</td>
                <td :class="[td, 'text-right']"><IconButton v-if="canWrite" icon="lucide:unlink" label="Desvincular" @click="unlink(l.id, l.materialName)" /></td>
              </tr>
              <tr v-if="!s.catalogLinks.length"><td colspan="4" class="px-4 py-12 text-center text-sm text-gray-400">Sin materiales vinculados.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'compras'" class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900"><tr><th :class="[th, 'text-left']">Fecha</th><th :class="[th, 'text-left']">Material</th><th :class="[th, 'text-right']">Cantidad</th><th :class="[th, 'text-right']">P. unitario</th><th :class="[th, 'text-right']">Total</th><th :class="[th, 'text-left']">Comprobante</th></tr></thead>
          <tbody>
            <tr v-for="p in s.purchases" :key="p.id">
              <td :class="[td, 'whitespace-nowrap text-gray-500']">{{ formatShortDate(p.purchasedAt) }}</td>
              <td :class="td">{{ p.materialName ?? p.notes ?? '—' }}<span v-if="p.materialCode" class="block text-xs text-gray-400">{{ p.materialCode }}</span></td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatQty(p.quantity) }}</td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(p.unitPrice, p.currency) }}</td>
              <td :class="[td, 'text-right font-medium tabular-nums']">{{ formatMoney(p.totalAmount, p.currency) }}</td>
              <td :class="[td, 'text-gray-500']">{{ p.invoiceRef ?? '—' }}</td>
            </tr>
            <tr v-if="!s.purchases.length"><td colspan="6" class="px-4 py-12 text-center text-sm text-gray-400">Sin compras registradas.</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900"><tr><th :class="[th, 'text-left']">Partida</th><th :class="[th, 'text-left']">Proyecto</th><th :class="[th, 'text-right']">Presupuestado</th><th :class="[th, 'text-right']">Costo real</th><th :class="[th, 'text-right']">Abonado</th><th :class="[th, 'text-left']">Estado</th></tr></thead>
          <tbody>
            <tr v-for="i in s.projectItems" :key="i.rowId" class="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02]" @click="goProject(i.project.id)">
              <td :class="[td, 'text-gray-800 dark:text-white/90']">{{ i.description || 'Sin descripción' }}</td>
              <td :class="td"><span class="block text-gray-800 dark:text-white/90">{{ i.project.name }}</span><span class="text-xs text-gray-400">{{ i.project.code }}</span></td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(i.cost, i.currency) }}</td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(i.actualCost, i.currency) }}</td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(i.paid, i.currency) }}</td>
              <td :class="td"><Badge :variant="ROW_STATUS[i.status]?.variant ?? 'neutral'">{{ ROW_STATUS[i.status]?.label ?? i.status }}</Badge></td>
            </tr>
            <tr v-if="!s.projectItems.length"><td colspan="6" class="px-4 py-12 text-center text-sm text-gray-400">No tiene partidas asignadas en presupuestos. Asígnelo desde la pestaña Compras del proyecto.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SupplierPurchaseModal v-if="s" v-model:open="purchaseOpen" :supplier-id="s.id" />
    <BaseModal v-model="linkOpen" title="Vincular material del catálogo" size="md">
      <div class="space-y-4 p-1">
        <FormCombobox v-model="linkDraft.materialId" label="Material" placeholder="Buscar material..." :options="linkOptions" empty-text="No quedan materiales por vincular" required />
        <FormInput v-model="linkDraft.sku" label="SKU del proveedor" placeholder="Opcional" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="linkOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" icon="lucide:link" :disabled="!linkDraft.materialId" :loading="linkMut.isPending.value" @click="submitLink">Vincular</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
