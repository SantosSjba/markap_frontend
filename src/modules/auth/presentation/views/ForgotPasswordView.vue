<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { computed } from 'vue'
import * as yup from 'yup'
import { getApiErrorMessage, getApiErrorStatus } from '@shared/utils/apiErrorMessage'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useForgotPassword } from '../composables/useAuthMutations'
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
      if (getApiErrorStatus(err) === 404) {
        void markapAlert.error(
          'No existe un usuario registrado con ese correo electrónico',
          'Error',
        )
      } else {
        void markapAlert.error(getApiErrorMessage(err, 'No se pudo enviar el código'), 'Error')
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
        class="w-16 h-16 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-500/12 border border-brand-500"
      >
        <AppIcon icon="lucide:key-round" :size="32" color="var(--color-primary)" />
      </div>
    </div>

    <!-- Title -->
    <h1 class="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">Recuperar Contraseña</h1>
    <p class="text-sm mb-8 text-gray-500 dark:text-gray-400">Te enviaremos un código de 6 dígitos por correo para restablecer tu contraseña</p>

    <!-- Success message -->
    <div v-if="isSubmitted" class="text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-success-500 bg-success-50 dark:bg-success-500/15"
      >
        <AppIcon icon="lucide:check" :size="32" color="var(--color-success)" />
      </div>
      <p class="mb-6 text-gray-500 dark:text-gray-400">
        Hemos enviado un código de recuperación a<br />
        <strong class="text-gray-800 dark:text-white/90">{{ values.email }}</strong>
      </p>
      <p class="text-sm mb-4 text-gray-400 dark:text-gray-500">
        Revisa tu bandeja de entrada y usa el código en la siguiente pantalla.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <BaseButton to="/auth/login" size="lg">Volver al inicio de sesión</BaseButton>
        <BaseButton :to="{ path: '/auth/reset-password', query: { email: values.email } }" variant="outline" size="lg">Ingresar código</BaseButton>
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
      <BaseButton type="submit" :disabled="isLoading" size="lg" block :loading="isLoading" loading-text="Enviando...">Enviar código</BaseButton>

      <!-- Back to login -->
      <p class="text-center">
        <router-link
          to="/auth/login"
          class="text-sm transition-colors text-brand-500 dark:text-brand-400"
        >
          ← Volver al inicio de sesión
        </router-link>
      </p>
    </form>
  </div>
</template>
