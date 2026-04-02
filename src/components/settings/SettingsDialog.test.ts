import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import { resetSettingsState, useSettings } from '@/composables/useSettings'

describe('SettingsDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSettingsState()
  })

  function createWrapper() {
    return mount(SettingsDialog)
  }

  it('renders the dialog with Settings title', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('renders Editor section header', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h3').text()).toBe('Editor')
  })

  it('renders show line numbers toggle', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Show line numbers')
    const toggle = wrapper.find('[role="switch"]')
    expect(toggle.exists()).toBe(true)
  })

  it('toggle is checked by default (showLineNumbers is true)', () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('[role="switch"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
  })

  it('clicking toggle turns off line numbers', async () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('[role="switch"]')
    await toggle.trigger('click')

    const { settings } = useSettings()
    expect(settings.showLineNumbers).toBe(false)
    expect(toggle.attributes('aria-checked')).toBe('false')
  })

  it('emits close when X button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('button[title="Close"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = createWrapper()
    const backdrop = wrapper.find('.fixed')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
