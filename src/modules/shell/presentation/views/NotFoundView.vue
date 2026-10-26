<script setup lang="ts">
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import ErrorPage from '@shared/presentation/components/ui/ErrorPage.vue'
/**
 * NotFoundView
 * 404 error page
 */
</script>

<template>
  <ErrorPage
    image="404"
    description="Lo sentimos, la página que buscas no existe o ha sido movida."
  >
    <template #actions>
      <BaseButton to="/" variant="outline" size="lg">Volver al inicio</BaseButton>
    </template>
  </ErrorPage>
</template>
