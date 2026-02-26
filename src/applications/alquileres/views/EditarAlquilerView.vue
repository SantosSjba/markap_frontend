<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
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
})

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
const setError = (field: string, message: string) => {
  errors.value[field] = message
}
const clearErrors = () => {
  errors.value = {}
}

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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Editar alquiler {{ rental?.code ?? '' }}
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Modificar fechas, montos y estado del contrato
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <svg
        class="animate-spin h-8 w-8"
        style="color: var(--color-primary)"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <p v-else-if="rentalError || !rental" class="text-sm py-8" :style="{ color: 'var(--color-error)' }">
      No se encontró el alquiler o ocurrió un error.
    </p>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <p v-if="errors._form" class="text-sm" :style="{ color: 'var(--color-error)' }">
        {{ errors._form }}
      </p>

      <!-- Propiedad e inquilino (solo lectura) -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Propiedad e inquilino
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propiedad</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ rental?.property?.code }} – {{ rental?.property?.addressLine }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inquilino</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental?.tenant?.fullName }}</p>
          </div>
        </div>
      </section>

      <!-- Fechas y condiciones -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
          Fechas y condiciones
        </h2>
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

      <!-- Notas -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
          Observaciones
        </h2>
        <FormTextarea
          v-model="form.notes"
          placeholder="Notas adicionales sobre el contrato..."
          :rows="3"
        />
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="updateMutation.isPending.value" variant="primary">
          Guardar cambios
        </BaseButton>
      </div>
    </form>
  </div>
</template>
