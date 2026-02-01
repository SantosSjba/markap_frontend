<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores'
import { BaseButton, BaseInput } from '@shared/components'
import type { RegisterData } from '../types'

/**
 * RegisterView
 * User registration page
 */

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive<RegisterData & { confirmPassword: string }>({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
})

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  general: '',
})

const validateForm = (): boolean => {
  let isValid = true
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })

  if (!formData.firstName) {
    errors.firstName = 'El nombre es requerido'
    isValid = false
  }

  if (!formData.lastName) {
    errors.lastName = 'El apellido es requerido'
    isValid = false
  }

  if (!formData.email) {
    errors.email = 'El email es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Email inválido'
    isValid = false
  }

  if (!formData.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  } else if (formData.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres'
    isValid = false
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const { confirmPassword, ...registerData } = formData
  const success = await authStore.register(registerData)

  if (success) {
    router.push('/dashboard')
  } else {
    errors.general = 'Error al registrar usuario'
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 text-center mb-6">
      Crear Cuenta
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- General error -->
      <div
        v-if="errors.general"
        class="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
      >
        {{ errors.general }}
      </div>

      <!-- Name fields -->
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="formData.firstName"
          label="Nombre"
          placeholder="Juan"
          :error="errors.firstName"
          required
        />
        <BaseInput
          v-model="formData.lastName"
          label="Apellido"
          placeholder="Pérez"
          :error="errors.lastName"
          required
        />
      </div>

      <!-- Email -->
      <BaseInput
        v-model="formData.email"
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        :error="errors.email"
        required
      />

      <!-- Password -->
      <BaseInput
        v-model="formData.password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        :error="errors.password"
        hint="Mínimo 8 caracteres"
        required
      />

      <!-- Confirm password -->
      <BaseInput
        v-model="formData.confirmPassword"
        type="password"
        label="Confirmar Contraseña"
        placeholder="••••••••"
        :error="errors.confirmPassword"
        required
      />

      <!-- Submit button -->
      <BaseButton
        type="submit"
        block
        :loading="authStore.isLoading"
      >
        Registrarse
      </BaseButton>

      <!-- Login link -->
      <p class="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?
        <router-link to="/auth/login" class="text-primary-500 hover:text-primary-700 font-medium">
          Inicia sesión
        </router-link>
      </p>
    </form>
  </div>
</template>
