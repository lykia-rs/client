import { ref } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'lykiadb-theme'

const theme = ref<Theme>('dark')

function applyTheme(newTheme: Theme) {
  theme.value = newTheme
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return {
    theme,
    toggleTheme,
  }
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored) {
    applyTheme(stored)
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }
}

