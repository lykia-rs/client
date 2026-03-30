<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface CardProps {
  as?: string
  asChild?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<CardProps>(), {
  as: 'div',
})
</script>

<template>
  <component
    :is="as"
    :class="cn('rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm', props.class)"
  >
    <slot />
  </component>
</template>
