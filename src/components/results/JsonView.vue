<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next'
import CardField from '@/components/results/CardField.vue'
import { isExpandable, typeClass, formatPrimitive, formatDocumentPreview, entries } from '@/components/results/format'
import type { QueryResultValue } from '@/composables/useQueryTabs'

const props = defineProps<{
  data: QueryResultValue
}>()

const expandedDocs = ref(new Set<number>())
const allExpanded = ref(false)

const items = computed<QueryResultValue[]>(() => {
  if (Array.isArray(props.data)) return props.data
  if (props.data !== null && props.data !== undefined) return [props.data]
  return []
})

function toggle(index: number) {
  const next = new Set(expandedDocs.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  expandedDocs.value = next
}

function toggleExpandAll() {
  allExpanded.value = !allExpanded.value
  expandedDocs.value = allExpanded.value
    ? new Set(items.value.map((_, i) => i))
    : new Set()
}
</script>

<template>
  <div v-if="items.length > 0" class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-end px-2 py-1 border-b border-zinc-200/60 dark:border-zinc-800/30 bg-zinc-100/50 dark:bg-zinc-950/50">
      <button
        data-testid="expand-collapse-all"
        class="flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800/40"
        :title="allExpanded ? 'Collapse all' : 'Expand all'"
        @click="toggleExpandAll"
      >
        <ChevronsDownUp v-if="allExpanded" :size="13" />
        <ChevronsUpDown v-else :size="13" />
        <span>{{ allExpanded ? 'Collapse all' : 'Expand all' }}</span>
      </button>
    </div>

    <!-- Document list -->
    <div class="flex-1 overflow-auto p-2 space-y-0.5">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="border-b border-zinc-200/80 dark:border-zinc-800/30"
      >
        <!-- Expandable document -->
        <template v-if="isExpandable(item)">
          <button
            class="flex items-center gap-1 w-full text-left py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors rounded-sm font-mono text-[12px]"
            data-testid="doc-toggle"
            @click="toggle(index)"
          >
            <component
              :is="expandedDocs.has(index) ? ChevronDown : ChevronRight"
              :size="14"
              class="text-zinc-400 dark:text-zinc-500 shrink-0"
            />
            <span v-if="!expandedDocs.has(index)" class="text-zinc-500 dark:text-zinc-400 truncate">
              {{ formatDocumentPreview(item) }}
            </span>
          </button>
          <div v-if="expandedDocs.has(index)" class="ml-5 pl-3 pb-1 border-l border-zinc-200 dark:border-zinc-700/50">
            <CardField
              v-for="[key, val] in entries(item)"
              :key="key"
              :field-key="key"
              :value="val"
            />
          </div>
        </template>

        <!-- Primitive item -->
        <div v-else class="flex items-center gap-1 py-1 px-2 font-mono text-[12px]">
          <div class="w-[14px] shrink-0" />
          <span :class="typeClass(item)">{{ formatPrimitive(item) }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-else />
</template>
