<script setup lang="ts">
import { ref } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  } catch (e: any) {
    error.value = e?.message || String(e) || 'Failed to connect to server'
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-border/60 w-full max-w-md p-6 shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-ui font-semibold text-muted-foreground tracking-tight">New Connection</h2>
        <button 
          @click="emit('close')" 
          class="text-muted-foreground hover:text-foreground p-1 hover:bg-accent rounded transition-all duration-200"
        >
          <X :size="16" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Host</Label>
          <Input
            v-model="host"
            type="text"
            placeholder="localhost"
            class="font-mono"
          />
        </div>
        
        <div class="space-y-1.5">
          <Label class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Port</Label>
          <Input
            v-model="port"
            type="text"
            placeholder="19191"
            class="font-mono"
          />
        </div>
        
        <div v-if="error" class="text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/20 border border-red-300 dark:border-red-900/30 rounded-lg px-3 py-2 animate-in slide-in-from-top duration-200">
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
