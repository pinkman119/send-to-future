<template>
  <!-- 后台主框架：左侧固定菜单 + 顶部固定 Header + 内容主体 -->
  <div class="app-shell" :class="{ 'sidebar-open': sidebarOpen }">
    <AppSidebar @navigate="sidebarOpen = false" />
    <div class="app-main">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'

// 控制移动端侧边栏抽屉的开关状态。
const sidebarOpen = ref(false)
</script>
