<script setup lang="ts">
import { toRef } from 'vue'
import { Play, Loader2, Plus, X, Clock } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Button from '@/components/ui/Button.vue'
import ResultTable from '@/components/ResultTable.vue'
import CodeEditor from '@/components/CodeEditor.vue'
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
      <div class="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900">
        <!-- Tabs Header -->
        <div class="flex h-10 items-stretch bg-zinc-200 dark:bg-zinc-950 border-b border-zinc-300/70 dark:border-zinc-800/60 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTabId = tab.id"
            :class="cn(
              'group relative flex items-center gap-1.5 px-4 text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 border-r border-zinc-300/50 dark:border-zinc-800/40',
              activeTabId === tab.id 
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100' 
                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
            )"
          >
            <div 
              class="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-150"
              :style="{ backgroundColor: activeTabId === tab.id ? connection.color : 'transparent' }"
            />
            <span class="font-medium tracking-wide">{{ tab.name }}</span>
            
            <!-- Show spinner when loading, close button when not -->
            <Loader2
              v-if="tab.loading"
              :size="12"
              class="animate-spin ml-0.5"
              :style="{ color: connection.color }"
            />
            <button
              v-else-if="tabs.length > 1"
              @click.stop="closeTab(tab.id)"
              class="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 ml-0.5"
              title="Close tab"
            >
              <X :size="12" />
            </button>
          </button>
          
          <button
            @click="addTab"
            class="flex items-center justify-center w-9 shrink-0 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/60 transition-all duration-150 border-r border-zinc-300/40 dark:border-zinc-800/30"
            title="New Query"
          >
            <Plus :size="13" />
          </button>
          
          <div class="flex-1 min-w-0" />
          
          <div class="flex items-center px-3 shrink-0 border-l border-zinc-300/40 dark:border-zinc-800/30">
            <Button 
              @click="executeQuery"
              :disabled="activeTab?.loading || !activeTab?.query.trim()"
              size="sm"
              class="gap-1.5 text-xs font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              :style="{ 
                backgroundColor: connection.color, 
                borderColor: connection.color,
              }"
            >
              <Loader2 v-if="activeTab?.loading" :size="12" class="animate-spin" />
              <Play v-else :size="12" fill="currentColor" />
              {{ activeTab?.loading ? 'Running...' : 'Execute' }}
            </Button>
          </div>
        </div>
        
        <CodeEditor
          v-if="activeTab"
          v-model="activeTab.query"
          :disabled="activeTab.loading"
          :readonly="activeTab.loading"
          placeholder="Enter your query here..."
        />
      </div>
    </Pane>

    <!-- Results -->
    <Pane :size="60" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900">
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
        
        <div class="px-4 h-8 flex items-center border-b border-zinc-300/60 dark:border-zinc-800/30 bg-zinc-200/70 dark:bg-zinc-950/80">
          <span class="text-label font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Results</span>
        </div>
        
        <div class="flex-1 overflow-hidden flex flex-col">
          <div v-if="activeTab?.error" class="p-4 bg-red-100 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 text-sm font-mono m-4">
            {{ activeTab.error }}
          </div>
          
          <div v-else-if="!activeTab?.result && !activeTab?.loading" class="text-ui text-zinc-400 dark:text-zinc-600 p-6">
            Execute a query to see results
          </div>
          
          <div v-else-if="activeTab?.result" class="flex-1 overflow-hidden">
            <ResultTable :data="activeTab.result" :is-locked="activeTab?.loading" />
          </div>
        </div>
        
        <!-- Status Bar -->
        <div 
          v-if="activeTab?.duration !== null && activeTab?.duration !== undefined"
          class="px-4 h-8 border-t border-zinc-300/60 dark:border-zinc-800/30 bg-zinc-100/80 dark:bg-zinc-950/80 flex items-center gap-1.5"
        >
          <Clock :size="12" class="text-zinc-400 dark:text-zinc-500" />
          <span class="text-label text-zinc-400 dark:text-zinc-500">Execution time:</span>
          <span 
            class="text-label font-semibold font-mono"
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
