import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '@/components/ui/Card.vue'

describe('Card.vue', () => {
  it('renders card component', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Card content',
      },
    })
    
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.text()).toBe('Card content')
  })

  it('applies default card styles', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Content',
      },
    })
    
    const card = wrapper.find('div')
    expect(card.classes()).toContain('rounded-lg')
    expect(card.classes()).toContain('border')
    expect(card.classes()).toContain('border-zinc-300')
    expect(card.classes()).toContain('bg-white')
  })

  it('accepts custom class prop', () => {
    const wrapper = mount(Card, {
      props: {
        class: 'custom-card-class',
      },
      slots: {
        default: 'Content',
      },
    })
    
    const card = wrapper.find('div')
    expect(card.classes()).toContain('custom-card-class')
  })

  it('renders slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>Custom paragraph</p>',
      },
    })
    
    expect(wrapper.html()).toContain('Custom paragraph')
  })

  it('renders as different element when as prop is provided', () => {
    const wrapper = mount(Card, {
      props: {
        as: 'section',
      },
      slots: {
        default: 'Section content',
      },
    })
    
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('renders complex nested content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: `
          <div class="header">Header</div>
          <div class="body">Body content</div>
          <div class="footer">Footer</div>
        `,
      },
    })
    
    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.body').exists()).toBe(true)
    expect(wrapper.find('.footer').exists()).toBe(true)
  })

  it('combines default and custom classes correctly', () => {
    const wrapper = mount(Card, {
      props: {
        class: 'p-4 shadow-xl',
      },
      slots: {
        default: 'Content',
      },
    })
    
    const card = wrapper.find('div')
    expect(card.classes()).toContain('rounded-lg')
    expect(card.classes()).toContain('border-zinc-300')
    expect(card.classes()).toContain('p-4')
    expect(card.classes()).toContain('shadow-xl')
  })

  it('maintains base styles when extending with custom classes', () => {
    const wrapper = mount(Card, {
      props: {
        class: 'hover:shadow-lg transition-shadow',
      },
      slots: {
        default: 'Hoverable card',
      },
    })
    
    const card = wrapper.find('div')
    // Base styles should still be present
    expect(card.classes()).toContain('rounded-lg')
    expect(card.classes()).toContain('border')
    // Custom classes should be added
    expect(card.classes()).toContain('hover:shadow-lg')
  })

  it('renders empty card when no content provided', () => {
    const wrapper = mount(Card)
    
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  it('supports asChild prop with custom component', () => {
    const wrapper = mount(Card, {
      props: {
        asChild: true,
      },
      slots: {
        default: '<button>Card as button</button>',
      },
    })
    
    expect(wrapper.html()).toContain('button')
  })

  it('can be used for layout composition', () => {
    const wrapper = mount(Card, {
      slots: {
        default: `
          <div class="card-header">
            <h2>Title</h2>
          </div>
          <div class="card-content">
            <p>Some content here</p>
          </div>
        `,
      },
    })
    
    expect(wrapper.find('.card-header').exists()).toBe(true)
    expect(wrapper.find('.card-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Some content here')
  })

  it('defaults to div element', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Content',
      },
    })
    
    expect(wrapper.element.tagName).toBe('DIV')
  })
})
