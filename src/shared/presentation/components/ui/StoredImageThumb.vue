<script setup lang="ts">
import { ref, watch } from 'vue'
import { useService } from '../../di/services'
import { FILE_ACCESS } from '../../../application/ports/file-access.port'
import AppIcon from './AppIcon.vue'
/**
 * StoredImageThumb — miniatura de una imagen guardada en el gestor de archivos: si `path` es una
 * clave de objeto pide la URL firmada; si ya es una URL http la usa tal cual.
 */

const props = defineProps<{ path: string; applicationSlug: string; alt?: string }>()
const fileAccess = useService(FILE_ACCESS)
const src = ref<string | null>(null)
const failed = ref(false)

watch(
  () => props.path,
  async (path) => {
    failed.value = false
    src.value = null
    if (/^https?:\/\//i.test(path)) {
      src.value = path
      return
    }
    try {
      src.value = (await fileAccess.resolveDownloadUrl(path, { applicationSlug: props.applicationSlug })).url
    } catch {
      failed.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <img v-if="src && !failed" :src="src" :alt="alt ?? ''" class="size-full object-cover" loading="lazy" @error="failed = true" />
  <div v-else class="flex size-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
    <AppIcon :icon="failed ? 'lucide:image-off' : 'lucide:image'" :size="20" />
  </div>
</template>
