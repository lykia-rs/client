import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JsonTreeView from '@/components/JsonTreeView.vue'
import type { QueryResultValue } from '@/composables/useQueryTabs'

const mountTree = (data: QueryResultValue, props: Record<string, QueryResultValue | boolean> = {}) =>
  mount(JsonTreeView, { props: { data, ...props } })

describe('JsonTreeView.vue', () => {
  describe('primitive values', () => {
    it('renders string with quotes and green color', () => {
      const wrapper = mountTree('hello', { label: 'name' })
      expect(wrapper.text()).toContain('"hello"')
      expect(wrapper.find('.text-green-600').exists()).toBe(true)
    })

    it('renders number with blue color', () => {
      const wrapper = mountTree(42, { label: 'count' })
      expect(wrapper.text()).toContain('42')
      expect(wrapper.find('.text-blue-600').exists()).toBe(true)
    })

    it('renders boolean with purple color', () => {
      const wrapper = mountTree(true, { label: 'active' })
      expect(wrapper.text()).toContain('true')
      expect(wrapper.find('.text-purple-600').exists()).toBe(true)
    })

    it('renders null with italic style', () => {
      const wrapper = mountTree(null, { label: 'value' })
      expect(wrapper.text()).toContain('null')
      expect(wrapper.find('.italic').exists()).toBe(true)
    })

    it('renders undefined with italic style', () => {
      const wrapper = mountTree(undefined, { label: 'value' })
      expect(wrapper.text()).toContain('undefined')
      expect(wrapper.find('.italic').exists()).toBe(true)
    })

    it('renders label before value', () => {
      const wrapper = mountTree('test', { label: 'key' })
      expect(wrapper.text()).toContain('key:')
    })

    it('renders without label when not provided', () => {
      const wrapper = mountTree('test')
      const labelSpans = wrapper.findAll('.text-zinc-500')
      expect(labelSpans.length).toBe(0)
    })
  })

  describe('objects', () => {
    it('renders expandable object with field count when collapsed', async () => {
      const wrapper = mountTree({ a: 1, b: 2 }, { label: 'obj' })
      // Click to collapse (defaultExpanded is false)
      expect(wrapper.text()).toContain('2 fields')
      expect(wrapper.text()).toContain('{')
      expect(wrapper.text()).toContain('}')
    })

    it('expands object on click to show children', async () => {
      const wrapper = mountTree({ name: 'Alice', age: 30 })
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('name:')
      expect(wrapper.text()).toContain('"Alice"')
      expect(wrapper.text()).toContain('age:')
      expect(wrapper.text()).toContain('30')
    })

    it('renders expanded by default when defaultExpanded is true', () => {
      const wrapper = mountTree({ x: 1 }, { defaultExpanded: true })
      expect(wrapper.text()).toContain('x:')
      expect(wrapper.text()).toContain('1')
    })

    it('collapses on second click', async () => {
      const wrapper = mountTree({ x: 1 }, { defaultExpanded: true })
      expect(wrapper.text()).toContain('x:')
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('1 fields')
    })

    it('shows closing bracket when expanded', () => {
      const wrapper = mountTree({ a: 1 }, { defaultExpanded: true })
      const closingBracket = wrapper.findAll('.text-zinc-400')
      expect(closingBracket.some((el) => el.text() === '}')).toBe(true)
    })
  })

  describe('arrays', () => {
    it('renders array with item count when collapsed', () => {
      const wrapper = mountTree([1, 2, 3])
      expect(wrapper.text()).toContain('3 items')
      expect(wrapper.text()).toContain('[')
    })

    it('expands array to show indexed children', async () => {
      const wrapper = mountTree(['a', 'b'], { defaultExpanded: true })
      expect(wrapper.text()).toContain('0:')
      expect(wrapper.text()).toContain('"a"')
      expect(wrapper.text()).toContain('1:')
      expect(wrapper.text()).toContain('"b"')
    })

    it('uses square brackets for arrays', () => {
      const wrapper = mountTree([1], { defaultExpanded: true })
      const brackets = wrapper.findAll('.text-zinc-400')
      expect(brackets.some((el) => el.text().includes('['))).toBe(true)
      expect(brackets.some((el) => el.text() === ']')).toBe(true)
    })
  })

  describe('nested structures', () => {
    it('renders nested objects recursively', async () => {
      const data = { user: { name: 'Alice', address: { city: 'NYC' } } }
      const wrapper = mountTree(data, { defaultExpanded: true })
      expect(wrapper.text()).toContain('user:')
      // Nested object shows as collapsed by default
      expect(wrapper.text()).toContain('2 fields')
    })

    it('deeply nested expand/collapse works', async () => {
      const data = { level1: { level2: { value: 42 } } }
      const wrapper = mountTree(data, { defaultExpanded: true })
      // Expand level1
      const buttons = wrapper.findAll('button')
      await buttons[1].trigger('click')
      expect(wrapper.text()).toContain('level2:')
      // Expand level2
      const newButtons = wrapper.findAll('button')
      await newButtons[2].trigger('click')
      expect(wrapper.text()).toContain('value:')
      expect(wrapper.text()).toContain('42')
    })

    it('renders array of objects', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const wrapper = mountTree(data, { defaultExpanded: true })
      expect(wrapper.text()).toContain('0:')
      expect(wrapper.text()).toContain('1:')
    })

    it('renders mixed types in array', () => {
      const data = ['string', 42, true, null, { key: 'val' }]
      const wrapper = mountTree(data, { defaultExpanded: true })
      expect(wrapper.text()).toContain('"string"')
      expect(wrapper.text()).toContain('42')
      expect(wrapper.text()).toContain('true')
      expect(wrapper.text()).toContain('null')
      expect(wrapper.text()).toContain('1 fields')
    })
  })

  describe('root mode', () => {
    it('renders root array as numbered documents', () => {
      const data = [{ name: 'Alice' }, { name: 'Bob' }]
      const wrapper = mountTree(data, { root: true })
      expect(wrapper.text()).toContain('Document 0')
      expect(wrapper.text()).toContain('Document 1')
    })

    it('documents are collapsed by default', () => {
      const data = [{ name: 'Alice' }]
      const wrapper = mountTree(data, { root: true })
      // Documents should be collapsed — should not show field values
      expect(wrapper.text()).not.toContain('"Alice"')
      expect(wrapper.text()).toContain('Document 0')
    })

    it('renders root non-array as single expandable node', () => {
      const data = { status: 'ok', count: 5 }
      const wrapper = mountTree(data, { root: true, defaultExpanded: true })
      expect(wrapper.text()).toContain('status:')
      expect(wrapper.text()).toContain('"ok"')
    })

    it('root non-array is collapsed by default', () => {
      const data = { status: 'ok', count: 5 }
      const wrapper = mountTree(data, { root: true })
      expect(wrapper.text()).not.toContain('"ok"')
      expect(wrapper.text()).toContain('2 fields')
    })

    it('renders root primitive value', () => {
      const wrapper = mountTree('plain string', { root: true })
      expect(wrapper.text()).toContain('"plain string"')
    })

    it('renders empty root array', () => {
      const wrapper = mountTree([], { root: true })
      // Should render empty documents container
      expect(wrapper.find('.flex.flex-col').exists()).toBe(true)
    })

    it('documents have border separators', () => {
      const data = [{ a: 1 }, { b: 2 }]
      const wrapper = mountTree(data, { root: true })
      expect(wrapper.findAll('.border-b').length).toBeGreaterThanOrEqual(2)
    })

    it('shows expand all button in root mode', () => {
      const wrapper = mountTree([{ id: 1 }], { root: true })
      const btn = wrapper.find('[data-testid="expand-collapse-all"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('Expand all')
    })

    it('shows expand all button for root non-array', () => {
      const wrapper = mountTree({ id: 1 }, { root: true })
      expect(wrapper.find('[data-testid="expand-collapse-all"]').exists()).toBe(true)
    })

    it('does not show expand all button when not root', () => {
      const wrapper = mountTree({ id: 1 })
      expect(wrapper.find('[data-testid="expand-collapse-all"]').exists()).toBe(false)
    })

    it('toggles to collapse all after clicking expand all', async () => {
      const wrapper = mountTree([{ id: 1 }], { root: true })
      const btn = wrapper.find('[data-testid="expand-collapse-all"]')
      expect(btn.text()).toContain('Expand all')
      await btn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="expand-collapse-all"]').text()).toContain('Collapse all')
    })

    it('toggles back to expand all after clicking collapse all', async () => {
      const wrapper = mountTree([{ id: 1 }], { root: true })
      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="expand-collapse-all"]').text()).toContain('Expand all')
    })

    it('expands all documents when expand all is clicked', async () => {
      const wrapper = mountTree([{ id: 1, name: 'Alice' }], { root: true })
      expect(wrapper.text()).not.toContain('"Alice"')

      await wrapper.find('[data-testid="expand-collapse-all"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('name:')
      expect(wrapper.text()).toContain('"Alice"')
    })
  })

  describe('empty structures', () => {
    it('renders empty object with 0 fields', () => {
      const wrapper = mountTree({})
      expect(wrapper.text()).toContain('0 fields')
    })

    it('renders empty array with 0 items', () => {
      const wrapper = mountTree([])
      expect(wrapper.text()).toContain('0 items')
    })
  })

  describe('styling', () => {
    it('uses monospace font', () => {
      const wrapper = mountTree({ key: 'val' })
      expect(wrapper.find('.font-mono').exists()).toBe(true)
    })

    it('has hover effect on expandable rows', () => {
      const wrapper = mountTree({ key: 'val' })
      expect(wrapper.find('button').classes()).toContain('hover:bg-zinc-100')
    })

    it('shows indentation border for nested content', () => {
      const wrapper = mountTree({ key: 'val' }, { defaultExpanded: true })
      expect(wrapper.find('.border-l').exists()).toBe(true)
    })

    it('has chevron icon for expandable nodes', () => {
      const wrapper = mountTree({ key: 'val' })
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })
})
