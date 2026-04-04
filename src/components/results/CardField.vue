<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import { isExpandable, typeClass, formatPrimitive, formatExpandableLabel, entries } from '@/components/results/format'
import type { QueryResultValue } from '@/composables/useQueryTabs'

defineProps<{
  fieldKey: string
  value: QueryResultValue
}>()

const expanded = ref(false)
</script>

<template>
  <!-- Expandable field (object or array) -->
  <div v-if="isExpandable(value)">
    <button
      class="flex items-center gap-1.5 w-full text-left py-[3px] hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-sm transition-colors"
      data-testid="card-field-toggle"
      @click="expanded = !expanded"
    >
      <component
        :is="expanded ? ChevronDown : ChevronRight"
        :size="14"
        class="text-zinc-400 dark:text-zinc-500 shrink-0"
      />
      <span class="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">{{ fieldKey }}</span>
      <span class="text-[11px] text-zinc-400 dark:text-zinc-500 mr-1">:</span>
      <span class="text-[12px] font-mono text-orange-600 dark:text-orange-400">
        {{ formatExpandableLabel(value) }}
      </span>
    </button>
    <div v-if="expanded" class="ml-5 pl-3 border-l border-zinc-200 dark:border-zinc-700/50">
      <CardField
        v-for="[childKey, childVal] in entries(value)"
        :key="childKey"
        :field-key="childKey"
        :value="childVal"
      />
    </div>
  </div>

  <!-- Primitive field -->
  <div v-else class="flex items-center gap-1.5 py-[3px]">
    <div class="w-[14px] shrink-0" />
    <span class="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">{{ fieldKey }}</span>
    <span class="text-[11px] text-zinc-400 dark:text-zinc-500 mr-1">:</span>
    <span :class="['text-[12px] font-mono', typeClass(value)]">
      {{ formatPrimitive(value) }}
    </span>
  </div>
</template>
