<script setup lang="ts">
import { Database, Plus, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Connection {
  id: string
  name: string
  address: string
  host: string
  port: string
  color: string
  active: boolean
  connected: boolean
}

defineProps<{
  connections: Connection[]
}>()

const emit = defineEmits<{
  select: [conn: Connection]
  add: []
  remove: [id: string]
}>()
</script>

<template>
  <div class="flex flex-col h-full bg-zinc-900 overflow-hidden">
    <div class="px-4 py-3 border-b border-zinc-800/30 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-zinc-100">Connections</h2>
      <button
        @click="emit('add')"
        class="p-1.5 hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-105"
        title="New Connection"
      >
        <Plus :size="16" />
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="conn in connections"
        :key="conn.id"
        :class="cn(
          'group relative px-4 py-3 border-b border-zinc-800/20 transition-all duration-200 cursor-pointer',
          'hover:bg-zinc-800/50',
          conn.active && 'bg-zinc-800/30'
        )"
        @click="emit('select', conn)"
      >
        <div 
          class="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200"
          :style="{ backgroundColor: conn.active ? conn.color : 'transparent' }"
        />
        <div class="flex items-center gap-2">
          <div 
            :class="cn(
              'w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200',
              conn.connected ? 'shadow-sm' : 'opacity-30'
            )"
            :style="{ 
              backgroundColor: conn.color,
              boxShadow: conn.connected ? `0 0 4px ${conn.color}` : 'none'
            }"
            :title="conn.connected ? 'Connected' : 'Disconnected'"
          />
          <Database :size="16" class="text-zinc-400 flex-shrink-0 transition-colors duration-200 group-hover:text-zinc-300" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ conn.name }}</div>
            <div class="text-xs text-zinc-500 truncate">{{ conn.address }}</div>
          </div>
          <button
            v-if="connections.length > 1"
            @click.stop="emit('remove', conn.id)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all duration-200 hover:scale-110"
          >
            <X :size="14" class="text-zinc-400 hover:text-red-400 transition-colors duration-200" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
