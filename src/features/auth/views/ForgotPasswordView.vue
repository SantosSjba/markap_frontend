<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useForgotPassword } from '../composables'
import { isAxiosError } from 'axios'

/**
 * ForgotPasswordView
 * Solicita un código de recuperación enviado por correo (TanStack Query)
 */

const forgotMutation = useForgotPassword()

const email = ref('')
const error = ref('')

const isSubmitted = computed(() => forgotMutation.isSuccess.value)
const isLoading = computed(() => forgotMutation.isPending.value)

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

  forgotMutation.mutate(email.value.trim(), {
    onSuccess: () => {
      // isSubmitted is derived from isSuccess
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 404) {
        error.value = 'No existe un usuario registrado con ese correo electrónico'
      } else {
        error.value = 'Error al enviar el código. Intente nuevamente.'
      }
    },
  })
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
        <AppIcon icon="lucide:key-round" :size="32" color="var(--color-primary)" />
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
        <AppIcon icon="lucide:check" :size="32" color="var(--color-success)" />
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
          <AppIcon icon="line-md:loading-loop" :size="20" color="currentColor" />
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
