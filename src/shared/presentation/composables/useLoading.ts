import { ref, type Ref } from 'vue'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'
/**
 * useLoading Composable
 * Manages loading states for async operations
 */

interface UseLoadingReturn {
  isLoading: Ref<boolean>
  error: Ref<string | null>
  execute: <T>(fn: () => Promise<T>) => Promise<T | null>
  reset: () => void
}

export function useLoading(): UseLoadingReturn {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const execute = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await fn()
      return result
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    isLoading.value = false
    error.value = null
  }

  return {
    isLoading,
    error,
    execute,
    reset,
  }
}
