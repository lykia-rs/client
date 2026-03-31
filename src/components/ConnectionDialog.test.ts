import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnectionDialog from '@/components/ConnectionDialog.vue'
import Button from '@/components/ui/Button.vue'
import { flushPromises } from '@/test/utils'

describe('ConnectionDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) =>
    mount(ConnectionDialog, {
      props: { connectHandler: vi.fn().mockResolvedValue(undefined), ...props },
    })

  it('renders the dialog with title', () => {
    expect(createWrapper().find('h2').text()).toBe('New Connection')
  })

  it('renders host and port input fields with defaults', () => {
    const inputs = createWrapper().findAll('input')
    expect(inputs).toHaveLength(2)
    expect(inputs[0].attributes('placeholder')).toBe('localhost')
    expect(inputs[0].element.value).toBe('localhost')
    expect(inputs[1].attributes('placeholder')).toBe('19191')
    expect(inputs[1].element.value).toBe('19191')
  })

  it('renders Cancel and Connect buttons', () => {
    const buttons = createWrapper().findAllComponents(Button)
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Cancel')
    expect(buttons[1].text()).toBe('Connect')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = createWrapper()
    const closeButton = wrapper
      .findAll('button')
      .find((btn) => !btn.classes().includes('inline-flex'))!
    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close event when Cancel button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.findAllComponents(Button)[0].trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.fixed.inset-0').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close when dialog content is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.bg-white').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('updates input values on user input', async () => {
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newhost')
    await inputs[1].setValue('8080')
    expect(inputs[0].element.value).toBe('newhost')
    expect(inputs[1].element.value).toBe('8080')
  })

  it('calls connectHandler with trimmed values when form is submitted', async () => {
    const connectHandler = vi.fn().mockResolvedValue(undefined)
    const wrapper = createWrapper({ connectHandler })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('  testhost  ')
    await inputs[1].setValue('  9999  ')
    await wrapper.find('form').trigger('submit')
    expect(connectHandler).toHaveBeenCalledWith('testhost', '9999')
  })

  it.each([
    ['empty host', '', '19191'],
    ['empty port', 'localhost', ''],
    ['both whitespace', '   ', '   '],
  ])('does not call connectHandler when %s', async (_, host, port) => {
    const connectHandler = vi.fn()
    const wrapper = createWrapper({ connectHandler })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue(host)
    await inputs[1].setValue(port)
    await wrapper.find('form').trigger('submit')
    expect(connectHandler).not.toHaveBeenCalled()
  })

  it('shows loading state and disables buttons when connecting', async () => {
    const connectHandler = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    const wrapper = createWrapper({ connectHandler })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAllComponents(Button)
    expect(buttons[1].text()).toContain('Connecting...')
    expect(buttons[0].attributes('disabled')).toBeDefined()
    expect(buttons[1].attributes('disabled')).toBeDefined()
    expect(buttons[1].html()).toContain('animate-spin')
  })

  it('displays error message when connection fails', async () => {
    const connectHandler = vi.fn().mockRejectedValue(new Error('Connection failed'))
    const wrapper = createWrapper({ connectHandler })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const errorMessage = wrapper.find('.text-red-700')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toBe('Connection failed')
  })

  it.each([
    ['string error', 'Unknown error', 'Unknown error'],
    ['null error', null, ''],
  ])('displays %s correctly', async (_, error, expectedMatch) => {
    const connectHandler = vi.fn().mockRejectedValue(error)
    const wrapper = createWrapper({ connectHandler })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const errorMessage = wrapper.find('.text-red-700')
    if (expectedMatch) {
      expect(errorMessage.text()).toBe(expectedMatch)
    } else {
      expect(errorMessage.text()).toBeTruthy()
    }
  })

  it('clears error message when retrying', async () => {
    const connectHandler = vi
      .fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(undefined)
    const wrapper = createWrapper({ connectHandler })

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.text-red-700').exists()).toBe(true)

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.text-red-700').exists()).toBe(false)
  })

  it('stops loading when connection succeeds', async () => {
    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAllComponents(Button)
    expect(buttons[1].text()).toMatch(/Connect/)
  })

  it('re-enables buttons after error', async () => {
    const connectHandler = vi.fn().mockRejectedValue(new Error('Failed'))
    const wrapper = createWrapper({ connectHandler })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAllComponents(Button)[1].attributes('disabled')).toBeUndefined()
  })

  it('can submit form by clicking Connect button', async () => {
    const connectHandler = vi.fn().mockResolvedValue(undefined)
    const wrapper = createWrapper({ connectHandler })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(connectHandler).toHaveBeenCalledWith('localhost', '19191')
  })

  it('has proper form accessibility', () => {
    const labels = createWrapper().findAll('label')
    expect(labels).toHaveLength(2)
    expect(labels[0].text()).toBe('Host')
    expect(labels[1].text()).toBe('Port')
  })

  it('has focus styles on inputs', () => {
    createWrapper()
      .findAll('input')
      .forEach((input) => {
        expect(input.classes()).toContain('focus-visible:ring-1')
        expect(input.classes()).toContain('focus-visible:ring-ring')
      })
  })

  it('applies animation classes to dialog', () => {
    const wrapper = createWrapper()

    const backdrop = wrapper.find('.fixed.inset-0')
    expect(backdrop.classes()).toContain('animate-in')
    expect(backdrop.classes()).toContain('fade-in')

    const dialog = wrapper.find('.bg-white')
    expect(dialog.classes()).toContain('animate-in')
    expect(dialog.classes()).toContain('zoom-in-95')
  })
})
