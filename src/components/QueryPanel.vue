<script setup lang="ts">
import { toRef } from 'vue'
import { Play, Loader2, Plus, X, Clock } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Button from '@/components/ui/Button.vue'
import ResultTable from '@/components/ResultTable.vue'
import { cn } from '@/lib/utils'
import { useQueryTabs } from '@/composables/useQueryTabs'
import { useQueryExecution } from '@/composables/useQueryExecution'
import type { Connection } from '@/composables/useConnections'

const props = defineProps<{
  connection: Connection
}>()

const connectionRef = toRef(props, 'connection')
const { tabs, activeTab, activeTabId, addTab, closeTab } = useQueryTabs(connectionRef)
const { executeQuery: executeQueryFn } = useQueryExecution()

async function executeQuery() {
  if (activeTab.value) {
    await executeQueryFn(activeTab.value, props.connection)
  }
}
</script>

<template>
  <Splitpanes horizontal class="h-full">
    <!-- Query Editor with Tabs -->
    <Pane :size="40" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-900">
        <!-- Tabs Header -->
        <div class="flex items-center gap-1 px-2 py-1 border-b border-zinc-800/30 bg-zinc-800">
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
            
            <!-- Show spinner when loading, close button when not -->
            <Loader2
              v-if="tab.loading"
              :size="14"
              class="animate-spin"
              :style="{ color: connection.color }"
            />
            <button
              v-else-if="tabs.length > 1"
              @click.stop="closeTab(tab.id)"
              class="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200 hover:scale-110"
              title="Close tab"
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
          :disabled="activeTab.loading"
          :readonly="activeTab.loading"
          placeholder="Enter your query here..."
          :class="[
            'flex-1 px-4 py-3 bg-zinc-850 text-zinc-100 font-mono text-sm resize-none outline-none placeholder:text-zinc-600 transition-opacity duration-200',
            activeTab.loading ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        />
      </div>
    </Pane>

    <!-- Results -->
    <Pane :size="60" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-900">
        <!-- Loading Bar -->
        <div 
          v-if="activeTab?.loading" 
          class="h-0.5 w-full relative overflow-hidden"
          :style="{ backgroundColor: connection.color + '40' }"
        >
          <div 
            class="absolute inset-0 w-full h-full loading-shimmer"
            :style="{ 
              background: `linear-gradient(90deg, transparent 0%, ${connection.color} 50%, transparent 100%)`,
              boxShadow: `0 0 8px ${connection.color}`
            }"
          />
        </div>
        
        <div class="px-4 py-2 border-b border-zinc-800/30 bg-zinc-800">
          <h3 class="text-sm font-semibold">Results</h3>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <div v-if="activeTab?.error" class="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono">
            {{ activeTab.error }}
          </div>
          
          <div v-else-if="!activeTab?.result && !activeTab?.loading" class="text-zinc-500 text-sm">
            Execute a query to see results
          </div>
          
          <ResultTable v-else-if="activeTab?.result" :data="activeTab.result" :is-locked="activeTab?.loading" />
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

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.loading-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
