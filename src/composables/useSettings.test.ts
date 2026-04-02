import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('should have showLineNumbers true by default', async () => {
    const { useSettings } = await import('./useSettings')
    const { settings } = useSettings()
    expect(settings.showLineNumbers).toBe(true)
  })

  it('should persist settings to localStorage when changed', async () => {
    const { useSettings } = await import('./useSettings')
    const { settings } = useSettings()

    settings.showLineNumbers = false
    await nextTick()
    const stored = JSON.parse(localStorage.getItem('lykiadb-settings') ?? '{}')
    expect(stored.showLineNumbers).toBe(false)
  })

  it('should restore settings from localStorage on init', async () => {
    localStorage.setItem('lykiadb-settings', JSON.stringify({ showLineNumbers: false }))
    const { useSettings } = await import('./useSettings')
    const { settings } = useSettings()
    expect(settings.showLineNumbers).toBe(false)
  })

  it('should use defaults when localStorage has corrupt data', async () => {
    localStorage.setItem('lykiadb-settings', 'not-json')
    const { useSettings } = await import('./useSettings')
    const { settings } = useSettings()
    expect(settings.showLineNumbers).toBe(true)
  })

  it('should merge partial stored settings with defaults', async () => {
    localStorage.setItem('lykiadb-settings', JSON.stringify({}))
    const { useSettings } = await import('./useSettings')
    const { settings } = useSettings()
    expect(settings.showLineNumbers).toBe(true)
  })

  it('should reset state with resetSettingsState', async () => {
    const { useSettings, resetSettingsState } = await import('./useSettings')
    const { settings } = useSettings()
    settings.showLineNumbers = false
    resetSettingsState()
    expect(settings.showLineNumbers).toBe(true)
  })
})
