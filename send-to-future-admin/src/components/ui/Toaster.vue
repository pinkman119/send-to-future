<script setup>
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const { toasts } = useToast()

const typeMap = {
  info: { cls: 'bg-ink dark:bg-surface-dark text-white dark:text-ink-dark', icon: 'info' },
  success: { cls: 'bg-success text-white', icon: 'check-circle' },
  danger: { cls: 'bg-danger text-white', icon: 'x-circle' },
  warning: { cls: 'bg-warning text-white', icon: 'alert-triangle' },
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-dropdown text-sm"
        :class="typeMap[t.type].cls"
      >
        <BaseIcon :name="typeMap[t.type].icon" :size="16" />
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
