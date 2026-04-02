<script setup lang="ts">
import { toRef, ref, watch, computed } from 'vue'
import { Play, Loader2, Plus, X, Clock, AlertCircle, LayoutList, Table2, Braces } from 'lucide-vue-next'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import ResultPanel from '@/components/results/ResultPanel.vue'
import QueryEditor from '@/components/query/QueryEditor.vue'
import { cn } from '@/lib/utils'
import { useQueryTabs } from '@/composables/useQueryTabs'
import { useQueryExecution } from '@/composables/useQueryExecution'
import { useSettings } from '@/composables/useSettings'
import type { Connection } from '@/composables/useConnections'

const props = defineProps<{
  connection: Connection
}>()

const connectionRef = toRef(props, 'connection')
const { tabs, activeTab, activeTabId, addTab, closeTab } = useQueryTabs(connectionRef)
const { executeQuery: executeQueryFn } = useQueryExecution()
const { settings } = useSettings()

const editorRef = ref<InstanceType<typeof QueryEditor> | null>(null)
const hasLocalError = ref(false)
const parseErrorMessage = ref('')

const statusBarError = computed(() => {
  if (activeTab.value?.error && activeTab.value?.errorSpan) return activeTab.value.error
  return ''
})

watch(
  () => activeTab.value?.errorSpan,
  (span) => {
    if (span) {
      editorRef.value?.showErrors?.([
        { from: span.from, to: span.to, message: activeTab.value?.error ?? '', severity: 'error' },
      ])
    } else {
      editorRef.value?.hideErrors?.()
    }
  },
)

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
        <div
          class="flex h-10 items-stretch bg-zinc-200 dark:bg-zinc-950 border-b border-zinc-300/70 dark:border-zinc-800/60 overflow-x-auto"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="
              cn(
                'group relative flex items-center gap-1.5 px-4 text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 border-r border-zinc-300/50 dark:border-zinc-800/40',
                activeTabId === tab.id
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/50',
              )
            "
            @click="activeTabId = tab.id"
          >
            <div
              class="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-150"
              :style="{
                backgroundColor: activeTabId === tab.id ? connection.color : 'transparent',
              }"
            />
            <span class="font-medium tracking-wide">{{ tab.name }}</span>

            <!-- Show spinner when loading indicator is active, close button when not -->
            <Loader2
              v-if="tab.loadingIndicator"
              :size="12"
              class="animate-spin ml-0.5"
              :style="{ color: connection.color }"
            />
            <button
              v-else-if="tabs.length > 1 && !tab.loading"
              class="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 ml-0.5"
              title="Close tab"
              @click.stop="closeTab(tab.id)"
            >
              <X :size="12" />
            </button>
          </button>

          <button
            class="flex items-center justify-center w-9 shrink-0 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/60 transition-all duration-150 border-r border-zinc-300/40 dark:border-zinc-800/30"
            title="New Query"
            @click="addTab"
          >
            <Plus :size="13" />
          </button>

          <div class="flex-1 min-w-0" />

          <div
            class="flex items-center shrink-0 border-l border-zinc-300/40 dark:border-zinc-800/30"
          >
            <button
              data-testid="execute-button"
              :disabled="activeTab?.loading || !activeTab?.query.trim() || hasLocalError"
              class="flex items-center gap-1.5 h-full px-4 text-xs font-semibold tracking-wide text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              :style="{ backgroundColor: connection.color }"
              @click="executeQuery"
            >
              <Loader2 v-if="activeTab?.loadingIndicator" :size="12" class="animate-spin" />
              <Play v-else :size="12" fill="currentColor" />
              {{ activeTab?.loadingIndicator ? 'Running...' : 'Execute' }}
            </button>
          </div>
        </div>

        <QueryEditor
          v-if="activeTab"
          ref="editorRef"
          v-model="activeTab.query"
          :disabled="activeTab.loading"
          :readonly="activeTab.loading"
          :dimmed="activeTab.loadingIndicator"
          :line-numbers="settings.showLineNumbers"
          placeholder="Enter your query here..."
          @parse-error="hasLocalError = $event"
          @parse-error-message="parseErrorMessage = $event"
        />

        <!-- Editor Status Bar (parse errors) -->
        <div
          v-if="parseErrorMessage"
          class="px-4 h-7 border-t border-red-300/40 dark:border-red-900/30 bg-red-50/80 dark:bg-red-950/20 flex items-center gap-1.5"
        >
          <AlertCircle :size="11" class="text-red-500 shrink-0" />
          <span class="text-label text-red-500 truncate">{{ parseErrorMessage }}</span>
        </div>
      </div>
    </Pane>

    <!-- Results -->
    <Pane :size="60" :min-size="20">
      <div class="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900">
        <!-- Loading Bar (always reserves space to prevent layout shift) -->
        <div class="h-0.5 w-full relative overflow-hidden">
          <div
            v-if="activeTab?.loadingIndicator"
            class="absolute inset-0 w-full h-full loading-shimmer"
            :style="{
              background: `linear-gradient(90deg, transparent 0%, ${connection.color} 50%, transparent 100%)`,
              boxShadow: `0 0 8px ${connection.color}`,
            }"
          />
        </div>

        <div
          class="px-4 h-8 flex items-center border-b border-border/60 bg-zinc-200/70 dark:bg-zinc-950/80"
        >
          <span class="text-label font-semibold uppercase tracking-widest text-muted-foreground"
            >Results</span
          >
          <div class="flex-1" />
          <div v-if="activeTab?.result" class="flex items-center gap-0.5">
            <button
              v-for="m in (['list', 'table', 'json'] as const)"
              :key="m"
              :class="[
                'p-1 rounded transition-colors',
                activeTab?.viewMode === m
                  ? 'text-zinc-800 dark:text-zinc-200 bg-zinc-300/60 dark:bg-zinc-700/60'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300',
              ]"
              :title="m === 'list' ? 'List view' : m === 'table' ? 'Table view' : 'JSON view'"
              @click="activeTab!.viewMode = m"
            >
              <LayoutList v-if="m === 'list'" :size="14" />
              <Table2 v-else-if="m === 'table'" :size="14" />
              <Braces v-else :size="14" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col">
          <div
            v-if="activeTab?.error"
            class="p-4 bg-red-100 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 text-sm font-mono m-4"
          >
            {{ activeTab.error }}
          </div>

          <div
            v-else-if="!activeTab?.result && !activeTab?.loading"
            class="flex-1 flex items-center justify-center"
          >
            <span class="text-sm text-zinc-400 dark:text-zinc-600"
              >Execute a query to see results</span
            >
          </div>

          <div v-else-if="activeTab?.result" class="flex-1 overflow-hidden">
            <ResultPanel :data="activeTab.result" :is-locked="activeTab?.loading" :show-overlay="activeTab?.loadingIndicator" :view-mode="activeTab.viewMode" />
          </div>
        </div>

        <!-- Status Bar -->
        <div
          class="px-4 h-8 border-t border-border/60 bg-zinc-100/80 dark:bg-zinc-950/80 flex items-center gap-1.5"
        >
          <template v-if="statusBarError">
            <AlertCircle :size="12" class="text-red-500 shrink-0" />
            <span class="text-label text-red-500 truncate">{{ statusBarError }}</span>
          </template>
          <template v-else-if="activeTab?.duration !== null && activeTab?.duration !== undefined">
            <Clock :size="12" class="text-zinc-400 dark:text-zinc-500" />
            <span class="text-label text-zinc-400 dark:text-zinc-500">Execution time:</span>
            <span class="text-label font-semibold font-mono" :style="{ color: connection.color }"
              >{{ activeTab.duration }}ms</span
            >
          </template>
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
