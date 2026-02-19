<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-105"
    :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <Sun v-if="theme === 'dark'" :size="16" class="text-zinc-900 dark:text-zinc-100" />
    <Moon v-else :size="16" class="text-zinc-900 dark:text-zinc-100" />
  </button>
</template>
