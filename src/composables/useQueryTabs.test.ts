import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useQueryTabs, hasRunningQueriesForConnection, resetQueryTabsState } from './useQueryTabs'
import type { Connection } from './useConnections'

const makeConn = (o: Partial<Connection> = {}): Connection => ({
  id: 'conn1',
  name: 'Test DB',
  address: 'localhost:19191',
  host: 'localhost',
  port: '19191',
  color: '#4db6ac',
  active: true,
  connected: true,
  ...o,
})

describe('useQueryTabs', () => {
  let connection: Connection

  beforeEach(() => {
    resetQueryTabsState()
    connection = makeConn()
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
    addTab()
    addTab()

    expect(tabs.value).toHaveLength(3)
    expect(tabs.value.every((t) => t.connectionId === 'conn1')).toBe(true)
  })

  it('can add new tabs', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, activeTabId } = useQueryTabs(connectionRef)
    const initialCount = tabs.value.length
    addTab()

    expect(tabs.value).toHaveLength(initialCount + 1)
    expect(tabs.value[1]).toMatchObject({ name: 'Query 2', connectionId: 'conn1', query: '' })
    expect(activeTabId.value).toBe(tabs.value[1].id)
  })

  it('increments tab names correctly', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()
    addTab()
    addTab()

    expect(tabs.value.map((t) => t.name)).toEqual(['Query 1', 'Query 2', 'Query 3', 'Query 4'])
  })

  it('makes new tab active when added', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTabId, addTab } = useQueryTabs(connectionRef)
    const firstTabId = tabs.value[0].id
    addTab()
    expect(activeTabId.value).toBe(tabs.value[1].id)
    expect(activeTabId.value).not.toBe(firstTabId)
  })

  it('can close tabs when multiple exist', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)
    addTab()
    addTab()
    expect(tabs.value).toHaveLength(3)

    closeTab(tabs.value[1].id)
    expect(tabs.value).toHaveLength(2)
  })

  it('cannot close the last remaining tab', () => {
    const connectionRef = ref(connection)
    const { tabs, closeTab } = useQueryTabs(connectionRef)
    closeTab(tabs.value[0].id)
    expect(tabs.value).toHaveLength(1)
  })

  it('switches to another tab when closing active tab', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTabId, addTab, closeTab } = useQueryTabs(connectionRef)
    addTab()
    addTab()

    const secondTabId = tabs.value[1].id
    activeTabId.value = secondTabId
    closeTab(secondTabId)

    expect(tabs.value.find((t) => t.id === activeTabId.value)).toBeDefined()
    expect(tabs.value.length).toBe(2)
  })

  it('switches tabs when connection changes', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()
    expect(tabs.value).toHaveLength(2)

    connectionRef.value = makeConn({ id: 'conn2' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(tabs.value.length).toBeGreaterThanOrEqual(1)
  })

  it('creates new tab when switching to connection with no tabs', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()

    connectionRef.value = makeConn({ id: 'conn2' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(tabs.value.length).toBeGreaterThanOrEqual(1)
    if (tabs.value.length > 0) {
      expect(tabs.value[0].connectionId).toBe('conn2')
    }
  })

  it('preserves tabs for each connection separately', async () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()
    const conn1TabCount = tabs.value.length

    connectionRef.value = makeConn({ id: 'conn2' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(tabs.value.every((t) => t.connectionId === 'conn2')).toBe(true)

    connectionRef.value = connection
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(tabs.value.length).toBe(conn1TabCount)
    expect(tabs.value.every((t) => t.connectionId === 'conn1')).toBe(true)
  })

  it('maintains separate state per tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()

    tabs.value[0].query = 'SELECT * FROM table1'
    tabs.value[0].result = [{ id: 1 }]
    tabs.value[0].duration = 100
    tabs.value[0].error = 'Error 1'
    tabs.value[0].loading = true

    tabs.value[1].query = 'SELECT * FROM table2'
    tabs.value[1].result = [{ id: 2 }]
    tabs.value[1].duration = 200
    tabs.value[1].error = 'Error 2'
    tabs.value[1].loading = false

    expect(tabs.value[0].query).toBe('SELECT * FROM table1')
    expect(tabs.value[0].result).toEqual([{ id: 1 }])
    expect(tabs.value[0].duration).toBe(100)
    expect(tabs.value[0].error).toBe('Error 1')
    expect(tabs.value[0].loading).toBe(true)
    expect(tabs.value[1].query).toBe('SELECT * FROM table2')
    expect(tabs.value[1].result).toEqual([{ id: 2 }])
    expect(tabs.value[1].duration).toBe(200)
    expect(tabs.value[1].error).toBe('Error 2')
    expect(tabs.value[1].loading).toBe(false)
  })

  it('assigns unique IDs to each tab', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)
    addTab()
    addTab()
    addTab()

    const ids = tabs.value.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns active tab correctly', () => {
    const connectionRef = ref(connection)
    const { tabs, activeTab, activeTabId, addTab } = useQueryTabs(connectionRef)
    expect(activeTab.value).toBe(tabs.value[0])

    addTab()
    expect(activeTab.value).toBe(tabs.value[1])
    expect(activeTab.value?.id).toBe(activeTabId.value)
  })

  it('prevents closing tabs that are currently loading', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)
    addTab()

    tabs.value[1].loading = true
    closeTab(tabs.value[1].id)
    expect(tabs.value).toHaveLength(2)
  })

  it('allows closing tabs that are not loading', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab, closeTab } = useQueryTabs(connectionRef)
    addTab()

    const tabId = tabs.value[1].id
    tabs.value[1].loading = false
    closeTab(tabId)

    expect(tabs.value).toHaveLength(1)
    expect(tabs.value.find((t) => t.id === tabId)).toBeUndefined()
  })

  it('detects running queries for a connection', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)
    addTab()
    tabs.value[1].loading = true
    expect(hasRunningQueriesForConnection(connection.id)).toBe(true)
    tabs.value[1].loading = false
    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)
  })

  it('detects running queries only for specific connection', () => {
    const conn2 = makeConn({
      id: 'conn2',
      name: 'Test DB 2',
      address: 'localhost:19192',
      port: '19192',
      color: '#a5d6a7',
      active: false,
    })
    const connectionRef1 = ref(connection)
    const connectionRef2 = ref(conn2)

    useQueryTabs(connectionRef1)
    const { tabs: tabs2, addTab: addTab2 } = useQueryTabs(connectionRef2)

    addTab2()
    tabs2.value[0].loading = true

    expect(hasRunningQueriesForConnection(connection.id)).toBe(false)
    expect(hasRunningQueriesForConnection(conn2.id)).toBe(true)
  })

  it('initializes new tabs with correct defaults', () => {
    const connectionRef = ref(connection)
    const { tabs, addTab } = useQueryTabs(connectionRef)

    expect(tabs.value[0].loadingIndicator).toBe(false)
    expect(tabs.value[0].errorSpan).toBeNull()

    addTab()
    expect(tabs.value[1].loadingIndicator).toBe(false)
    expect(tabs.value[1].errorSpan).toBeNull()
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
})
