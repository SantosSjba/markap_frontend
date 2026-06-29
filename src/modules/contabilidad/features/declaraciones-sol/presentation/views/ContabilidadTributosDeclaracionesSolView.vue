<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  Badge,
  DataTable,
  FormCheckbox,
  FormInput,
  FormSectionCard,
  PageHeader,
} from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadActiveLegalEntity } from '@modules/contabilidad/presentation/composables/useContabilidadActiveLegalEntity'
import {
  useContabilidadSolCredentials,
  useContabilidadSaveSolCredentials,
  useContabilidadSolDeclarations,
  useContabilidadPreparePdt621,
  useContabilidadSubmitPdt621,
  useContabilidadMarkPdt621Manual,
  contabilidadSolApiRepository,
} from '../../application/useContabilidadSol'
import {
  SOL_DECLARATION_STATUS,
  solStatusVariant,
  type ContabilidadSunatDeclarationLogDTO,
} from '../../domain/sol.types'
import { markapAlert } from '@/shared/composables'

const { activePeriod } = useContabilidadActivePeriod()
const { activeLegalEntityId, entities } = useContabilidadActiveLegalEntity()
const activeEntity = computed(() => entities.value?.find((e) => e.id === activeLegalEntityId.value))

const periodId = computed(() => activePeriod.value?.id)
const listParams = computed(() => ({
  periodId: periodId.value,
  declarationType: 'PDT_621',
}))

const { data: credBoot, refetch: refetchCred } = useContabilidadSolCredentials()
const { data: declData, refetch: refetchDecl } = useContabilidadSolDeclarations(listParams)
const { mutate: saveCred, isPending: savingCred } = useContabilidadSaveSolCredentials()
const { mutate: preparePdt, isPending: preparing } = useContabilidadPreparePdt621()
const { mutate: submitPdt, isPending: submitting } = useContabilidadSubmitPdt621()
const { mutate: markManual, isPending: markingManual } = useContabilidadMarkPdt621Manual()

const credForm = ref({
  solUser: '',
  solPassword: '',
  useSandbox: true,
  isActive: false,
})

watch(
  () => credBoot.value?.credentials,
  (c) => {
    if (!c) return
    credForm.value = {
      solUser: c.solUser,
      solPassword: '',
      useSandbox: c.useSandbox,
      isActive: c.isActive,
    }
  },
  { immediate: true },
)

const latest = computed(() => declData.value?.latest ?? null)
const logs = computed(() => declData.value?.logs ?? [])
const statusLabels = computed(() => declData.value?.statusLabels ?? {})
const manualInstructions = computed(() => credBoot.value?.manualInstructions ?? [])

const preparedPackage = ref<Record<string, unknown> | null>(null)
const preparedLogId = ref<string | null>(null)

const historyColumns = [
  { key: 'createdAt', label: 'Fecha' },
  { key: 'declarationType', label: 'Tipo' },
  { key: 'status', label: 'Estado' },
  { key: 'response', label: 'Respuesta SUNAT' },
  { key: 'actions', label: '', align: 'right' as const },
]

function saveCredentials() {
  saveCred(
    {
      solUser: credForm.value.solUser.trim(),
      solPassword: credForm.value.solPassword.trim() || undefined,
      useSandbox: credForm.value.useSandbox,
      isActive: credForm.value.isActive,
    },
    { onSuccess: () => void refetchCred() },
  )
}

function onPrepare() {
  if (!periodId.value) return
  preparePdt(periodId.value, {
    onSuccess: (res) => {
      preparedPackage.value = res.package
      preparedLogId.value = res.logId
      void refetchDecl()
    },
  })
}

function onMarkManual() {
  const logId = preparedLogId.value ?? latest.value?.id
  if (!logId || !periodId.value) return
  markManual({ logId, periodId: periodId.value }, { onSuccess: () => void refetchDecl() })
}

function onSubmitSandbox() {
  const logId = preparedLogId.value ?? latest.value?.id
  if (!logId || !periodId.value) return
  submitPdt({ logId, periodId: periodId.value }, { onSuccess: () => void refetchDecl() })
}

async function downloadPackage(logId: string) {
  try {
    await contabilidadSolApiRepository.downloadPackage(logId)
  } catch {
    void markapAlert.toast.error('No se pudo descargar el paquete')
  }
}

function formatPeriodLabel(row: ContabilidadSunatDeclarationLogDTO) {
  return `${row.periodYear}-${String(row.periodMonth).padStart(2, '0')}`
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1200px] mx-auto">
    <PageHeader
      icon="lucide:file-badge"
      title="Declaraciones SUNAT (SOL)"
      subtitle="Wizard PDT 621 por periodo: preparar paquete, carga manual o envío sandbox."
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>
    <p v-else-if="activeEntity" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
      Periodo {{ activePeriod.year }}-{{ String(activePeriod.month).padStart(2, '0') }} ·
      Entidad {{ activeEntity.code }} (RUC {{ activeEntity.ruc }})
    </p>

    <FormSectionCard title="1. Credenciales SOL" icon="lucide:key-round">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveCredentials">
        <FormInput
          v-model="credForm.solUser"
          label="Usuario SOL"
          placeholder="RUC + usuario"
          hint="Formato habitual: RUC del representante legal."
        />
        <FormInput
          v-model="credForm.solPassword"
          label="Clave SOL"
          type="password"
          :placeholder="credBoot?.credentials.hasSolPassword ? `Configurada (${credBoot.credentials.solPasswordHint})` : 'Clave SOL'"
        />
        <div class="sm:col-span-2 flex flex-wrap gap-6">
          <FormCheckbox v-model="credForm.useSandbox" label="Modo sandbox / prueba" />
          <FormCheckbox v-model="credForm.isActive" label="Credenciales activas" />
        </div>
        <div class="sm:col-span-2 flex justify-end">
          <BaseButton type="submit" variant="secondary" :loading="savingCred">Guardar credenciales</BaseButton>
        </div>
      </form>
    </FormSectionCard>

    <FormSectionCard title="2. PDT 621 — IGV mensual" icon="lucide:file-spreadsheet">
      <div class="space-y-4">
        <div v-if="latest" class="flex flex-wrap items-center gap-3">
          <span class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Última declaración del periodo:</span>
          <Badge :variant="solStatusVariant(latest.status)">
            {{ statusLabels[latest.status] ?? latest.status }}
          </Badge>
          <span v-if="latest.sunatResponseMessage" class="text-xs">{{ latest.sunatResponseMessage }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="primary" :disabled="!activePeriod" :loading="preparing" @click="onPrepare">
            Preparar paquete PDT 621
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!(preparedLogId || latest?.id)"
            :loading="markingManual"
            @click="onMarkManual"
          >
            Marcar carga manual SOL
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!(preparedLogId || latest?.id) || latest?.status === SOL_DECLARATION_STATUS.ACCEPTED"
            :loading="submitting"
            @click="onSubmitSandbox"
          >
            Enviar (sandbox)
          </BaseButton>
          <BaseButton
            v-if="preparedLogId || latest?.id"
            variant="secondary"
            @click="downloadPackage((preparedLogId ?? latest!.id)!)"
          >
            <AppIcon icon="lucide:download" :size="16" class="mr-1" />
            Descargar JSON
          </BaseButton>
        </div>

        <div
          v-if="preparedPackage"
          class="rounded-lg border p-4 text-xs font-mono overflow-auto max-h-64"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }"
        >
          <pre>{{ JSON.stringify(preparedPackage, null, 2) }}</pre>
        </div>

        <ol class="list-decimal list-inside text-sm space-y-1" :style="{ color: 'var(--color-text-muted)' }">
          <li v-for="(step, i) in manualInstructions" :key="i">{{ step }}</li>
        </ol>
      </div>
    </FormSectionCard>

    <FormSectionCard title="3. Historial de declaraciones" icon="lucide:history">
      <DataTable
        :columns="historyColumns"
        :data="logs"
        :loading="false"
        empty-text="Sin declaraciones registradas."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadSunatDeclarationLogDTO).createdAt.slice(0, 16).replace('T', ' ') }}</td>
          <td class="py-3 px-4 text-sm">{{ formatPeriodLabel(row as ContabilidadSunatDeclarationLogDTO) }} · PDT 621</td>
          <td class="py-3 px-4">
            <Badge :variant="solStatusVariant((row as ContabilidadSunatDeclarationLogDTO).status)">
              {{ statusLabels[(row as ContabilidadSunatDeclarationLogDTO).status] ?? (row as ContabilidadSunatDeclarationLogDTO).status }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-xs">{{ (row as ContabilidadSunatDeclarationLogDTO).sunatResponseMessage ?? '—' }}</td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="secondary" size="sm" @click="downloadPackage((row as ContabilidadSunatDeclarationLogDTO).id)">
              JSON
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </FormSectionCard>
  </div>
</template>
