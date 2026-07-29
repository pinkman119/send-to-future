<script setup>
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 },
})

const iconComponent = computed(() => {
  const pascal = props.name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return LucideIcons[pascal] || LucideIcons.Circle
})
</script>

<template>
  <component :is="iconComponent" :size="size" :stroke-width="strokeWidth" />
</template>
