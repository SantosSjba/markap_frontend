<script setup lang="ts">
import { ThemeToggle } from '@shared/components'

/**
 * AuthLayout Component
 * Layout for authentication pages (login, forgot password)
 * Uses brand colors from main.css
 */
</script>

<template>
  <div class="min-h-screen flex flex-col relative bg-gradient-to-br from-primary-700 to-primary-900 p-4">
    <!-- Theme toggle - top right -->
    <div class="absolute top-4 right-4 z-10">
      <ThemeToggle variant="light" />
    </div>

    <div class="flex-1 flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Content card -->
      <div class="card p-8 shadow-lg">
        <router-view />
      </div>

      <!-- Footer -->
      <p class="text-center text-primary-200 text-sm mt-6">
        MARKAP S.A.C. &copy; {{ new Date().getFullYear() }} - Todos los derechos reservados
      </p>
    </div>
    </div>
  </div>
</template>
