<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: any
}>()

const isArray = computed(() => Array.isArray(props.data) && props.data.length > 0)
const columns = computed(() => {
  if (!isArray.value) return []
  const first = props.data[0]
  return typeof first === 'object' && first !== null ? Object.keys(first) : []
})

function formatValue(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<template>
  <div v-if="isArray && columns.length" class="overflow-auto">
    <table class="w-full text-sm border-collapse">
      <thead class="sticky top-0 bg-zinc-900 border-b border-zinc-800">
        <tr>
          <th
            v-for="col in columns"
            :key="col"
            class="text-left px-3 py-2 font-semibold text-zinc-300 text-xs uppercase tracking-wide"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in data"
          :key="idx"
          class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
        >
          <td
            v-for="col in columns"
            :key="col"
            class="px-3 py-2 font-mono text-zinc-300 text-xs"
          >
            {{ formatValue(row[col]) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <pre v-else class="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{{ JSON.stringify(data, null, 2) }}</pre>
</template>
