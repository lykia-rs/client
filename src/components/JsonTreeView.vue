<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next'
import type { QueryResultValue } from '@/composables/useQueryTabs'

const props = withDefaults(
  defineProps<{
    data: QueryResultValue
    label?: string
    root?: boolean
    defaultExpanded?: boolean
  }>(),
  {
    label: undefined,
    root: false,
    defaultExpanded: false,
  },
)

const expanded = ref(props.defaultExpanded)
const expandKey = ref(0)
const allExpanded = ref(props.defaultExpanded)

function toggleExpandAll() {
  allExpanded.value = !allExpanded.value
  expandKey.value++
}

function isExpandable(val: QueryResultValue): val is Record<string, QueryResultValue> | QueryResultValue[] {
  return val !== null && val !== undefined && typeof val === 'object'
}

function entries(val: QueryResultValue): [string, QueryResultValue][] {
  if (!isExpandable(val)) return []
  return Array.isArray(val) ? val.map((v, i) => [String(i), v]) : Object.entries(val)
}

function typeClass(val: QueryResultValue): string {
  if (val === null || val === undefined) return 'text-zinc-400 dark:text-zinc-500 italic'
  if (typeof val === 'string') return 'text-green-600 dark:text-green-400'
  if (typeof val === 'number') return 'text-blue-600 dark:text-blue-400'
  if (typeof val === 'boolean') return 'text-purple-600 dark:text-purple-400'
  return ''
}

function formatPrimitive(val: QueryResultValue): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

function bracketPair(val: QueryResultValue): [string, string] {
  return Array.isArray(val) ? ['[', ']'] : ['{', '}']
}

function childCount(val: QueryResultValue): number {
  if (!isExpandable(val)) return 0
  return Array.isArray(val) ? val.length : Object.keys(val).length
}
</script>

<template>
  <!-- Root array: toolbar + numbered documents -->
  <div v-if="root && Array.isArray(data)" class="flex flex-col h-full">
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
    <div class="flex-1 overflow-auto p-2">
      <div
        v-for="(item, index) in data"
        :key="`${expandKey}-${index}`"
        class="border-b border-zinc-200/80 dark:border-zinc-800/30"
      >
        <JsonTreeView
          :data="item"
          :label="`Document ${index}`"
          :default-expanded="allExpanded"
        />
      </div>
    </div>
  </div>

  <!-- Root non-array: toolbar + single expandable node -->
  <div v-else-if="root" class="flex flex-col h-full">
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
    <div class="flex-1 overflow-auto p-2">
      <JsonTreeView :key="expandKey" :data="data" :default-expanded="allExpanded" />
    </div>
  </div>

  <!-- Expandable node (object or array) -->
  <div v-else-if="isExpandable(data)" class="font-mono text-[12px]">
    <button
      class="flex items-center gap-1 w-full text-left py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors rounded-sm group"
      @click="expanded = !expanded"
    >
      <component
        :is="expanded ? ChevronDown : ChevronRight"
        :size="14"
        class="text-zinc-400 dark:text-zinc-500 shrink-0"
      />
      <span v-if="label" class="text-zinc-500 dark:text-zinc-400 mr-1">{{ label }}:</span>
      <span class="text-zinc-400 dark:text-zinc-600">
        {{ bracketPair(data)[0] }}
        <template v-if="!expanded">
          <span class="text-zinc-400 dark:text-zinc-600 text-[11px] ml-0.5">
            {{ childCount(data) }} {{ Array.isArray(data) ? 'items' : 'fields' }}
          </span>
          {{ bracketPair(data)[1] }}
        </template>
      </span>
    </button>
    <div v-if="expanded" class="ml-4 border-l border-zinc-200 dark:border-zinc-800/50 pl-2">
      <JsonTreeView
        v-for="[key, val] in entries(data)"
        :key="key"
        :data="val"
        :label="key"
      />
      <div class="py-0.5 px-2 text-zinc-400 dark:text-zinc-600">{{ bracketPair(data)[1] }}</div>
    </div>
  </div>

  <!-- Leaf node (primitive) -->
  <div v-else class="flex items-center gap-1 py-1 px-2 font-mono text-[12px]">
    <div class="w-[14px] shrink-0" />
    <span v-if="label" class="text-zinc-500 dark:text-zinc-400 mr-1">{{ label }}:</span>
    <span :class="typeClass(data)">{{ formatPrimitive(data) }}</span>
  </div>
</template>
