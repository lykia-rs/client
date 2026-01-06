<script setup lang="ts">
import { ref } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  connectHandler: (host: string, port: string) => Promise<void>
}>()

const emit = defineEmits<{
  close: []
}>()

const host = ref('localhost')
const port = ref('19191')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!host.value.trim() || !port.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    await props.connectHandler(host.value.trim(), port.value.trim())
    // If successful, the parent will close the dialog
  } catch (e: any) {
    error.value = e?.message || String(e) || 'Failed to connect to server'
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">New Connection</h2>
        <button 
          @click="emit('close')" 
          class="text-zinc-400 hover:text-zinc-100 p-1 hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-110"
        >
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
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-[#4db6ac] focus:ring-2 focus:ring-[#4db6ac]/20 transition-all duration-200"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1.5">Port</label>
          <input
            v-model="port"
            type="text"
            placeholder="19191"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-[#4db6ac] focus:ring-2 focus:ring-[#4db6ac]/20 transition-all duration-200"
          />
        </div>
        
        <div v-if="error" class="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 animate-in slide-in-from-top duration-200">
          {{ error }}
        </div>
        
        <div class="flex gap-2 justify-end pt-2">
          <Button variant="ghost" type="button" @click="emit('close')" :disabled="loading">
            Cancel
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" :size="16" class="animate-spin mr-2" />
            {{ loading ? 'Connecting...' : 'Connect' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
