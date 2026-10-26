import { cn } from '@shared/presentation/utils/cn'

export type AlertVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info'

const base =
  "group/alert relative grid w-full gap-0.5 rounded-xl border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4"

const variants: Record<AlertVariant, string> = {
  default:
    'bg-white text-gray-700 border-gray-200 dark:border-gray-800 dark:bg-[#1E2634] dark:text-gray-300',
  success:
    'bg-success-50 border-success-500 *:[svg]:text-success-500 dark:bg-success-500/10 dark:border-success-500/30 dark:*:[svg]:text-success-400',
  warning:
    'bg-warning-50 border-warning-500 *:[svg]:text-warning-500 dark:bg-warning-500/10 dark:border-warning-500/30 dark:*:[svg]:text-warning-400',
  destructive:
    'bg-error-50 border-error-500 *:[svg]:text-error-500 dark:bg-error-500/10 dark:border-error-500/30 dark:*:[svg]:text-error-400',
  info: 'bg-sky-50 border-sky-500 *:[svg]:text-sky-500 dark:bg-sky-500/10 dark:border-sky-500/30 dark:*:[svg]:text-sky-400',
}

export function alertVariants({
  variant = 'default',
  class: className,
}: { variant?: AlertVariant; class?: string } = {}) {
  return cn(base, variants[variant], className)
}
