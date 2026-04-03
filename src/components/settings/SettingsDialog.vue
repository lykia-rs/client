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
      class="bg-white dark:bg-zinc-900 rounded-lg border border-border/60 w-full max-w-xs mx-4 shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-200"
    >
      <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
        <h2 class="text-sm font-semibold text-foreground">Settings</h2>
        <button
          class="text-muted-foreground hover:text-foreground p-1 -mr-1 hover:bg-accent rounded transition-all duration-200"
          title="Close"
          @click="$emit('close')"
        >
          <X :size="14" />
        </button>
      </div>

      <div class="px-5 py-4">
        <!-- Editor Section -->
        <div>
          <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Editor</h3>

          <label
            class="flex items-center justify-between py-1.5 rounded cursor-pointer"
            @click="settings.showLineNumbers = !settings.showLineNumbers"
          >
            <span class="text-xs text-foreground">Show line numbers</span>
            <button
              role="switch"
              :aria-checked="settings.showLineNumbers"
              :class="[
                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                settings.showLineNumbers
                  ? 'bg-primary'
                  : 'bg-zinc-300 dark:bg-zinc-600',
              ]"
              @click.stop="settings.showLineNumbers = !settings.showLineNumbers"
            >
              <span
                :class="[
                  'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
                  settings.showLineNumbers ? 'translate-x-3' : 'translate-x-0',
                ]"
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
