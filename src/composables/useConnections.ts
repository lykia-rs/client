import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { hasRunningQueriesForConnection } from './useQueryTabs'

export interface Connection {
  id: string
  name: string
  address: string
  host: string
  port: string
  color: string
  active: boolean
  connected: boolean
}

const CONNECTION_COLORS = ['#4db6ac', '#a5d6a7', '#81c784', '#64b5f6', '#ba68c8', '#ff8a65']

function makeConnection(
  id: string,
  host: string,
  port: string,
  color: string,
  overrides: Partial<Connection> = {},
): Connection {
  return {
    id,
    name: host,
    address: `${host}:${port}`,
    host,
    port,
    color,
    active: false,
    connected: false,
    ...overrides,
  }
}

export function useConnections() {
  const connections = ref<Connection[]>([
    makeConnection('1', 'localhost', '19191', CONNECTION_COLORS[0], { active: true }),
  ])

  const activeConnection = ref(connections.value[0])
  let colorIndex = 1

  async function testConnection(conn: Connection) {
    try {
      await invoke('test_connection', { address: conn.address })
      conn.connected = true
    } catch {
      conn.connected = false
    }
  }

  function selectConnection(conn: Connection) {
    connections.value.forEach((c) => (c.active = false))
    conn.active = true
    activeConnection.value = conn
  }

  async function addConnection(host: string, port: string) {
    await invoke('test_connection', { address: `${host}:${port}` })
    const color = CONNECTION_COLORS[colorIndex++ % CONNECTION_COLORS.length]
    const newConn = makeConnection(String(Date.now()), host, port, color, { connected: true })
    connections.value.push(newConn)
    selectConnection(newConn)
  }

  function removeConnection(id: string) {
    const index = connections.value.findIndex((c) => c.id === id)
    if (index === -1 || connections.value.length === 1) return
    if (hasRunningQueriesForConnection(id)) return

    connections.value.splice(index, 1)
    if (activeConnection.value.id === id) {
      selectConnection(connections.value[0])
    }
  }

  testConnection(connections.value[0])

  return {
    connections,
    activeConnection,
    testConnection,
    selectConnection,
    addConnection,
    removeConnection,
  }
}
