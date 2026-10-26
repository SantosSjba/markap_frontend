import { computed, ref, watch } from 'vue'
const THEME_KEY = 'markap-theme'
const DARK_CLASS = 'dark'

export type Theme = 'light' | 'dark'

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return null
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add(DARK_CLASS)
  } else {
    html.classList.remove(DARK_CLASS)
  }
}

/**
 * Estado compartido: todos los botones de tema (header, login, configuración)
 * leen y escriben el mismo valor.
 */
const isDark = ref((getStoredTheme() ?? getSystemPreference()) === 'dark')

watch(isDark, (dark) => {
  const theme: Theme = dark ? 'dark' : 'light'
  applyTheme(theme)
  localStorage.setItem(THEME_KEY, theme)
})

/** Apply theme immediately on load (prevents flash of wrong theme) */
export function initTheme() {
  applyTheme(isDark.value ? 'dark' : 'light')
}

/**
 * useTheme Composable
 * Manages dark/light mode with localStorage persistence
 * Respects system preference on first load if no stored preference
 */
export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (theme: Theme) => {
    isDark.value = theme === 'dark'
  }

  return {
    isDark,
    /** Alias con el nombre que usan los componentes de TailAdmin. */
    isDarkMode: computed(() => isDark.value),
    toggleTheme,
    setTheme,
  }
}
