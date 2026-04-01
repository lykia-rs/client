import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

const mountBtn = (props = {}, slots = { default: 'Button' }) => mount(Button, { props, slots })

describe('Button.vue', () => {
  it('renders button with default variant', () => {
    const wrapper = mountBtn({}, { default: 'Click me' })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toBe('Click me')
  })

  it.each([
    ['default', 'bg-[#4db6ac]'],
    ['outline', 'border'],
    ['ghost', 'hover:bg-zinc-100'],
  ])('applies %s variant styles', (variant, expectedClass) => {
    const wrapper = mountBtn({ variant })
    expect(wrapper.find('button').classes()).toContain(expectedClass)
  })

  it.each([
    ['default', ['h-9', 'px-4']],
    ['sm', ['h-7', 'px-3']],
    ['lg', ['h-10', 'px-6']],
  ] as const)('applies %s size styles', (size, expectedClasses) => {
    const classes = mountBtn({ size }).find('button').classes()
    expectedClasses.forEach((c) => expect(classes).toContain(c))
  })

  it('accepts custom class prop', () => {
    expect(mountBtn({ class: 'custom-class' }).find('button').classes()).toContain('custom-class')
  })

  it('can be disabled', () => {
    const wrapper = mount(Button, { attrs: { disabled: true }, slots: { default: 'Button' } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('can be clicked', async () => {
    const wrapper = mountBtn()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('supports type attribute', () => {
    const wrapper = mount(Button, { attrs: { type: 'submit' }, slots: { default: 'Submit' } })
    expect(wrapper.find('button').attributes('type')).toBe('submit')
  })

  it('renders slot content', () => {
    expect(mountBtn({}, { default: '<span>Custom Content</span>' }).html()).toContain(
      'Custom Content',
    )
  })

  it('combines multiple props correctly', () => {
    const classes = mountBtn({ variant: 'outline', size: 'sm', class: 'my-custom-class' })
      .find('button')
      .classes()
    expect(classes).toContain('border')
    expect(classes).toContain('h-7')
    expect(classes).toContain('my-custom-class')
  })

  it('renders as different element when as prop is provided', () => {
    expect(mountBtn({ as: 'a' }, { default: 'Link Button' }).find('a').exists()).toBe(true)
  })

  it('renders with icons in slot', () => {
    const wrapper = mountBtn({}, { default: '<svg class="icon"></svg> Button' })
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Button')
  })
})
