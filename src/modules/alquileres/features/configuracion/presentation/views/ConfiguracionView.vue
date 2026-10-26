<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ConfigToggleRow from '@shared/presentation/components/ui/ConfigToggleRow.vue'
import { useAlertConfig } from '../composables/useAlertConfig'
const APPLICATION_SLUG = 'alquileres'

const activeTab = ref<'alertas' | 'notificaciones'>('alertas')

const {
  data: config,
  isLoading,
  save,
  isSaving,
  saveError,
  saveSuccess,
} = useAlertConfig(APPLICATION_SLUG)

const form = ref({
  alert30Days: true,
  alert60Days: true,
  alert90Days: true,
  alertPendingPayment: true,
  alertOverduePayment: true,
  channelInApp: true,
  channelEmail: false,
  channelWhatsapp: false,
})

watch(
  config,
  (val) => {
    if (!val) return
    form.value = {
      alert30Days: val.alert30Days,
      alert60Days: val.alert60Days,
      alert90Days: val.alert90Days,
      alertPendingPayment: val.alertPendingPayment,
      alertOverduePayment: val.alertOverduePayment,
      channelInApp: val.channelInApp,
      channelEmail: val.channelEmail,
      channelWhatsapp: val.channelWhatsapp,
    }
  },
  { immediate: true },
)

async function handleSave() {
  await save({ ...form.value })
}

const tabs = [
  { id: 'alertas', label: 'Alertas', icon: 'lucide:bell' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'lucide:mail' },
] as const
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      title="Configuración"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Personaliza el comportamiento del módulo de alquileres
      </p>
      </template>
    </PageHeader>

    <!-- Tabs -->
    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <!-- Loading -->
    <LoadingState v-if="isLoading" text="Cargando configuración..." />

    <template v-else>
      <!-- ===== TAB ALERTAS ===== -->
      <div v-show="activeTab === 'alertas'" class="space-y-6">

        <!-- Alertas de Vencimiento -->
        <BaseCard padding="none" class="block overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <AppIcon icon="lucide:bell-ring" :size="16" color="var(--color-primary)" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Alertas de Vencimiento</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500">Configura cuándo recibir alertas sobre contratos</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.alert30Days" title="Aviso a 1 mes" description="Notificar cuando al contrato le quedan 30 días o menos" />
          <ConfigToggleRow v-model="form.alert60Days" title="Aviso a 2 meses" description="Notificar cuando al contrato le quedan entre 31 y 60 días" />
          <ConfigToggleRow v-model="form.alert90Days" title="Aviso a 3 meses" description="Notificar cuando al contrato le quedan entre 61 y 90 días" />
        </BaseCard>

        <!-- Alertas de Cobranza -->
        <BaseCard padding="none" class="block overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <AppIcon icon="lucide:circle-dollar-sign" :size="16" color="#10b981" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Alertas de Cobranza</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500">Configura alertas de pagos pendientes</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.alertPendingPayment" title="Pago pendiente" description="Alertar cuando hay un pago próximo a vencer" />
          <ConfigToggleRow v-model="form.alertOverduePayment" title="Pago atrasado" description="Alertar cuando un pago está vencido" />
        </BaseCard>
      </div>

      <!-- ===== TAB NOTIFICACIONES ===== -->
      <div v-show="activeTab === 'notificaciones'" class="space-y-6">
        <BaseCard padding="none" class="block overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <AppIcon icon="lucide:mail" :size="16" color="var(--color-primary)" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Canales de Notificación</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500">Elige cómo recibir las notificaciones</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.channelInApp" title="En el sistema" description="Recibir notificaciones dentro de la aplicación" />
          <ConfigToggleRow v-model="form.channelEmail" title="Email" description="Recibir notificaciones por correo electrónico (próximamente)" :disabled="true" />
          <ConfigToggleRow v-model="form.channelWhatsapp" title="WhatsApp" description="Recibir notificaciones por WhatsApp (próximamente)" :disabled="true" />
        </BaseCard>

        <!-- Info -->
        <BaseAlert type="info">
          <p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Las notificaciones en el sistema son enviadas en tiempo real cuando ocurre un evento relevante
            (nuevo contrato, pago pendiente, contrato próximo a vencer). Puedes verlas en el ícono de
            campana en la barra superior.
          </p>
        </BaseAlert>
      </div>

      <!-- Feedback -->
      <div v-if="saveError" class="flex items-center gap-2 p-3 rounded-lg border border-error-500 bg-error-500/10">
        <AppIcon icon="lucide:circle-x" :size="16" color="var(--color-error)" />
        <p class="text-sm text-error-500 dark:text-error-400">{{ saveError }}</p>
      </div>
      <BaseAlert v-if="saveSuccess" type="success">
        <p class="text-sm text-success-600 dark:text-success-500">Configuración guardada correctamente</p>
      </BaseAlert>

      <!-- Guardar -->
      <div class="flex justify-end">
        <BaseButton v-if="canWrite" variant="primary" class="flex items-center gap-2" :loading="isSaving" @click="handleSave">
          <AppIcon icon="lucide:save" :size="16" />
          Guardar Configuración
        </BaseButton>
      </div>
    </template>
  </div>
</template>
