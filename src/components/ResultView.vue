<script setup lang="ts">
import { computed } from 'vue'
import ResultTable from '@/components/ResultTable.vue'
import JsonTreeView from '@/components/JsonTreeView.vue'
import type { QueryResult, QueryResultRow, ResultViewMode } from '@/composables/useQueryTabs'

const props = withDefaults(
  defineProps<{
    data: QueryResult
    isLocked?: boolean
    viewMode?: ResultViewMode
  }>(),
  {
    isLocked: false,
    viewMode: 'table',
  },
)

// Normalize data for ResultTable: wrap non-array results in an array
const tableData = computed<QueryResultRow[] | null>(() => {
  if (props.data === null) return null
  if (Array.isArray(props.data)) return props.data
  return [props.data]
})
</script>

<template>
  <div
    :class="['relative h-full flex flex-col', isLocked ? 'pointer-events-none select-none' : '']"
  >
    <div
      v-if="isLocked"
      class="absolute inset-0 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity duration-200"
    >
      <div class="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Query running...</div>
    </div>

    <div
      :class="[
        'flex-1 flex flex-col overflow-hidden',
        isLocked ? 'opacity-50 transition-opacity duration-200' : '',
      ]"
    >
      <div v-if="viewMode === 'table'" class="flex-1 overflow-hidden">
        <ResultTable :data="tableData" />
      </div>

      <div v-else data-testid="json-tree" class="flex-1 overflow-hidden">
        <JsonTreeView :data="data" :root="true" />
      </div>
    </div>
  </div>
</template>
