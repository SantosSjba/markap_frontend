<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorismoConfigBootstrap, useInteriorismoSaveProjectStages } from '../composables/useInteriorismoConfig'
import type { InteriorismoProjectStageDTO } from '../../domain/config.types'
/**
 * Configuración de Interiorismo: nombres de las etapas del proyecto (el orden del ciclo es fijo) y,
 * como referencia, el flujo del negocio con un enlace a cada área. Los códigos de proyecto se
 * generan solos (año, tipo, distrito y cliente), así que no hay numeración que configurar.
 */

const tabs = [
  { id: 'parametros', label: 'Parametrización', icon: 'lucide:sliders-horizontal' },
  { id: 'flujo', label: 'Flujo del negocio', icon: 'lucide:workflow' },
]
const activeTab = ref('parametros')

// ── Etapas del proyecto ──
const { data: boot, isLoading, isError, error, refetch } = useInteriorismoConfigBootstrap()
const { mutate: saveStages, isPending: savingStages } = useInteriorismoSaveProjectStages()

const stages = computed(() => [...(boot.value?.projectStages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
const labels = ref<Record<string, string>>({})
watch(
  stages,
  (rows) => {
    labels.value = Object.fromEntries(rows.map((r) => [r.code, r.label]))
  },
  { immediate: true },
)
const dirty = computed(() => stages.value.some((s) => (labels.value[s.code] ?? '').trim() !== s.label))
const invalid = computed(() => stages.value.some((s) => !(labels.value[s.code] ?? '').trim()))

function submitStages() {
  if (invalid.value) return
  const rows: InteriorismoProjectStageDTO[] = stages.value.map((s, i) => ({
    ...s,
    label: labels.value[s.code]!.trim(),
    sortOrder: i,
    isActive: true,
  }))
  saveStages(rows)
}
function resetLabels() {
  labels.value = Object.fromEntries(stages.value.map((s) => [s.code, s.label]))
}

const STAGE_HINTS: Record<string, string> = {
  DESIGN: 'Se levanta información y se propone el diseño.',
  QUOTE: 'Se arma y envía el presupuesto al cliente.',
  APPROVED: 'El cliente aprobó; se prepara la obra y las compras.',
  IN_PROGRESS: 'Obra en curso: compras, tareas, hitos y cobros.',
  FINISHED: 'Proyecto entregado y liquidado.',
}
const STAGES_HELP: HelpTooltipItem[] = [
  { icon: 'lucide:tag', term: 'Nombre', text: 'Cómo se muestra la etapa en proyectos, filtros, calendario y reportes.' },
  { icon: 'lucide:arrow-right', term: 'Orden fijo', text: 'El ciclo siempre va de Diseño a Finalizado; solo cambia el nombre.' },
  { icon: 'lucide:history', term: 'Actividad', text: 'Cada cambio de etapa de un proyecto queda anotado en su pestaña Actividad.' },
  { icon: 'lucide:ban', term: 'Cancelado', text: 'Un proyecto cancelado sale del ciclo; no es una etapa configurable.' },
]

// ── Flujo del negocio (informativo) ──
const projectsPath = `${INTERIORISMO_BASE_PATH}/proyectos`
const flowSteps = [
  { title: 'Cliente', icon: 'lucide:user', text: 'Se registra la persona o empresa y su dirección.', to: `${INTERIORISMO_BASE_PATH}/clientes`, where: 'Clientes' },
  { title: 'Equipo', icon: 'lucide:hard-hat', text: 'Responsables que se asignan al proyecto: diseño, arquitectura, obra y comercial.', to: `${INTERIORISMO_BASE_PATH}/equipo`, where: 'Equipo' },
  { title: 'Proyecto', icon: 'lucide:folder-kanban', text: 'Se crea con su tipo, ubicación, equipo y condiciones económicas.', to: projectsPath, where: 'Proyectos' },
  { title: 'Presupuesto', icon: 'lucide:file-spreadsheet', text: 'Grupos y partidas con costo, utilidad e IGV; se exporta a Excel o PDF.', to: projectsPath, where: 'Ficha › Presupuesto' },
  { title: 'Compras', icon: 'lucide:shopping-cart', text: 'Costo real de cada partida, proveedor y abonos.', to: projectsPath, where: 'Ficha › Compras y contrataciones' },
  { title: 'Ejecución', icon: 'lucide:list-checks', text: 'Tareas, hitos, evidencias e incidencias de obra.', to: projectsPath, where: 'Ficha › Ejecución' },
  { title: 'Liquidación', icon: 'lucide:scale', text: 'Cobros del cliente, saldo y utilidad del proyecto.', to: projectsPath, where: 'Ficha › Liquidación' },
  { title: 'Seguimiento', icon: 'lucide:bar-chart-3', text: 'Calendario, documentos y reportes de todos los proyectos.', to: `${INTERIORISMO_BASE_PATH}/reportes`, where: 'Calendario · Documentos · Reportes' },
]
</script>

<template>
  <div class="max-w-5xl space-y-6">
    <PageHeader title="Configuración" subtitle="Ajustes propios de Interiorismo y el flujo de trabajo del módulo" />

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="activeTab === 'parametros'" class="space-y-6">
      <LoadingState v-if="isLoading" />

      <BaseCard v-else-if="isError" padding="lg" class="block space-y-3 text-center">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">No se pudo cargar la configuración</p>
        <p class="mx-auto max-w-lg text-xs text-gray-500 dark:text-gray-400">{{ getApiErrorMessage(error) }}</p>
        <BaseButton type="button" @click="() => refetch()">Reintentar</BaseButton>
      </BaseCard>

      <template v-else>
        <section class="space-y-3">
          <SectionIntro
            title="Etapas del proyecto"
            subtitle="Nombre con que se muestra cada etapa del ciclo en todo el módulo."
            help-title="¿Qué se configura aquí?"
            :help="STAGES_HELP"
          />
          <BaseCard padding="none" class="block overflow-hidden">
            <ol class="divide-y divide-gray-100 dark:divide-gray-800">
              <li v-for="(s, i) in stages" :key="s.code" class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    {{ i + 1 }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-theme-xs text-gray-400 dark:text-gray-500">{{ STAGE_HINTS[s.code] ?? s.code }}</p>
                  </div>
                </div>
                <FormInput
                  v-model="labels[s.code]"
                  size="sm"
                  class="sm:w-64"
                  :aria-label="`Nombre de la etapa ${i + 1}`"
                  :disabled="!canWrite"
                  :error="!(labels[s.code] ?? '').trim() ? 'Escriba un nombre' : undefined"
                />
              </li>
            </ol>
            <div v-if="canWrite" class="flex justify-end gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
              <BaseButton variant="outline" size="sm" :disabled="!dirty" @click="resetLabels">Descartar cambios</BaseButton>
              <BaseButton variant="primary" size="sm" icon="lucide:save" :loading="savingStages" :disabled="!dirty || invalid" @click="submitStages">
                Guardar nombres
              </BaseButton>
            </div>
          </BaseCard>
        </section>

        <section class="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <AppIcon icon="lucide:hard-hat" :size="20" class="mt-0.5 shrink-0 text-brand-500" />
          <div class="min-w-0 flex-1 text-sm">
            <p class="font-medium text-gray-800 dark:text-white/90">Responsables de proyecto</p>
            <p class="text-gray-500 dark:text-gray-400">
              Se registran en Equipo con sus funciones (diseño, arquitectura, obra, comercial). Es un registro informativo: no tienen acceso al sistema.
            </p>
          </div>
          <BaseButton variant="outline" size="sm" :to="`${INTERIORISMO_BASE_PATH}/equipo`">Ir a Equipo</BaseButton>
        </section>

        <p class="flex items-start gap-2 text-theme-xs text-gray-400 dark:text-gray-500">
          <AppIcon icon="lucide:info" :size="14" class="mt-0.5 shrink-0" />
          Los códigos de proyecto se generan solos con el año, el tipo, el distrito y el cliente (p. ej. PROYECTO-2026-DISEÑO-CAYMA-TORRES), por eso no hay numeración que configurar.
        </p>
      </template>
    </div>

    <div v-else class="space-y-4">
      <SectionIntro title="Flujo del negocio" subtitle="Cómo avanza un proyecto de interiorismo, de principio a fin. Cada paso enlaza a su área." />
      <ol class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in flowSteps" :key="s.title">
          <RouterLink
            :to="s.to"
            class="group flex h-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
          >
            <div class="flex items-center justify-between">
              <span class="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15">
                <AppIcon :icon="s.icon" :size="18" />
              </span>
              <span class="text-theme-xs font-semibold text-gray-300 dark:text-gray-600">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
            <p class="text-sm font-semibold text-gray-800 group-hover:text-brand-500 dark:text-white/90">{{ s.title }}</p>
            <p class="flex-1 text-theme-xs text-gray-500 dark:text-gray-400">{{ s.text }}</p>
            <p class="flex items-center gap-1 text-theme-xs font-medium text-brand-500">
              {{ s.where }} <AppIcon icon="lucide:arrow-right" :size="12" />
            </p>
          </RouterLink>
        </li>
      </ol>
    </div>
  </div>
</template>
