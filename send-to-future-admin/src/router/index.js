import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import LoginView from '@/views/LoginView.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import LetterAuditView from '@/views/LetterAuditView.vue'
import CoordManageView from '@/views/CoordManageView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: '首页' } },
      { path: 'letter-audit', name: 'letter-audit', component: LetterAuditView, meta: { title: '审核管理' } },
      { path: 'coord-manage', name: 'coord-manage', component: CoordManageView, meta: { title: '坐标管理' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isLoggedIn } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return '/login'
  }
  if (to.path === '/login' && isLoggedIn.value) {
    return '/'
  }
})

export default router
