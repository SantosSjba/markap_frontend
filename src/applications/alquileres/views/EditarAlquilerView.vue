<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton, AppIcon } from '@shared/components'
import { FormInput, FormSelect, FormTextarea, FileDropzone } from '@shared/components'
import { useRental, useUpdateRental } from '../composables/useRentals'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const form = ref({
  startDate: '',
  endDate: '',
  currency: 'PEN',
  monthlyAmount: '' as string | number,
  securityDeposit: '' as string | number,
  paymentDueDay: 5 as number,
  notes: '',
  status: 'ACTIVE' as string,
  enableAlerts: true,
})

const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)

const errors = ref<Record<string, string>>({})

const schema = yup.object({
  startDate: yup.string().required('La fecha de inicio es requerida'),
  endDate: yup.string().required('La fecha de fin es requerida'),
  currency: yup.string().required(),
  monthlyAmount: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).required('El monto mensual es requerido'),
  securityDeposit: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
  paymentDueDay: yup.number().min(1).max(28).required(),
  notes: yup.string().trim(),
  status: yup.string().oneOf(['ACTIVE', 'EXPIRED', 'CANCELLED']).required(),
})

const { data: rental, isLoading: loadingRental, isError: rentalError } = useRental(id)
const updateMutation = useUpdateRental()

const loading = computed(() => loadingRental.value)

watch(
  rental,
  (r) => {
    if (!r) return
    form.value = {
      startDate: r.startDate?.slice(0, 10) ?? '',
      endDate: r.endDate?.slice(0, 10) ?? '',
      currency: r.currency ?? 'PEN',
      monthlyAmount: r.monthlyAmount ?? '',
      securityDeposit: r.securityDeposit ?? '',
      paymentDueDay: r.paymentDueDay ?? 5,
      notes: r.notes ?? '',
      status: r.status ?? 'ACTIVE',
      enableAlerts: r.enableAlerts ?? true,
    }
  },
  { immediate: true }
)

const currencyOptions = [
  { value: 'PEN', label: 'Soles (S/)' },
  { value: 'USD', label: 'Dólares (USD)' },
]
const paymentDueDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Día ${i + 1} de cada mes`,
}))
const statusOptions = [
  { value: 'ACTIVE', label: 'Vigente' },
  { value: 'EXPIRED', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)
const setError = (field: string, message: string) => { errors.value[field] = message }
const clearErrors = () => { errors.value = {} }

const toNum = (v: string | number): number | null => {
  if (v === '' || v === undefined) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const handleSubmit = async () => {
  clearErrors()
  try {
    await schema.validate(form.value, { abortEarly: false })
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      e.inner.forEach((err) => {
        if (err.path) setError(err.path, err.message)
      })
      return
    }
    throw e
  }

  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        currency: form.value.currency,
        monthlyAmount: toNum(form.value.monthlyAmount) ?? 0,
        securityDeposit: toNum(form.value.securityDeposit),
        paymentDueDay: form.value.paymentDueDay,
        notes: form.value.notes.trim() || null,
        status: form.value.status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED',
        enableAlerts: form.value.enableAlerts,
      },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    await updateMutation.invalidateList()
    router.push(`/alquileres/contratos/${id.value}`)
  } catch (error) {
    const msg =
      isAxiosError(error) && error.response?.data?.message
        ? String(error.response.data.message)
        : 'Error al actualizar el contrato'
    setError('_form', msg)
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        title="Volver al detalle"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:pencil" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Editar alquiler {{ rental?.code ?? '' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Modificar fechas, montos, adjuntos y estado del contrato
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando contrato...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium" :style="{ color: 'var(--color-error)' }">
        No se encontró el alquiler o ocurrió un error.
      </p>
      <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="handleSubmit">
      <!-- Error global -->
      <div
        v-if="errors._form"
        class="xl:col-span-3 flex items-center gap-3 px-4 py-3 rounded-lg"
        :style="{ backgroundColor: 'var(--color-error)15', border: '1px solid var(--color-error)40', color: 'var(--color-error)' }"
      >
        <AppIcon icon="lucide:alert-circle" :size="18" />
        <span class="text-sm font-medium">{{ errors._form }}</span>
      </div>

      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <!-- Propiedad e inquilino (solo lectura) -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:building-2" :size="17" color="var(--color-primary)" />
            </div>
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
              Propiedad e inquilino
            </h2>
            <span
              class="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }"
            >
              Solo lectura
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              class="flex items-center gap-3 p-3 rounded-lg"
              :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
            >
              <AppIcon icon="lucide:map-pin" :size="16" color="var(--color-text-muted)" />
              <div class="min-w-0">
                <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propiedad</p>
                <p class="text-sm font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                  {{ rental?.property?.code }} – {{ rental?.property?.addressLine }}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-3 p-3 rounded-lg"
              :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
            >
              <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" />
              <div class="min-w-0">
                <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inquilino</p>
                <p class="text-sm font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">{{ rental?.tenant?.fullName }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Fechas y condiciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:calendar" :size="17" color="var(--color-primary)" />
            </div>
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
              Fechas y condiciones
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              v-model="form.startDate"
              type="date"
              label="Fecha de Inicio"
              :error="errors.startDate"
              required
            />
            <FormInput
              v-model="form.endDate"
              type="date"
              label="Fecha de Fin"
              :error="errors.endDate"
              required
            />
            <FormSelect
              v-model="form.currency"
              label="Moneda"
              :options="currencyOptions"
            />
            <FormInput
              v-model="form.monthlyAmount"
              type="number"
              min="0"
              step="0.01"
              label="Monto Mensual"
              placeholder="0.00"
              :error="errors.monthlyAmount"
              required
            />
            <FormInput
              v-model="form.securityDeposit"
              type="number"
              min="0"
              step="0.01"
              label="Depósito de Garantía"
              placeholder="0.00"
            />
            <FormSelect
              v-model="form.paymentDueDay"
              label="Día de Vencimiento de Pago"
              :options="paymentDueDayOptions"
            />
            <div class="md:col-span-2">
              <FormSelect
                v-model="form.status"
                label="Estado del contrato"
                :options="statusOptions"
              />
            </div>
          </div>
        </section>

        <!-- Adjuntos -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:paperclip" :size="17" color="var(--color-primary)" />
            </div>
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Adjuntos</h2>
          </div>
          <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
            Reemplaza o agrega documentos al contrato (PDF, Word o imágenes, máx. 10 MB)
          </p>

          <!-- Estado de adjuntos actuales -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              :style="{
                backgroundColor: rental.hasContract ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                border: `1px solid ${rental.hasContract ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
              }"
            >
              <AppIcon
                :icon="rental.hasContract ? 'lucide:file-check-2' : 'lucide:file-x-2'"
                :size="16"
                :color="rental.hasContract ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
              />
              <span :style="{ color: rental.hasContract ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)' }">
                Contrato: {{ rental.hasContract ? 'Adjunto' : 'Sin archivo' }}
              </span>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              :style="{
                backgroundColor: rental.hasDeliveryAct ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                border: `1px solid ${rental.hasDeliveryAct ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
              }"
            >
              <AppIcon
                :icon="rental.hasDeliveryAct ? 'lucide:file-check-2' : 'lucide:file-x-2'"
                :size="16"
                :color="rental.hasDeliveryAct ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
              />
              <span :style="{ color: rental.hasDeliveryAct ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)' }">
                Acta: {{ rental.hasDeliveryAct ? 'Adjunto' : 'Sin archivo' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileDropzone
              v-model="contractFile"
              label="Contrato firmado"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el contrato aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="Reemplaza el contrato actual. PDF, Word o imágenes."
            />
            <FileDropzone
              v-model="deliveryActFile"
              label="Acta de entrega de la propiedad"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el acta aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="Reemplaza el acta actual. PDF, Word o imágenes."
            />
          </div>
        </section>

        <!-- Alertas y Notificaciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:bell" :size="17" color="var(--color-primary)" />
            </div>
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Alertas y Notificaciones</h2>
          </div>
          <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
            Controla si recibirás alertas para este contrato
          </p>
          <div
            class="flex items-center justify-between p-4 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-3">
              <AppIcon
                :icon="form.enableAlerts ? 'lucide:bell-ring' : 'lucide:bell-off'"
                :size="18"
                :color="form.enableAlerts ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              />
              <div>
                <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Recibir alertas para este contrato</p>
                <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
                  Según la configuración global de alertas del sistema
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="form.enableAlerts"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              :style="{ backgroundColor: form.enableAlerts ? 'var(--color-primary)' : 'var(--color-border)' }"
              @click="form.enableAlerts = !form.enableAlerts"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :style="{ transform: form.enableAlerts ? 'translateX(20px)' : 'translateX(0)' }"
              />
            </button>
          </div>
        </section>

        <!-- Observaciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:notebook-pen" :size="17" color="var(--color-primary)" />
            </div>
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Observaciones</h2>
          </div>
          <FormTextarea
            v-model="form.notes"
            placeholder="Notas adicionales sobre el contrato..."
            :rows="3"
          />
        </section>
      </div>

      <!-- Columna lateral: resumen y acciones -->
      <div class="xl:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
            Resumen del contrato
          </h2>
          <dl class="space-y-3 text-sm mb-6">
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:map-pin" :size="13" />
                Propiedad
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ rental?.property?.code }} – {{ rental?.property?.addressLine }}</dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:user" :size="13" />
                Inquilino
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ rental?.tenant?.fullName }}</dd>
            </div>
            <div class="border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:calendar" :size="13" />
                Vigencia
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{ form.startDate || '—' }} → {{ form.endDate || '—' }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:banknote" :size="13" />
                Monto mensual
              </dt>
              <dd class="font-bold" :style="{ color: 'var(--color-primary)' }">
                {{ form.currency === 'USD' ? 'US$' : 'S/' }}
                {{ form.monthlyAmount !== '' ? Number(form.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00' }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="updateMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar cambios
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full flex items-center justify-center gap-2" @click="goBack">
              <AppIcon icon="lucide:x" :size="16" />
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
