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

export function useConnections() {
  const connections = ref<Connection[]>([
    { 
      id: '1', 
      name: 'localhost', 
      address: 'localhost:19191', 
      host: 'localhost', 
      port: '19191', 
      color: CONNECTION_COLORS[0], 
      active: true, 
      connected: false 
    }
  ])

  const activeConnection = ref(connections.value[0])
  let colorIndex = 1 // Start from next color since we used the first one

  async function testConnection(conn: Connection) {
    try {
      await invoke('test_connection', { address: conn.address })
      conn.connected = true
    } catch {
      conn.connected = false
    }
  }

  function selectConnection(conn: Connection) {
    connections.value.forEach(c => c.active = false)
    conn.active = true
    activeConnection.value = conn
  }

  async function addConnection(host: string, port: string) {
    const address = `${host}:${port}`
    
    // Test connection first - this will throw if it fails
    await invoke('test_connection', { address })
    
    // Only add if connection succeeds
    const id = String(Date.now())
    const color = CONNECTION_COLORS[colorIndex % CONNECTION_COLORS.length]
    colorIndex++
    
    const newConn: Connection = {
      id,
      name: host,
      address,
      host,
      port,
      color,
      active: false,
      connected: true
    }
    
    connections.value.push(newConn)
    selectConnection(newConn)
  }

  function removeConnection(id: string) {
    const index = connections.value.findIndex(c => c.id === id)
    if (index === -1 || connections.value.length === 1) return
    
    // Prevent removing connections with running queries
    if (hasRunningQueriesForConnection(id)) return
    
    connections.value.splice(index, 1)
    if (activeConnection.value.id === id) {
      selectConnection(connections.value[0])
    }
  }

  // Test initial connection
  testConnection(connections.value[0])

  return {
    connections,
    activeConnection,
    testConnection,
    selectConnection,
    addConnection,
    removeConnection
  }
}
