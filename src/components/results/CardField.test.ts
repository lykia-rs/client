import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardField from '@/components/results/CardField.vue'
import type { QueryResultValue } from '@/composables/useQueryTabs'

const mountField = (fieldKey: string, value: QueryResultValue) =>
  mount(CardField, { props: { fieldKey, value } })

describe('CardField.vue', () => {
  describe('primitive values', () => {
    it('renders string value with quotes', () => {
      const wrapper = mountField('name', 'Alice')
      expect(wrapper.text()).toContain('name')
      expect(wrapper.text()).toContain('"Alice"')
    })

    it('renders number value', () => {
      const wrapper = mountField('count', 42)
      expect(wrapper.text()).toContain('count')
      expect(wrapper.text()).toContain('42')
    })

    it('renders boolean value', () => {
      const wrapper = mountField('active', true)
      expect(wrapper.text()).toContain('active')
      expect(wrapper.text()).toContain('true')
    })

    it('renders null value', () => {
      const wrapper = mountField('empty', null)
      expect(wrapper.text()).toContain('empty')
      expect(wrapper.text()).toContain('null')
    })

    it('renders undefined value', () => {
      const wrapper = mountField('missing', undefined)
      expect(wrapper.text()).toContain('missing')
      expect(wrapper.text()).toContain('undefined')
    })

    it('does not show toggle button for primitives', () => {
      const wrapper = mountField('name', 'Alice')
      expect(wrapper.find('[data-testid="card-field-toggle"]').exists()).toBe(false)
    })
  })

  describe('expandable objects', () => {
    it('renders Object label for object values', () => {
      const wrapper = mountField('address', { street: '123 Main', city: 'NYC' })
      expect(wrapper.text()).toContain('address')
      expect(wrapper.text()).toContain('Object')
    })

    it('renders Array label with count for array values', () => {
      const wrapper = mountField('tags', ['a', 'b', 'c'])
      expect(wrapper.text()).toContain('tags')
      expect(wrapper.text()).toContain('Array (3)')
    })

    it('shows toggle button for expandable values', () => {
      const wrapper = mountField('meta', { key: 'val' })
      expect(wrapper.find('[data-testid="card-field-toggle"]').exists()).toBe(true)
    })

    it('does not show children when collapsed', () => {
      const wrapper = mountField('meta', { key: 'val' })
      expect(wrapper.text()).not.toContain('"val"')
    })

    it('shows children when expanded', async () => {
      const wrapper = mountField('meta', { key: 'val' })
      await wrapper.find('[data-testid="card-field-toggle"]').trigger('click')
      expect(wrapper.text()).toContain('key')
      expect(wrapper.text()).toContain('"val"')
    })

    it('collapses children on second click', async () => {
      const wrapper = mountField('meta', { key: 'val' })
      const toggle = wrapper.find('[data-testid="card-field-toggle"]')
      await toggle.trigger('click')
      expect(wrapper.text()).toContain('"val"')

      await toggle.trigger('click')
      expect(wrapper.text()).not.toContain('"val"')
    })
  })

  describe('nested expandable values', () => {
    it('renders nested object fields when expanded', async () => {
      const wrapper = mountField('user', {
        name: 'Alice',
        address: { city: 'NYC', zip: '10001' },
      })
      await wrapper.find('[data-testid="card-field-toggle"]').trigger('click')
      expect(wrapper.text()).toContain('"Alice"')
      expect(wrapper.text()).toContain('address')
      expect(wrapper.text()).toContain('Object')
    })

    it('renders deeply nested values when all levels expanded', async () => {
      const wrapper = mountField('root', {
        child: { grandchild: 'deep' },
      })
      // Expand root
      await wrapper.find('[data-testid="card-field-toggle"]').trigger('click')
      // Expand child
      const toggles = wrapper.findAll('[data-testid="card-field-toggle"]')
      await toggles[1].trigger('click')
      expect(wrapper.text()).toContain('"deep"')
    })

    it('renders array items with numeric keys when expanded', async () => {
      const wrapper = mountField('items', ['first', 'second', 'third'])
      await wrapper.find('[data-testid="card-field-toggle"]').trigger('click')
      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('"first"')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('"second"')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('"third"')
    })
  })
})
