<template>
  <div class="stat-card">
    <div class="stat-icon" :class="color">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path :d="iconPath" />
      </svg>
    </div>
    <div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ value }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 统计指标卡片：图标 + 标题 + 数值。
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  color: { type: String, default: 'primary' }, // primary | success | warning | info
  icon: { type: String, default: 'users' }
})

// 内置图标路径映射（线性图标）。
const ICONS = {
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  mail: 'M4 4h16v16H4z M4 7l8 5 8-5',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
}
const iconPath = computed(() => ICONS[props.icon] || ICONS.users)
</script>
