<script setup lang="ts">
import { Database } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Connection {
  id: string
  name: string
  address: string
  active: boolean
}

defineProps<{
  connections: Connection[]
}>()

const emit = defineEmits<{
  select: [conn: Connection]
}>()
</script>

<template>
  <div class="flex flex-col h-full bg-zinc-900">
    <div class="px-4 py-3 border-b border-zinc-800">
      <h2 class="text-sm font-semibold text-zinc-100">Connections</h2>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <button
        v-for="conn in connections"
        :key="conn.id"
        @click="emit('select', conn)"
        :class="cn(
          'w-full px-4 py-3 text-left border-b border-zinc-800/50 transition-colors',
          'hover:bg-zinc-800/50',
          conn.active && 'bg-[#4db6ac]/10 border-l-2 border-l-[#4db6ac]'
        )"
      >
        <div class="flex items-center gap-2">
          <Database :size="16" class="text-zinc-400" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ conn.name }}</div>
            <div class="text-xs text-zinc-500 truncate">{{ conn.address }}</div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
