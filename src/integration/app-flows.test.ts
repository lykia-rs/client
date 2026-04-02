/**
 * Integration tests — mount the full App and exercise multi-component flows
 * using mockIPC to intercept Tauri commands.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import App from '@/App.vue'
import ConnectionPanel from '@/components/connection/ConnectionPanel.vue'
import ConnectionDialog from '@/components/connection/ConnectionDialog.vue'
import QueryPanel from '@/components/query/QueryPanel.vue'
import ResultPanel from '@/components/results/ResultPanel.vue'
import { resetQueryTabsState } from '@/composables/useQueryTabs'
import type { QueryResult } from '@/composables/useQueryTabs'
import type { Connection } from '@/composables/useConnections'
import { resetConnectionsState } from '@/composables/useConnections'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

const QueryEditorStub = {
  name: 'QueryEditor',
  template: `<textarea
    :value="modelValue"
    :disabled="disabled"
    :readonly="readonly"
    @input="$emit('update:modelValue', $event.target.value)"
    class="code-editor-stub"
  />`,
  props: ['modelValue', 'disabled', 'readonly', 'dimmed', 'placeholder'],
  emits: ['update:modelValue', 'parseError', 'parseErrorMessage'],
}

const stubs = {
  Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
  Pane: { template: '<div class="pane"><slot /></div>' },
  QueryEditor: QueryEditorStub,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountApp() {
  return mount(App, { global: { stubs } })
}

/**
 * Configure invoke mock to handle both test_connection and execute_query
 * based on the command name, similar to how the real server would respond.
 */
function mockIPC(overrides: {
  connectionResult?: 'success' | 'fail'
  queryData?: QueryResult
  queryError?: string
  queryDuration?: number
  queryErrorSpan?: { from: number; to: number } | null
} = {}) {
  const {
    connectionResult = 'success',
    queryData = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com' },
    ],
    queryError,
    queryDuration = 42,
    queryErrorSpan = null,
  } = overrides

  vi.mocked(invoke).mockImplementation(async (cmd: string) => {
    if (cmd === 'test_connection') {
      if (connectionResult === 'fail') throw new Error('Connection refused')
      return undefined
    }
    if (cmd === 'execute_query') {
      if (queryError) {
        return { success: false, error: queryError, duration: queryDuration, error_span: queryErrorSpan }
      }
      return { success: true, data: queryData, duration: queryDuration }
    }
    throw new Error(`Unknown command: ${cmd}`)
  })
}

async function openDialog(wrapper: VueWrapper) {
  const cp = wrapper.findComponent(ConnectionPanel)
  await cp.vm.$emit('add')
  await wrapper.vm.$nextTick()
  return wrapper.findComponent(ConnectionDialog)
}

async function addConnection(wrapper: VueWrapper, host: string, port: string) {
  const dialog = await openDialog(wrapper)
  await dialog.props('connectHandler')(host, port)
  await flushPromises()
}

function getConnections(wrapper: VueWrapper): Connection[] {
  return wrapper.findComponent(ConnectionPanel).props('connections')
}

function getQueryPanel(wrapper: VueWrapper) {
  return wrapper.findComponent(QueryPanel)
}

async function typeAndExecute(wrapper: VueWrapper, query: string) {
  const qp = getQueryPanel(wrapper)
  const textarea = qp.find('textarea')
  await textarea.setValue(query)
  await wrapper.vm.$nextTick()
  await qp.find('[data-testid="execute-button"]').trigger('click')
  await flushPromises()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Integration: Connection → Query → Results', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetQueryTabsState()
    resetConnectionsState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Full flow: connect, query, see results', () => {
    it('connects to default server and executes a SELECT query', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      // Default connection is established
      const conns = getConnections(wrapper)
      expect(conns).toHaveLength(1)
      expect(conns[0].connected).toBe(true)

      // Execute a query
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      // Verify invoke was called with execute_query
      expect(invoke).toHaveBeenCalledWith('execute_query', {
        address: 'localhost:19191',
        query: 'SELECT * FROM users',
      })

      // Results should be visible in ResultView
      const rv = wrapper.findComponent(ResultPanel)
      expect(rv.exists()).toBe(true)
      expect(rv.props('data')).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' },
      ])
    })

    it('shows query error in the UI', async () => {
      mockIPC({ queryError: 'Syntax error near SELECT' })
      const wrapper = mountApp()
      await flushPromises()

      await typeAndExecute(wrapper, 'SELEC * FROM users')

      // Error should be displayed somewhere in the query panel
      const qp = getQueryPanel(wrapper)
      expect(qp.text()).toContain('Syntax error near SELECT')
    })

    it('shows execution duration after successful query', async () => {
      mockIPC({ queryDuration: 123 })
      const wrapper = mountApp()
      await flushPromises()

      await typeAndExecute(wrapper, 'SELECT 1')

      const qp = getQueryPanel(wrapper)
      expect(qp.text()).toContain('123ms')
    })
  })

  describe('Connection management flow', () => {
    it('adds a second connection and switches between them', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      // Add a second connection
      await addConnection(wrapper, 'otherhost', '5432')

      const conns = getConnections(wrapper)
      expect(conns).toHaveLength(2)
      expect(conns[1].address).toBe('otherhost:5432')
      expect(conns[1].active).toBe(true) // newly added becomes active
      expect(conns[0].active).toBe(false)

      // Switch back to first connection
      const cp = wrapper.findComponent(ConnectionPanel)
      await cp.vm.$emit('select', conns[0])
      await wrapper.vm.$nextTick()

      const updated = getConnections(wrapper)
      expect(updated[0].active).toBe(true)
      expect(updated[1].active).toBe(false)
    })

    it('shows error in dialog when connection fails', async () => {
      // First call succeeds (initial connection), subsequent calls fail
      let callCount = 0
      vi.mocked(invoke).mockImplementation(async (cmd: string) => {
        if (cmd === 'test_connection') {
          callCount++
          if (callCount > 1) throw new Error('Connection refused')
          return undefined
        }
        return undefined
      })

      const wrapper = mountApp()
      await flushPromises()

      const dialog = await openDialog(wrapper)
      await expect(
        dialog.props('connectHandler')('badhost', '9999'),
      ).rejects.toThrow('Connection refused')

      // Only original connection remains
      expect(getConnections(wrapper)).toHaveLength(1)
    })

    it('removes a connection and falls back to the first', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      await addConnection(wrapper, 'temphost', '3000')
      expect(getConnections(wrapper)).toHaveLength(2)

      const cp = wrapper.findComponent(ConnectionPanel)
      const connToRemove = getConnections(wrapper)[1]
      await cp.vm.$emit('remove', connToRemove.id)
      await wrapper.vm.$nextTick()

      const remaining = getConnections(wrapper)
      expect(remaining).toHaveLength(1)
      expect(remaining[0].active).toBe(true)
    })
  })

  describe('Tab management across connections', () => {
    it('each connection gets its own tab set', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      // Type a query in connection 1's tab
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      // Add second connection — should get a fresh empty tab
      await addConnection(wrapper, 'db2', '5432')

      const qp = getQueryPanel(wrapper)
      // The new connection's active tab should have no result
      expect(qp.text()).toContain('Execute a query to see results')

      // Switch back to connection 1 — result should still be there
      const cp = wrapper.findComponent(ConnectionPanel)
      await cp.vm.$emit('select', getConnections(wrapper)[0])
      await wrapper.vm.$nextTick()

      const rt2 = wrapper.findComponent(ResultPanel)
      expect(rt2.exists()).toBe(true)
      expect(rt2.props('data')).toHaveLength(3)
    })

    it('creates additional tabs and switches between them', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      // Execute in first tab
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      // Add a second tab via QueryPanel
      const qp = getQueryPanel(wrapper)
      const newTabBtn = qp.findAll('button').find((b) => b.attributes('title') === 'New Query')
      expect(newTabBtn).toBeDefined()
      await newTabBtn!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should see "Query 2" tab
      expect(qp.text()).toContain('Query 2')

      // The new tab should show empty state
      expect(qp.text()).toContain('Execute a query to see results')
    })
  })

  describe('Query results display', () => {
    it('displays tabular data for array-of-objects result', async () => {
      mockIPC({
        queryData: [
          { id: 1, value: 'one' },
          { id: 2, value: 'two' },
        ],
      })
      const wrapper = mountApp()
      await flushPromises()

      await typeAndExecute(wrapper, 'SELECT * FROM items')

      const rt = wrapper.findComponent(ResultPanel)
      expect(rt.exists()).toBe(true)
      expect(rt.props('data')).toEqual([
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
      ])
    })

    it('displays JSON for non-array results', async () => {
      mockIPC({ queryData: [{ affected_rows: 1 }] })

      // Override to return an object (not an array of row-like objects)
      vi.mocked(invoke).mockImplementation(async (cmd: string) => {
        if (cmd === 'test_connection') return undefined
        return { success: true, data: { affected_rows: 1 }, duration: 15 }
      })

      const wrapper = mountApp()
      await flushPromises()

      await typeAndExecute(wrapper, 'INSERT INTO t VALUES (1)')

      // Non-array data is passed to ResultView
      const rv = wrapper.findComponent(ResultPanel)
      expect(rv.exists()).toBe(true)
      expect(rv.props('data')).toEqual({ affected_rows: 1 })
    })

    it('preserves previous results while query is loading', async () => {
      vi.useFakeTimers()
      mockIPC()
      const wrapper = mountApp()
      await vi.advanceTimersByTimeAsync(100)
      await wrapper.vm.$nextTick()

      // First query
      const qp = getQueryPanel(wrapper)
      await qp.find('textarea').setValue('SELECT * FROM users')
      await wrapper.vm.$nextTick()
      await qp.find('[data-testid="execute-button"]').trigger('click')
      await vi.advanceTimersByTimeAsync(500)
      await wrapper.vm.$nextTick()

      const rt = wrapper.findComponent(ResultPanel)
      expect(rt.props('data')).toHaveLength(3)

      // Start a slow second query (never resolves)
      vi.mocked(invoke).mockImplementation(() => new Promise(() => {}))
      await qp.find('textarea').setValue('SELECT * FROM slow')
      await wrapper.vm.$nextTick()
      await qp.find('[data-testid="execute-button"]').trigger('click')
      vi.advanceTimersByTime(200)
      await wrapper.vm.$nextTick()

      // Previous results still visible while loading
      const rt2 = wrapper.findComponent(ResultPanel)
      expect(rt2.props('data')).toHaveLength(3)
      expect(rt2.props('isLocked')).toBe(true)       // locked immediately
      expect(rt2.props('showOverlay')).toBe(false)    // no overlay before 500ms
    })
  })

  describe('Execute button behavior', () => {
    it('is disabled when query is empty', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      const qp = getQueryPanel(wrapper)
      const btn = qp.find('[data-testid="execute-button"]')
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('is enabled when query has content', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      const qp = getQueryPanel(wrapper)
      await qp.find('textarea').setValue('SELECT 1')
      await wrapper.vm.$nextTick()

      const btn = qp.find('[data-testid="execute-button"]')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('shows loading indicator after 500ms', async () => {
      vi.useFakeTimers()
      mockIPC()
      const wrapper = mountApp()
      await vi.advanceTimersByTimeAsync(100)
      await wrapper.vm.$nextTick()

      // Set up a never-resolving invoke for the query
      vi.mocked(invoke).mockImplementation((cmd: string) => {
        if (cmd === 'test_connection') return Promise.resolve(undefined)
        return new Promise(() => {})
      })

      const qp = getQueryPanel(wrapper)
      await qp.find('textarea').setValue('SELECT * FROM slow')
      await wrapper.vm.$nextTick()
      await qp.find('[data-testid="execute-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Before 500ms — no loading indicator
      expect(qp.find('[data-testid="execute-button"]').text()).toBe('Execute')

      // Advance past 500ms
      vi.advanceTimersByTime(600)
      await wrapper.vm.$nextTick()

      expect(qp.find('[data-testid="execute-button"]').text()).toContain('Running...')
    })
  })

  describe('Multi-connection query isolation', () => {
    it('queries on one connection do not affect another', async () => {
      mockIPC()
      const wrapper = mountApp()
      await flushPromises()

      // Run query on connection 1
      await typeAndExecute(wrapper, 'SELECT * FROM users')
      const rt1 = wrapper.findComponent(ResultPanel)
      expect(rt1.props('data')).toHaveLength(3)

      // Add connection 2 and run a different query
      await addConnection(wrapper, 'db2', '5432')
      vi.mocked(invoke).mockImplementation(async (cmd: string) => {
        if (cmd === 'test_connection') return undefined
        return { success: true, data: [{ x: 1 }], duration: 5 }
      })
      await typeAndExecute(wrapper, 'SELECT x FROM other')
      const rt2 = wrapper.findComponent(ResultPanel)
      expect(rt2.props('data')).toEqual([{ x: 1 }])

      // Switch back to connection 1 — original results preserved
      const cp = wrapper.findComponent(ConnectionPanel)
      await cp.vm.$emit('select', getConnections(wrapper)[0])
      await wrapper.vm.$nextTick()

      const rt3 = wrapper.findComponent(ResultPanel)
      expect(rt3.props('data')).toHaveLength(3)
      expect(rt3.props('data')).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' },
      ])
    })
  })

  describe('View mode toggle', () => {
    it('switches between list, table and JSON views after query execution', async () => {
      mockIPC({ queryData: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] })
      const wrapper = mountApp()
      await flushPromises()
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      // Default is list
      const rv = wrapper.findComponent(ResultPanel)
      expect(rv.props('viewMode')).toBe('list')

      // Click Table toggle
      const qp = getQueryPanel(wrapper)
      await qp.find('[title="Table view"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent(ResultPanel).props('viewMode')).toBe('table')

      // Click JSON toggle
      await qp.find('[title="JSON view"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent(ResultPanel).props('viewMode')).toBe('json')

      // Click List toggle back
      await qp.find('[title="List view"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent(ResultPanel).props('viewMode')).toBe('list')
    })

    it('shows list view as default with card layout', async () => {
      mockIPC({
        queryData: [
          { id: 1, name: 'Alice', meta: { role: 'admin' } },
          { id: 2, name: 'Bob', meta: { role: 'user' } },
        ],
      })
      const wrapper = mountApp()
      await flushPromises()
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      const rv = wrapper.findComponent(ResultPanel)
      expect(rv.props('viewMode')).toBe('list')
      // Cards rendered for each row
      const cards = rv.findAll('[data-testid="list-card"]')
      expect(cards).toHaveLength(2)
      // Root-level fields shown as key-value pairs
      expect(rv.text()).toContain('id')
      expect(rv.text()).toContain('name')
      expect(rv.text()).toContain('"Alice"')
      expect(rv.text()).toContain('"Bob"')
    })

    it('shows JSON view with nested data', async () => {
      mockIPC({
        queryData: [
          { id: 1, name: 'Alice', meta: { role: 'admin', tags: ['a', 'b'] } },
        ],
      })
      const wrapper = mountApp()
      await flushPromises()
      await typeAndExecute(wrapper, 'SELECT * FROM users')

      const qp = getQueryPanel(wrapper)
      await qp.find('[title="JSON view"]').trigger('click')
      await wrapper.vm.$nextTick()

      const rv = wrapper.findComponent(ResultPanel)
      expect(rv.props('viewMode')).toBe('json')
      expect(rv.text()).toContain('Document 0')
      // Content is collapsed by default, shows field count
      expect(rv.text()).toContain('3 fields')
    })
  })
})
