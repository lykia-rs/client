import { ref } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'lykiadb-theme'

const theme = ref<Theme>('dark')
let initialized = false

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    
    // Update document class
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Persist to localStorage
    localStorage.setItem(THEME_KEY, newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const initTheme = () => {
    if (initialized) return
    initialized = true
    
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    
    if (stored) {
      setTheme(stored)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    initTheme
  }
}

// Initialize theme immediately on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  if (stored) {
    theme.value = stored
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }
  initialized = true
}

