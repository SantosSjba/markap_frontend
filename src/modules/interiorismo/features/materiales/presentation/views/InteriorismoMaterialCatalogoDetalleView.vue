<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import StoredImageThumb from '@shared/presentation/components/ui/StoredImageThumb.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { useOpenStoredFile } from '@shared/presentation/composables/useOpenStoredFile'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney } from '@shared/utils/money'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorCatalogMaterialDetail } from '../composables/useInteriorCatalogMaterials'
import { formatQty } from '../labels'
/** Ficha del material: cifras clave y pestañas Datos · Proveedores · Compras. */

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const { data: m, isLoading, isError } = useInteriorCatalogMaterialDetail(id)
const { openStoredFile } = useOpenStoredFile(INTERIORISMO_APP_SLUG)

const TABS = [
  { id: 'datos', label: 'Datos', icon: 'lucide:info' },
  { id: 'proveedores', label: 'Proveedores', icon: 'lucide:truck' },
  { id: 'compras', label: 'Compras', icon: 'lucide:shopping-cart' },
] as const
const activeTab = ref<(typeof TABS)[number]['id']>('datos')
const images = computed(() => [...(m.value?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
const lastPurchase = computed(() => m.value?.purchases[0] ?? null)

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo`)
const goSupplier = (supplierId: string) => router.push(`${INTERIORISMO_BASE_PATH}/materiales/proveedores/${supplierId}`)
const th = 'border-b border-gray-200 px-4 py-2.5 text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400'
const td = 'border-b border-gray-100 px-4 py-3 text-sm dark:border-gray-800'
</script>

<template>
  <div>
    <PageHeader :title="m?.name ?? 'Material'" :subtitle="m ? `${m.code} · ${m.brand}` : 'Ficha del material'" back class="mb-6" @back="goBack">
      <template #actions>
        <div v-if="m" class="flex items-center gap-2">
          <Badge variant="neutral">{{ m.category }}</Badge>
          <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:pencil" @click="router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${m.id}/editar`)">Editar</BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" class="py-24" />
    <p v-else-if="isError || !m" class="py-16 text-center text-sm text-gray-500">No se encontró el material.</p>
    <div v-else class="space-y-6">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard compact title="Precio ref." :value="formatMoney(m.price, m.currency)" :subtitle="`por ${m.unit}`">
          <template #icon><AppIcon icon="lucide:tag" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Stock" :value="formatQty(m.stock)" :subtitle="m.stock <= 0 ? 'por reponer' : m.unit">
          <template #icon><AppIcon icon="lucide:package" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Proveedores" :value="String(m.suppliers.length)" subtitle="lo surten">
          <template #icon><AppIcon icon="lucide:truck" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Última compra" :value="lastPurchase ? formatMoney(lastPurchase.unitPrice, lastPurchase.currency) : '—'" :subtitle="lastPurchase ? `${formatShortDate(lastPurchase.purchasedAt)} · ${lastPurchase.supplierName}` : 'sin compras'">
          <template #icon><AppIcon icon="lucide:receipt" :size="20" /></template>
        </StatsCard>
      </div>

      <BaseTabs v-model="activeTab" :tabs="TABS" />

      <div v-if="activeTab === 'datos'" class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <FormSectionCard class="xl:col-span-2" title="Imágenes" icon="lucide:image" show-icon>
          <div v-if="images.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button v-for="img in images" :key="img.id" type="button" class="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800" @click="openStoredFile({ url: img.url, filePath: img.url })">
              <StoredImageThumb :path="img.url" :application-slug="INTERIORISMO_APP_SLUG" />
            </button>
          </div>
          <p v-else class="text-sm text-gray-400">Sin imágenes. Agréguelas desde Editar.</p>
        </FormSectionCard>
        <aside class="space-y-6">
          <FormSectionCard title="Descripción" icon="lucide:align-left" show-icon>
            <p class="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">{{ m.description || 'Sin descripción.' }}</p>
          </FormSectionCard>
          <FormSectionCard title="Ficha técnica" icon="lucide:file-text" show-icon>
            <BaseButton v-if="m.technicalSheetUrl" variant="outline" size="sm" icon="lucide:external-link" @click="openStoredFile({ url: m.technicalSheetUrl, filePath: m.technicalSheetUrl })">Abrir ficha técnica</BaseButton>
            <p v-else class="text-sm text-gray-400">Sin ficha técnica.</p>
          </FormSectionCard>
        </aside>
      </div>

      <div v-else-if="activeTab === 'proveedores'" class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900"><tr><th :class="[th, 'text-left']">Proveedor</th><th :class="[th, 'text-left']">RUC</th><th :class="[th, 'text-left']">SKU del proveedor</th></tr></thead>
          <tbody>
            <tr v-for="s in m.suppliers" :key="s.linkId" class="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02]" @click="goSupplier(s.supplierId)">
              <td :class="[td, 'font-medium text-gray-800 dark:text-white/90']">{{ s.companyName }}</td>
              <td :class="[td, 'text-gray-500']">{{ s.ruc }}</td>
              <td :class="[td, 'text-gray-500']">{{ s.supplierSku ?? '—' }}</td>
            </tr>
            <tr v-if="!m.suppliers.length"><td colspan="3" class="px-4 py-12 text-center text-sm text-gray-400">Ningún proveedor lo tiene vinculado. Vincúlelo desde la ficha del proveedor.</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr><th :class="[th, 'text-left']">Fecha</th><th :class="[th, 'text-left']">Proveedor</th><th :class="[th, 'text-right']">Cantidad</th><th :class="[th, 'text-right']">P. unitario</th><th :class="[th, 'text-right']">Total</th><th :class="[th, 'text-left']">Comprobante</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in m.purchases" :key="p.id">
              <td :class="[td, 'whitespace-nowrap text-gray-500']">{{ formatShortDate(p.purchasedAt) }}</td>
              <td :class="td"><button type="button" class="text-left text-gray-800 hover:text-brand-500 dark:text-white/90" @click="goSupplier(p.supplierId)">{{ p.supplierName }}</button></td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatQty(p.quantity) }}</td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(p.unitPrice, p.currency) }}</td>
              <td :class="[td, 'text-right font-medium tabular-nums']">{{ formatMoney(p.totalAmount, p.currency) }}</td>
              <td :class="[td, 'text-gray-500']">{{ p.invoiceRef ?? '—' }}</td>
            </tr>
            <tr v-if="!m.purchases.length"><td colspan="6" class="px-4 py-12 text-center text-sm text-gray-400">Sin compras registradas de este material.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
