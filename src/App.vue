<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Splitpanes, Pane } from 'splitpanes'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import QueryPanel from '@/components/QueryPanel.vue'
import ConnectionDialog from '@/components/ConnectionDialog.vue'

interface Connection {
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
let colorIndex = 0

const connections = ref<Connection[]>([
  { id: '1', name: 'localhost', address: 'localhost:19191', host: 'localhost', port: '19191', color: CONNECTION_COLORS[0], active: true, connected: false }
])

// Start from next color since we used the first one
colorIndex = 1

const activeConnection = ref(connections.value[0])
const showConnectionDialog = ref(false)

// Test initial connection
testConnection(connections.value[0])

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
  showConnectionDialog.value = false
}

function removeConnection(id: string) {
  const index = connections.value.findIndex(c => c.id === id)
  if (index === -1 || connections.value.length === 1) return
  
  connections.value.splice(index, 1)
  if (activeConnection.value.id === id) {
    selectConnection(connections.value[0])
  }
}
</script>

<template>
  <div class="h-screen w-screen bg-zinc-950 text-zinc-100">
    <Splitpanes>
      <Pane :size="20" :min-size="15" :max-size="40">
        <ConnectionPanel 
          :connections="connections" 
          @select="selectConnection"
          @add="showConnectionDialog = true"
          @remove="removeConnection"
        />
      </Pane>
      
      <Pane :size="80">
        <QueryPanel :connection="activeConnection" />
      </Pane>
    </Splitpanes>
    
    <ConnectionDialog 
      v-if="showConnectionDialog"
      :on-connect="addConnection"
      @close="showConnectionDialog = false"
    />
  </div>
</template>

<style>
@import 'splitpanes/dist/splitpanes.css';
</style>
