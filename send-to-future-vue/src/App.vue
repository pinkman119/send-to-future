<template>
  <router-view />
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'

// 初始化主题（暗黑/明亮），根据本地存储还原用户偏好。
const theme = useThemeStore()
theme.init()
</script>
