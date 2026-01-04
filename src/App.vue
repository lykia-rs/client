<script setup lang="ts">
import { ref } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
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
  <div class="h-screen w-screen bg-zinc-950 text-zinc-100">
    <Splitpanes>
      <Pane :size="20" :min-size="15" :max-size="40">
        <ConnectionPanel 
          :connections="connections" 
          @select="selectConnection"
        />
      </Pane>
      
      <Pane :size="80">
        <QueryPanel :connection="activeConnection" />
      </Pane>
    </Splitpanes>
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
