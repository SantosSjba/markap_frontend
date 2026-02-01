<script setup lang="ts">
/**
 * AuthLayout Component
 * Layout for authentication pages (login, forgot password)
 * Uses brand colors from main.css
 */
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-4">
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
</template>
