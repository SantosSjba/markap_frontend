<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores'
import type { LoginCredentials } from '../types'

/**
 * LoginView
 * User login page
 */

const router = useRouter()
const authStore = useAuthStore()

const credentials = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const showPassword = ref(false)

const validateForm = (): boolean => {
  let isValid = true
  errors.email = ''
  errors.password = ''
  errors.general = ''

  if (!credentials.email) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.email = 'Ingrese un correo electrónico válido'
    isValid = false
  }

  if (!credentials.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const result = await authStore.login(credentials)

  if (result.success) {
    // Always redirect to applications after login (ignore query redirect)
    router.push('/applications')
  } else {
    errors.general = result.error || 'Credenciales inválidas'
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    </div>

    <!-- Title -->
    <h1 class="text-2xl font-bold tracking-wide mb-2" style="color: var(--color-text-primary);">MARKAP</h1>
    <p class="text-sm mb-8" style="color: var(--color-text-secondary);">Sistema Integral de Gestión Empresarial</p>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-5 text-left">
      <!-- General error -->
      <div
        v-if="errors.general"
        class="p-3 rounded-lg text-sm text-center"
        style="background-color: var(--color-error-light); border: 1px solid var(--color-error); color: var(--color-error);"
      >
        {{ errors.general }}
      </div>

      <!-- Email -->
      <div>
        <label 
          class="block text-sm font-medium mb-2"
          style="color: var(--color-text-secondary);"
        >
          Correo electrónico
        </label>
        <input
          v-model="credentials.email"
          type="email"
          placeholder="usuario@markap.com"
          :style="errors.email ? 'border-color: var(--color-error);' : ''"
          class="w-full"
        />
        <p v-if="errors.email" class="mt-1.5 text-sm" style="color: var(--color-error);">
          {{ errors.email }}
        </p>
      </div>

      <!-- Password -->
      <div>
        <label 
          class="block text-sm font-medium mb-2"
          style="color: var(--color-text-secondary);"
        >
          Contraseña
        </label>
        <div class="relative">
          <input
            v-model="credentials.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            :style="errors.password ? 'border-color: var(--color-error);' : ''"
            class="w-full pr-12"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style="color: var(--color-text-muted);"
            @click="togglePassword"
            @mouseenter="($event.target as HTMLElement).style.color = 'var(--color-text-secondary)'"
            @mouseleave="($event.target as HTMLElement).style.color = 'var(--color-text-muted)'"
          >
            <!-- Eye icon (show) -->
            <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <!-- Eye off icon (hide) -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="mt-1.5 text-sm" style="color: var(--color-error);">
          {{ errors.password }}
        </p>
      </div>

      <!-- Forgot password link -->
      <div class="text-right">
        <router-link
          to="/auth/forgot-password"
          class="text-sm transition-colors"
          style="color: var(--color-primary);"
        >
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.isLoading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Ingresando...
        </span>
        <span v-else>Ingresar</span>
      </button>
    </form>
  </div>
</template>
