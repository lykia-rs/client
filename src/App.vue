<script setup lang="ts">
import { ref } from 'vue'
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
}

const CONNECTION_COLORS = ['#4db6ac', '#a5d6a7', '#81c784', '#64b5f6', '#ba68c8', '#ff8a65']
let colorIndex = 0

const connections = ref<Connection[]>([
  { id: '1', name: 'localhost', address: 'localhost:19191', host: 'localhost', port: '19191', color: CONNECTION_COLORS[0], active: true }
])

// Start from next color since we used the first one
colorIndex = 1

const activeConnection = ref(connections.value[0])
const showConnectionDialog = ref(false)

function selectConnection(conn: Connection) {
  connections.value.forEach(c => c.active = false)
  conn.active = true
  activeConnection.value = conn
}

function addConnection(host: string, port: string) {
  const id = String(Date.now())
  const color = CONNECTION_COLORS[colorIndex % CONNECTION_COLORS.length]
  colorIndex++
  
  const newConn: Connection = {
    id,
    name: host,
    address: `${host}:${port}`,
    host,
    port,
    color,
    active: false
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
      @submit="addConnection"
      @close="showConnectionDialog = false"
    />
  </div>
</template>

<style>
@import 'splitpanes/dist/splitpanes.css';

.splitpanes.splitpanes--vertical > .splitpanes__splitter,
.splitpanes .splitpanes__splitter {
  background-color: #3f3f3f !important;
  border: none !important;
}

.splitpanes.splitpanes--vertical > .splitpanes__splitter:hover,
.splitpanes .splitpanes__splitter:hover {
  background-color: #1a1a1a !important;
}

.splitpanes--vertical > .splitpanes__splitter {
  width: 1px !important;
}

.splitpanes--horizontal > .splitpanes__splitter {
  height: 1px !important;
}
</style>
