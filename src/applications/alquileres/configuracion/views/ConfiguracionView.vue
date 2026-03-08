<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import ConfigToggleRow from '@shared/components/ui/ConfigToggleRow.vue'
import { useAlertConfig } from '../composables/useAlertConfig'

const APPLICATION_SLUG = 'alquileres'

const activeTab = ref<'alertas' | 'notificaciones'>('alertas')

const { data: config, isLoading, save, isSaving, saveError, saveSuccess } = useAlertConfig(APPLICATION_SLUG)

const form = ref({
  alert30Days: true,
  alert60Days: true,
  alert90Days: false,
  alertPendingPayment: true,
  alertOverduePayment: true,
  channelInApp: true,
  channelEmail: false,
  channelWhatsapp: false,
})

watch(config, (val) => {
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
}, { immediate: true })

async function handleSave() {
  await save({ ...form.value })
}

const tabs = [
  { id: 'alertas', label: 'Alertas', icon: 'lucide:bell' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'lucide:mail' },
] as const
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Configuración
      </h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Personaliza el comportamiento del módulo de alquileres
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b" :style="{ borderColor: 'var(--color-border)' }">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === tab.id ? 'border-[var(--color-primary)]' : 'border-transparent hover:bg-[var(--color-hover)]'"
        :style="{ color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }"
        @click="activeTab = tab.id"
      >
        <Icon :icon="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando configuración...</p>
    </div>

    <template v-else>
      <!-- ===== TAB ALERTAS ===== -->
      <div v-show="activeTab === 'alertas'" class="space-y-6">

        <!-- Alertas de Vencimiento -->
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b" :style="{ borderColor: 'var(--color-border)' }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
              <AppIcon icon="lucide:bell-ring" :size="16" color="var(--color-primary)" />
            </div>
            <div>
              <h3 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Alertas de Vencimiento</h3>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Configura cuándo recibir alertas sobre contratos</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.alert30Days" title="Alerta a 30 días" description="Notificar cuando un contrato vence en 30 días" />
          <ConfigToggleRow v-model="form.alert60Days" title="Alerta a 60 días" description="Notificar cuando un contrato vence en 60 días" />
          <ConfigToggleRow v-model="form.alert90Days" title="Alerta a 90 días" description="Notificar cuando un contrato vence en 90 días" />
        </div>

        <!-- Alertas de Cobranza -->
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b" :style="{ borderColor: 'var(--color-border)' }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
              <AppIcon icon="lucide:circle-dollar-sign" :size="16" color="#10b981" />
            </div>
            <div>
              <h3 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Alertas de Cobranza</h3>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Configura alertas de pagos pendientes</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.alertPendingPayment" title="Pago pendiente" description="Alertar cuando hay un pago próximo a vencer" />
          <ConfigToggleRow v-model="form.alertOverduePayment" title="Pago atrasado" description="Alertar cuando un pago está vencido" />
        </div>
      </div>

      <!-- ===== TAB NOTIFICACIONES ===== -->
      <div v-show="activeTab === 'notificaciones'" class="space-y-6">
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b" :style="{ borderColor: 'var(--color-border)' }">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
              <AppIcon icon="lucide:mail" :size="16" color="var(--color-primary)" />
            </div>
            <div>
              <h3 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Canales de Notificación</h3>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Elige cómo recibir las notificaciones</p>
            </div>
          </div>
          <ConfigToggleRow no-border v-model="form.channelInApp" title="En el sistema" description="Recibir notificaciones dentro de la aplicación" />
          <ConfigToggleRow v-model="form.channelEmail" title="Email" description="Recibir notificaciones por correo electrónico (próximamente)" :disabled="true" />
          <ConfigToggleRow v-model="form.channelWhatsapp" title="WhatsApp" description="Recibir notificaciones por WhatsApp (próximamente)" :disabled="true" />
        </div>

        <!-- Info -->
        <div
          class="flex items-start gap-3 p-4 rounded-xl border"
          :style="{ borderColor: '#6366f130', backgroundColor: '#6366f108' }"
        >
          <AppIcon icon="lucide:info" :size="16" color="var(--color-primary)" class="mt-0.5 shrink-0" />
          <p class="text-xs leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            Las notificaciones en el sistema son enviadas en tiempo real cuando ocurre un evento relevante
            (nuevo contrato, pago pendiente, contrato próximo a vencer). Puedes verlas en el ícono de
            campana en la barra superior.
          </p>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="saveError" class="flex items-center gap-2 p-3 rounded-lg border" :style="{ borderColor: 'var(--color-error)', backgroundColor: '#ef444410' }">
        <AppIcon icon="lucide:circle-x" :size="16" color="var(--color-error)" />
        <p class="text-sm" :style="{ color: 'var(--color-error)' }">{{ saveError }}</p>
      </div>
      <div v-if="saveSuccess" class="flex items-center gap-2 p-3 rounded-lg border" :style="{ borderColor: 'var(--color-success)', backgroundColor: '#10b98110' }">
        <AppIcon icon="lucide:circle-check" :size="16" color="var(--color-success)" />
        <p class="text-sm" :style="{ color: 'var(--color-success)' }">Configuración guardada correctamente</p>
      </div>

      <!-- Guardar -->
      <div class="flex justify-end">
        <BaseButton variant="primary" class="flex items-center gap-2" :loading="isSaving" @click="handleSave">
          <AppIcon icon="lucide:save" :size="16" />
          Guardar Configuración
        </BaseButton>
      </div>
    </template>
  </div>
</template>
