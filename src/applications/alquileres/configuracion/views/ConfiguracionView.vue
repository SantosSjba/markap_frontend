<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import BaseButton from '@shared/components/ui/BaseButton.vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useAlertConfig } from '../composables/useAlertConfig'

const APPLICATION_SLUG = 'alquileres'

const activeTab = ref<'alertas' | 'notificaciones'>('alertas')

const { data: config, isLoading, save, isSaving, saveError, saveSuccess } = useAlertConfig(APPLICATION_SLUG)

// Formulario local reactivo
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

// Sincronizar cuando carga la config
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-3xl mx-auto">
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
        :class="
          activeTab === tab.id
            ? 'border-[var(--color-primary)]'
            : 'border-transparent hover:bg-[var(--color-hover)]'
        "
        :style="{
          color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }"
        @click="activeTab = tab.id"
      >
        <Icon :icon="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="flex items-center justify-center py-16 gap-3">
        <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando configuración...</p>
      </div>
    </template>

    <template v-else>
      <!-- ==================== TAB ALERTAS ==================== -->
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
          <div class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
            <ConfigToggleRow
              v-model="form.alert30Days"
              title="Alerta a 30 días"
              description="Notificar cuando un contrato vence en 30 días"
            />
            <ConfigToggleRow
              v-model="form.alert60Days"
              title="Alerta a 60 días"
              description="Notificar cuando un contrato vence en 60 días"
            />
            <ConfigToggleRow
              v-model="form.alert90Days"
              title="Alerta a 90 días"
              description="Notificar cuando un contrato vence en 90 días"
            />
          </div>
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
          <div class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
            <ConfigToggleRow
              v-model="form.alertPendingPayment"
              title="Pago pendiente"
              description="Alertar cuando hay un pago próximo a vencer"
            />
            <ConfigToggleRow
              v-model="form.alertOverduePayment"
              title="Pago atrasado"
              description="Alertar cuando un pago está vencido"
            />
          </div>
        </div>
      </div>

      <!-- ==================== TAB NOTIFICACIONES ==================== -->
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
          <div class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
            <ConfigToggleRow
              v-model="form.channelInApp"
              title="En el sistema"
              description="Recibir notificaciones dentro de la aplicación"
            />
            <ConfigToggleRow
              v-model="form.channelEmail"
              title="Email"
              description="Recibir notificaciones por correo electrónico (próximamente)"
              :disabled="true"
            />
            <ConfigToggleRow
              v-model="form.channelWhatsapp"
              title="WhatsApp"
              description="Recibir notificaciones por WhatsApp (próximamente)"
              :disabled="true"
            />
          </div>
        </div>

        <!-- Info banner -->
        <div
          class="flex items-start gap-3 p-4 rounded-xl border"
          :style="{
            borderColor: 'var(--color-primary-border, #6366f120)',
            backgroundColor: 'var(--color-primary-soft, #6366f108)',
          }"
        >
          <AppIcon icon="lucide:info" :size="16" color="var(--color-primary)" class="mt-0.5 shrink-0" />
          <p class="text-xs leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            Las notificaciones en el sistema son enviadas en tiempo real cuando ocurre un evento relevante
            (nuevo contrato, pago pendiente, contrato próximo a vencer). Puedes verlas en el ícono de
            campana en la barra superior.
          </p>
        </div>
      </div>

      <!-- Mensajes de feedback -->
      <div v-if="saveError" class="flex items-center gap-2 p-3 rounded-lg border" :style="{ borderColor: 'var(--color-error)', backgroundColor: 'var(--color-error-soft, #ef444410)' }">
        <AppIcon icon="lucide:circle-x" :size="16" color="var(--color-error)" />
        <p class="text-sm" :style="{ color: 'var(--color-error)' }">{{ saveError }}</p>
      </div>
      <div v-if="saveSuccess" class="flex items-center gap-2 p-3 rounded-lg border" :style="{ borderColor: 'var(--color-success)', backgroundColor: 'var(--color-success-soft, #10b98110)' }">
        <AppIcon icon="lucide:circle-check" :size="16" color="var(--color-success)" />
        <p class="text-sm" :style="{ color: 'var(--color-success)' }">Configuración guardada correctamente</p>
      </div>

      <!-- Botón guardar -->
      <div class="flex justify-end">
        <BaseButton
          variant="primary"
          class="flex items-center gap-2"
          :loading="isSaving"
          @click="handleSave"
        >
          <AppIcon icon="lucide:save" :size="16" />
          Guardar Configuración
        </BaseButton>
      </div>
    </template>
  </div>
</template>

<!-- ─── Subcomponente inline: fila con toggle ─────────────────────────────── -->
<script lang="ts">
import { defineComponent } from 'vue'

const ConfigToggleRow = defineComponent({
  name: 'ConfigToggleRow',
  props: {
    modelValue: { type: Boolean, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function toggle() {
      if (!props.disabled) emit('update:modelValue', !props.modelValue)
    }
    return { toggle }
  },
  template: `
    <div class="flex items-center justify-between px-5 py-4">
      <div class="pr-8">
        <p class="text-sm font-medium" :style="{ color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }">{{ title }}</p>
        <p v-if="description" class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">{{ description }}</p>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :disabled="disabled"
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        :style="{ backgroundColor: modelValue ? 'var(--color-primary)' : 'var(--color-border)' }"
        @click="toggle"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :style="{ transform: modelValue ? 'translateX(20px)' : 'translateX(0)' }"
        />
      </button>
    </div>
  `,
})

export { ConfigToggleRow }
</script>
