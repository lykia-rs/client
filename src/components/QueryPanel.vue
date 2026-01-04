<script setup lang="ts">
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Play, Loader2, Plus, X } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Button from '@/components/ui/Button.vue'
import ResultTable from '@/components/ResultTable.vue'
import { cn } from '@/lib/utils'

interface Connection {
  id: string
  name: string
  address: string
}

interface QueryTab {
  id: string
  name: string
  query: string
  result: any
  error: string
  loading: boolean
}

const props = defineProps<{
  connection: Connection
}>()

let tabIdCounter = 0
const tabs = ref<QueryTab[]>([
  { id: '0', name: 'Query 1', query: '', result: null, error: '', loading: false }
])
const activeTabId = ref('0')

const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))

function addTab() {
  tabIdCounter++
  const newTab: QueryTab = {
    id: String(tabIdCounter),
    name: `Query ${tabIdCounter + 1}`,
    query: '',
    result: null,
    error: '',
    loading: false
  }
  tabs.value.push(newTab)
  activeTabId.value = newTab.id
}

function closeTab(id: string) {
  if (tabs.value.length === 1) return
  
  const index = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(index, 1)
  
  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)].id
  }
}

async function executeQuery() {
  const tab = activeTab.value
  if (!tab || !tab.query.trim()) return
  
  tab.loading = true
  tab.error = ''
  tab.result = null
  
  try {
    const res = await invoke<any>('execute_query', {
      address: props.connection.address,
      query: tab.query
    })
    
    if (res.success) {
      tab.result = res.data
    } else {
      tab.error = res.error || 'Query failed'
    }
  } catch (e) {
    tab.error = String(e)
  } finally {
    tab.loading = false
  }
}
</script>

<template>
  <Splitpanes horizontal class="h-full">
    <!-- Query Editor with Tabs -->
    <Pane :size="40" :min-size="20">
      <div class="flex flex-col h-full">
        <!-- Tabs Header -->
        <div class="flex items-center gap-1 px-2 py-1 border-b border-zinc-800/30 bg-zinc-900">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTabId = tab.id"
            :class="cn(
              'group flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors',
              activeTabId === tab.id 
                ? 'bg-zinc-800 text-zinc-100' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            )"
          >
            <span>{{ tab.name }}</span>
            <button
              v-if="tabs.length > 1"
              @click.stop="closeTab(tab.id)"
              class="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <X :size="14" />
            </button>
          </button>
          
          <button
            @click="addTab"
            class="ml-1 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="New Query"
          >
            <Plus :size="16" />
          </button>
          
          <div class="flex-1" />
          
          <Button 
            @click="executeQuery"
            :disabled="activeTab?.loading || !activeTab?.query.trim()"
            size="sm"
            class="gap-2"
          >
            <Loader2 v-if="activeTab?.loading" :size="14" class="animate-spin" />
            <Play v-else :size="14" />
            {{ activeTab?.loading ? 'Running...' : 'Execute' }}
          </Button>
        </div>
        
        <textarea
          v-if="activeTab"
          v-model="activeTab.query"
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
          <div v-if="activeTab?.error" class="p-4 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm font-mono">
            {{ activeTab.error }}
          </div>
          
          <div v-else-if="!activeTab?.result && !activeTab?.loading" class="text-zinc-500 text-sm">
            Execute a query to see results
          </div>
          
          <ResultTable v-else-if="activeTab?.result" :data="activeTab.result" />
        </div>
      </div>
    </Pane>
  </Splitpanes>
</template>
