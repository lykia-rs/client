import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JsonView from '@/components/results/JsonView.vue'
import CardField from '@/components/results/CardField.vue'
import type { QueryResultValue } from '@/composables/useQueryTabs'

const mountTree = (data: QueryResultValue) =>
  mount(JsonView, { props: { data } })

describe('JsonView.vue', () => {
  describe('document previews', () => {
    it('shows preview with first key-value pair for collapsed object', () => {
      const wrapper = mountTree([{ name: 'Alice', age: 30 }])
      expect(wrapper.text()).toContain('{ name: "Alice", ... }')
    })

    it('shows single-field preview without ellipsis', () => {
      const wrapper = mountTree([{ status: 'ok' }])
      expect(wrapper.text()).toContain('{ status: "ok" }')
    })

    it('shows preview with nested object placeholder', () => {
      const wrapper = mountTree([{ meta: { key: 'val' }, extra: 1 }])
      expect(wrapper.text()).toContain('{ meta: {...}, ... }')
    })

    it('shows preview for array documents', () => {
      const wrapper = mountTree([[1, 2, 3]])
      expect(wrapper.text()).toContain('[ 1, ... ]')
    })

    it('shows empty object preview', () => {
      const wrapper = mountTree([{}])
      expect(wrapper.text()).toContain('{ }')
    })

    it('shows empty array preview', () => {
      const wrapper = mountTree([[]])
      expect(wrapper.text()).toContain('[ ]')
    })
  })

  describe('expansion', () => {
    it('documents are collapsed by default', () => {
      const wrapper = mountTree([{ name: 'Alice', age: 30 }])
      expect(wrapper.findComponent(CardField).exists()).toBe(false)
      expect(wrapper.text()).toContain('{ name: "Alice", ... }')
    })

    it('expands document on click showing CardField content', async () => {
      const wrapper = mountTree([{ name: 'Alice', age: 30 }])
      await wrapper.find('[data-testid="doc-toggle"]').trigger('click')
      expect(wrapper.findComponent(CardField).exists()).toBe(true)
      expect(wrapper.text()).toContain('name')
      expect(wrapper.text()).toContain('"Alice"')
      expect(wrapper.text()).toContain('age')
      expect(wrapper.text()).toContain('30')
    })

    it('collapses document on second click', async () => {
      const wrapper = mountTree([{ name: 'Alice' }])
      const toggle = wrapper.find('[data-testid="doc-toggle"]')
      await toggle.trigger('click')
      expect(wrapper.findComponent(CardField).exists()).toBe(true)

      await toggle.trigger('click')
      expect(wrapper.findComponent(CardField).exists()).toBe(false)
      expect(wrapper.text()).toContain('{ name: "Alice" }')
    })

    it('multiple documents can be expanded independently', async () => {
      const wrapper = mountTree([{ a: 1 }, { b: 2 }])
      const toggles = wrapper.findAll('[data-testid="doc-toggle"]')
      expect(toggles).toHaveLength(2)

      await toggles[0].trigger('click')
      // First doc expanded showing field, second still collapsed with preview
      expect(wrapper.text()).toContain('a')
      expect(wrapper.text()).toContain('{ b: 2 }')
    })
  })

  describe('root array', () => {
    it('renders one toggle per array item', () => {
      const wrapper = mountTree([{ a: 1 }, { b: 2 }, { c: 3 }])
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(3)
    })

    it('renders primitive items directly without toggle', () => {
      const wrapper = mountTree([42, 'hello', true])
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(0)
      expect(wrapper.text()).toContain('42')
      expect(wrapper.text()).toContain('"hello"')
      expect(wrapper.text()).toContain('true')
    })

    it('renders mix of objects and primitives', () => {
      const wrapper = mountTree([{ name: 'Alice' }, 42])
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(1)
      expect(wrapper.text()).toContain('{ name: "Alice" }')
      expect(wrapper.text()).toContain('42')
    })
  })

  describe('root non-array', () => {
    it('renders single object as expandable document', () => {
      const wrapper = mountTree({ status: 'ok', count: 5 })
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(1)
      expect(wrapper.text()).toContain('{ status: "ok", ... }')
    })

    it('expands single object to show fields', async () => {
      const wrapper = mountTree({ status: 'ok', count: 5 })
      await wrapper.find('[data-testid="doc-toggle"]').trigger('click')
      expect(wrapper.text()).toContain('status')
      expect(wrapper.text()).toContain('"ok"')
      expect(wrapper.text()).toContain('count')
      expect(wrapper.text()).toContain('5')
    })

    it('renders primitive value directly', () => {
      const wrapper = mountTree('plain string')
      expect(wrapper.text()).toContain('"plain string"')
    })
  })

  describe('expand all / collapse all', () => {
    it('shows expand all button', () => {
      const wrapper = mountTree([{ id: 1 }])
      const btn = wrapper.find('[data-testid="expand-collapse-all"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('Expand all')
    })

    it('shows expand all button for non-array data', () => {
      const wrapper = mountTree({ id: 1 })
      expect(wrapper.find('[data-testid="expand-collapse-all"]').exists()).toBe(true)
    })

    it('expands all documents when clicked', async () => {
      const wrapper = mountTree([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
      expect(wrapper.findAllComponents(CardField)).toHaveLength(0)

      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('"Alice"')
      expect(wrapper.text()).toContain('"Bob"')
    })

    it('toggles to collapse all after clicking expand all', async () => {
      const wrapper = mountTree([{ id: 1 }])
      const btn = wrapper.find('[data-testid="expand-collapse-all"]')
      expect(btn.text()).toContain('Expand all')
      await btn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="expand-collapse-all"]').text()).toContain('Collapse all')
    })

    it('collapses all documents when collapse all is clicked', async () => {
      const wrapper = mountTree([{ id: 1, name: 'Alice' }])
      const btn = wrapper.find('[data-testid="expand-collapse-all"]')

      await btn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('"Alice"')

      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAllComponents(CardField)).toHaveLength(0)
    })

    it('toggles back to expand all text after collapsing', async () => {
      const wrapper = mountTree([{ id: 1 }])
      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="expand-collapse-all"]').text()).toContain('Expand all')
    })
  })

  describe('empty/edge cases', () => {
    it('renders empty container for null data', () => {
      const wrapper = mountTree(null)
      expect(wrapper.find('div').exists()).toBe(true)
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(0)
    })

    it('renders empty container for empty array', () => {
      const wrapper = mountTree([])
      expect(wrapper.find('div').exists()).toBe(true)
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(0)
    })

    it('renders empty container for undefined data', () => {
      const wrapper = mountTree(undefined)
      expect(wrapper.findAll('[data-testid="doc-toggle"]')).toHaveLength(0)
    })

    it('has border separators between documents', () => {
      const wrapper = mountTree([{ a: 1 }, { b: 2 }])
      expect(wrapper.findAll('.border-b').length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('styling', () => {
    it('uses monospace font for document rows', () => {
      const wrapper = mountTree([{ key: 'val' }])
      expect(wrapper.find('.font-mono').exists()).toBe(true)
    })

    it('has hover effect on document toggles', () => {
      const wrapper = mountTree([{ key: 'val' }])
      expect(wrapper.find('[data-testid="doc-toggle"]').classes()).toContain('hover:bg-zinc-100')
    })

    it('shows indentation border when expanded', async () => {
      const wrapper = mountTree([{ key: 'val' }])
      await wrapper.find('[data-testid="doc-toggle"]').trigger('click')
      expect(wrapper.find('.border-l').exists()).toBe(true)
    })

    it('has chevron icon on document toggles', () => {
      const wrapper = mountTree([{ key: 'val' }])
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })
})
