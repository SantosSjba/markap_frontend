<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useRoute, useRouter } from 'vue-router'
import { markapAlert } from '@/shared/alert'
import { useResetPassword } from '../composables'
import { isAxiosError } from 'axios'

/**
 * ResetPasswordView
 * Restablece la contraseña usando el código recibido por correo (TanStack Query)
 */

const route = useRoute()
const router = useRouter()
const resetMutation = useResetPassword()

const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const emailFromQuery = computed(() => {
  const q = route.query.email
  return typeof q === 'string' ? q : ''
})

onMounted(() => {
  if (emailFromQuery.value) {
    email.value = emailFromQuery.value
  }
})

const isSuccess = computed(() => resetMutation.isSuccess.value)
const isLoading = computed(() => resetMutation.isPending.value)

const validateForm = (): boolean => {
  const msgs: string[] = []

  if (!email.value) {
    msgs.push('El correo electrónico es requerido')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    msgs.push('Ingrese un correo electrónico válido')
  }

  if (!code.value || code.value.length !== 6) {
    msgs.push('El código debe tener exactamente 6 dígitos')
  } else if (!/^\d{6}$/.test(code.value)) {
    msgs.push('El código solo debe contener números')
  }

  if (!newPassword.value || newPassword.value.length < 6) {
    msgs.push('La contraseña debe tener al menos 6 caracteres')
  }

  if (newPassword.value !== confirmPassword.value) {
    msgs.push('Las contraseñas no coinciden')
  }

  if (msgs.length) {
    void markapAlert.warning(msgs.join(' '), 'Revisa el formulario')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  resetMutation.mutate(
    {
      email: email.value.trim(),
      code: code.value.trim(),
      newPassword: newPassword.value,
    },
    {
      onSuccess: () => {
        void markapAlert.toast.success(
          'Ya puedes iniciar sesión con tu nueva contraseña.',
          'Contraseña actualizada',
        )
      },
      onError: (err: unknown) => {
        const res = isAxiosError(err) ? err.response : undefined
        if (res?.status === 400) {
          void markapAlert.error(
            (res.data as { message?: string })?.message || 'El código es inválido o ha expirado',
            'Error',
          )
        } else if (res?.status === 404) {
          void markapAlert.error('No existe un usuario con ese correo electrónico', 'Error')
        } else {
          void markapAlert.error('Error al restablecer la contraseña. Intente nuevamente.', 'Error')
        }
      },
    },
  )
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
        <AppIcon icon="lucide:key-round" :size="32" color="var(--color-primary)" />
      </div>
    </div>

    <!-- Success state -->
    <div v-if="isSuccess" class="text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style="background-color: var(--color-success-light); border: 1px solid var(--color-success);"
      >
        <AppIcon icon="lucide:check" :size="32" color="var(--color-success)" />
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
            class="w-full"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <AppIcon icon="line-md:loading-loop" :size="20" color="currentColor" />
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
