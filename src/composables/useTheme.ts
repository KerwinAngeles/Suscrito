import { readonly, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'suscrito:theme'

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(readInitial())

function apply(next: Theme) {
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
  }
}

apply(theme.value)
watch(theme, apply)

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function set(next: Theme) {
    theme.value = next
  }

  return { theme: readonly(theme), toggle, set }
}
