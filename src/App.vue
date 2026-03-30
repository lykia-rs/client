<script setup lang="ts">
import { ref } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import QueryPanel from '@/components/QueryPanel.vue'
import ConnectionDialog from '@/components/ConnectionDialog.vue'
import { useConnections } from '@/composables/useConnections'
import { hasRunningQueriesForConnection } from '@/composables/useQueryTabs'

const showConnectionDialog = ref(false)

const {
  connections,
  activeConnection,
  selectConnection,
  addConnection,
  removeConnection
} = useConnections()

async function handleAddConnection(host: string, port: string) {
  await addConnection(host, port)
  showConnectionDialog.value = false
}
</script>

<template>
  <div class="h-screen w-screen bg-background text-foreground transition-colors duration-200">
    <Splitpanes>
      <Pane :size="20" :min-size="15" :max-size="40">
        <ConnectionPanel 
          :connections="connections" 
          :has-running-queries="hasRunningQueriesForConnection"
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
      :connect-handler="handleAddConnection"
      @close="showConnectionDialog = false"
    />
  </div>
</template>

<style>
@import 'splitpanes/dist/splitpanes.css';
</style>
