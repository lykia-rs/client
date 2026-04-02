import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultPanel from '@/components/results/ResultPanel.vue'
import TableView from '@/components/results/TableView.vue'
import ListView from '@/components/results/ListView.vue'
import type { QueryResult, QueryResultRow, ResultViewMode } from '@/composables/useQueryTabs'

const mountView = (data: QueryResult | QueryResultRow, isLocked = false, viewMode: ResultViewMode = 'list', showOverlay = false) =>
  mount(ResultPanel, { props: { data: data as QueryResult, isLocked, viewMode, showOverlay } })

describe('ResultPanel.vue', () => {
  describe('view mode switching', () => {
    it('renders ListView in list mode (default)', () => {
      const wrapper = mountView([{ id: 1, name: 'Alice' }])
      expect(wrapper.findComponent(ListView).exists()).toBe(true)
      expect(wrapper.find('[data-testid="list-view"]').exists()).toBe(true)
      expect(wrapper.findComponent(TableView).exists()).toBe(false)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(false)
    })

    it('renders TableView in table mode', () => {
      const wrapper = mountView([{ id: 1, name: 'Alice' }], false, 'table')
      expect(wrapper.findComponent(TableView).exists()).toBe(true)
      expect(wrapper.find('[data-testid="list-view"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(false)
    })

    it('renders JSON tree in json mode', () => {
      const wrapper = mountView([{ id: 1, name: 'Alice' }], false, 'json')
      expect(wrapper.findComponent(TableView).exists()).toBe(false)
      expect(wrapper.find('[data-testid="list-view"]').exists()).toBe(false)
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

    it('renders TableView for table mode with non-array data', () => {
      const wrapper = mountView({ status: 'ok' }, false, 'table')
      expect(wrapper.findComponent(TableView).exists()).toBe(true)
    })

    it('renders ListView for list mode with non-array data', () => {
      const wrapper = mountView({ status: 'ok' }, false, 'list')
      expect(wrapper.findComponent(ListView).exists()).toBe(true)
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

    it('blocks interaction when isLocked is true without overlay', () => {
      const wrapper = mountView([{ id: 1, name: 'Test' }], true)
      const container = wrapper.find('.relative')
      expect(container.classes()).toContain('pointer-events-none')
      expect(container.classes()).toContain('select-none')
      expect(container.classes()).toContain('cursor-wait')
      // No overlay or dimming without showOverlay
      expect(wrapper.find('.bg-zinc-100\\/50').exists()).toBe(false)
      expect(wrapper.find('.opacity-50').exists()).toBe(false)
    })

    it('renders locked state with overlay when showOverlay is true', () => {
      const wrapper = mountView([{ id: 1, name: 'Test' }], true, 'table', true)
      const overlay = wrapper.find('.bg-zinc-100\\/50')
      expect(overlay.exists()).toBe(true)
      expect(overlay.text()).toContain('Query running...')
      const container = wrapper.find('.relative')
      expect(container.classes()).toContain('pointer-events-none')
      expect(container.classes()).toContain('select-none')
    })

    it('applies opacity only when showOverlay is true', () => {
      expect(
        mountView([{ id: 1 }], true, 'table', true)
          .find('.opacity-50')
          .exists(),
      ).toBe(true)
      expect(
        mountView([{ id: 1 }], true)
          .find('.opacity-50')
          .exists(),
      ).toBe(false)
      expect(
        mountView([{ id: 1 }], false)
          .find('.opacity-50')
          .exists(),
      ).toBe(false)
    })

    it('renders list data correctly when locked', () => {
      const wrapper = mountView(
        [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        true,
      )
      expect(wrapper.findComponent(ListView).exists()).toBe(true)
    })

    it('shows overlay in json viewMode when showOverlay is true', () => {
      const wrapper = mountView([{ id: 1 }], true, 'json', true)
      expect(wrapper.find('.bg-zinc-100\\/50').exists()).toBe(true)
      expect(wrapper.find('[data-testid="json-tree"]').exists()).toBe(true)
    })
  })
})
