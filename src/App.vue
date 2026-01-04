<script setup lang="ts">
import { ref } from 'vue'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import QueryPanel from '@/components/QueryPanel.vue'

const connections = ref([
  { id: '1', name: 'localhost', address: 'localhost:19191', active: true }
])
const activeConnection = ref(connections.value[0])

function selectConnection(conn: typeof connections.value[0]) {
  connections.value.forEach(c => c.active = false)
  conn.active = true
  activeConnection.value = conn
}
</script>

<template>
  <div class="flex h-screen w-screen bg-zinc-950 text-zinc-100">
    <ConnectionPanel 
      :connections="connections" 
      @select="selectConnection"
      class="w-64 border-r border-zinc-800"
    />
    <QueryPanel 
      :connection="activeConnection"
      class="flex-1"
    />
  </div>
</template>
