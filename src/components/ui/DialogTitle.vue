<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogTitle } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const classes = computed(() =>
  cn('text-sm font-semibold leading-none tracking-tight', props.class),
)
</script>

<template>
  <DialogTitle :class="classes">
    <slot />
  </DialogTitle>
</template>
