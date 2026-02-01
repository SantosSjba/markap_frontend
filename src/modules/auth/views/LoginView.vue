<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores'
import { BaseButton, BaseInput } from '@shared/components'
import type { LoginCredentials } from '../types'

/**
 * LoginView
 * User login page
 */

const router = useRouter()
const route = useRoute()
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
    errors.email = 'El email es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.email = 'Email inválido'
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

  const success = await authStore.login(credentials)

  if (success) {
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  } else {
    errors.general = 'Credenciales inválidas'
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 text-center mb-6">
      Iniciar Sesión
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- General error -->
      <div
        v-if="errors.general"
        class="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
      >
        {{ errors.general }}
      </div>

      <!-- Email -->
      <BaseInput
        v-model="credentials.email"
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        :error="errors.email"
        required
      />

      <!-- Password -->
      <div class="relative">
        <BaseInput
          v-model="credentials.password"
          :type="showPassword ? 'text' : 'password'"
          label="Contraseña"
          placeholder="••••••••"
          :error="errors.password"
          required
        />
        <button
          type="button"
          class="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
          @click="showPassword = !showPassword"
        >
          <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <!-- Forgot password link -->
      <div class="text-right">
        <router-link
          to="/auth/forgot-password"
          class="text-sm text-primary-500 hover:text-primary-700"
        >
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <!-- Submit button -->
      <BaseButton
        type="submit"
        block
        :loading="authStore.isLoading"
      >
        Ingresar
      </BaseButton>

      <!-- Register link -->
      <p class="text-center text-sm text-gray-600">
        ¿No tienes cuenta?
        <router-link to="/auth/register" class="text-primary-500 hover:text-primary-700 font-medium">
          Regístrate
        </router-link>
      </p>
    </form>
  </div>
</template>
