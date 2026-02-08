<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../services'

/**
 * ResetPasswordView
 * Restablece la contraseña usando el código recibido por correo
 */

const route = useRoute()
const router = useRouter()

const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)

const emailFromQuery = computed(() => {
  const q = route.query.email
  return typeof q === 'string' ? q : ''
})

onMounted(() => {
  if (emailFromQuery.value) {
    email.value = emailFromQuery.value
  }
})

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

  if (!code.value || code.value.length !== 6) {
    error.value = 'El código debe tener exactamente 6 dígitos'
    return
  }

  if (!/^\d{6}$/.test(code.value)) {
    error.value = 'El código solo debe contener números'
    return
  }

  if (!newPassword.value || newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  isLoading.value = true

  try {
    await authService.resetPassword(
      email.value.trim(),
      code.value.trim(),
      newPassword.value
    )
    isSuccess.value = true
  } catch (err: unknown) {
    const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response
    if (res?.status === 400) {
      error.value = res.data?.message || 'El código es inválido o ha expirado'
    } else if (res?.status === 404) {
      error.value = 'No existe un usuario con ese correo electrónico'
    } else {
      error.value = 'Error al restablecer la contraseña. Intente nuevamente.'
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/auth/login')
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
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
    </div>

    <!-- Success state -->
    <div v-if="isSuccess" class="text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style="background-color: var(--color-success-light); border: 1px solid var(--color-success);"
      >
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style="color: var(--color-success);"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 class="text-xl font-bold mb-2" style="color: var(--color-text-primary);">
        Contraseña actualizada
      </h2>
      <p class="mb-6" style="color: var(--color-text-secondary);">
        Ya puedes iniciar sesión con tu nueva contraseña.
      </p>
      <button
        type="button"
        @click="goToLogin"
        class="btn-primary inline-block py-3 px-6 rounded-lg font-medium"
      >
        Ir a iniciar sesión
      </button>
    </div>

    <!-- Form -->
    <template v-else>
      <h1 class="text-2xl font-bold tracking-wide mb-2" style="color: var(--color-text-primary);">
        Restablecer Contraseña
      </h1>
      <p class="text-sm mb-8" style="color: var(--color-text-secondary);">
        Ingresa el código de 6 dígitos que recibiste por correo y tu nueva contraseña
      </p>

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
            v-model="email"
            type="email"
            placeholder="usuario@markap.com"
            :style="error ? 'border-color: var(--color-error);' : ''"
            class="w-full"
            :readonly="!!emailFromQuery"
          />
        </div>

        <!-- Code -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            style="color: var(--color-text-secondary);"
          >
            Código de recuperación
          </label>
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            :style="error ? 'border-color: var(--color-error);' : ''"
            class="w-full text-center text-xl tracking-[0.5em] font-mono"
          />
        </div>

        <!-- New Password -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            style="color: var(--color-text-secondary);"
          >
            Nueva contraseña
          </label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="Mínimo 6 caracteres"
            :style="error ? 'border-color: var(--color-error);' : ''"
            class="w-full"
          />
        </div>

        <!-- Confirm Password -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            style="color: var(--color-text-secondary);"
          >
            Confirmar contraseña
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repite la contraseña"
            :style="error ? 'border-color: var(--color-error);' : ''"
            class="w-full"
          />
        </div>

        <p v-if="error" class="text-sm" style="color: var(--color-error);">
          {{ error }}
        </p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg
              class="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Restableciendo...
          </span>
          <span v-else>Restablecer contraseña</span>
        </button>

        <!-- Back links -->
        <p class="text-center space-x-2">
          <router-link
            to="/auth/forgot-password"
            class="text-sm"
            style="color: var(--color-primary);"
          >
            Solicitar nuevo código
          </router-link>
          <span style="color: var(--color-text-muted);">|</span>
          <router-link
            to="/auth/login"
            class="text-sm"
            style="color: var(--color-primary);"
          >
            Volver al login
          </router-link>
        </p>
      </form>
    </template>
  </div>
</template>
