<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { formatMoney } from '@shared/utils/money'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import {
  useDepartments,
  useDistricts,
  useInteriorClient,
  useInteriorClientsList,
  useProvinces,
} from '../../../clientes/presentation/composables/useClients'
import type { ListClientsParams } from '../../../clientes/domain/client.types'
import { INTERVENTION_LEVEL_OPTIONS } from '../../../proyecto-presupuesto/presentation/labels'
import { buildInteriorProjectCode, suggestClientSurname } from '../../domain/project-code'
import type {
  InteriorProjectDetail,
  InteriorProjectFormPayload,
  InteriorProjectStatus,
  InteriorProjectType,
} from '../../domain/project.types'
import { PROJECT_TYPE_LABELS } from '../labels'
import InteriorClienteFormModal from '../../../clientes/presentation/components/InteriorClienteFormModal.vue'
import InteriorEquipoFormModal from '../../../equipo/presentation/components/InteriorEquipoFormModal.vue'
import { useInteriorProjectStageOptions } from '../composables/useInteriorProjectStageOptions'
import { useInteriorActiveTeam } from '../../../equipo/presentation/composables/useTeam'
import type { TeamRole } from '../../../equipo/domain/team.types'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
/**
 * InteriorProyectoForm — alta y edición de proyectos de Interiorismo (mismo formulario).
 * El código se arma con el año, el tipo, el distrito y el apellido del cliente
 * (`PROYECTO-2026-DISEÑO-CAYMA-TORRES`); al editar se conserva y solo cambia con «Regenerar».
 * Al elegir el cliente en un alta, la ubicación vacía toma la dirección principal del cliente.
 */

interface Props {
  /** Proyecto a editar; sin él, el formulario arranca vacío (alta) */
  initial?: InteriorProjectDetail | null
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  submitting: false,
  canWrite: true,
})

const emit = defineEmits<{
  submit: [payload: InteriorProjectFormPayload]
  cancel: []
}>()

const isEditing = computed(() => !!props.initial)

// ── Catálogos ──
const clientsParams = ref<ListClientsParams>({ applicationSlug: INTERIORISMO_APP_SLUG, page: 1, limit: 500 })
const { data: clientsRes, isLoading: loadingClients } = useInteriorClientsList(clientsParams)
const { data: team, isLoading: loadingAgents } = useInteriorActiveTeam()
const { options: currencyOptions } = useCurrencyCatalog()
const { formOptions: stageOptions } = useInteriorProjectStageOptions()

const clientOptions = computed(() =>
  (clientsRes.value?.data ?? []).map((c) => ({ value: c.id, label: `${c.fullName} · ${c.documentNumber}` })),
)
/**
 * Opciones de un puesto del equipo: integrantes activos con esa función. El responsable ya
 * asignado se mantiene aunque hoy no cumpla el filtro (inactivo o sin la función).
 */
function teamOptions(role: TeamRole, current: { id: string; fullName: string } | null | undefined) {
  const members = (team.value ?? []).filter((m) => m.roles.includes(role))
  const keep = current && !members.some((m) => m.id === current.id) ? [{ value: current.id, label: current.fullName }] : []
  return [{ value: '', label: 'Sin asignar' }, ...keep, ...members.map((m) => ({ value: m.id, label: m.fullName }))]
}
const designerOptions = computed(() => teamOptions('DESIGNER', props.initial?.designerAgent))
const commercialOptions = computed(() => teamOptions('COMMERCIAL', props.initial?.commercialAgent))
const architectSrOptions = computed(() => teamOptions('ARCHITECT_SR', props.initial?.architectSrAgent))
const architectJrOptions = computed(() => teamOptions('ARCHITECT_JR', props.initial?.architectJrAgent))
const supervisorOptions = computed(() => teamOptions('SUPERVISOR', props.initial?.supervisorAgent))
const teamPath = `${INTERIORISMO_BASE_PATH}/equipo`
const typeOptions = (Object.keys(PROJECT_TYPE_LABELS) as InteriorProjectType[]).map((k) => ({
  value: k,
  label: PROJECT_TYPE_LABELS[k],
}))
const levelOptions = [{ value: '', label: 'Sin definir' }, ...INTERVENTION_LEVEL_OPTIONS]

// ── Formulario ──
const optionalNumber = () =>
  yup
    .number()
    .transform((v, raw) => (raw === '' || raw == null || Number.isNaN(v) ? undefined : v))
    .min(0, 'No puede ser negativo')
    .nullable()

const schema = yup.object({
  code: yup.string().required('Complete tipo, cliente y distrito para generar el código').trim().max(80),
  name: yup.string().required('Ingrese el nombre del proyecto').trim().max(255),
  clientId: yup.string().required('Seleccione el cliente'),
  projectType: yup.string().required('Seleccione el tipo'),
  status: yup.string().required('Seleccione la etapa'),
  addressLine: yup.string().trim(),
  departmentId: yup.string().trim(),
  provinceId: yup.string().trim(),
  districtId: yup.string().trim(),
  interventionLevel: yup.string().trim(),
  areaSqm: optionalNumber(),
  levelsCount: optionalNumber().integer('Debe ser un número entero'),
  environmentsNote: yup.string().trim(),
  executionTimeNote: yup.string().trim().max(500),
  startDate: yup.string().trim(),
  estimatedEndDate: yup
    .string()
    .trim()
    .test('after-start', 'La fecha fin no puede ser anterior al inicio', function (end) {
      const start = this.parent.startDate as string | undefined
      return !start || !end || end >= start
    }),
  designerAgentId: yup.string(),
  architectJrAgentId: yup.string(),
  architectSrAgentId: yup.string(),
  supervisorAgentId: yup.string(),
  commercialAgentId: yup.string(),
  currency: yup.string().required('Seleccione la moneda'),
  exchangeRate: yup
    .number()
    .transform((v, raw) => (raw === '' || raw == null || Number.isNaN(v) ? undefined : v))
    .positive('Debe ser mayor que cero')
    .nullable(),
  defaultUtilityPct: optionalNumber(),
  defaultOverheadPct: optionalNumber(),
  defaultIgvPct: optionalNumber(),
  estimatedBudget: optionalNumber(),
})

const { handleSubmit, errors, values, setFieldValue, resetForm, defineComponentBinds, defineField, submitCount } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    code: '',
    name: '',
    clientId: '',
    projectType: 'INTERIOR_DESIGN',
    status: 'DESIGN',
    addressLine: '',
    departmentId: '',
    provinceId: '',
    districtId: '',
    interventionLevel: '',
    areaSqm: undefined as number | undefined,
    levelsCount: undefined as number | undefined,
    environmentsNote: '',
    executionTimeNote: '',
    startDate: '',
    estimatedEndDate: '',
    designerAgentId: '',
    architectJrAgentId: '',
    architectSrAgentId: '',
    supervisorAgentId: '',
    commercialAgentId: '',
    currency: 'PEN',
    exchangeRate: undefined as number | undefined,
    defaultUtilityPct: 20 as number | undefined,
    defaultOverheadPct: 0 as number | undefined,
    defaultIgvPct: 18 as number | undefined,
    estimatedBudget: undefined as number | undefined,
  },
})

const b = defineComponentBinds
// Campos sin input propio: registrarlos evita que vee-validate les marque error al validar otro campo
const [clientIdModel] = defineField('clientId')
defineField('code')
const nameB = b('name')
const projectTypeB = b('projectType')
const statusB = b('status')
const addressLineB = b('addressLine')
const departmentB = b('departmentId')
const provinceB = b('provinceId')
const districtB = b('districtId')
const levelB = b('interventionLevel')
const areaB = b('areaSqm')
const levelsB = b('levelsCount')
const environmentsB = b('environmentsNote')
const executionTimeB = b('executionTimeNote')
const startDateB = b('startDate')
const endDateB = b('estimatedEndDate')
const designerB = b('designerAgentId')
const architectJrB = b('architectJrAgentId')
const architectSrB = b('architectSrAgentId')
const supervisorB = b('supervisorAgentId')
const commercialB = b('commercialAgentId')
const currencyB = b('currency')
const exchangeRateB = b('exchangeRate')
const utilityB = b('defaultUtilityPct')
const overheadB = b('defaultOverheadPct')
const igvB = b('defaultIgvPct')
const budgetB = b('estimatedBudget')

// ── Cliente nuevo sin salir del formulario ──
const clientModalOpen = ref(false)
function onClientCreated(client: { id: string }) {
  setFieldValue('clientId', client.id)
}

// ── Integrante nuevo sin salir del formulario: ocupa los puestos vacíos de sus funciones ──
const teamModalOpen = ref(false)
const ROLE_FIELDS = {
  DESIGNER: 'designerAgentId',
  COMMERCIAL: 'commercialAgentId',
  ARCHITECT_SR: 'architectSrAgentId',
  ARCHITECT_JR: 'architectJrAgentId',
  SUPERVISOR: 'supervisorAgentId',
} as const satisfies Record<TeamRole, string>
function onTeamMemberCreated(member: { id: string; roles: TeamRole[] }) {
  for (const role of member.roles) {
    const field = ROLE_FIELDS[role]
    if (!values[field]) setFieldValue(field, member.id)
  }
}

// ── Ubicación (ubigeo en cascada) ──
const isInitializing = ref(false)
const departmentId = computed(() => values.departmentId || undefined)
const provinceId = computed(() => values.provinceId || undefined)
const { data: departments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(departmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(provinceId)
const departmentOptions = computed(() => (departments.value ?? []).map((d) => ({ value: d.id, label: d.name })))
const provinceOptions = computed(() => (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })))
const districtOptions = computed(() => (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })))

watch(
  () => values.departmentId,
  () => {
    if (isInitializing.value) return
    setFieldValue('provinceId', '')
    setFieldValue('districtId', '')
  },
)
watch(
  () => values.provinceId,
  () => {
    if (!isInitializing.value) setFieldValue('districtId', '')
  },
)

/** Alta: si la ubicación está vacía, tomar la dirección principal del cliente elegido */
const selectedClientId = computed(() => values.clientId || '')
const { data: selectedClient } = useInteriorClient(selectedClientId)
watch(selectedClient, async (client) => {
  const address = client?.primaryAddress
  if (isEditing.value || !address || values.districtId) return
  isInitializing.value = true
  setFieldValue('departmentId', address.district.province.department.id)
  setFieldValue('provinceId', address.district.province.id)
  setFieldValue('districtId', address.districtId)
  if (!values.addressLine) setFieldValue('addressLine', address.addressLine)
  await Promise.resolve()
  isInitializing.value = false
})

// ── Código descriptivo ──
const selectedClientRow = computed(() => (clientsRes.value?.data ?? []).find((c) => c.id === values.clientId))
const districtName = computed(
  () =>
    (districts.value ?? []).find((d) => d.id === values.districtId)?.name ??
    (props.initial?.district?.id === values.districtId ? props.initial?.district?.name : '') ??
    '',
)
const codeYear = computed(() => Number((values.startDate || new Date().toISOString()).slice(0, 4)))
const autoCode = computed(() =>
  buildInteriorProjectCode({
    year: codeYear.value,
    typeLabel: PROJECT_TYPE_LABELS[values.projectType as InteriorProjectType],
    district: districtName.value,
    clientSurname: selectedClientRow.value
      ? suggestClientSurname(selectedClientRow.value.fullName, selectedClientRow.value.documentNumber)
      : props.initial?.client.id === values.clientId && props.initial
        ? suggestClientSurname(props.initial.client.fullName, props.initial.client.documentNumber)
        : '',
  }),
)
// Alta: el código sigue a los datos (con cliente elegido). Edición: se conserva hasta «Regenerar».
watch(
  autoCode,
  (code) => {
    if (isEditing.value || isInitializing.value) return
    const next = values.clientId ? code : ''
    if (next !== values.code) setFieldValue('code', next, submitCount.value > 0)
  },
  { immediate: true },
)
const canRegenerateCode = computed(() => isEditing.value && autoCode.value !== values.code)
const regenerateCode = () => setFieldValue('code', autoCode.value)

// ── Edición: cargar valores ──
watch(
  () => props.initial,
  async (p) => {
    if (!p) return
    isInitializing.value = true
    resetForm({
      values: {
        code: p.code,
        name: p.name,
        clientId: p.client.id,
        projectType: p.projectType,
        status: p.status,
        addressLine: p.addressLine ?? '',
        departmentId: p.district?.departmentId ?? '',
        provinceId: p.district?.provinceId ?? '',
        districtId: p.district?.id ?? '',
        interventionLevel: p.interventionLevel ?? '',
        areaSqm: p.areaSqm ?? undefined,
        levelsCount: p.levelsCount ?? undefined,
        environmentsNote: p.environmentsNote ?? '',
        executionTimeNote: p.executionTimeNote ?? '',
        startDate: p.startDate ?? '',
        estimatedEndDate: p.estimatedEndDate ?? '',
        designerAgentId: p.designerAgent?.id ?? '',
        architectJrAgentId: p.architectJrAgent?.id ?? '',
        architectSrAgentId: p.architectSrAgent?.id ?? '',
        supervisorAgentId: p.supervisorAgent?.id ?? '',
        commercialAgentId: p.commercialAgent?.id ?? '',
        currency: p.currency || 'PEN',
        exchangeRate: p.exchangeRate ?? undefined,
        defaultUtilityPct: p.defaultUtilityPct,
        defaultOverheadPct: p.defaultOverheadPct,
        defaultIgvPct: p.defaultIgvPct,
        estimatedBudget: p.estimatedBudget ?? undefined,
      },
    })
    await Promise.resolve()
    isInitializing.value = false
  },
  { immediate: true },
)

// ── Resumen ──
const clientLabel = computed(() => selectedClientRow.value?.fullName ?? props.initial?.client.fullName ?? '—')
const locationSummary = computed(() => {
  const prov = (provinces.value ?? []).find((p) => p.id === values.provinceId)?.name
  return [districtName.value, prov].filter(Boolean).join(', ') || '—'
})
const budgetPreview = computed(() =>
  values.estimatedBudget != null && `${values.estimatedBudget}` !== ''
    ? formatMoney(Number(values.estimatedBudget), values.currency)
    : '—',
)

const loading = computed(() => loadingClients.value || loadingAgents.value)

const text = (s: string | undefined | null) => (s?.trim() ? s.trim() : null)
const numberOrNull = (n: number | string | null | undefined) =>
  n === '' || n == null || Number.isNaN(Number(n)) ? null : Number(n)

const onSubmit = handleSubmit((v) => {
  emit('submit', {
    code: v.code,
    name: v.name,
    clientId: v.clientId,
    projectType: v.projectType as InteriorProjectType,
    status: v.status as InteriorProjectStatus,
    addressLine: text(v.addressLine),
    districtId: text(v.districtId),
    interventionLevel: text(v.interventionLevel),
    areaSqm: numberOrNull(v.areaSqm),
    levelsCount: numberOrNull(v.levelsCount),
    environmentsNote: text(v.environmentsNote),
    executionTimeNote: text(v.executionTimeNote),
    startDate: text(v.startDate),
    estimatedEndDate: text(v.estimatedEndDate),
    designerAgentId: text(v.designerAgentId),
    architectJrAgentId: text(v.architectJrAgentId),
    architectSrAgentId: text(v.architectSrAgentId),
    supervisorAgentId: text(v.supervisorAgentId),
    commercialAgentId: text(v.commercialAgentId),
    currency: v.currency || 'PEN',
    exchangeRate: numberOrNull(v.exchangeRate),
    defaultUtilityPct: numberOrNull(v.defaultUtilityPct) ?? 20,
    defaultOverheadPct: numberOrNull(v.defaultOverheadPct) ?? 0,
    defaultIgvPct: numberOrNull(v.defaultIgvPct) ?? 18,
    estimatedBudget: numberOrNull(v.estimatedBudget),
  })
})
</script>

<template>
  <LoadingState v-if="loading" text="Cargando opciones..." class="py-24" />

  <form v-else class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3" novalidate @submit.prevent="onSubmit">
    <!-- ── Columna principal ── -->
    <div class="space-y-6 xl:col-span-2">
      <FormSectionCard title="Datos generales" subtitle="El código se arma con el año, el tipo, el distrito y el cliente">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput v-bind="nameB" class="md:col-span-2" label="Nombre del proyecto" placeholder="Ej. Implementación casa Hortensias" :error="errors.name" required />
          <FormSelect v-bind="projectTypeB" label="Tipo de proyecto" :options="typeOptions" :error="errors.projectType" required />
          <FormSelect v-bind="statusB" label="Etapa" :options="stageOptions" :error="errors.status" required />
          <div class="flex items-end gap-2 md:col-span-2">
          <FormCombobox
            class="min-w-0 flex-1"
            v-model="clientIdModel"
            label="Cliente"
            placeholder="Buscar por nombre o documento..."
            :options="clientOptions"
            empty-text="No hay clientes con ese dato"
            :error="errors.clientId"
            required
          />
          <BaseButton
            v-if="canWrite"
            type="button"
            variant="outline"
            icon="lucide:user-plus"
            class="mb-0.5 shrink-0"
            :class="errors.clientId ? 'mb-6' : ''"
            @click="clientModalOpen = true"
          >
            Nuevo
          </BaseButton>
          </div>
          <!-- Código generado (solo lectura) -->
          <div class="md:col-span-2">
            <p :class="fieldLabelClass">Código</p>
            <div
              class="mt-2 flex min-h-11 flex-wrap items-center gap-3 rounded-[10px] border border-dashed border-gray-300 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              <span class="min-w-0 flex-1 font-semibold tracking-wide break-all text-gray-800 dark:text-white/90">
                {{ values.code || '—' }}
              </span>
              <BaseButton
                v-if="canRegenerateCode && canWrite"
                type="button"
                variant="outline"
                size="sm"
                icon="lucide:refresh-cw"
                @click="regenerateCode"
              >
                Regenerar
              </BaseButton>
            </div>
            <p v-if="errors.code" role="alert" class="mt-1.5 text-theme-xs text-error-500">{{ errors.code }}</p>
            <p v-else-if="canRegenerateCode" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Con los datos actuales sería <strong>{{ autoCode }}</strong>
            </p>
            <p v-else-if="initial?.legacyCode" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Código anterior: {{ initial.legacyCode }}
            </p>
            <p v-else-if="!isEditing" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Si ya existe uno igual se agrega -2, -3…
            </p>
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Ubicación" subtitle="Dirección de la obra; por defecto la del cliente">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormInput v-bind="addressLineB" class="md:col-span-3" label="Dirección" placeholder="Av., calle, número, urbanización" />
          <FormSelect v-bind="departmentB" label="Departamento" placeholder="Seleccionar" :options="departmentOptions" />
          <FormSelect
            v-bind="provinceB"
            label="Provincia"
            placeholder="Seleccionar"
            :options="provinceOptions"
            :loading="loadingProvinces"
            :disabled="!values.departmentId"
          />
          <FormSelect
            v-bind="districtB"
            label="Distrito"
            placeholder="Seleccionar"
            :options="districtOptions"
            :loading="loadingDistricts"
            :disabled="!values.provinceId"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Alcance y plazos" subtitle="Nivel de intervención, áreas y fechas">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect v-bind="levelB" label="Nivel de intervención" :options="levelOptions" />
          <FormInput v-bind="areaB" type="number" inputmode="decimal" label="Área (m²)" placeholder="0" :error="errors.areaSqm" />
          <FormInput v-bind="levelsB" type="number" inputmode="numeric" label="Niveles / pisos" placeholder="0" :error="errors.levelsCount" />
          <FormInput v-bind="startDateB" type="date" label="Inicio" />
          <FormInput v-bind="endDateB" type="date" label="Fin estimado" :error="errors.estimatedEndDate" />
          <FormInput v-bind="executionTimeB" label="Plazo de ejecución" placeholder="Ej. 55 días hábiles por nivel" />
          <FormTextarea v-bind="environmentsB" class="md:col-span-3" label="Ambientes" placeholder="Sala, comedor, patio interior..." :rows="2" />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Equipo" subtitle="Responsables del proyecto">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect v-bind="designerB" label="Diseñador(a)" :options="designerOptions" />
          <FormSelect v-bind="commercialB" label="Asesor comercial" :options="commercialOptions" />
          <FormSelect v-bind="architectSrB" label="Arquitecto senior" :options="architectSrOptions" />
          <FormSelect v-bind="architectJrB" label="Arquitecto junior" :options="architectJrOptions" />
          <FormSelect v-bind="supervisorB" label="Supervisor de obra" :options="supervisorOptions" />
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            Cada puesto lista a los integrantes con esa función.
            <RouterLink :to="teamPath" class="font-medium text-brand-500 hover:text-brand-600">Gestionar equipo</RouterLink>
          </p>
          <BaseButton
            v-if="canWrite"
            type="button"
            variant="outline"
            size="sm"
            icon="lucide:user-plus"
            @click="teamModalOpen = true"
          >
            Nuevo integrante
          </BaseButton>
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Condiciones económicas"
        subtitle="Valores por defecto para el presupuesto del proyecto"
        :help-items="[
          { term: 'Moneda y tipo de cambio', text: 'Moneda del presupuesto; el tipo de cambio sirve para mostrar el equivalente y convertir cobros en otra moneda.' },
          { term: 'Presupuesto estimado', text: 'Referencia inicial hasta que se arme el presupuesto detallado.' },
          { term: 'Utilidad y gastos generales (%)', text: 'Se aplican sobre el costo de las partidas; luego se pueden ajustar en el presupuesto.' },
          { term: 'IGV (%)', text: 'Tasa del impuesto que se suma al precio al cliente cuando corresponde.' },
        ]"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect v-bind="currencyB" label="Moneda" :options="currencyOptions" :error="errors.currency" required />
          <FormInput
            v-bind="exchangeRateB"
            type="number"
            inputmode="decimal"
            label="Tipo de cambio (S/ por unidad)"
            placeholder="Ej. 3.50"
            hint="Para mostrar el equivalente en otra moneda"
            :error="errors.exchangeRate"
          />
          <FormInput v-bind="budgetB" type="number" inputmode="decimal" label="Presupuesto estimado" placeholder="0.00" :error="errors.estimatedBudget" />
          <FormInput v-bind="utilityB" type="number" inputmode="decimal" label="Utilidad (%)" placeholder="20" :error="errors.defaultUtilityPct" />
          <FormInput v-bind="overheadB" type="number" inputmode="decimal" label="Gastos generales (%)" placeholder="0" :error="errors.defaultOverheadPct" />
          <FormInput v-bind="igvB" type="number" inputmode="decimal" label="IGV (%)" placeholder="18" :error="errors.defaultIgvPct" />
        </div>
      </FormSectionCard>
    </div>

    <!-- ── Lateral: resumen + acciones (fijo en escritorio) ── -->
    <aside class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Código</dt>
            <dd class="font-semibold break-all text-gray-800 dark:text-white/90">{{ values.code || '—' }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Cliente</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ clientLabel }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Ubicación</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ values.addressLine || '—' }}</dd>
            <dd class="text-theme-xs text-gray-500 dark:text-gray-400">{{ locationSummary }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Presupuesto estimado</dt>
            <dd class="font-bold text-brand-500 dark:text-brand-400">{{ budgetPreview }}</dd>
          </div>
        </dl>
      </FormSectionCard>

      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <BaseButton
          v-if="canWrite"
          type="submit"
          variant="primary"
          icon="lucide:save"
          block
          :loading="submitting"
          loading-text="Guardando..."
        >
          {{ submitLabel }}
        </BaseButton>
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">Cancelar</BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
  <InteriorClienteFormModal v-model:open="clientModalOpen" @created="onClientCreated" />
  <InteriorEquipoFormModal v-model:open="teamModalOpen" @created="onTeamMemberCreated" />
</template>
