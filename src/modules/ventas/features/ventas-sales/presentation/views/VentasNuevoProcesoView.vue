<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, AppIcon } from '@shared/components'
import { useVentasPipelineStages } from '@ventas/configuracion'
import { useVentasCreateProcess } from '../../application/useVentasSales'
import { ventasClientsRepository } from '@modules/ventas/features/clientes'
import { ventasPropertiesRepository } from '@modules/ventas/features/propiedades'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')

const { stageOptions } = useVentasPipelineStages()
const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)
const agentOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

const buyerOptions = ref<{ value: string; label: string }[]>([])
const propertyOptions = ref<{ value: string; label: string }[]>([])
const propertyOwners = ref<{ id: string; fullName: string; documentNumber: string; isPrimary: boolean }[]>([])
const loadingPropertyOwners = ref(false)

const form = ref({
  propertyId: '',
  agentId: '',
  title: '',
  pipelineStage: 'SEPARATION',
  buyers: [''],
})

const { mutate: createProcess, isPending } = useVentasCreateProcess()

function ensureOneEmpty(items: string[]) {
  const cleaned = items.filter((x) => !!x)
  return cleaned.length ? cleaned : ['']
}

function addBuyer() {
  form.value.buyers.push('')
}
function removeBuyer(idx: number) {
  form.value.buyers.splice(idx, 1)
  form.value.buyers = ensureOneEmpty(form.value.buyers)
}
async function loadPropertyOwners(propertyId: string) {
  if (!propertyId) {
    propertyOwners.value = []
    return
  }
  loadingPropertyOwners.value = true
  try {
    const p = await ventasPropertiesRepository.getById(propertyId)
    propertyOwners.value = (p.owners ?? []).map((o) => ({
      id: o.id,
      fullName: o.fullName,
      documentNumber: o.documentNumber,
      isPrimary: o.isPrimary,
    }))
  } catch {
    propertyOwners.value = []
  } finally {
    loadingPropertyOwners.value = false
  }
}

watch(
  () => form.value.propertyId,
  (id) => {
    void loadPropertyOwners(id)
  },
)

async function loadCatalogs() {
  loadError.value = ''
  loading.value = true
  try {
    const [buyers, props] = await Promise.all([
      ventasClientsRepository.getList({ clientType: 'BUYER', page: 1, limit: 1000 }),
      ventasPropertiesRepository.getList({ page: 1, limit: 1000, listingStatus: 'AVAILABLE' }),
    ])
    buyerOptions.value = buyers.data.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.documentNumber})`,
    }))
    propertyOptions.value = props.data.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.addressLine}`,
    }))
  } catch (e) {
    loadError.value = getApiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

void loadCatalogs()

function submit() {
  const buyerIds = Array.from(new Set(form.value.buyers.filter(Boolean)))
  const primaryBuyerId = buyerIds[0]
  if (!form.value.propertyId || !primaryBuyerId) return
  createProcess(
    {
      propertyId: form.value.propertyId,
      buyerClientId: primaryBuyerId,
      buyerClientIds: buyerIds,
      agentId: form.value.agentId || null,
      title: form.value.title || null,
      pipelineStage: form.value.pipelineStage,
    },
    {
      onSuccess: () => router.push('/ventas/procesos'),
    },
  )
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        @click="router.push('/ventas/procesos')"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Nuevo proceso de venta
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Múltiples compradores. Los propietarios se cargan del inmueble seleccionado.
        </p>
      </div>
    </div>

    <div
      v-if="loadError"
      class="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-warning-light)' }"
    >
      <span class="max-w-xl" style="color: var(--color-error)">{{ loadError }}</span>
      <BaseButton variant="outline" size="sm" class="ml-auto shrink-0" :loading="loading" @click="loadCatalogs">
        Reintentar
      </BaseButton>
    </div>

    <div
      class="p-5 rounded-xl border space-y-5"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          v-model="form.propertyId"
          label="Inmueble (disponible)"
          :options="propertyOptions"
          :loading="loading"
          required
        />
        <FormSelect v-model="form.agentId" label="Asesor" :options="agentOptions" />
        <FormSelect v-model="form.pipelineStage" label="Etapa inicial" :options="stageOptions" />
        <FormInput
          v-model="form.title"
          label="Título (opcional)"
          placeholder="Ej. Familia Pérez — Torre Vista Mar"
        />
      </div>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Compradores
          </h2>
          <BaseButton type="button" variant="outline" size="sm" @click="addBuyer">
            + Agregar comprador
          </BaseButton>
        </div>
        <div v-for="(_, idx) in form.buyers" :key="`buyer-${idx}`" class="flex gap-2 items-end">
          <div class="flex-1">
            <FormSelect
              v-model="form.buyers[idx]"
              :label="`Comprador ${idx + 1}`"
              :options="buyerOptions"
              :loading="loading"
              required
            />
          </div>
          <BaseButton
            v-if="form.buyers.length > 1"
            type="button"
            variant="ghost"
            size="sm"
            @click="removeBuyer(idx)"
          >
            Quitar
          </BaseButton>
        </div>
      </section>

      <section
        v-if="form.propertyId"
        class="space-y-2 rounded-lg border px-4 py-3"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Propietarios del inmueble
        </h2>
        <p v-if="loadingPropertyOwners" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Cargando propietarios…
        </p>
        <ul v-else-if="propertyOwners.length" class="space-y-1 text-sm">
          <li
            v-for="o in propertyOwners"
            :key="o.id"
            :style="{ color: 'var(--color-text-primary)' }"
          >
            {{ o.fullName }}
            <span v-if="o.documentNumber"> ({{ o.documentNumber }})</span>
            <span
              v-if="o.isPrimary"
              class="ml-1 text-xs"
              :style="{ color: 'var(--color-text-muted)' }"
            >— principal</span>
          </li>
        </ul>
        <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Sin propietarios registrados en la ficha del inmueble.
        </p>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          Para agregar copropietarios, edítelos en Nueva propiedad / Editar propiedad.
        </p>
      </section>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="outline" @click="router.push('/ventas/procesos')">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="isPending" @click="submit">Crear proceso</BaseButton>
      </div>
    </div>
  </div>
</template>
