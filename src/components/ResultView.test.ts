import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultView from '@/components/ResultView.vue'
import ResultTable from '@/components/ResultTable.vue'
import type { QueryResult, ResultViewMode } from '@/composables/useQueryTabs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mountView = (data: QueryResult | Record<string, any>, isLocked = false, viewMode: ResultViewMode = 'table') =>
  mount(ResultView, { props: { data: data as QueryResult, isLocked, viewMode } })

describe('ResultView.vue', () => {
  describe('view mode switching', () => {
    it('renders ResultTable in table mode', () => {
      const wrapper = mountView([{ id: 1, name: 'Alice' }])
      expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(false)
    })

    it('renders JSON tree in json mode', () => {
      const wrapper = mountView([{ id: 1, name: 'Alice' }], false, 'json')
      expect(wrapper.findComponent(ResultTable).exists()).toBe(false)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Document 0')
    })

    it('shows multiple documents in json mode', () => {
      const wrapper = mountView(
        [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
        false,
        'json',
      )
      expect(wrapper.text()).toContain('Document 0')
      expect(wrapper.text()).toContain('Document 1')
    })

    it('renders ResultTable for table mode with non-array data', () => {
      const wrapper = mountView({ status: 'ok' }, false, 'table')
      expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    })

    it('renders JSON tree for non-array data in json mode', () => {
      const wrapper = mountView({ status: 'ok' }, false, 'json')
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(true)
      // Collapsed by default, shows field count
      expect(wrapper.text()).toContain('1 fields')
    })
  })

  describe('lock overlay', () => {
    it('renders without locked state by default', () => {
      const wrapper = mountView([{ id: 1, name: 'Test' }])
      expect(wrapper.find('.bg-zinc-100\\/50').exists()).toBe(false)
      const container = wrapper.find('.relative')
      expect(container.classes()).not.toContain('pointer-events-none')
      expect(container.classes()).not.toContain('select-none')
    })

    it('renders locked state with overlay when isLocked is true', () => {
      const wrapper = mountView([{ id: 1, name: 'Test' }], true)
      const overlay = wrapper.find('.bg-zinc-100\\/50')
      expect(overlay.exists()).toBe(true)
      expect(overlay.text()).toContain('Query running...')
      const container = wrapper.find('.relative')
      expect(container.classes()).toContain('pointer-events-none')
      expect(container.classes()).toContain('select-none')
    })

    it('applies opacity when locked, not when unlocked', () => {
      expect(
        mountView([{ id: 1 }], true)
          .find('.opacity-50')
          .exists(),
      ).toBe(true)
      expect(
        mountView([{ id: 1 }], false)
          .find('.opacity-50')
          .exists(),
      ).toBe(false)
    })

    it('renders table data correctly when locked', () => {
      const wrapper = mountView(
        [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        true,
      )
      expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    })

    it('shows overlay in json viewMode when locked', () => {
      const wrapper = mountView([{ id: 1 }], true, 'json')
      expect(wrapper.find('.bg-zinc-100\\/50').exists()).toBe(true)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(true)
    })
  })
})
