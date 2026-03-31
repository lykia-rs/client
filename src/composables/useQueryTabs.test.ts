import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useQueryTabs, hasRunningQueriesForConnection, resetQueryTabsState } from './useQueryTabs'
import type { Connection } from './useConnections'

describe('useQueryTabs', () => {
  let connection: Connection

  beforeEach(() => {
    // Reset shared state before each test
    resetQueryTabsState()
    
    connection = {
      id: 'conn1',
      name: 'Test DB',
      address: 'localhost:19191',
      host: 'localhost',
      port: '19191',
      color: '#4db6ac',
      active: true,
      connected: true,
    }
  })

  it('initializes with one default tab', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTab } = useQueryTabs(connectionRef)

    expect(tabs.value).toHaveLength(1)
    expect(tabs.value[0]).toMatchObject({
      name: 'Query 1',
      query: '',
      result: null,
      error: '',
      loading: false,
      connectionId: 'conn1',
      duration: null,
    })
    expect(tabs.value[0].id).toBeDefined()
    expect(activeTab.value).toBe(tabs.value[0])
  })

  it('filters tabs by connection ID', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    // Add tabs for current connection
    addTab()
    addTab()

    expect(tabs.value).toHaveLength(3)
    expect(tabs.value.every(t => t.connectionId === 'conn1')).toBe(true)
  })

  it('can add new tabs', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, activeTabId } = useQueryTabs(connectionRef)

    const initialCount = tabs.value.length

    addTab()

    expect(tabs.value).toHaveLength(initialCount + 1)
    expect(tabs.value[1].name).toBe('Query 2')
    expect(tabs.value[1].connectionId).toBe('conn1')
    expect(tabs.value[1].query).toBe('')
    expect(activeTabId.value).toBe(tabs.value[1].id)
  })

  it('increments tab names correctly', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    addTab()
    addTab()
    addTab()

    expect(tabs.value[0].name).toBe('Query 1')
    expect(tabs.value[1].name).toBe('Query 2')
    expect(tabs.value[2].name).toBe('Query 3')
    expect(tabs.value[3].name).toBe('Query 4')
  })

  it('makes new tab active when added', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTabId, addTab } = useQueryTabs(connectionRef)

    const firstTabId = tabs.value[0].id

    addTab()

    const secondTabId = tabs.value[1].id

    expect(activeTabId.value).toBe(secondTabId)
    expect(activeTabId.value).not.toBe(firstTabId)
  })

  it('can close tabs when multiple exist', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)

    // Start with 1, add 2 more
    addTab()
    addTab()

    const initialCount = tabs.value.length
    expect(initialCount).toBe(3)

    // Close one tab
    const tabToClose = tabs.value[1]
    closeTab(tabToClose.id)

    // Should have one less
    expect(tabs.value.length).toBe(initialCount - 1)
  })

  it('cannot close the last remaining tab', () => {
    const connectionRef = ref(connection)
    const { tabs, closeTab } = useQueryTabs(connectionRef)

    expect(tabs.value).toHaveLength(1)

    closeTab(tabs.value[0].id)

    expect(tabs.value).toHaveLength(1)
  })

  it('switches to another tab when closing active tab', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTabId, addTab, closeTab } = useQueryTabs(connectionRef)

    addTab()
    addTab()

    // Make second tab active
    const secondTabId = tabs.value[1].id
    activeTabId.value = secondTabId

    // Close the active tab
    closeTab(secondTabId)

    // Should switch to a valid tab
    const activeTab = tabs.value.find(t => t.id === activeTabId.value)
    expect(activeTab).toBeDefined()
    expect(tabs.value.length).toBe(2)
  })

  it('switches tabs when connection changes', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    // Add tabs for first connection
    addTab()

    expect(tabs.value).toHaveLength(2)
    expect(tabs.value.every(t => t.connectionId === 'conn1')).toBe(true)

    // Change to different connection
    const newConnection = { ...connection, id: 'conn2' }
    connectionRef.value = newConnection

    // Should see no tabs initially (will auto-create one)
    await new Promise(resolve => setTimeout(resolve, 0))

    // The watcher should create a new tab for conn2
    expect(tabs.value.length).toBeGreaterThanOrEqual(1)
  })

  it('creates new tab when switching to connection with no tabs', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    addTab()

    // Switch to a new connection
    const newConnection = { ...connection, id: 'conn2' }
    connectionRef.value = newConnection

    // Wait for watcher to trigger
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should have created a new tab for conn2
    expect(tabs.value.length).toBeGreaterThanOrEqual(1)
    if (tabs.value.length > 0) {
      expect(tabs.value[0].connectionId).toBe('conn2')
    }
  })

  it('preserves tabs for each connection separately', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    // Add tabs for conn1
    addTab()
    const conn1TabCount = tabs.value.length

    // Switch to conn2
    const conn2 = { ...connection, id: 'conn2' }
    connectionRef.value = conn2

    await new Promise(resolve => setTimeout(resolve, 0))

    // Should show only conn2 tabs
    expect(tabs.value.every(t => t.connectionId === 'conn2')).toBe(true)

    // Switch back to conn1
    connectionRef.value = connection

    await new Promise(resolve => setTimeout(resolve, 0))

    // Should show conn1 tabs again
    expect(tabs.value.length).toBe(conn1TabCount)
    expect(tabs.value.every(t => t.connectionId === 'conn1')).toBe(true)
  })

  it('maintains separate query content per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    tabs.value[0].query = 'SELECT * FROM table1'
    
    addTab()
    tabs.value[1].query = 'SELECT * FROM table2'

    expect(tabs.value[0].query).toBe('SELECT * FROM table1')
    expect(tabs.value[1].query).toBe('SELECT * FROM table2')
  })

  it('maintains separate results per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    tabs.value[0].result = [{ id: 1 }]
    tabs.value[0].duration = 100

    addTab()
    tabs.value[1].result = [{ id: 2 }]
    tabs.value[1].duration = 200

    expect(tabs.value[0].result).toEqual([{ id: 1 }])
    expect(tabs.value[0].duration).toBe(100)
    expect(tabs.value[1].result).toEqual([{ id: 2 }])
    expect(tabs.value[1].duration).toBe(200)
  })

  it('maintains separate errors per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    tabs.value[0].error = 'Error 1'
    
    addTab()
    tabs.value[1].error = 'Error 2'

    expect(tabs.value[0].error).toBe('Error 1')
    expect(tabs.value[1].error).toBe('Error 2')
  })

  it('maintains separate loading states per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    tabs.value[0].loading = true
    
    addTab()
    tabs.value[1].loading = false

    expect(tabs.value[0].loading).toBe(true)
    expect(tabs.value[1].loading).toBe(false)
  })

  it('assigns unique IDs to each tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    // Add several tabs
    addTab()
    addTab()
    addTab()

    // Collect all IDs
    const ids = tabs.value.map(t => t.id)
    const uniqueIds = new Set(ids)

    // All IDs should be unique
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('returns active tab correctly', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTab, activeTabId, addTab } = useQueryTabs(connectionRef)

    const firstTab = tabs.value[0]
    expect(activeTab.value).toBe(firstTab)

    addTab()
    const secondTab = tabs.value[1]
    
    expect(activeTab.value).toBe(secondTab)
    expect(activeTab.value?.id).toBe(activeTabId.value)
  })

  it('prevents closing tabs that are currently loading', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)

    // Add a second tab
    addTab()
    expect(tabs.value).toHaveLength(2)

    const tabToClose = tabs.value[1]
    const tabId = tabToClose.id

    // Set tab to loading state
    tabToClose.loading = true

    // Attempt to close the loading tab
    closeTab(tabId)

    // Tab should still exist
    expect(tabs.value).toHaveLength(2)
    expect(tabs.value.find(t => t.id === tabId)).toBeDefined()
  })

  it('allows closing tabs that are not loading', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)

    // Add a second tab
    addTab()
    expect(tabs.value).toHaveLength(2)

    const tabToClose = tabs.value[1]
    const tabId = tabToClose.id

    // Ensure tab is not loading
    tabToClose.loading = false

    // Close the tab
    closeTab(tabId)

    // Tab should be removed
    expect(tabs.value).toHaveLength(1)
    expect(tabs.value.find(t => t.id === tabId)).toBeUndefined()
  })

  it('detects running queries for a connection', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    // Initially no running queries
    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)

    // Add a tab and set it to loading
    addTab()
    tabs.value[1].loading = true

    // Should now detect running queries
    expect(hasRunningQueriesForConnection(connection.id)).toBe(true)

    // Set loading to false
    tabs.value[1].loading = false

    // Should no longer detect running queries
    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)
  })

  it('detects running queries only for specific connection', () => {
    const connection2: Connection = {
      id: 'conn2',
      name: 'Test DB 2',
      address: 'localhost:19192',
      host: 'localhost',
      port: '19192',
      color: '#a5d6a7',
      active: false,
      connected: true,
    }

    const connectionRef1 = ref(connection)
    const connectionRef2 = ref(connection2)
    
    useQueryTabs(connectionRef1)
    const { tabs: tabs2, addTab: addTab2 } = useQueryTabs(connectionRef2)

    // Add loading tab to connection 2
    addTab2()
    tabs2.value[0].loading = true

    // Connection 1 should have no running queries
    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)
    
    // Connection 2 should have running queries
    expect(hasRunningQueriesForConnection(connection2.id)).toBe(true)
  })

  it('initializes new tabs with loadingIndicator set to false', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    expect(tabs.value[0].loadingIndicator).toBe(false)

    addTab()
    expect(tabs.value[1].loadingIndicator).toBe(false)
  })

  it('maintains separate loadingIndicator states per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    addTab()

    tabs.value[0].loadingIndicator = true
    tabs.value[1].loadingIndicator = false

    expect(tabs.value[0].loadingIndicator).toBe(true)
    expect(tabs.value[1].loadingIndicator).toBe(false)
  })

  it('initializes new tabs with errorSpan set to null', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    expect(tabs.value[0].errorSpan).toBeNull()

    addTab()
    expect(tabs.value[1].errorSpan).toBeNull()
  })
})
