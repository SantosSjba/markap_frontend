<script setup lang="ts">
import { computed } from 'vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney } from '@shared/utils/money'
import { INTERVENTION_LEVEL_LABELS } from '../../../../proyecto-presupuesto/presentation/labels'
import type { InteriorProjectDetail } from '../../../domain/project.types'
import { PROJECT_TYPE_LABELS } from '../../labels'
/** Pestaña Resumen de la ficha: datos, ubicación, equipo y condiciones económicas. */

const props = defineProps<{ project: InteriorProjectDetail }>()

const p = computed(() => props.project)
const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : String(v))
const date = (d: string | null) => (d ? formatShortDate(d) : '—')

const team = computed(() => [
  { role: 'Diseñador(a)', agent: p.value.designerAgent },
  { role: 'Asesor comercial', agent: p.value.commercialAgent },
  { role: 'Arquitecto senior', agent: p.value.architectSrAgent },
  { role: 'Arquitecto junior', agent: p.value.architectJrAgent },
  { role: 'Supervisor de obra', agent: p.value.supervisorAgent },
])
</script>

<template>
  <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
    <div class="space-y-6 xl:col-span-2">
      <FormSectionCard title="Proyecto" subtitle="Cliente, tipo y alcance" icon="lucide:folder-kanban" show-icon>
        <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Cliente</dt>
            <dd class="font-medium text-gray-800 dark:text-white/90">{{ p.client.fullName }}</dd>
            <dd class="text-gray-500 dark:text-gray-400">{{ p.client.documentNumber }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Tipo · Nivel de intervención</dt>
            <dd class="text-gray-800 dark:text-white/90">
              {{ PROJECT_TYPE_LABELS[p.projectType] }} · {{ p.interventionLevel ? INTERVENTION_LEVEL_LABELS[p.interventionLevel] ?? p.interventionLevel : 'Sin definir' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Área · Niveles</dt>
            <dd class="text-gray-800 dark:text-white/90">
              {{ p.areaSqm != null ? `${p.areaSqm} m²` : '—' }} · {{ orDash(p.levelsCount) }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Vigencia</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ date(p.startDate) }} – {{ date(p.estimatedEndDate) }}</dd>
            <dd v-if="p.executionTimeNote" class="text-gray-500 dark:text-gray-400">{{ p.executionTimeNote }}</dd>
          </div>
          <div v-if="p.environmentsNote" class="sm:col-span-2">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Ambientes</dt>
            <dd class="whitespace-pre-wrap text-gray-800 dark:text-white/90">{{ p.environmentsNote }}</dd>
          </div>
          <div v-if="p.legacyCode">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Código anterior</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ p.legacyCode }}</dd>
          </div>
        </dl>
      </FormSectionCard>

      <FormSectionCard title="Ubicación" icon="lucide:map-pin" show-icon>
        <p class="text-sm text-gray-800 dark:text-white/90">{{ p.addressLine || 'Sin dirección' }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ p.district?.name ?? p.city ?? '—' }}</p>
      </FormSectionCard>
    </div>

    <aside class="space-y-6">
      <FormSectionCard title="Condiciones económicas" icon="lucide:wallet" show-icon>
        <ul class="space-y-2 text-sm">
          <li class="flex justify-between gap-2">
            <span class="text-gray-600 dark:text-gray-400">Moneda</span>
            <span class="font-medium text-gray-800 dark:text-white/90">{{ p.currency }}</span>
          </li>
          <li v-if="p.exchangeRate" class="flex justify-between gap-2">
            <span class="text-gray-600 dark:text-gray-400">Tipo de cambio</span>
            <span class="text-gray-800 dark:text-white/90">S/ {{ p.exchangeRate }}</span>
          </li>
          <li class="flex justify-between gap-2">
            <span class="text-gray-600 dark:text-gray-400">Presupuesto estimado</span>
            <span class="font-medium text-gray-800 dark:text-white/90">{{ formatMoney(p.estimatedBudget, p.currency) }}</span>
          </li>
          <li class="flex justify-between gap-2">
            <span class="text-gray-600 dark:text-gray-400">Utilidad · GG · IGV</span>
            <span class="text-gray-800 dark:text-white/90">{{ p.defaultUtilityPct }}% · {{ p.defaultOverheadPct }}% · {{ p.defaultIgvPct }}%</span>
          </li>
        </ul>
      </FormSectionCard>

      <FormSectionCard title="Equipo" icon="lucide:users" show-icon>
        <ul class="space-y-2 text-sm">
          <li v-for="m in team" :key="m.role" class="flex justify-between gap-2">
            <span class="text-gray-600 dark:text-gray-400">{{ m.role }}</span>
            <span class="text-right text-gray-800 dark:text-white/90">{{ m.agent?.fullName ?? '—' }}</span>
          </li>
        </ul>
      </FormSectionCard>
    </aside>
  </div>
</template>
