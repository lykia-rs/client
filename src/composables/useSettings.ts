import { reactive, watch } from 'vue'

export interface Settings {
  showLineNumbers: boolean
}

const SETTINGS_KEY = 'lykiadb-settings'

const defaults: Settings = {
  showLineNumbers: true,
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') return { ...defaults }
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Settings>
      return { ...defaults, ...parsed }
    }
  } catch {
    // ignore corrupt data
  }
  return { ...defaults }
}

const settings = reactive<Settings>(loadSettings())

if (typeof window !== 'undefined') {
  watch(settings, (val) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(val))
  })
}

export function useSettings() {
  return { settings }
}

export function resetSettingsState() {
  Object.assign(settings, { ...defaults })
}
