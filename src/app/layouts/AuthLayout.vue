<script setup lang="ts">
import ThemeToggle from '@shared/presentation/components/ui/ThemeToggle.vue'
/**
 * AuthLayout — pantalla dividida de TailAdmin para login y recuperación de contraseña.
 */
</script>

<template>
  <div class="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
    <div
      class="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900"
    >
      <div class="flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
        <div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <router-view />
        </div>
      </div>

      <div
        class="relative hidden h-full w-full items-center justify-center bg-brand-950 lg:grid lg:w-1/2 dark:bg-white/5"
      >
        <div class="z-1 flex h-full items-center justify-center">
          <div>
            <div class="absolute top-0 right-1 -z-1 w-full max-w-62.5 xl:max-w-112.5">
              <img src="/images/shape/grid-01.svg" alt="" />
            </div>
            <div class="absolute bottom-0 start-0 -z-1 w-full max-w-62.5 rotate-180 xl:max-w-112.5">
              <img src="/images/shape/grid-01.svg" alt="" />
            </div>
          </div>

          <div class="flex max-w-xs flex-col items-center">
            <div class="mb-4 rounded-2xl bg-white p-4">
              <img width="160" height="160" src="/images/logo_bg_removed.png" alt="MARKAP Homes" />
            </div>
            <p class="text-center text-gray-400 dark:text-white/60">
              Sistema Integral de Gestión Empresarial
            </p>
            <p class="mt-2 text-center text-theme-xs text-gray-500 dark:text-white/40">
              MARKAP S.A.C. &copy; {{ new Date().getFullYear() }}
            </p>
          </div>
        </div>
      </div>

      <div class="fixed end-6 bottom-6 z-50 hidden sm:block">
        <ThemeToggle variant="floating" />
      </div>
    </div>
  </div>
</template>
