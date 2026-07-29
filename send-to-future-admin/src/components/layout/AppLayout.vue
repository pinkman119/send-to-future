<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const STORAGE_COLLAPSE = 'sl_sidebar_collapsed'
const route = useRoute()

const collapsed = ref(localStorage.getItem(STORAGE_COLLAPSE) === '1')

function toggleSidebar() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_COLLAPSE, collapsed.value ? '1' : '0')
}
</script>

<template>
  <div class="theme-transition">
    <AppHeader :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
    <AppSidebar :collapsed="collapsed" />

    <main
      class="ml-[265px] mt-[65px] h-[calc(100vh-65px)] overflow-y-auto transition-[margin] duration-200"
      :class="{ 'ml-[76px]': collapsed }"
    >
      <div :key="route.path" class="page-content p-5 lg:p-7">
        <router-view />
      </div>
    </main>
  </div>
</template>
