<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useRouter } from 'vue-router'
import { markapAlert } from '@/shared/alert'
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

const showPassword = ref(false)

const validateForm = (): boolean => {
  const msgs: string[] = []

  if (!credentials.email) {
    msgs.push('El correo electrónico es requerido')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    msgs.push('Ingrese un correo electrónico válido')
  }

  if (!credentials.password) {
    msgs.push('La contraseña es requerida')
  }

  if (msgs.length) {
    void markapAlert.warning(msgs.join(' '), 'Revisa el formulario')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const result = await authStore.login(credentials)

  if (result.success) {
    void markapAlert.toast.success('Bienvenido', 'Redirigiendo al panel…')
    router.push('/applications')
  } else {
    void markapAlert.error(result.error || 'Credenciales inválidas', 'Error')
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
          class="w-full"
        />
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
