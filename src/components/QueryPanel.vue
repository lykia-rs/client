<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Play, Loader2 } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Button from '@/components/ui/Button.vue'
import ResultTable from '@/components/ResultTable.vue'

interface Connection {
  id: string
  name: string
  address: string
}

const props = defineProps<{
  connection: Connection
}>()

const query = ref('')
const result = ref<any>(null)
const loading = ref(false)
const error = ref('')

async function executeQuery() {
  if (!query.value.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const res = await invoke<any>('execute_query', {
      address: props.connection.address,
      query: query.value
    })
    
    if (res.success) {
      result.value = res.data
    } else {
      error.value = res.error || 'Query failed'
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Splitpanes horizontal class="h-full">
    <!-- Query Editor -->
    <Pane :size="40" :min-size="20">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-4 py-2 border-b border-zinc-800/30 bg-zinc-900">
          <h3 class="text-sm font-semibold">Query</h3>
          <Button 
            @click="executeQuery"
            :disabled="loading || !query.trim()"
            size="sm"
            class="gap-2"
          >
            <Loader2 v-if="loading" :size="14" class="animate-spin" />
            <Play v-else :size="14" />
            {{ loading ? 'Running...' : 'Execute' }}
          </Button>
        </div>
        
        <textarea
          v-model="query"
          placeholder="Enter your query here..."
          class="flex-1 px-4 py-3 bg-zinc-950 text-zinc-100 font-mono text-sm resize-none outline-none placeholder:text-zinc-600"
        />
      </div>
    </Pane>

    <!-- Results -->
    <Pane :size="60" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-950 overflow-hidden">
        <div class="px-4 py-2 border-b border-zinc-800/30 bg-zinc-900">
          <h3 class="text-sm font-semibold">Results</h3>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <div v-if="error" class="p-4 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm font-mono">
            {{ error }}
          </div>
          
          <div v-else-if="!result && !loading" class="text-zinc-500 text-sm">
            Execute a query to see results
          </div>
          
          <ResultTable v-else-if="result" :data="result" />
        </div>
      </div>
    </Pane>
  </Splitpanes>
</template>
