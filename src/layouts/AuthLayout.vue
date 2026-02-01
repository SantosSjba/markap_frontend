<script setup lang="ts">
/**
 * AuthLayout Component
 * Layout for authentication pages (login, register, forgot password)
 */
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Markap</h1>
        <p class="text-white/80 mt-2">Sistema Inmobiliario</p>
      </div>

      <!-- Content card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <slot />
      </div>

      <!-- Footer -->
      <p class="text-center text-white/60 text-sm mt-6">
        &copy; {{ new Date().getFullYear() }} Markap. Todos los derechos reservados.
      </p>
    </div>
  </div>
</template>
