<template>
  <div>
    <div class="page-head">
      <nav class="breadcrumb">
        <a href="javascript:void(0)">首页</a>
        <span class="sep">/</span>
        <span>信件管理</span>
        <span class="sep">/</span>
        <span class="current">坐标管理</span>
      </nav>
      <div class="page-head-row">
        <div>
          <h1 class="page-title">坐标管理</h1>
          <p class="page-sub">管理 user_coord 表中的用户联系方式（邮箱 / 手机号等）。</p>
        </div>
      </div>
    </div>

    <!-- 坐标列表 -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">坐标记录</h2>
        <div class="card-toolbar">
          <div class="search-box" style="width: 280px">
            <svg class="search-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              v-model="keyword"
              class="form-control"
              placeholder="搜索用户昵称 / 坐标值 / 类型"
            />
          </div>
          <span class="badge gray">共 {{ filteredCoords.length }} 条</span>
        </div>
      </div>
      <div class="card-body" style="padding: 0">
        <table class="table">
          <thead>
            <tr>
              <th>坐标 ID</th>
              <th>用户</th>
              <th>坐标类型</th>
              <th>坐标值</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCoords" :key="c.coord_id">
              <td class="nowrap">{{ c.coord_id }}</td>
              <td>{{ getNickname(c.user_id) }} <span class="text-muted">#{{ c.user_id }}</span></td>
              <td>
                <span class="badge" :class="c.coord_type === 'email' ? 'info' : 'primary'">{{ c.coord_type }}</span>
              </td>
              <td>{{ c.coord_value }}</td>
              <td class="nowrap">{{ c.create_time }}</td>
              <td class="nowrap">{{ c.update_time }}</td>
              <td class="text-right nowrap">
                <button class="btn btn-light btn-sm" @click="removeCoord(c.coord_id)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredCoords.length === 0">
              <td class="empty" colspan="7">未找到匹配的坐标记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { coordsData } from '@/stores/data'
import { getNickname } from '@/mock/data'

const keyword = ref('')

// 按关键词过滤：昵称 / 坐标值 / 类型。
const filteredCoords = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return coordsData.value
  return coordsData.value.filter((c) => {
    const nick = getNickname(c.user_id).toLowerCase()
    return (
      nick.includes(k) ||
      String(c.coord_value).toLowerCase().includes(k) ||
      c.coord_type.toLowerCase().includes(k)
    )
  })
})

/** 删除一条坐标记录（演示用本地移除）。 */
function removeCoord(id) {
  const idx = coordsData.value.findIndex((c) => c.coord_id === id)
  if (idx !== -1) coordsData.value.splice(idx, 1)
}
</script>
