<script setup lang="ts">
import type { BudgetSheetDto } from '../../domain/project-budget.types'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import BudgetSheet from './sheet/BudgetSheet.vue'
import ProjectBudgetAttachments from './ProjectBudgetAttachments.vue'
/** Pestaña Presupuesto: la hoja editable y, debajo, los archivos de respaldo (cotizaciones, planos). */

defineProps<{ projectId: string; budget: BudgetSheetDto; canWrite: boolean }>()

const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:file-spreadsheet', term: 'Hoja', text: 'Grupos (niveles, ambientes) con partidas, como en Excel. Arrastre ⠿ para ordenar y clic derecho para más opciones.' },
  { icon: 'lucide:percent', term: 'Utilidad por partida', text: 'Cada partida lleva su % de utilidad y su precio al cliente.' },
  { icon: 'lucide:sigma', term: 'GG + utilidad al final', text: 'Se presupuesta a costo; los gastos generales y la utilidad se suman al total.' },
  { icon: 'lucide:receipt', term: 'IGV', text: 'Sin IGV, en todo el presupuesto o solo en algunas partidas.' },
  { icon: 'lucide:copy', term: 'Versiones', text: 'Duplique el presupuesto para guardar una versión y elija cuál está activa.' },
  { icon: 'lucide:paperclip', term: 'Adjuntos', text: 'Cotizaciones, planos o el Excel original que respaldan el presupuesto.' },
]
</script>

<template>
  <div class="space-y-6">
    <SectionIntro
      title="Presupuesto"
      subtitle="Lo que se cotiza al cliente: grupos y partidas con su costo, utilidad e IGV."
      help-title="¿Cómo funciona el presupuesto?"
      :help="HELP"
    />
    <BudgetSheet :project-id="projectId" :sheet="budget" :can-write="canWrite" />
    <ProjectBudgetAttachments :project-id="projectId" :can-write="canWrite" />
  </div>
</template>
