import { ref } from 'vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'lykiadb-theme'
const theme = ref<Theme>('dark')

function applyTheme(newTheme: Theme) {
  theme.value = newTheme
  document.documentElement.classList.toggle('dark', newTheme === 'dark')
}

export function useTheme() {
  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }
  return { theme, toggleTheme }
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  applyTheme(
    stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )
}
