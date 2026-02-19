import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock matchMedia before importing useTheme
const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false, // default to light mode for tests
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    mockMatchMedia.mockClear()
    mockMatchMedia.mockReturnValue({ matches: false })
    
    // Reset the module to reinitialize
    vi.resetModules()
  })

  it('should initialize theme based on system preference', async () => {
    mockMatchMedia.mockReturnValue({ matches: false })
    const { useTheme } = await import('./useTheme')
    const { theme } = useTheme()
    expect(theme.value).toBe('light')
  })

  it('should toggle between light and dark themes', async () => {
    const { useTheme } = await import('./useTheme')
    const { theme, toggleTheme } = useTheme()
    const currentTheme = theme.value
    
    toggleTheme()
    expect(theme.value).toBe(currentTheme === 'dark' ? 'light' : 'dark')
    
    toggleTheme()
    expect(theme.value).toBe(currentTheme)
  })

  it('should set theme and update document class', async () => {
    const { useTheme } = await import('./useTheme')
    const { setTheme } = useTheme()
    
    setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    
    setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should persist theme to localStorage', async () => {
    const { useTheme } = await import('./useTheme')
    const { setTheme } = useTheme()
    
    setTheme('light')
    expect(localStorage.getItem('lykiadb-theme')).toBe('light')
    
    setTheme('dark')
    expect(localStorage.getItem('lykiadb-theme')).toBe('dark')
  })

  it('should restore theme from localStorage on init', async () => {
    localStorage.setItem('lykiadb-theme', 'light')
    
    const { useTheme } = await import('./useTheme')
    const { theme } = useTheme()
    
    expect(theme.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should use system preference when no stored theme', async () => {
    mockMatchMedia.mockReturnValue({ matches: true })
    
    const { useTheme } = await import('./useTheme')
    const { theme } = useTheme()
    
    expect(theme.value).toBe('dark')
  })
})
