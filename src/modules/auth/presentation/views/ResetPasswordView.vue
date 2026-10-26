<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { computed, onMounted } from 'vue'
import * as yup from 'yup'
import { getApiErrorMessage, getApiErrorStatus } from '@shared/utils/apiErrorMessage'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useRoute, useRouter } from 'vue-router'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useResetPassword } from '../composables/useAuthMutations'
/**
 * ResetPasswordView
 * Restablece la contraseña usando el código recibido por correo (TanStack Query)
 */

const route = useRoute()
const router = useRouter()
const resetMutation = useResetPassword()

const emailFromQuery = computed(() => {
  const q = route.query.email
  return typeof q === 'string' ? q : ''
})

const resetSchema = yup.object({
  email: yup
    .string()
    .required('El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido')
    .trim(),
  code: yup
    .string()
    .required('El código es requerido')
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .matches(/^\d+$/, 'El código solo debe contener números'),
  newPassword: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(50)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Incluye mayúscula, minúscula y número'),
  confirmPassword: yup
    .string()
    .required('Confirma la contraseña')
    .oneOf([yup.ref('newPassword')], 'Las contraseñas no coinciden'),
})

const { handleSubmit, errors, defineComponentBinds, setFieldValue } = useForm({
  validationSchema: toTypedSchema(resetSchema),
  initialValues: {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  },
})

const emailBinds = defineComponentBinds('email')
const codeBinds = defineComponentBinds('code')
const newPasswordBinds = defineComponentBinds('newPassword')
const confirmPasswordBinds = defineComponentBinds('confirmPassword')

onMounted(() => {
  if (emailFromQuery.value) {
    setFieldValue('email', emailFromQuery.value)
  }
})

const isSuccess = computed(() => resetMutation.isSuccess.value)
const isLoading = computed(() => resetMutation.isPending.value)

const onSubmit = handleSubmit((formValues) => {
  resetMutation.mutate(
    {
      email: formValues.email.trim(),
      code: formValues.code.trim(),
      newPassword: formValues.newPassword,
    },
    {
      onSuccess: () => {
        void markapAlert.toast.success(
          'Ya puedes iniciar sesión con tu nueva contraseña.',
          'Contraseña actualizada',
        )
      },
      onError: (err: unknown) => {
        const status = getApiErrorStatus(err)
        if (status === 400) {
          void markapAlert.error(
            getApiErrorMessage(err, 'El código es inválido o ha expirado'),
            'Error',
          )
        } else if (status === 404) {
          void markapAlert.error('No existe un usuario con ese correo electrónico', 'Error')
        } else {
          void markapAlert.error(
            getApiErrorMessage(err, 'No se pudo restablecer la contraseña'),
            'Error',
          )
        }
      },
    },
  )
})

const goToLogin = () => {
  router.push('/auth/login')
}
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

    <!-- Success state -->
    <div v-if="isSuccess" class="text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-success-500 bg-success-50 dark:bg-success-500/15"
      >
        <AppIcon icon="lucide:check" :size="32" color="var(--color-success)" />
      </div>
      <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
        Contraseña actualizada
      </h2>
      <p class="mb-6 text-gray-500 dark:text-gray-400">
        Ya puedes iniciar sesión con tu nueva contraseña.
      </p>
      <BaseButton @click="goToLogin" size="lg">Ir a iniciar sesión</BaseButton>
    </div>

    <!-- Form -->
    <template v-else>
      <h1 class="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
        Restablecer Contraseña
      </h1>
      <p class="text-sm mb-8 text-gray-500 dark:text-gray-400">
        Ingresa el código de 6 dígitos que recibiste por correo y tu nueva contraseña
      </p>

      <form @submit.prevent="onSubmit" class="space-y-5 text-left">
        <FormInput
          v-bind="emailBinds"
          type="email"
          label="Correo electrónico"
          placeholder="usuario@markap.com"
          :error="errors.email"
          :disabled="!!emailFromQuery"
          required
        />

        <FormInput
          v-bind="codeBinds"
          type="text"
          label="Código de recuperación"
          placeholder="123456"
          input-class="text-center text-xl tracking-[0.5em] font-mono"
          :error="errors.code"
          required
          inputmode="numeric"
          maxlength="6"
        />

        <FormInput
          v-bind="newPasswordBinds"
          type="password"
          label="Nueva contraseña"
          placeholder="Mínimo 8 caracteres"
          :error="errors.newPassword"
          required
        />

        <FormInput
          v-bind="confirmPasswordBinds"
          type="password"
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          :error="errors.confirmPassword"
          required
        />

        <!-- Submit -->
        <BaseButton type="submit" :disabled="isLoading" size="lg" block :loading="isLoading" loading-text="Restableciendo...">Restablecer contraseña</BaseButton>

        <!-- Back links -->
        <p class="text-center space-x-2">
          <router-link
            to="/auth/forgot-password"
            class="text-sm text-brand-500 dark:text-brand-400"
          >
            Solicitar nuevo código
          </router-link>
          <span class="text-gray-400 dark:text-gray-500">|</span>
          <router-link
            to="/auth/login"
            class="text-sm text-brand-500 dark:text-brand-400"
          >
            Volver al login
          </router-link>
        </p>
      </form>
    </template>
  </div>
</template>
