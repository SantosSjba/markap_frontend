<script setup lang="ts">
import { computed } from 'vue'
import * as yup from 'yup'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import { markapAlert } from '@/shared/alert'
import { useForm, toTypedSchema } from '@shared/forms'
import { useForgotPassword } from '../composables'
import { isAxiosError } from 'axios'

/**
 * ForgotPasswordView
 * Solicita un código de recuperación enviado por correo (TanStack Query)
 */

const forgotMutation = useForgotPassword()

const forgotSchema = yup.object({
  email: yup
    .string()
    .required('El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido')
    .trim(),
})

const { handleSubmit, errors, defineComponentBinds, values } = useForm({
  validationSchema: toTypedSchema(forgotSchema),
  initialValues: { email: '' },
})

const emailBinds = defineComponentBinds('email')

const isSubmitted = computed(() => forgotMutation.isSuccess.value)
const isLoading = computed(() => forgotMutation.isPending.value)

const onSubmit = handleSubmit((formValues) => {
  const trimmed = formValues.email.trim()

  forgotMutation.mutate(trimmed, {
    onSuccess: () => {
      void markapAlert.toast.success(
        `Te enviamos un código de 6 dígitos a ${trimmed}`,
        'Correo enviado',
      )
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 404) {
        void markapAlert.error(
          'No existe un usuario registrado con ese correo electrónico',
          'Error',
        )
      } else {
        void markapAlert.error('Error al enviar el código. Intente nuevamente.', 'Error')
      }
    },
  })
})
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
        <strong style="color: var(--color-text-primary);">{{ values.email }}</strong>
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
          :to="{ path: '/auth/reset-password', query: { email: values.email } }"
          class="btn inline-block py-3 px-6 rounded-lg font-medium text-center border-2"
          style="border-color: var(--color-primary); color: var(--color-primary);"
        >
          Ingresar código
        </router-link>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="onSubmit" class="space-y-5 text-left">
      <FormInput
        v-bind="emailBinds"
        type="email"
        label="Correo electrónico"
        placeholder="usuario@markap.com"
        :error="errors.email"
        required
      />

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
