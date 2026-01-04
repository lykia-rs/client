<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface ButtonProps extends PrimitiveProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
})

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-[#4db6ac] text-white hover:opacity-90': props.variant === 'default',
      'border border-zinc-700 bg-transparent hover:bg-zinc-800': props.variant === 'outline',
      'hover:bg-zinc-800': props.variant === 'ghost',
      'h-10 px-4 py-2 text-sm': props.size === 'default',
      'h-9 px-3 text-xs': props.size === 'sm',
      'h-11 px-8': props.size === 'lg',
    },
    props.class
  )
)
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
