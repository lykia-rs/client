<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const emit = defineEmits<{
  submit: [host: string, port: string]
  close: []
}>()

const host = ref('localhost')
const port = ref('19191')

function handleSubmit() {
  if (host.value.trim() && port.value.trim()) {
    emit('submit', host.value.trim(), port.value.trim())
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">New Connection</h2>
        <button @click="emit('close')" class="text-zinc-400 hover:text-zinc-100">
          <X :size="20" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5">Host</label>
          <input
            v-model="host"
            type="text"
            placeholder="localhost"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm outline-none focus:border-[#4db6ac] transition-colors"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1.5">Port</label>
          <input
            v-model="port"
            type="text"
            placeholder="19191"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm outline-none focus:border-[#4db6ac] transition-colors"
          />
        </div>
        
        <div class="flex gap-2 justify-end pt-2">
          <Button variant="ghost" type="button" @click="emit('close')">
            Cancel
          </Button>
          <Button type="submit">
            Connect
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
