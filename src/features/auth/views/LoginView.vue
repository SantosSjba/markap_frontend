<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
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
    <!-- Logo -->
    <div class="flex justify-center mb-6">
      <img 
        src="/images/logo_bg_removed.png" 
        alt="MARKAP Homes" 
        class="h-32 w-auto object-contain"
      />
    </div>

    <!-- Title -->
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
            <AppIcon v-if="!showPassword" icon="lucide:eye" :size="20" color="currentColor" />
            <AppIcon v-else icon="lucide:eye-off" :size="20" color="currentColor" />
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
          <AppIcon icon="line-md:loading-loop" :size="20" color="currentColor" />
          Ingresando...
        </span>
        <span v-else>Ingresar</span>
      </button>
    </form>
  </div>
</template>
