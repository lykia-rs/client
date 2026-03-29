import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const mockToggleTheme = vi.fn()
const mockTheme = ref<'light' | 'dark'>('dark')

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  }),
}))

// Must import after mock is set up
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

describe('ThemeToggle.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme.value = 'dark'
  })

  it('renders a button', () => {
    const wrapper = mount(ThemeToggle)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('calls toggleTheme when clicked', async () => {
    const wrapper = mount(ThemeToggle)
    await wrapper.find('button').trigger('click')
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })

  it('shows title for switching to light mode when dark', () => {
    mockTheme.value = 'dark'
    const wrapper = mount(ThemeToggle)
    expect(wrapper.find('button').attributes('title')).toBe('Switch to light mode')
  })

  it('shows title for switching to dark mode when light', () => {
    mockTheme.value = 'light'
    const wrapper = mount(ThemeToggle)
    expect(wrapper.find('button').attributes('title')).toBe('Switch to dark mode')
  })
})
