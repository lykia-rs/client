import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

describe('Button.vue', () => {
  it('renders button with default variant', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    })
    
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toBe('Click me')
  })

  it('applies default variant styles', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'default',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-[#4db6ac]')
  })

  it('applies outline variant styles', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'outline',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('border')
    expect(button.classes()).toContain('border-zinc-300')
  })

  it('applies ghost variant styles', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'ghost',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('hover:bg-zinc-100')
  })

  it('applies default size styles', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'default',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('h-9')
    expect(button.classes()).toContain('px-4')
  })

  it('applies sm size styles', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'sm',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('h-7')
    expect(button.classes()).toContain('px-3')
  })

  it('applies lg size styles', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'lg',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('h-10')
    expect(button.classes()).toContain('px-6')
  })

  it('accepts custom class prop', () => {
    const wrapper = mount(Button, {
      props: {
        class: 'custom-class',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('custom-class')
  })

  it('can be disabled', () => {
    const wrapper = mount(Button, {
      attrs: {
        disabled: true,
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('can be clicked', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Button',
      },
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('supports type attribute', () => {
    const wrapper = mount(Button, {
      attrs: {
        type: 'submit',
      },
      slots: {
        default: 'Submit',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('submit')
  })

  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: '<span>Custom Content</span>',
      },
    })
    
    expect(wrapper.html()).toContain('Custom Content')
  })

  it('combines multiple props correctly', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'outline',
        size: 'sm',
        class: 'my-custom-class',
      },
      slots: {
        default: 'Button',
      },
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('border')
    expect(button.classes()).toContain('h-7')
    expect(button.classes()).toContain('my-custom-class')
  })

  it('renders as different element when as prop is provided', () => {
    const wrapper = mount(Button, {
      props: {
        as: 'a',
      },
      slots: {
        default: 'Link Button',
      },
    })
    
    expect(wrapper.find('a').exists()).toBe(true)
  })

  it('renders with icons in slot', () => {
    const wrapper = mount(Button, {
      slots: {
        default: '<svg class="icon"></svg> Button',
      },
    })
    
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Button')
  })
})
