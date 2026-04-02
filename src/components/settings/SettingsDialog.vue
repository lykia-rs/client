<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useSettings } from '@/composables/useSettings'

defineEmits<{
  close: []
}>()

const { settings } = useSettings()
</script>

<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white dark:bg-zinc-900 rounded-xl border border-border/60 w-full max-w-sm p-6 shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-200"
    >
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-ui font-semibold text-muted-foreground tracking-tight">Settings</h2>
        <button
          class="text-muted-foreground hover:text-foreground p-1 hover:bg-accent rounded transition-all duration-200"
          title="Close"
          @click="$emit('close')"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="space-y-3">
        <!-- Editor Section -->
        <div>
          <h3
            class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Editor
          </h3>

          <div
            class="flex items-center justify-between py-2 px-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <span class="text-sm text-foreground">Show line numbers</span>
            <button
              role="switch"
              :aria-checked="settings.showLineNumbers"
              :class="[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                settings.showLineNumbers
                  ? 'bg-primary'
                  : 'bg-zinc-300 dark:bg-zinc-600',
              ]"
              @click="settings.showLineNumbers = !settings.showLineNumbers"
            >
              <span
                :class="[
                  'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
                  settings.showLineNumbers ? 'translate-x-4' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
