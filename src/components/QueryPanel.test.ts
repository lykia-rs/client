import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import QueryPanel from '@/components/QueryPanel.vue'
import ResultTable from '@/components/ResultTable.vue'
import { createMockConnection, flushPromises } from '@/test/utils'
import { resetQueryTabsState } from '@/composables/useQueryTabs'
import type { QueryResult } from '@/composables/useQueryTabs'

vi.mock('@tauri-apps/api/core')

const CodeEditorStub = {
  name: 'CodeEditor',
  template: `<textarea
    :value="modelValue"
    :disabled="disabled"
    :readonly="readonly"
    @input="$emit('update:modelValue', $event.target.value)"
    class="code-editor-stub"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  />`,
  props: ['modelValue', 'disabled', 'readonly', 'placeholder'],
  emits: ['update:modelValue', 'parseError', 'parseErrorMessage'],
}

const stubs = {
  Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
  Pane: { template: '<div class="pane"><slot /></div>' },
  CodeEditor: CodeEditorStub,
}
const conn1 = (o = {}) => createMockConnection({ id: 'conn1', ...o })
const conn2 = (o = {}) => createMockConnection({ id: 'conn2', ...o })
const findTabs = (w: VueWrapper) => w.findAll('button').filter((b) => b.text().includes('Query'))

const mockSuccess = (data: QueryResult = [], duration = 10) =>
  vi.mocked(invoke).mockResolvedValue({ success: true, data, duration })
const mockError = (error: string, extra: Record<string, string | number | boolean | { from: number; to: number }> = {}) =>
  vi.mocked(invoke).mockResolvedValue({ success: false, error, duration: 10, ...extra })
const mockSlow = () =>
  vi
    .mocked(invoke)
    .mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: [], duration: 50 }), 5000),
        ),
    )

describe('QueryPanel.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetQueryTabsState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = (props = {}) =>
    mount(QueryPanel, {
      props: { connection: createMockConnection(), ...props },
      global: { stubs },
    })

  async function exec(wrapper: VueWrapper, query: string) {
    await wrapper.find('textarea').setValue(query)
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="execute-button"]').trigger('click')
    await flushPromises()
  }

  async function startLoading(wrapper: VueWrapper, query = 'SELECT * FROM test') {
    vi.useFakeTimers()
    mockSlow()
    await wrapper.find('textarea').setValue(query)
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="execute-button"]').trigger('click')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
  }

  async function addTab(wrapper: VueWrapper) {
    await wrapper.find('button[title="New Query"]').trigger('click')
    await wrapper.vm.$nextTick()
  }

  it('renders the component with query editor and results pane', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.splitpanes').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Results')
  })

  it('initializes with one default tab', () => {
    expect(findTabs(createWrapper()).length).toBeGreaterThanOrEqual(1)
  })

  it('disables Execute button when query is empty', () => {
    expect(
      createWrapper().find('[data-testid="execute-button"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('enables Execute button when query has content', async () => {
    const wrapper = createWrapper()
    await wrapper.find('textarea').setValue('SELECT * FROM users')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="execute-button"]').attributes('disabled')).toBeUndefined()
  })

  it('disables Execute button when editor emits a parse error', async () => {
    const wrapper = createWrapper()
    await wrapper.find('textarea').setValue('SELECT * FROM users')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="execute-button"]').attributes('disabled')).toBeUndefined()

    wrapper.findComponent(CodeEditorStub).vm.$emit('parseError', true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="execute-button"]').attributes('disabled')).toBeDefined()

    wrapper.findComponent(CodeEditorStub).vm.$emit('parseError', false)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="execute-button"]').attributes('disabled')).toBeUndefined()
  })

  it('executes query when Execute button is clicked', async () => {
    mockSuccess([{ id: 1, name: 'Test' }], 42)
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'localhost:19191',
      query: 'SELECT * FROM test',
    })
  })

  it('displays results after successful query execution', async () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]
    mockSuccess(data, 25)
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM users')
    const rt = wrapper.findComponent(ResultTable)
    expect(rt.exists()).toBe(true)
    expect(rt.props('data')).toEqual(data)
  })

  it('displays error message when query fails', async () => {
    mockError('Syntax error in query')
    const wrapper = createWrapper()
    await exec(wrapper, 'INVALID QUERY')
    const el = wrapper.find('.text-red-700')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('Syntax error in query')
  })

  it('displays error when invoke throws exception', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Network error'))
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    const el = wrapper.find('.text-red-700')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('Network error')
  })

  it('shows loading state during query execution', async () => {
    const wrapper = createWrapper()
    await startLoading(wrapper)
    const btn = wrapper.find('[data-testid="execute-button"]')
    expect(btn.text()).toContain('Running...')
    expect(btn.html()).toContain('animate-spin')
  })

  it('shows loading bar at top of results pane during query execution', async () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.loading-shimmer').exists()).toBe(false)
    await startLoading(wrapper)
    expect(wrapper.find('.loading-shimmer').exists()).toBe(true)
  })

  it('hides loading bar after query completes', async () => {
    mockSuccess([{ id: 1 }], 42)
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    expect(wrapper.find('.loading-shimmer').exists()).toBe(false)
  })

  it('keeps previous results visible when executing new query', async () => {
    vi.useFakeTimers()
    mockSuccess([{ id: 1 }], 20)
    const wrapper = createWrapper()

    await wrapper.find('textarea').setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="execute-button"]').trigger('click')
    await vi.advanceTimersByTimeAsync(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)

    vi.mocked(invoke).mockImplementation(() => new Promise(() => {}))
    await wrapper.find('[data-testid="execute-button"]').trigger('click')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    expect(wrapper.findComponent(ResultTable).props('isLocked')).toBe(true)
  })

  it('displays execution time after query completes', async () => {
    mockSuccess([{ id: 1 }], 123)
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    expect(wrapper.text()).toContain('123ms')
  })

  it('can add new query tab', async () => {
    const wrapper = createWrapper()
    await addTab(wrapper)
    expect(findTabs(wrapper).length).toBeGreaterThanOrEqual(2)
  })

  it('switches between tabs', async () => {
    const wrapper = createWrapper()
    await addTab(wrapper)
    const tabs = findTabs(wrapper)
    await tabs[0].trigger('click')
    await wrapper.vm.$nextTick()
    expect(tabs[0].classes()).toContain('bg-white')
  })

  it('maintains separate query content per tab', async () => {
    const wrapper = createWrapper()
    await wrapper.find('textarea').setValue('SELECT * FROM tab1')
    await wrapper.vm.$nextTick()
    await addTab(wrapper)
    expect(wrapper.find('textarea').element.value).toBe('')

    await findTabs(wrapper)[0].trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('textarea').element.value).toBe('SELECT * FROM tab1')
  })

  it('can close tabs when multiple exist', async () => {
    const wrapper = createWrapper()
    await addTab(wrapper)
    const tabs = findTabs(wrapper)
    const count = tabs.length
    await tabs[1].find('button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(findTabs(wrapper).length).toBe(count - 1)
  })

  it('cannot close the last remaining tab', () => {
    expect(findTabs(createWrapper())[0].findAll('button').length).toBe(0)
  })

  it('switches to another tab when closing active tab', async () => {
    const wrapper = createWrapper()
    await addTab(wrapper)
    const tabs = findTabs(wrapper)
    expect(tabs[1].classes()).toContain('bg-white')
    await tabs[1].find('button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(findTabs(wrapper)[0].classes()).toContain('bg-white')
  })

  it('shows empty state when no results', () => {
    expect(createWrapper().text()).toContain('Execute a query to see results')
  })

  it('uses connection address in query execution', async () => {
    mockSuccess()
    const wrapper = createWrapper({
      connection: createMockConnection({ address: 'custom.host:8080' }),
    })
    await exec(wrapper, 'SELECT 1')
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'custom.host:8080',
      query: 'SELECT 1',
    })
  })

  it('applies connection color to execute button', () => {
    const wrapper = createWrapper({ connection: createMockConnection({ color: '#ff00ff' }) })
    expect(wrapper.find('[data-testid="execute-button"]').attributes('style')).toContain('#ff00ff')
  })

  it('creates new tabs for the current connection', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await addTab(wrapper)
    expect(findTabs(wrapper).length).toBeGreaterThanOrEqual(2)
  })

  it('switches tabs when connection changes', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await wrapper.find('textarea').setValue('SELECT from conn1')
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('maintains separate tabs per connection', async () => {
    const wrapper = createWrapper({ connection: conn1({ name: 'DB1' }) })
    await wrapper.find('textarea').setValue('SELECT * FROM users')
    await wrapper.vm.$nextTick()
    await addTab(wrapper)
    await wrapper.find('textarea').setValue('SELECT * FROM orders')
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ connection: conn2({ name: 'DB2' }) })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('textarea').element.value).toBe('')

    await wrapper.setProps({ connection: conn1({ name: 'DB1' }) })
    await wrapper.vm.$nextTick()
    expect(findTabs(wrapper).length).toBeGreaterThanOrEqual(2)
  })

  it('preserves tab content when switching connections', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await wrapper.find('textarea').setValue('SELECT * FROM table1')
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    await wrapper.find('textarea').setValue('SELECT * FROM table2')
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ connection: conn1() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('textarea').element.value).toBe('SELECT * FROM table1')
  })

  it('preserves query results per connection', async () => {
    mockSuccess([{ id: 1, name: 'Result 1' }], 20)
    const wrapper = createWrapper({ connection: conn1() })
    await exec(wrapper, 'SELECT * FROM conn1_table')
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)

    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ResultTable).exists()).toBe(false)

    await wrapper.setProps({ connection: conn1() })
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
  })

  it('creates new tab for new connection if none exists', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(findTabs(wrapper).length).toBeGreaterThanOrEqual(1)
  })

  it('executes query on correct connection', async () => {
    mockSuccess()
    const wrapper = createWrapper({ connection: conn1({ address: 'host1:9001' }) })
    await wrapper.find('textarea').setValue('SELECT 1')
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ connection: conn2({ address: 'host2:9002' }) })
    await wrapper.vm.$nextTick()
    await exec(wrapper, 'SELECT 2')
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'host2:9002',
      query: 'SELECT 2',
    })
  })

  it('maintains separate active tabs per connection', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await addTab(wrapper)
    await findTabs(wrapper)[0].trigger('click')
    await wrapper.vm.$nextTick()
    expect(findTabs(wrapper)[0].classes()).toContain('bg-white')

    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    await addTab(wrapper)

    await wrapper.setProps({ connection: conn1() })
    await wrapper.vm.$nextTick()
    expect(findTabs(wrapper)[0].classes()).toContain('bg-white')
  })

  it('does not mix tabs from different connections', async () => {
    const wrapper = createWrapper({ connection: conn1() })
    await addTab(wrapper)
    await addTab(wrapper)
    const conn1TabCount = findTabs(wrapper).length

    await wrapper.setProps({ connection: conn2() })
    await wrapper.vm.$nextTick()
    const tabs = findTabs(wrapper)
    expect(tabs.length).toBe(1)
    expect(tabs.length).not.toBe(conn1TabCount)
  })

  it('disables query textarea during loading state', async () => {
    const wrapper = createWrapper()
    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()

    await startLoading(wrapper)
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('readonly')).toBeDefined()
    expect(textarea.element.closest('.opacity-50')).not.toBeNull()
  })

  it.each([
    ['completes', () => mockSuccess([{ id: 1 }], 42)],
    ['errors', () => mockError('Syntax error')],
  ])('re-enables query textarea after query %s', async (_, setup) => {
    setup()
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()
    expect(textarea.classes()).not.toContain('opacity-50')
    expect(textarea.classes()).not.toContain('cursor-not-allowed')
  })

  it('shows spinner instead of close button when query is running', async () => {
    const wrapper = createWrapper()
    await addTab(wrapper)

    const closeButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('title')?.includes('Close tab'))
    expect(closeButtons.length).toBeGreaterThan(0)
    const initialSpinnerCount = wrapper.findAll('.animate-spin').length

    await startLoading(wrapper)
    expect(wrapper.findAll('.animate-spin').length).toBeGreaterThan(initialSpinnerCount)
    expect(findTabs(wrapper).length).toBeGreaterThan(0)
  })

  it('shows close button again after query completes', async () => {
    mockSuccess([{ id: 1 }], 42)
    const wrapper = createWrapper()
    await addTab(wrapper)
    await exec(wrapper, 'SELECT * FROM test')

    const closeButtons = wrapper
      .findAll('button')
      .filter(
        (b) => b.html().includes('Close tab') || b.attributes('title')?.includes('close'),
      )
    expect(closeButtons[0].attributes('disabled')).toBeUndefined()
  })

  it('shows parse error message in editor status bar', async () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.text-red-500').exists()).toBe(false)
    wrapper
      .findComponent(CodeEditorStub)
      .vm.$emit('parseErrorMessage', 'Unexpected token at line 1')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Unexpected token at line 1')
  })

  it('hides parse error message when error is cleared', async () => {
    const wrapper = createWrapper()
    wrapper.findComponent(CodeEditorStub).vm.$emit('parseErrorMessage', 'Some parse error')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Some parse error')

    wrapper.findComponent(CodeEditorStub).vm.$emit('parseErrorMessage', '')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Some parse error')
  })

  it('shows error with errorSpan in status bar instead of results error box', async () => {
    mockError('Syntax error near SELECT', { error_span: { from: 0, to: 6 } })
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    const statusBars = wrapper.findAll('.px-4.h-8')
    expect(statusBars[statusBars.length - 1]?.text()).toContain('Syntax error near SELECT')
  })

  it('shows execution time when error has no errorSpan', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: false,
      error: 'Connection refused',
      duration: 5,
    })
    const wrapper = createWrapper()
    await exec(wrapper, 'SELECT * FROM test')
    const statusBars = wrapper.findAll('.px-4.h-8')
    expect(statusBars[statusBars.length - 1]?.text()).toContain('5ms')
  })
})
