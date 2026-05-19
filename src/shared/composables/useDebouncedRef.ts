import { ref, watch, type Ref } from 'vue'

/** Mirrors `source` into a ref updated after `delayMs` without updates while typing. */
export function useDebouncedRef(source: Ref<string>, delayMs = 300): Ref<string> {
  const debounced = ref(source.value)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(
    source,
    (value) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        debounced.value = value
      }, delayMs)
    },
    { immediate: true },
  )

  return debounced
}
