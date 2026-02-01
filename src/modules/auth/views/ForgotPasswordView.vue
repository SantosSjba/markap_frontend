<script setup lang="ts">
import { ref } from 'vue'
import { BaseButton, BaseInput } from '@shared/components'

/**
 * ForgotPasswordView
 * Password recovery page
 */

const email = ref('')
const error = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)

const handleSubmit = async () => {
  error.value = ''

  if (!email.value) {
    error.value = 'El email es requerido'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = 'Email inválido'
    return
  }

  isLoading.value = true

  // TODO: Implement password reset API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  isLoading.value = false
  isSubmitted.value = true
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 text-center mb-2">
      Recuperar Contraseña
    </h2>
    <p class="text-gray-600 text-center mb-6">
      Te enviaremos un enlace para restablecer tu contraseña.
    </p>

    <!-- Success message -->
    <div v-if="isSubmitted" class="text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="text-gray-600 mb-4">
        Hemos enviado un enlace de recuperación a <strong>{{ email }}</strong>
      </p>
      <router-link
        to="/auth/login"
        class="text-primary-500 hover:text-primary-700 font-medium"
      >
        Volver al inicio de sesión
      </router-link>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <BaseInput
        v-model="email"
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        :error="error"
        required
      />

      <BaseButton
        type="submit"
        block
        :loading="isLoading"
      >
        Enviar Enlace
      </BaseButton>

      <p class="text-center">
        <router-link
          to="/auth/login"
          class="text-sm text-primary-500 hover:text-primary-700"
        >
          Volver al inicio de sesión
        </router-link>
      </p>
    </form>
  </div>
</template>
