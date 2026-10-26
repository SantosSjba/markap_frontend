<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import ErrorPage from '@shared/presentation/components/ui/ErrorPage.vue'
/**
 * UnauthorizedView
 * 403 access denied page
 */
</script>

<template>
  <ErrorPage
    title="ACCESO DENEGADO"
    code="403"
    description="No tienes permisos para acceder a esta página."
  >
    <template #actions>
      <BaseButton to="/" size="lg">Ir al inicio</BaseButton>
      <BaseButton to="/auth/login" variant="outline" size="lg">Iniciar sesión</BaseButton>
    </template>
  </ErrorPage>
</template>
