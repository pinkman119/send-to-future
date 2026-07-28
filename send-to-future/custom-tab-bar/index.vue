<template>
  <view class="tab-bar">
    <view
      v-for="(item, index) in list"
      :key="item.pagePath"
      class="tab-item"
      :class="{ active: selected === index }"
      @click="switchTab(item, index)"
    >
      <view class="tab-icon" :class="tabIconClass(index)">
        <image v-if="index === 3 && planetImg" class="tab-planet-img" :src="planetImg" mode="aspectFit" />
      </view>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'customTabBar',
  /**
   * 返回自定义 TabBar 的初始数据
   * @returns {object} 包含选中项、星球图片与 tab 列表的数据对象
   */
  data() {
    return {
      selected: 0,
      planetImg: '',
      list: [
        { pagePath: 'pages/launch/launch', text: '发射' },
        { pagePath: 'pages/wander/wander', text: '星系' },
        { pagePath: 'pages/listen/listen', text: '信号' },
        { pagePath: 'pages/earth/earth', text: '地球' }
      ]
    }
  },
  /**
   * 组件创建时同步选中项与星球图片，并监听星球切换事件
   */
  created() {
    this.syncSelected()
    this.syncPlanetImg()
    uni.$on('planet-change', (url) => { this.planetImg = url })
  },
  /**
   * TabBar 显示时同步选中项与星球图片
   */
  onShow() {
    this.syncSelected()
    this.syncPlanetImg()
  },
  methods: {
    /**
     * 根据当前页面路由同步高亮的 tab 项
     */
    syncSelected() {
      const pages = getCurrentPages()
      if (!pages || !pages.length) return
      const route = pages[pages.length - 1].route
      const idx = this.list.findIndex(i => i.pagePath === route)
      if (idx !== -1) this.selected = idx
    },
    /**
     * 切换 tab 页
     * @param {object} item - 目标 tab 项
     * @param {number} index - tab 索引
     */
    switchTab(item, index) {
      if (this.selected === index) return
      this.selected = index
      uni.switchTab({ url: '/' + item.pagePath })
    },
    /**
     * 从 globalData 同步星球图片
     */
    syncPlanetImg() {
      const app = getApp()
      if (app.globalData && app.globalData.myPlanetImg) this.planetImg = app.globalData.myPlanetImg
    },
    /**
     * 返回指定 tab 的图标样式类（第 4 项有星球图片时返回空）
     * @param {number} index - tab 索引
     * @returns {string} 图标样式类名
     */
    tabIconClass(index) {
      if (index === 3 && this.planetImg) return ''
      return 'ico-' + index
    }
  }
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  background: rgba(5, 5, 20, 0.92);
  border-top: 1px solid rgba(0, 229, 255, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #5a5a7a;
}
.tab-item.active {
  color: #00e5ff;
}
.tab-icon {
  width: 28px;
  height: 28px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.2s ease;
}
.tab-planet-img {
  width: 28px;
  height: 28px;
}
.tab-item.active .tab-planet-img {
  transform: translateY(-2px) scale(1.08);
  filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.9));
}
.tab-item.active .tab-icon {
  transform: translateY(-2px) scale(1.08);
}
.tab-text {
  font-size: 12px;
  line-height: 1;
  letter-spacing: 2px;
}

/* 发射 - 火箭 */
.ico-0 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a5a7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2.5c3 2 4.6 5.2 4.6 8.8 0 1.6-.5 3.1-1.1 4.6L12 21l-3.5-5.1c-.6-1.5-1.1-3-1.1-4.6C7.4 7.7 9 4.5 12 2.5z'/><circle cx='12' cy='9.6' r='1.7'/><path d='M7.6 12.6C5 13.1 3.6 15 3.6 15s2.6.6 4.2-1.5'/><path d='M16.4 12.6C19 13.1 20.4 15 20.4 15s-2.6.6-4.2-1.5'/><path d='M12 19v1.8'/></svg>");
}
.tab-item.active .ico-0 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300e5ff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2.5c3 2 4.6 5.2 4.6 8.8 0 1.6-.5 3.1-1.1 4.6L12 21l-3.5-5.1c-.6-1.5-1.1-3-1.1-4.6C7.4 7.7 9 4.5 12 2.5z'/><circle cx='12' cy='9.6' r='1.7'/><path d='M7.6 12.6C5 13.1 3.6 15 3.6 15s2.6.6 4.2-1.5'/><path d='M16.4 12.6C19 13.1 20.4 15 20.4 15s-2.6.6-4.2-1.5'/><path d='M12 19v1.8'/></svg>");
}

/* 星系 - 指南针 */
.ico-1 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a5a7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9.2'/><polygon points='16.2 7.8 14 14 7.8 16.2 10 10 16.2 7.8'/></svg>");
}
.tab-item.active .ico-1 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300e5ff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9.2'/><polygon points='16.2 7.8 14 14 7.8 16.2 10 10 16.2 7.8'/></svg>");
}

/* 信号 - 电波 */
.ico-2 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a5a7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='15' r='2.4'/><path d='M8.4 13.4a5 5 0 0 1 7.2 0'/><path d='M5.8 10.8a8.6 8.6 0 0 1 12.4 0'/><path d='M3.4 8.2a12 12 0 0 1 17.2 0'/></svg>");
}
.tab-item.active .ico-2 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300e5ff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='15' r='2.4'/><path d='M8.4 13.4a5 5 0 0 1 7.2 0'/><path d='M5.8 10.8a8.6 8.6 0 0 1 12.4 0'/><path d='M3.4 8.2a12 12 0 0 1 17.2 0'/></svg>");
}

/* 地球 - 星球 */
.ico-3 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a5a7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M3 12h18'/><path d='M12 3c2.9 2.5 4.5 5.7 4.5 9s-1.6 6.5-4.5 9c-2.9-2.5-4.5-5.7-4.5-9S9.1 5.5 12 3z'/><path d='M5 8h14'/><path d='M5 16h14'/></svg>");
}
.tab-item.active .ico-3 {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300e5ff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M3 12h18'/><path d='M12 3c2.9 2.5 4.5 5.7 4.5 9s-1.6 6.5-4.5 9c-2.9-2.5-4.5-5.7-4.5-9S9.1 5.5 12 3z'/><path d='M5 8h14'/><path d='M5 16h14'/></svg>");
}

</style>
