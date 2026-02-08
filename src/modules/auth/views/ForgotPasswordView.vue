<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '../services'

/**
 * ForgotPasswordView
 * Solicita un código de recuperación enviado por correo
 */

const email = ref('')
const error = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)

const handleSubmit = async () => {
  error.value = ''

  if (!email.value) {
    error.value = 'El correo electrónico es requerido'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = 'Ingrese un correo electrónico válido'
    return
  }

  isLoading.value = true

  try {
    await authService.forgotPassword(email.value.trim())
    isSubmitted.value = true
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      error.value = 'No existe un usuario registrado con ese correo electrónico'
    } else {
      error.value = 'Error al enviar el código. Intente nuevamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <!-- Icon -->
    <div class="flex justify-center mb-6">
      <div 
        class="w-16 h-16 rounded-xl flex items-center justify-center"
        style="background-color: var(--color-primary-light); border: 1px solid var(--color-primary);"
      >
        <svg 
          class="w-8 h-8" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style="color: var(--color-primary);"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
    </div>

    <!-- Title -->
    <h1 class="text-2xl font-bold tracking-wide mb-2" style="color: var(--color-text-primary);">Recuperar Contraseña</h1>
    <p class="text-sm mb-8" style="color: var(--color-text-secondary);">Te enviaremos un código de 6 dígitos por correo para restablecer tu contraseña</p>

    <!-- Success message -->
    <div v-if="isSubmitted" class="text-center">
      <div 
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style="background-color: var(--color-success-light); border: 1px solid var(--color-success);"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-success);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="mb-6" style="color: var(--color-text-secondary);">
        Hemos enviado un código de recuperación a<br />
        <strong style="color: var(--color-text-primary);">{{ email }}</strong>
      </p>
      <p class="text-sm mb-4" style="color: var(--color-text-muted);">
        Revisa tu bandeja de entrada y usa el código en la siguiente pantalla.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <router-link
          to="/auth/login"
          class="btn-primary inline-block py-3 px-6 rounded-lg font-medium text-center"
        >
          Volver al inicio de sesión
        </router-link>
        <router-link
          :to="{ path: '/auth/reset-password', query: { email } }"
          class="btn inline-block py-3 px-6 rounded-lg font-medium text-center border-2"
          style="border-color: var(--color-primary); color: var(--color-primary);"
        >
          Ingresar código
        </router-link>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-5 text-left">
      <!-- Email -->
      <div>
        <label 
          class="block text-sm font-medium mb-2"
          style="color: var(--color-text-secondary);"
        >
          Correo electrónico
        </label>
        <input
          v-model="email"
          type="email"
          placeholder="usuario@markap.com"
          :style="error ? 'border-color: var(--color-error);' : ''"
          class="w-full"
        />
        <p v-if="error" class="mt-1.5 text-sm" style="color: var(--color-error);">
          {{ error }}
        </p>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Enviando...
        </span>
        <span v-else>Enviar código</span>
      </button>

      <!-- Back to login -->
      <p class="text-center">
        <router-link
          to="/auth/login"
          class="text-sm transition-colors"
          style="color: var(--color-primary);"
        >
          ← Volver al inicio de sesión
        </router-link>
      </p>
    </form>
  </div>
</template>
