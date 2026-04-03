<script setup lang="ts">
import { ref, computed } from 'vue'
import JsonView from '@/components/results/JsonView.vue'
import { isExpandable, typeClass, formatPrimitive } from '@/components/results/format'
import type { QueryResultRow } from '@/composables/useQueryTabs'

const props = defineProps<{
  data: QueryResultRow[] | null
}>()

const PAGE_SIZE = 50
const currentPage = ref(0)

const totalPages = computed(() => {
  if (!props.data) return 0
  return Math.ceil(props.data.length / PAGE_SIZE)
})

const pagedData = computed(() => {
  if (!props.data) return []
  const start = currentPage.value * PAGE_SIZE
  return props.data.slice(start, start + PAGE_SIZE)
})
</script>

<template>
  <div v-if="data && data.length > 0" class="flex flex-col h-full">
    <div class="flex-1 overflow-auto p-1.5 space-y-1">
      <div
        v-for="(row, index) in pagedData"
        :key="currentPage * PAGE_SIZE + index"
        class="border border-zinc-200/60 dark:border-zinc-800/30 rounded bg-white dark:bg-zinc-900/60"
        data-testid="list-card"
      >
        <div class="px-3 py-1.5">
          <div
            v-for="([key, value], i) in Object.entries(row)"
            :key="key"
            :class="['flex gap-2 items-baseline', i > 0 ? 'mt-0.5' : '']"
          >
            <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 min-w-[80px] max-w-[140px] truncate shrink-0 select-none">
              {{ key }}
            </span>
            <div class="flex-1 min-w-0">
              <template v-if="isExpandable(value)">
                <JsonView :data="value" />
              </template>
              <template v-else>
                <span :class="['font-mono text-[12px]', typeClass(value)]">
                  {{ formatPrimitive(value) }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between gap-2 px-3 h-8 border-t border-zinc-300/60 dark:border-zinc-800/30 bg-zinc-200/60 dark:bg-zinc-950/80"
    >
      <div class="text-xs text-zinc-500 dark:text-zinc-500">
        Showing
        {{ currentPage * PAGE_SIZE + 1 }}
        to
        {{ Math.min((currentPage + 1) * PAGE_SIZE, data.length) }}
        of {{ data.length }} documents
      </div>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="currentPage === 0"
          @click="currentPage--"
        >
          Previous
        </button>
        <span class="text-xs text-zinc-500 dark:text-zinc-500">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>
        <button
          class="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="currentPage >= totalPages - 1"
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
