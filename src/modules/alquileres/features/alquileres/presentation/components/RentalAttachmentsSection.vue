<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import { getAttachmentUrl } from '../downloads/rental-attachment-url'
import type { RentalAttachment } from '../../domain/rental.types'
/**
 * RentalAttachmentsSection — contrato firmado y acta de entrega. En edición muestra el
 * archivo actual (con descarga) y subir otro lo reemplaza.
 */

const props = withDefaults(defineProps<{ attachments?: RentalAttachment[] }>(), {
  attachments: () => [],
})

const contractFile = defineModel<File | null>('contractFile', { default: null })
const deliveryActFile = defineModel<File | null>('deliveryActFile', { default: null })

const slots = computed(() => [
  {
    type: 'CONTRACT' as const,
    label: 'Contrato firmado',
    current: props.attachments.find((a) => a.type === 'CONTRACT'),
    model: contractFile,
  },
  {
    type: 'DELIVERY_ACT' as const,
    label: 'Acta de entrega',
    current: props.attachments.find((a) => a.type === 'DELIVERY_ACT'),
    model: deliveryActFile,
  },
])
</script>

<template>
  <FormSectionCard title="Adjuntos" subtitle="PDF, Word o imágenes, máx. 10 MB">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div v-for="slot in slots" :key="slot.type" class="space-y-2">
        <div
          v-if="slot.current"
          class="flex items-center gap-2 rounded-lg border border-success-500/20 bg-success-500/6 px-3 py-2 text-sm"
        >
          <AppIcon icon="lucide:file-check-2" :size="16" color="var(--color-success, #16a34a)" />
          <span class="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
            {{ slot.current.originalFileName }}
          </span>
          <a
            :href="getAttachmentUrl(slot.current)"
            target="_blank"
            download
            class="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-500 dark:text-brand-400"
          >
            <AppIcon icon="lucide:download" :size="12" />
            Descargar
          </a>
        </div>
        <FileDropzone
          :model-value="slot.model.value"
          :label="slot.current ? `Reemplazar ${slot.label.toLowerCase()}` : slot.label"
          accept=".pdf,.doc,.docx,image/*"
          placeholder="Arrastra el archivo aquí o haz clic para seleccionar"
          :max-size="10 * 1024 * 1024"
          :multiple="false"
          @update:model-value="slot.model.value = Array.isArray($event) ? ($event[0] ?? null) : $event"
        />
      </div>
    </div>
  </FormSectionCard>
</template>
