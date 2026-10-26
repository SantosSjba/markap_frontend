<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import * as yup from 'yup'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useRouter } from 'vue-router'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { useAuthStore } from '../stores/auth.store'
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
    <p class="text-sm mb-8 text-gray-500 dark:text-gray-400">Sistema Integral de Gestión Empresarial</p>

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
          class="text-sm transition-colors text-brand-500 dark:text-brand-400"
        >
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <!-- Submit button -->
      <BaseButton type="submit" :disabled="authStore.isLoading" size="lg" block :loading="authStore.isLoading" loading-text="Ingresando...">Ingresar</BaseButton>
    </form>
  </div>
</template>
