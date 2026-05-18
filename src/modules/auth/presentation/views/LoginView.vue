<script setup lang="ts">
import * as yup from 'yup'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import FormInput from '@shared/components/forms/FormInput.vue'
import { useRouter } from 'vue-router'
import { markapAlert } from '@/shared/composables'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { useAuthStore } from '@modules/auth'

/**
 * LoginView
 * User login page
 */

const router = useRouter()
const authStore = useAuthStore()

const loginSchema = yup.object({
  email: yup
    .string()
    .required('El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido')
    .trim(),
  password: yup.string().required('La contraseña es requerida'),
})

const { handleSubmit, errors, defineComponentBinds } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
  },
})

const emailBinds = defineComponentBinds('email')
const passwordBinds = defineComponentBinds('password')

const onSubmit = handleSubmit(async (values) => {
  const result = await authStore.login({
    email: values.email.trim(),
    password: values.password,
  })

  if (result.success) {
    void markapAlert.toast.success('Bienvenido', 'Redirigiendo al panel…')
    router.push('/applications')
  } else {
    void markapAlert.error(result.error || 'Credenciales inválidas', 'Error')
  }
})

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
    <form @submit.prevent="onSubmit" class="space-y-5 text-left">
      <FormInput
        v-bind="emailBinds"
        type="email"
        label="Correo electrónico"
        placeholder="usuario@markap.com"
        :error="errors.email"
        required
      />

      <FormInput
        v-bind="passwordBinds"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        :error="errors.password"
        required
      />

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
