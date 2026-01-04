<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Play, Loader2, Plus, X, Clock } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Button from '@/components/ui/Button.vue'
import ResultTable from '@/components/ResultTable.vue'
import { cn } from '@/lib/utils'

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

interface QueryTab {
  id: string
  name: string
  query: string
  result: any
  error: string
  loading: boolean
  connectionId: string
  duration: number | null
}

const props = defineProps<{
  connection: Connection
}>()

let tabIdCounter = 0
const allTabs = ref<QueryTab[]>([
  { id: '0', name: 'Query 1', query: '', result: null, error: '', loading: false, connectionId: props.connection.id, duration: null }
])
const activeTabId = ref('0')

const tabs = computed(() => allTabs.value.filter(t => t.connectionId === props.connection.id))
const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))

watch(() => props.connection.id, () => {
  const firstTab = tabs.value[0]
  if (firstTab) {
    activeTabId.value = firstTab.id
  } else {
    addTab()
  }
})

function addTab() {
  tabIdCounter++
  const connTabs = tabs.value
  const newTab: QueryTab = {
    id: String(Date.now()),
    name: `Query ${connTabs.length + 1}`,
    query: '',
    result: null,
    error: '',
    loading: false,
    connectionId: props.connection.id,
    duration: null
  }
  allTabs.value.push(newTab)
  activeTabId.value = newTab.id
}

function closeTab(id: string) {
  if (tabs.value.length === 1) return
  
  const index = allTabs.value.findIndex(t => t.id === id)
  allTabs.value.splice(index, 1)
  
  if (activeTabId.value === id) {
    const connTabs = tabs.value
    activeTabId.value = connTabs[Math.max(0, Math.min(index, connTabs.length - 1))]?.id || connTabs[0]?.id
  }
}

async function executeQuery() {
  const tab = activeTab.value
  if (!tab || !tab.query.trim()) return
  
  tab.loading = true
  tab.error = ''
  tab.result = null
  tab.duration = null
  
  try {
    const res = await invoke<any>('execute_query', {
      address: props.connection.address,
      query: tab.query
    })
    
    tab.duration = res.duration
    
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
  <Splitpanes horizontal class="h-full rounded-lg overflow-hidden">
    <!-- Query Editor with Tabs -->
    <Pane :size="40" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-900">
        <!-- Tabs Header -->
        <div class="flex items-center gap-1 px-2 py-1 border-b border-zinc-800/30 bg-zinc-900">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTabId = tab.id"
            :class="cn(
              'group relative flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200',
              activeTabId === tab.id 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            )"
          >
            <div 
              class="absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-200"
              :style="{ 
                backgroundColor: activeTabId === tab.id ? connection.color : 'transparent',
                boxShadow: activeTabId === tab.id ? `0 0 8px ${connection.color}40` : 'none'
              }"
            />
            <span class="ml-1">{{ tab.name }}</span>
            <button
              v-if="tabs.length > 1"
              @click.stop="closeTab(tab.id)"
              class="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200 hover:scale-110"
            >
              <X :size="14" />
            </button>
          </button>
          
          <button
            @click="addTab"
            class="ml-1 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-105"
            title="New Query"
          >
            <Plus :size="16" />
          </button>
          
          <div class="flex-1" />
          
          <Button 
            @click="executeQuery"
            :disabled="activeTab?.loading || !activeTab?.query.trim()"
            size="sm"
            class="gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{ 
              backgroundColor: connection.color, 
              borderColor: connection.color,
              boxShadow: `0 0 0 0 ${connection.color}40`
            }"
            @mouseenter="(e: MouseEvent) => !activeTab?.loading && ((e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${connection.color}80`)"
            @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${connection.color}40`)"
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
          <div v-if="activeTab?.error" class="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono">
            {{ activeTab.error }}
          </div>
          
          <div v-else-if="!activeTab?.result && !activeTab?.loading" class="text-zinc-500 text-sm">
            Execute a query to see results
          </div>
          
          <ResultTable v-else-if="activeTab?.result" :data="activeTab.result" />
        </div>
        
        <!-- Status Bar -->
        <div 
          v-if="activeTab?.duration !== null && activeTab?.duration !== undefined"
          class="px-4 py-2 border-t border-zinc-800/30 bg-zinc-900 flex items-center gap-2 text-xs"
        >
          <Clock :size="14" class="text-zinc-400" />
          <span class="text-zinc-400">Execution time:</span>
          <span 
            class="font-medium font-mono"
            :style="{ color: connection.color }"
          >{{ activeTab.duration }}ms</span>
        </div>
      </div>
    </Pane>
  </Splitpanes>
</template>
