import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { useConnections, resetConnectionsState } from './useConnections'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

vi.mock('./useQueryTabs', () => ({
  hasRunningQueriesForConnection: vi.fn(() => false),
  useQueryTabs: vi.fn(),
}))

const extraConn = {
  id: '2',
  name: 'test',
  address: 'test:8080',
  host: 'test',
  port: '8080',
  color: '#ffffff',
  active: false,
  connected: true,
}

describe('useConnections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetConnectionsState()
  })

  it('initializes with default localhost connection', () => {
    const { connections, activeConnection } = useConnections()

    expect(connections.value).toHaveLength(1)
    expect(connections.value[0]).toMatchObject({
      id: '1',
      name: 'localhost',
      address: 'localhost:19191',
      host: 'localhost',
      port: '19191',
      active: true,
      connected: false,
    })
    expect(connections.value[0].color).toBeDefined()
    expect(activeConnection.value).toBe(connections.value[0])
  })

  it('tests initial connection on creation', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    useConnections()
    await flushPromises()
    expect(invoke).toHaveBeenCalledWith('test_connection', { address: 'localhost:19191' })
  })

  it.each([
    ['succeeds', () => vi.mocked(invoke).mockResolvedValue(undefined), true],
    ['fails', () => vi.mocked(invoke).mockRejectedValue(new Error('Connection failed')), false],
  ])('sets connected correctly when connection test %s', async (_, setup, expected) => {
    setup()
    const { connections } = useConnections()
    await flushPromises()
    expect(connections.value[0].connected).toBe(expected)
  })

  it('can select a different connection', () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, activeConnection, selectConnection } = useConnections()
    connections.value.push({ ...extraConn })
    selectConnection(connections.value[1])

    expect(connections.value[0].active).toBe(false)
    expect(connections.value[1].active).toBe(true)
    expect(activeConnection.value).toStrictEqual(connections.value[1])
  })

  it('adds a new connection successfully', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, activeConnection, addConnection } = useConnections()

    await addConnection('newhost', '9999')
    await flushPromises()

    expect(connections.value).toHaveLength(2)
    expect(connections.value[1]).toMatchObject({
      name: 'newhost',
      address: 'newhost:9999',
      host: 'newhost',
      port: '9999',
      connected: true,
    })
    expect(connections.value[1].id).toBeDefined()
    expect(connections.value[1].color).toBeDefined()
    expect(activeConnection.value).toBe(connections.value[1])
  })

  it('tests connection before adding', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { addConnection } = useConnections()
    await addConnection('testhost', '8888')
    expect(invoke).toHaveBeenCalledWith('test_connection', { address: 'testhost:8888' })
  })

  it('throws error if connection test fails during add', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Connection failed'))
    const { addConnection } = useConnections()
    await expect(addConnection('badhost', '9999')).rejects.toThrow()
  })

  it('assigns different colors to connections', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, addConnection } = useConnections()
    const firstColor = connections.value[0].color

    await addConnection('host1', '8080')
    await addConnection('host2', '8081')
    await addConnection('host3', '8082')

    const colors = connections.value.map((c) => c.color)
    expect(new Set(colors).size).toBeGreaterThan(1)
    expect(colors[0]).toBe(firstColor)
  })

  it('removes a connection', () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, removeConnection } = useConnections()
    connections.value.push({ ...extraConn })

    removeConnection('2')
    expect(connections.value).toHaveLength(1)
    expect(connections.value.find((c) => c.id === '2')).toBeUndefined()
  })

  it('switches to first connection when removing active connection', () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, activeConnection, removeConnection, selectConnection } = useConnections()
    connections.value.push({ ...extraConn })
    selectConnection(connections.value[1])

    expect(activeConnection.value.id).toBe('2')
    removeConnection('2')
    expect(activeConnection.value.id).toBe('1')
  })

  it('does not remove the last connection', () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, removeConnection } = useConnections()
    removeConnection('1')
    expect(connections.value).toHaveLength(1)
  })

  it('does nothing when removing non-existent connection', () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, removeConnection } = useConnections()
    const len = connections.value.length
    removeConnection('999')
    expect(connections.value).toHaveLength(len)
  })

  it('can test a connection manually', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, testConnection } = useConnections()
    connections.value[0].connected = false
    await testConnection(connections.value[0])
    expect(connections.value[0].connected).toBe(true)
  })

  it('handles manual connection test failure', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Failed'))
    const { connections, testConnection } = useConnections()
    await flushPromises()

    connections.value[0].connected = true
    await testConnection(connections.value[0])
    expect(connections.value[0].connected).toBe(false)
  })

  it('makes new connection active when added', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { connections, activeConnection, addConnection } = useConnections()
    const firstConn = connections.value[0]
    expect(activeConnection.value).toBe(firstConn)

    await addConnection('newhost', '9999')
    expect(firstConn.active).toBe(false)
    expect(connections.value[1].active).toBe(true)
    expect(activeConnection.value).toBe(connections.value[1])
  })

  it('prevents removing connection with running queries', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { hasRunningQueriesForConnection } = await import('./useQueryTabs')
    vi.mocked(hasRunningQueriesForConnection).mockReturnValue(true)

    const { connections, addConnection, removeConnection } = useConnections()
    await addConnection('test', '8080')
    await flushPromises()
    expect(connections.value).toHaveLength(2)

    removeConnection(connections.value[1].id)
    expect(connections.value).toHaveLength(2)
  })

  it('allows removing connection without running queries', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { hasRunningQueriesForConnection } = await import('./useQueryTabs')
    vi.mocked(hasRunningQueriesForConnection).mockReturnValue(false)

    const { connections, addConnection, removeConnection } = useConnections()
    await addConnection('test', '8080')
    await flushPromises()
    expect(connections.value).toHaveLength(2)

    const id = connections.value[1].id
    removeConnection(id)
    expect(connections.value).toHaveLength(1)
    expect(connections.value.find((c) => c.id === id)).toBeUndefined()
  })
})
