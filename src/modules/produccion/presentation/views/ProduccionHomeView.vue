<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth'
import AppIcon from '@shared/components/ui/AppIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

const kpis = [
  { label: 'Órdenes activas', value: '34', delta: '+4', icon: 'lucide:clipboard-list' as const },
  { label: 'En planta', value: '12', delta: '+2', icon: 'lucide:hammer' as const },
  { label: 'Stock alerta', value: '5', icon: 'lucide:warehouse' as const },
  { label: 'OC pendientes', value: '7', delta: '+1', icon: 'lucide:truck' as const },
]

const actividad = [
  { title: 'Orden en ensamble', detail: 'OT-2024-118 — Juego comedor roble', time: 'Hace 1 h', tone: 'primary' as const },
  { title: 'Corte finalizado', detail: 'OT-2024-115 — Vestidores proyecto Norte', time: 'Hace 3 h', tone: 'success' as const },
  { title: 'Ingreso de insumos', detail: 'Madera terciada — Proveedor Maderas del Sur', time: 'Hace 1 día', tone: 'muted' as const },
  { title: 'Acabados en revisión', detail: 'OT-2024-112 — Laca mate', time: 'Hace 1 día', tone: 'muted' as const },
]

const acciones = [
  { label: 'Nuevo cliente', sub: 'Registrar', to: '/produccion/clientes/nuevo', icon: 'lucide:user-plus' as const },
  { label: 'Nueva orden', sub: 'Crear OT', to: '/produccion/ordenes-trabajo', icon: 'lucide:plus-circle' as const },
  { label: 'Nuevo mueble', sub: 'Catálogo', to: '/produccion/catalogo/nuevo', icon: 'lucide:boxes' as const },
  { label: 'Producción en proceso', sub: 'Seguimiento', to: '/produccion/produccion/en-proceso', icon: 'lucide:kanban' as const },
]

const toneBorder = (tone: (typeof actividad)[number]['tone']) => {
  if (tone === 'success') return 'var(--color-success, #16a34a)'
  if (tone === 'primary') return 'var(--color-primary)'
  return 'var(--color-border)'
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          Producción de muebles
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
          Control de órdenes, inventario y planta
        </p>
        <p class="text-sm mt-3 font-medium" style="color: var(--color-text-primary)">
          {{ greeting }}, {{ firstName }}
        </p>
      </div>
      <p class="text-sm shrink-0" style="color: var(--color-text-muted)">
        {{
          new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="rounded-xl border p-4 transition-shadow hover:shadow-md"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-medium line-clamp-2" style="color: var(--color-text-muted)">
            {{ k.label }}
          </span>
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style="background-color: var(--color-primary-light); color: var(--color-primary)"
          >
            <AppIcon :icon="k.icon" :size="18" />
          </div>
        </div>
        <p class="text-2xl font-bold tabular-nums" style="color: var(--color-text-primary)">
          {{ k.value }}
        </p>
        <p
          v-if="k.delta"
          class="text-xs mt-1 font-medium"
          style="color: var(--color-success, #16a34a)"
        >
          {{ k.delta }}
        </p>
        <p v-else class="text-xs mt-1" style="color: var(--color-text-muted)">—</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div
        class="rounded-xl border p-5 lg:p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
          Actividad reciente
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          Últimos movimientos en planta
        </p>
        <ul class="space-y-3">
          <li
            v-for="a in actividad"
            :key="a.title + a.time"
            class="flex gap-3 rounded-lg border p-3"
            :style="{
              borderColor: 'var(--color-border)',
              borderLeftWidth: '3px',
              borderLeftColor: toneBorder(a.tone),
            }"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium" style="color: var(--color-text-primary)">
                {{ a.title }}
              </p>
              <p class="text-xs mt-0.5 truncate" style="color: var(--color-text-secondary)">
                {{ a.detail }}
              </p>
            </div>
            <span class="text-[11px] shrink-0 self-start" style="color: var(--color-text-muted)">
              {{ a.time }}
            </span>
          </li>
        </ul>
      </div>

      <div
        class="rounded-xl border p-5 lg:p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
          Acciones rápidas
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          Tareas frecuentes
        </p>
        <div class="grid sm:grid-cols-2 gap-3">
          <button
            v-for="ac in acciones"
            :key="ac.to"
            type="button"
            class="flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover-surface"
            :style="{ borderColor: 'var(--color-border)' }"
            @click="router.push(ac.to)"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style="background-color: var(--color-primary-light); color: var(--color-primary)"
            >
              <AppIcon :icon="ac.icon" :size="20" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold" style="color: var(--color-text-primary)">
                {{ ac.label }}
              </p>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">
                {{ ac.sub }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <p class="text-center text-xs" style="color: var(--color-text-muted)">
      Datos de demostración; conectar módulos reales cuando estén listos.
    </p>
  </div>
</template>
