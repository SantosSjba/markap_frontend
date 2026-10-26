<script setup lang="ts">
/**
 * ErrorPage — página de error de pantalla completa de TailAdmin (`Error404`):
 * rejilla decorativa, título, ilustración (o código grande) y acciones.
 */
withDefaults(
  defineProps<{
    title?: string
    description: string
    /** Ilustración de `/images/error/{image}.svg` (con variante `-dark`) */
    image?: '404'
    /** Código grande cuando no hay ilustración (ej. 403) */
    code?: string
  }>(),
  { title: 'ERROR', image: undefined, code: undefined },
)
</script>

<template>
  <div
    class="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-6 dark:bg-gray-900"
  >
    <div class="absolute top-0 right-0 -z-1 w-full max-w-62.5 xl:max-w-112.5">
      <img src="/images/shape/grid-01.svg" alt="" />
    </div>
    <div class="absolute bottom-0 left-0 -z-1 w-full max-w-62.5 rotate-180 xl:max-w-112.5">
      <img src="/images/shape/grid-01.svg" alt="" />
    </div>

    <div class="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
      <h1 class="mb-8 text-title-md font-bold text-gray-800 dark:text-white/90 xl:text-title-2xl">
        {{ title }}
      </h1>

      <template v-if="image">
        <img :src="`/images/error/${image}.svg`" :alt="image" class="dark:hidden" width="472" height="152" />
        <img
          :src="`/images/error/${image}-dark.svg`"
          :alt="image"
          class="hidden dark:block"
          width="472"
          height="152"
        />
      </template>
      <p v-else-if="code" class="text-title-2xl font-bold text-brand-500 dark:text-brand-400">
        {{ code }}
      </p>

      <p class="mt-10 mb-6 text-base text-gray-700 sm:text-lg dark:text-gray-400">
        {{ description }}
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <slot name="actions" />
      </div>
    </div>

    <p
      class="absolute start-1/2 bottom-6 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      &copy; {{ new Date().getFullYear() }} - MARKAP S.A.C.
    </p>
  </div>
</template>
