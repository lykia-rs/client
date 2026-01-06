import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import QueryPanel from '@/components/QueryPanel.vue'
import ResultTable from '@/components/ResultTable.vue'
import Button from '@/components/ui/Button.vue'
import { createMockConnection, flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

describe('QueryPanel.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(QueryPanel, {
      props: {
        connection: createMockConnection(),
        ...props,
      },
      global: {
        stubs: {
          Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
          Pane: { template: '<div class="pane"><slot /></div>' },
        },
      },
    })
  }

  it('renders the component with query editor and results pane', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.find('.splitpanes').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Results')
  })

  it('initializes with one default tab', () => {
    const wrapper = createWrapper()
    
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Execute button', () => {
    const wrapper = createWrapper()
    
    const executeButton = wrapper.findComponent(Button)
    expect(executeButton.text()).toContain('Execute')
  })

  it('disables Execute button when query is empty', () => {
    const wrapper = createWrapper()
    
    const executeButton = wrapper.findComponent(Button)
    expect(executeButton.attributes('disabled')).toBeDefined()
  })

  it('enables Execute button when query has content', async () => {
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM users')
    
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    expect(executeButton.attributes('disabled')).toBeUndefined()
  })

  it('updates query text when typing in textarea', async () => {
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM products')
    
    expect(textarea.element.value).toBe('SELECT * FROM products')
  })

  it('executes query when Execute button is clicked', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Test' }],
      duration: 42,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'localhost:19191',
      query: 'SELECT * FROM test',
    })
  })

  it('displays results after successful query execution', async () => {
    const mockData = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]
    
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: mockData,
      duration: 25,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM users')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    const resultTable = wrapper.findComponent(ResultTable)
    expect(resultTable.exists()).toBe(true)
    expect(resultTable.props('data')).toEqual(mockData)
  })

  it('displays error message when query fails', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: false,
      error: 'Syntax error in query',
      duration: 10,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('INVALID QUERY')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    const errorElement = wrapper.find('.text-red-400')
    expect(errorElement.exists()).toBe(true)
    expect(errorElement.text()).toContain('Syntax error in query')
  })

  it('displays error when invoke throws exception', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Network error'))
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    const errorElement = wrapper.find('.text-red-400')
    expect(errorElement.exists()).toBe(true)
    expect(errorElement.text()).toContain('Network error')
  })

  it('shows loading state during query execution', async () => {
    vi.mocked(invoke).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 50 }), 100))
    )
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await wrapper.vm.$nextTick()
    
    expect(executeButton.text()).toContain('Running...')
    expect(executeButton.html()).toContain('animate-spin')
  })

  it('shows loading bar at top of results pane during query execution', async () => {
    vi.mocked(invoke).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 50 }), 100))
    )
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    // Loading bar should not exist initially
    let loadingBar = wrapper.find('.h-0\\.5')
    expect(loadingBar.exists()).toBe(false)
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Loading bar should appear during loading
    loadingBar = wrapper.find('.h-0\\.5')
    expect(loadingBar.exists()).toBe(true)
  })

  it('hides loading bar after query completes', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      duration: 42,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await flushPromises()
    
    // Loading bar should be hidden after completion
    const loadingBar = wrapper.find('.h-0\\.5')
    expect(loadingBar.exists()).toBe(false)
  })

  it('keeps previous results visible when executing new query', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      duration: 20,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await flushPromises()
    
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    
    // Execute again
    vi.mocked(invoke).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    await executeButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Results should remain visible while loading (locked state)
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    expect(wrapper.findComponent(ResultTable).props('isLocked')).toBe(true)
  })

  it('displays execution time after query completes', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      duration: 123,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    expect(wrapper.text()).toContain('123ms')
  })

  it('can add new query tab', async () => {
    const wrapper = createWrapper()
    
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    
    await wrapper.vm.$nextTick()
    
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBeGreaterThanOrEqual(2)
  })

  it('switches between tabs', async () => {
    const wrapper = createWrapper()
    
    // Add a new tab
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    
    // Click on first tab
    await tabs[0].trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(tabs[0].classes()).toContain('bg-zinc-800')
  })

  it('maintains separate query content per tab', async () => {
    const wrapper = createWrapper()
    
    // Set query in first tab
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM tab1')
    await wrapper.vm.$nextTick()
    
    // Add new tab
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // New tab should have empty query
    expect(wrapper.find('textarea').element.value).toBe('')
    
    // Switch back to first tab
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    await tabs[0].trigger('click')
    await wrapper.vm.$nextTick()
    
    // First tab should still have its query
    expect(wrapper.find('textarea').element.value).toBe('SELECT * FROM tab1')
  })

  it('can close tabs when multiple exist', async () => {
    const wrapper = createWrapper()
    
    // Add a second tab
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    let tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    const initialTabCount = tabs.length
    
    // Find and click close button
    const closeButton = tabs[1].find('button')
    await closeButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBe(initialTabCount - 1)
  })

  it('cannot close the last remaining tab', async () => {
    const wrapper = createWrapper()
    
    // Should have one tab
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    
    // Try to find close button - shouldn't exist for single tab
    const closeButtons = tabs[0].findAll('button')
    expect(closeButtons.length).toBe(0) // No close button on single tab
  })

  it('switches to another tab when closing active tab', async () => {
    const wrapper = createWrapper()
    
    // Add a second tab
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Second tab should be active
    let tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs[1].classes()).toContain('bg-zinc-800')
    
    // Close the active tab
    const closeButton = tabs[1].find('button')
    await closeButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // First tab should now be active
    tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs[0].classes()).toContain('bg-zinc-800')
  })

  it('shows empty state when no results', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.text()).toContain('Execute a query to see results')
  })

  it('uses connection address in query execution', async () => {
    const connection = createMockConnection({ 
      address: 'custom.host:8080' 
    })
    
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 10,
    })
    
    const wrapper = createWrapper({ connection })
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT 1')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    
    await flushPromises()
    
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'custom.host:8080',
      query: 'SELECT 1',
    })
  })

  it('applies connection color to execute button', () => {
    const connection = createMockConnection({ color: '#ff00ff' })
    const wrapper = createWrapper({ connection })
    
    const executeButton = wrapper.findComponent(Button)
    expect(executeButton.attributes('style')).toContain('#ff00ff')
  })

  it('creates new tabs for the current connection', async () => {
    const connection = createMockConnection({ id: 'conn1' })
    const wrapper = createWrapper({ connection })
    
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBeGreaterThanOrEqual(2)
  })

  it('switches tabs when connection changes', async () => {
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Set query in first connection's tab
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT from conn1')
    await wrapper.vm.$nextTick()
    
    // Change connection
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Should show empty query for new connection
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('maintains separate tabs per connection', async () => {
    const connection1 = createMockConnection({ id: 'conn1', name: 'DB1' })
    const connection2 = createMockConnection({ id: 'conn2', name: 'DB2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Create tabs and set queries for connection 1
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM users')
    await wrapper.vm.$nextTick()
    
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    await wrapper.find('textarea').setValue('SELECT * FROM orders')
    await wrapper.vm.$nextTick()
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Connection 2 should have its own tab
    expect(wrapper.find('textarea').element.value).toBe('')
    
    // Switch back to connection 1
    await wrapper.setProps({ connection: connection1 })
    await wrapper.vm.$nextTick()
    
    // Connection 1 should still have both tabs
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBeGreaterThanOrEqual(2)
  })

  it('preserves tab content when switching connections', async () => {
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Set query in connection 1
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM table1')
    await wrapper.vm.$nextTick()
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Set different query in connection 2
    await wrapper.find('textarea').setValue('SELECT * FROM table2')
    await wrapper.vm.$nextTick()
    
    // Switch back to connection 1
    await wrapper.setProps({ connection: connection1 })
    await wrapper.vm.$nextTick()
    
    // Original query should be preserved
    expect(wrapper.find('textarea').element.value).toBe('SELECT * FROM table1')
  })

  it('preserves query results per connection', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Result 1' }],
      duration: 20,
    })
    
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Execute query in connection 1
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM conn1_table')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await flushPromises()
    
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Connection 2 should not show results from connection 1
    expect(wrapper.findComponent(ResultTable).exists()).toBe(false)
    
    // Switch back to connection 1
    await wrapper.setProps({ connection: connection1 })
    await wrapper.vm.$nextTick()
    
    // Results should still be visible
    expect(wrapper.findComponent(ResultTable).exists()).toBe(true)
  })

  it('creates new tab for new connection if none exists', async () => {
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Switch to connection 2 (which has no tabs yet)
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Should automatically create a tab
    expect(wrapper.find('textarea').exists()).toBe(true)
    const tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBeGreaterThanOrEqual(1)
  })

  it('executes query on correct connection', async () => {
    const connection1 = createMockConnection({ id: 'conn1', address: 'host1:9001' })
    const connection2 = createMockConnection({ id: 'conn2', address: 'host2:9002' })
    
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 10,
    })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Set query for connection 1
    await wrapper.find('textarea').setValue('SELECT 1')
    await wrapper.vm.$nextTick()
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Set and execute query for connection 2
    await wrapper.find('textarea').setValue('SELECT 2')
    await wrapper.vm.$nextTick()
    
    await wrapper.findComponent(Button).trigger('click')
    await flushPromises()
    
    // Should execute on connection 2's address
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'host2:9002',
      query: 'SELECT 2',
    })
  })

  it('maintains separate active tabs per connection', async () => {
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Create two tabs for connection 1
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Get tabs and click the first one to make it active
    let tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    await tabs[0].trigger('click')
    await wrapper.vm.$nextTick()
    
    // First tab should be active
    expect(tabs[0].classes()).toContain('bg-zinc-800')
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Add tab for connection 2
    await wrapper.find('button[title="New Query"]').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Switch back to connection 1
    await wrapper.setProps({ connection: connection1 })
    await wrapper.vm.$nextTick()
    
    // First tab should still be active in connection 1
    tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs[0].classes()).toContain('bg-zinc-800')
  })

  it('does not mix tabs from different connections', async () => {
    const connection1 = createMockConnection({ id: 'conn1' })
    const connection2 = createMockConnection({ id: 'conn2' })
    
    const wrapper = createWrapper({ connection: connection1 })
    
    // Create 2 tabs for connection 1
    const addTabButton = wrapper.find('button[title="New Query"]')
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    await addTabButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    let tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    const conn1TabCount = tabs.length
    
    // Switch to connection 2
    await wrapper.setProps({ connection: connection2 })
    await wrapper.vm.$nextTick()
    
    // Connection 2 should start with 1 tab (auto-created)
    tabs = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Query')
    )
    expect(tabs.length).toBe(1)
    expect(tabs.length).not.toBe(conn1TabCount)
  })

  it('disables query textarea during loading state', async () => {
    vi.mocked(invoke).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 50 }), 100))
    )
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    // Textarea should be enabled initially
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Textarea should be disabled during loading
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('readonly')).toBeDefined()
    expect(textarea.classes()).toContain('opacity-50')
    expect(textarea.classes()).toContain('cursor-not-allowed')
  })

  it('re-enables query textarea after query completes', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      duration: 42,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('SELECT * FROM test')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await flushPromises()
    
    // Textarea should be enabled again after completion
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()
    expect(textarea.classes()).not.toContain('opacity-50')
    expect(textarea.classes()).not.toContain('cursor-not-allowed')
  })

  it('re-enables query textarea after query error', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: false,
      error: 'Syntax error',
      duration: 10,
    })
    
    const wrapper = createWrapper()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('INVALID QUERY')
    await wrapper.vm.$nextTick()
    
    const executeButton = wrapper.findComponent(Button)
    await executeButton.trigger('click')
    await flushPromises()
    
    // Textarea should be enabled again after error
    expect(textarea.attributes('disabled')).toBeUndefined()
    expect(textarea.attributes('readonly')).toBeUndefined()
  })
})

