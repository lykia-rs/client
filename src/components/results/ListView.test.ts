import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ListView from '@/components/results/ListView.vue'
import CardField from '@/components/results/CardField.vue'
import type { QueryResultRow } from '@/composables/useQueryTabs'

const mountList = (data: QueryResultRow[] | null) =>
  mount(ListView, { props: { data } })

describe('ListView.vue', () => {
  describe('rendering', () => {
    it('renders nothing for null data', () => {
      const wrapper = mountList(null)
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(0)
    })

    it('renders nothing for empty array', () => {
      const wrapper = mountList([])
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(0)
    })

    it('renders one card per row', () => {
      const wrapper = mountList([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(2)
    })

    it('displays root-level field keys', () => {
      const wrapper = mountList([{ id: 1, name: 'Alice', email: 'alice@test.com' }])
      const text = wrapper.text()
      expect(text).toContain('id')
      expect(text).toContain('name')
      expect(text).toContain('email')
    })

    it('displays primitive values with type formatting', () => {
      const wrapper = mountList([{ count: 42, active: true, label: 'test', empty: null }])
      const text = wrapper.text()
      expect(text).toContain('42')
      expect(text).toContain('true')
      expect(text).toContain('"test"')
      expect(text).toContain('null')
    })
  })

  describe('nested objects', () => {
    it('renders CardField for each field', () => {
      const wrapper = mountList([
        { id: 1, meta: { role: 'admin', level: 5 } },
      ])
      expect(wrapper.findAllComponents(CardField).length).toBeGreaterThanOrEqual(2)
    })

    it('shows Object label for nested objects', () => {
      const wrapper = mountList([
        { id: 1, meta: { role: 'admin', level: 5 } },
      ])
      expect(wrapper.text()).toContain('Object')
    })

    it('shows Array label for nested arrays', () => {
      const wrapper = mountList([
        { id: 1, tags: ['a', 'b', 'c'] },
      ])
      expect(wrapper.text()).toContain('Array (3)')
    })
  })

  describe('pagination', () => {
    it('does not show pagination for small datasets', () => {
      const wrapper = mountList([{ id: 1 }, { id: 2 }])
      expect(wrapper.text()).not.toContain('Previous')
      expect(wrapper.text()).not.toContain('Page')
    })

    it('shows pagination controls for large datasets', () => {
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i }))
      const wrapper = mountList(data)
      expect(wrapper.text()).toContain('Page 1 of 2')
      expect(wrapper.text()).toContain('Showing 1 to 50 of 60 documents')
    })

    it('navigates to next page', async () => {
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i }))
      const wrapper = mountList(data)
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(50)

      const nextBtn = wrapper.findAll('button').find((b) => b.text() === 'Next')!
      await nextBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(10)
      expect(wrapper.text()).toContain('Page 2 of 2')
    })

    it('navigates back to previous page', async () => {
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i }))
      const wrapper = mountList(data)

      const nextBtn = wrapper.findAll('button').find((b) => b.text() === 'Next')!
      await nextBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const prevBtn = wrapper.findAll('button').find((b) => b.text() === 'Previous')!
      await prevBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-testid="list-card"]')).toHaveLength(50)
      expect(wrapper.text()).toContain('Page 1 of 2')
    })

    it('disables Previous on first page', () => {
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i }))
      const wrapper = mountList(data)
      const prevBtn = wrapper.findAll('button').find((b) => b.text() === 'Previous')!
      expect(prevBtn.attributes('disabled')).toBeDefined()
    })

    it('disables Next on last page', async () => {
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i }))
      const wrapper = mountList(data)
      const nextBtn = wrapper.findAll('button').find((b) => b.text() === 'Next')!
      await nextBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(nextBtn.attributes('disabled')).toBeDefined()
    })
  })
})
