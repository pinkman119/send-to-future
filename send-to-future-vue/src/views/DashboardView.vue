<template>
  <div>
    <div class="page-head">
      <nav class="breadcrumb">
        <a href="javascript:void(0)">首页</a>
        <span class="sep">/</span>
        <span class="current">运营概览</span>
      </nav>
      <div class="page-head-row">
        <div>
          <h1 class="page-title">运营概览</h1>
          <p class="page-sub">欢迎回来，{{ auth.user?.name }}。这里是「寄给未来」运营概览。</p>
        </div>
      </div>
    </div>

    <!-- 当前时间横幅 -->
    <div class="row g-4">
      <div class="col-12">
        <div class="clock-card">
          <div>
            <div class="clock-time">{{ clock.time }}</div>
            <div class="clock-date">{{ clock.date }} · {{ clock.weekday }}</div>
          </div>
          <div class="clock-greet">寄给未来 · 让此刻的连接，抵达未来的ta</div>
        </div>
      </div>
    </div>

    <!-- 统计指标 -->
    <div class="row g-4 mt-4">
      <div class="col-12 col-sm-6 col-xl-3">
        <StatCard label="用户数量" :value="userCount" color="primary" icon="users" />
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <StatCard label="访问数量" :value="visitCount" color="info" icon="eye" />
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <StatCard label="付费信件" :value="paidLetterCount" color="warning" icon="mail" />
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <StatCard label="付费收入" :value="'¥' + paidIncome.toFixed(2)" color="success" icon="money" />
      </div>
    </div>

    <!-- 待办 + 运营速览 -->
    <div class="row g-4 mt-4">
      <!-- 待办列表 -->
      <div class="col-12 col-lg-7">
        <div class="card" style="height: 100%">
          <div class="card-header">
            <h2 class="card-title">待办列表</h2>
            <span class="badge primary">{{ todos.filter((t) => !t.done).length }} 项待处理</span>
          </div>
          <div class="card-body">
            <div v-for="todo in todos" :key="todo.id" class="todo-item">
              <span class="todo-check" :class="{ done: todo.done }" @click="todo.done = !todo.done">
                <svg v-if="todo.done" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5 9-11" />
                </svg>
              </span>
              <div class="todo-text" :class="{ done: todo.done }">
                {{ todo.text }}
                <div class="todo-time">{{ todo.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 运营速览 -->
      <div class="col-12 col-lg-5">
        <div class="card" style="height: 100%">
          <div class="card-header">
            <h2 class="card-title">运营速览</h2>
          </div>
          <div class="card-body">
            <div class="d-flex align-center gap-3 mb-3">
              <span class="badge warning"><span class="dot"></span>待审核信件</span>
              <span class="flex-1">{{ pendingLetters.length }} 封等待审核</span>
              <router-link to="/letters/review" class="btn btn-outline btn-sm">去处理</router-link>
            </div>
            <div class="d-flex align-center gap-3 mb-3">
              <span class="badge success"><span class="dot"></span>已送达信件</span>
              <span class="flex-1">{{ deliveredCount }} 封成功送达</span>
            </div>
            <div class="d-flex align-center gap-3 mb-3">
              <span class="badge danger"><span class="dot"></span>已驳回信件</span>
              <span class="flex-1">{{ rejectedCount }} 封未通过审核</span>
            </div>
            <div class="d-flex align-center gap-3">
              <span class="badge info"><span class="dot"></span>坐标记录</span>
              <span class="flex-1">{{ coordsData.length }} 条用户坐标</span>
              <router-link to="/coords" class="btn btn-outline btn-sm">查看</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  userCount,
  visitCount,
  paidLetterCount,
  paidIncome,
  pendingLetters,
  lettersData,
  coordsData
} from '@/stores/data'
import StatCard from '@/components/StatCard.vue'

const auth = useAuthStore()

// 实时时钟
const clock = reactive({ time: '', date: '', weekday: '' })
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
let timer = null

/** 刷新当前时间显示。 */
function tick() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  clock.time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  clock.date = `${d.getFullYear()}年${p(d.getMonth() + 1)}月${p(d.getDate())}日`
  clock.weekday = WEEK[d.getDay()]
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

// 信件状态统计
const deliveredCount = computed(() => lettersData.value.filter((l) => l.status === 2).length)
const rejectedCount = computed(() => lettersData.value.filter((l) => l.status === 3).length)

// 待办列表：审核待办由数据动态驱动，其余为运营常规事项。
const todos = ref([
  { id: 1, text: '审核新提交的待审信件', time: '实时', done: false },
  { id: 2, text: '核查本周付费订单对账', time: '每天 18:00', done: false },
  { id: 3, text: '回复用户反馈的投递异常', time: '每周一', done: false },
  { id: 4, text: '更新坐标管理中的失效联系方式', time: '本周', done: true },
  { id: 5, text: '巡检数据库备份任务', time: '每月 1 日', done: true }
])
</script>
