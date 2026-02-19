<script setup lang="ts">
import { computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table'
import { ref } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  data: any
  isLocked?: boolean
}>(), {
  isLocked: false
})

const sorting = ref<SortingState>([])

const isArray = computed(() => Array.isArray(props.data) && props.data.length > 0)

const columns = computed<ColumnDef<any>[]>(() => {
  if (!isArray.value) return []
  const first = props.data[0]
  if (typeof first !== 'object' || first === null) return []
  
  return Object.keys(first).map(key => ({
    accessorKey: key,
    header: key,
    cell: (info: any) => formatValue(info.getValue()),
  }))
})

const table = computed(() => {
  if (!isArray.value || columns.value.length === 0) return null
  
  return useVueTable({
    get data() { return props.data },
    get columns() { return columns.value },
    state: {
      get sorting() { return sorting.value },
    },
    onSortingChange: (updaterOrValue) => {
      sorting.value = typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting.value)
        : updaterOrValue
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  })
})

function formatValue(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<template>
  <div 
    :class="[
      'relative h-full flex flex-col',
      isLocked ? 'pointer-events-none select-none' : ''
    ]"
  >
    <div 
      v-if="isLocked"
      class="absolute inset-0 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity duration-200"
    >
      <div class="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Query running...</div>
    </div>
    
    <div :class="[
      'flex-1 flex flex-col overflow-hidden',
      isLocked ? 'opacity-50 transition-opacity duration-200' : ''
    ]">
      <div v-if="table" class="flex flex-col h-full">
        <div class="overflow-auto flex-1">
          <table class="w-full border-collapse">
            <thead class="sticky top-0 bg-zinc-100/95 dark:bg-zinc-900/95 border-b border-zinc-300/60 dark:border-zinc-800/40 z-10 backdrop-blur-sm">
              <tr
                v-for="headerGroup in table.getHeaderGroups()"
                :key="headerGroup.id"
              >
                <th
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :class="[
                    'text-left px-3 py-2.5 font-semibold text-label uppercase tracking-widest text-zinc-500 dark:text-zinc-500 select-none',
                    header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors' : ''
                  ]"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <div class="flex items-center gap-2">
                    <FlexRender
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                    <component
                      :is="
                        header.column.getIsSorted() === 'asc'
                          ? ChevronUp
                          : header.column.getIsSorted() === 'desc'
                          ? ChevronDown
                          : ChevronsUpDown
                      "
                      :class="[
                        'w-4 h-4',
                        header.column.getIsSorted() ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'
                      ]"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                class="border-b border-zinc-200/80 dark:border-zinc-800/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="px-3 py-2 font-mono text-[12px] text-zinc-700 dark:text-zinc-300"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination controls -->
        <div 
          v-if="table.getPageCount() > 1"
          class="flex items-center justify-between gap-2 px-3 h-8 border-t border-zinc-300/60 dark:border-zinc-800/30 bg-zinc-200/60 dark:bg-zinc-950/80"
        >
          <div class="text-xs text-zinc-500 dark:text-zinc-500">
            Showing {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }} 
            to {{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length) }} 
            of {{ table.getFilteredRowModel().rows.length }} rows
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              @click="table.previousPage()"
              :disabled="!table.getCanPreviousPage()"
            >
              Previous
            </button>
            <span class="text-xs text-zinc-500 dark:text-zinc-500">
              Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
            </span>
            <button
              class="px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              @click="table.nextPage()"
              :disabled="!table.getCanNextPage()"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      <pre v-else class="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap p-4">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>
