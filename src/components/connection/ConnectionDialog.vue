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
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e) || 'Failed to connect to server'
    loading.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
    @click.self="emit('close')"
  >
    <div
      class="bg-white dark:bg-zinc-900 rounded-lg border border-border/60 w-full max-w-sm mx-4 shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-200"
    >
      <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <h2 class="text-sm font-semibold text-foreground">New Connection</h2>
        <button
          class="text-muted-foreground hover:text-foreground p-1 -mr-1 hover:bg-accent rounded transition-all duration-200"
          @click="emit('close')"
        >
          <X :size="14" />
        </button>
      </div>

      <form class="px-5 py-4 space-y-3" @submit.prevent="handleSubmit">
        <div class="space-y-1">
          <Label class="text-xs text-muted-foreground">Host</Label>
          <Input v-model="host" type="text" placeholder="localhost" class="font-mono text-sm h-8" />
        </div>

        <div class="space-y-1">
          <Label class="text-xs text-muted-foreground">Port</Label>
          <Input v-model="port" type="text" placeholder="19191" class="font-mono text-sm h-8" />
        </div>

        <div
          v-if="error"
          class="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded px-3 py-2 animate-in slide-in-from-top duration-200"
        >
          {{ error }}
        </div>
      </form>

      <div class="flex gap-2 justify-end px-5 pb-4 pt-1">
        <Button variant="ghost" size="sm" type="button" :disabled="loading" @click="emit('close')">
          Cancel
        </Button>
        <Button size="sm" type="submit" :disabled="loading" @click="handleSubmit">
          <Loader2 v-if="loading" :size="14" class="animate-spin mr-1.5" />
          {{ loading ? 'Connecting...' : 'Connect' }}
        </Button>
      </div>
    </div>
  </div>
</template>
