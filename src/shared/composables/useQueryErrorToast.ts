import { watch, unref, type Ref } from 'vue'
import { markapAlert } from './useMarkapAlert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

export type QueryErrorToastOptions = {
  /**
   * When false, no toast is shown when the query errors (use inline UI instead).
   * Useful when several queries run in parallel on the same screen.
   */
  enabled?: Ref<boolean> | boolean
  /**
   * If set, only one toast per group is shown within `burstMs` (parallel report hooks share one alert).
   */
  burstGroup?: string
  /** Window in ms for burst deduplication. Default 2200. */
  burstMs?: number
}

const burstUntilByGroup = new Map<string, number>()
let lastToastSignature: string | undefined

/**
 * Shows one error toast when a TanStack query `error` ref becomes set.
 * Avoids duplicate toasts when the same error is re-watched with the same message.
 */
export function useQueryErrorToast(
  error: Ref<unknown>,
  title: string,
  options?: QueryErrorToastOptions,
) {
  watch(
    () => ({
      err: error.value,
      on: options?.enabled === undefined ? true : unref(options.enabled),
    }),
    ({ err, on }) => {
      if (!err || !on) {
        lastToastSignature = undefined
        return
      }
      const msg = getApiErrorMessage(err)
      const sig = `${title}|${msg}`
      if (sig === lastToastSignature) return

      const group = options?.burstGroup
      if (group) {
        const until = burstUntilByGroup.get(group) ?? 0
        if (Date.now() < until) return
        burstUntilByGroup.set(group, Date.now() + (options.burstMs ?? 2200))
      }

      lastToastSignature = sig
      void markapAlert.toast.error(title, msg)
    },
    { flush: 'post' },
  )
}
