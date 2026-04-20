<script setup lang="ts">
import { computed, onMounted } from 'vue'
import * as yup from 'yup'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import { useRoute, useRouter } from 'vue-router'
import { markapAlert } from '@/shared/alert'
import { useForm, toTypedSchema } from '@shared/forms'
import { useResetPassword } from '../../application/useAuthMutations'
import { isAxiosError } from 'axios'

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
  email: yup.string().required('El correo electrónico es requerido').email('Ingrese un correo electrónico válido').trim(),
  code: yup
    .string()
    .required('El código es requerido')
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .matches(/^\d+$/, 'El código solo debe contener números'),
  newPassword: yup.string().required('La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
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
          placeholder="Mínimo 6 caracteres"
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
