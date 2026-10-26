<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@shared/presentation/utils/cn'

defineOptions({ inheritAttrs: false })

type BadgeVariant = 'light' | 'solid' | 'ghost'
type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'gray' | 'light' | 'dark'
type BadgeSize = 'sm' | 'default' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant
    color?: BadgeColor
    size?: BadgeSize
  }>(),
  {
    variant: 'light',
    color: 'primary',
    size: 'default',
  },
)

const attrs = useAttrs()

const base =
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 font-medium whitespace-nowrap transition-colors select-none [&>svg]:pointer-events-none [&>svg]:shrink-0'

const sizes: Record<BadgeSize, string> = {
  sm: 'h-5.5 rounded-lg px-2 py-0.5 text-xs [&:has(>svg:first-child)]:ps-1.5 [&:has(>svg:last-child)]:pe-1.5 [&>svg]:size-3',
  default:
    'h-6 rounded-lg px-2.5 py-0.5 text-sm [&:has(>svg:first-child)]:ps-2 [&:has(>svg:last-child)]:pe-2 [&>svg]:size-3.5',
  lg: 'h-7 rounded-[10px] px-3 py-1 text-sm [&:has(>svg:first-child)]:ps-2.5 [&:has(>svg:last-child)]:pe-2.5 [&>svg]:size-3.5',
}

const light: Record<BadgeColor, string> = {
  primary:
    'bg-brand-50 text-brand-500 [text-shadow:0_4px_4px_var(--color-brand-200)] dark:bg-brand-500/15 dark:text-brand-400 dark:[text-shadow:0_4px_4px_rgba(11,176,190,0.20)]',
  success:
    'bg-success-50 text-success-600 [text-shadow:0_4px_4px_var(--color-success-200)] dark:bg-success-500/15 dark:text-success-500 dark:[text-shadow:0_4px_4px_rgba(45,190,126,0.20)]',
  error:
    'bg-error-50 text-error-600 [text-shadow:0_4px_4px_var(--color-error-200)] dark:bg-error-500/15 dark:text-error-500 dark:[text-shadow:0_4px_4px_rgba(229,83,61,0.20)]',
  warning:
    'bg-warning-50 text-warning-600 [text-shadow:0_4px_4px_rgba(254,223,137,0.60)] dark:bg-warning-500/15 dark:text-orange-400 dark:[text-shadow:0_4px_4px_rgba(244,183,64,0.20)]',
  info: 'bg-sky-50 text-sky-500 [text-shadow:0_4px_4px_var(--color-sky-200)] dark:bg-sky-500/15 dark:text-sky-500 dark:[text-shadow:0_4px_4px_rgba(11,165,236,0.20)]',
  gray: 'bg-gray-100 text-gray-700 [text-shadow:0_4px_4px_var(--color-gray-300)] dark:bg-white/5 dark:text-white/80 dark:[text-shadow:0_4px_4px_rgba(255,255,255,0.10)]',
  light: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
  dark: 'bg-gray-500/15 text-gray-800 dark:bg-white/5 dark:text-white',
}

const solid: Record<BadgeColor, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_4px_8px_0_var(--color-brand-200)] dark:shadow-[0_4px_8px_0_rgba(11,176,190,0.20)]',
  success:
    'bg-success-500 text-white shadow-[0_4px_8px_0_var(--color-success-200)] dark:shadow-[0_4px_8px_0_rgba(45,190,126,0.20)]',
  error:
    'bg-error-500 text-white shadow-[0_4px_8px_0_var(--color-error-200)] dark:shadow-[0_4px_8px_0_rgba(229,83,61,0.20)]',
  warning:
    'bg-warning-500 text-white shadow-[0_4px_8px_0_rgba(254,223,137,0.60)] dark:shadow-[0_4px_8px_0_rgba(244,183,64,0.20)]',
  info: 'bg-sky-500 text-white shadow-[0_4px_8px_0_rgba(184,230,254,1)] dark:shadow-[0_4px_8px_0_rgba(11,165,236,0.20)]',
  gray: 'bg-gray-700 text-white shadow-[0_4px_8px_0_rgba(209,213,220,1)] dark:bg-gray-700 dark:text-white dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)]',
  light: 'bg-gray-400 text-white dark:bg-white/5 dark:text-white/80',
  dark: 'bg-gray-800 text-white dark:bg-gray-700 dark:text-white',
}

const ghostBase =
  'bg-transparent px-0 py-0 [&:has(>svg:first-child)]:ps-0 [&:has(>svg:last-child)]:pe-0'

const ghost: Record<BadgeColor, string> = {
  primary: 'text-brand-500 dark:text-brand-400',
  success: 'text-success-600 dark:text-success-500',
  error: 'text-error-600 dark:text-error-500',
  warning: 'text-warning-600 dark:text-orange-400',
  info: 'text-sky-500',
  gray: 'text-gray-700 dark:text-gray-300',
  light: 'text-gray-700 dark:text-gray-300',
  dark: 'text-gray-800 dark:text-white',
}

const classes = computed(() =>
  cn(
    base,
    sizes[props.size],
    props.variant === 'light'
      ? light[props.color]
      : props.variant === 'solid'
        ? solid[props.color]
        : cn(ghostBase, ghost[props.color]),
    attrs.class as string,
  ),
)
</script>

<template>
  <span
    data-slot="badge"
    :data-variant="variant"
    :data-color="color"
    :data-size="size"
    v-bind="{ ...attrs, class: undefined }"
    :class="classes"
  >
    <slot />
  </span>
</template>
