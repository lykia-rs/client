<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  orientation?: 'horizontal' | 'vertical'
}>()

const orientation = computed(() => props.orientation ?? 'horizontal')

const classes = computed(() =>
  cn(
    'shrink-0 bg-border',
    orientation.value === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
    props.class,
  ),
)
</script>

<template>
  <div role="none" :class="classes" />
</template>
