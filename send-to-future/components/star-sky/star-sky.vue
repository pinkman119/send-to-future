<template>
  <view>
    <!-- 背景星空（位于页面内容之下，不拦截点击） -->
    <view class="star-sky" :style="skyBg">
      <view class="star-layer layer-1" :style="layer1"></view>
      <view class="star-layer layer-2" :style="layer2"></view>
      <view class="star-layer layer-3" :style="layer3"></view>
    </view>

    <!-- 流星层（位于页面内容之上，仅流星本体可点击） -->
    <view class="meteor-layer">
      <view
        v-for="m in meteors"
        :key="m.id"
        class="meteor"
        :style="m.style"
        @click="onMeteorTap"
      >
        <view class="meteor-tail" :style="m.tail"></view>
      </view>
    </view>

    <!-- 流星留言弹窗 -->
    <view class="meteor-message-mask" v-if="showMessage" @click="closeMessage">
      <view class="meteor-message" @click.stop>
        <view class="meteor-message-star">🌠</view>
        <view class="meteor-message-label">来自星海的留言</view>
        <view class="meteor-message-text">{{ currentMessage.text }}</view>
        <view class="meteor-message-no">小行星 {{ currentMessage.no }} 号 · {{ currentMessage.name }}</view>
        <button class="meteor-message-btn" @click="captureMessage">收下这份温柔</button>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 生成用 box-shadow 模拟星空的多层星点样式字符串
 * @param {number} count - 星点数量
 * @param {number} w - 画布宽度
 * @param {number} h - 画布高度
 * @param {Function} colorFn - 返回单颗星颜色（rgba 字符串）的函数
 * @param {number} blur - 星点模糊半径
 * @returns {string} box-shadow 样式字符串
 */
function buildStars(count, w, h, colorFn, blur) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * w);
    const y = Math.round(Math.random() * h);
    parts.push(x + 'px ' + y + 'px ' + blur + 'px 0 ' + colorFn());
  }
  return 'box-shadow:' + parts.join(',') + ';';
}

/**
 * 将十六进制颜色字符串转为 [r, g, b] 数组
 * @param {string} hex - 形如 #rrggbb 或 #rgb 的颜色
 * @returns {Array<number>} RGB 数值数组
 */
function hexToRgb(hex) {
  let h = (hex || '').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * 读取「我的星球」中选择的星球颜色（调色板），返回 hex 数组
 * @returns {Array<string>} 调色板颜色 hex 数组
 */
function getPaletteHex() {
  let palette = null;
  try {
    const app = getApp();
    const palettes = (app.globalData && app.globalData.satPalettes) || [];
    const idx = (app.globalData && typeof app.globalData.satPalette === 'number') ? app.globalData.satPalette : 0;
    palette = (palettes[idx] && palettes[idx].colors) || (palettes[0] && palettes[0].colors);
  } catch (e) {
    palette = null;
  }
  if (!palette || !palette.length) palette = ['#ffffff', '#00e5ff', '#ffd56b', '#a855f7'];
  return palette;
}

/**
 * 星空着色用的 rgb 字符串数组，如 "0,229,255"
 * @returns {Array<string>} 调色板颜色 rgb 字符串数组
 */
function getPaletteRgb() {
  return getPaletteHex().map(hexToRgb).map(function (c) { return c.join(','); });
}

// 随机留言池：点击流星时随机展示其中一条
// no / name 取自真实被发现过的小行星（主带 / 近地小行星）编号与命名
const sampleMessages = [
  { text: '愿你成为自己的太阳，无需凭借谁的光。', no: 4, name: 'Vesta 灶神星' },
  { text: '慢慢来，比较快。你要的，时间都会给你。', no: 1, name: 'Ceres 谷神星' },
  { text: '今天也要记得，你已经被很多人悄悄爱着。', no: 433, name: 'Eros 爱神星' },
  { text: '如果此刻很难，请相信：这阵风过去，就会是晴天。', no: 588, name: 'Achilles 阿基里斯' },
  { text: '别慌，星星也在黑暗里，才显得明亮。', no: 2, name: 'Pallas 智神星' },
  { text: '未来的你，一定会感谢现在没有放弃的自己。', no: 3, name: 'Juno 婚神星' },
  { text: '把心事寄给星空吧，它会替你保管好。', no: 4179, name: 'Toutatis 战神星' },
  { text: '你不必完美，你已经足够好。', no: 25143, name: 'Itokawa 丝川' },
  { text: '所有的晚安，都藏着一句：明天见。', no: 21, name: 'Lutetia 司琴星' },
  { text: '再小的光，也能照亮一段路。你就是那束光。', no: 99942, name: 'Apophis 阿波菲斯' },
  { text: '允许自己偶尔停下，看看头顶的星河。', no: 1862, name: 'Apollo 阿波罗' },
  { text: '远方的朋友，愿你被世界温柔以待。', no: 1566, name: 'Icarus 伊卡洛斯' },
];

export default {
  data() {
    return {
      layer1: '',
      layer2: '',
      layer3: '',
      skyBg: '',
      meteors: [],
      meteorId: 0,
      timer: null,
      screenW: 0,
      screenH: 0,
      showMessage: false,
      currentMessage: '',
    };
  },
  /**
   * 组件挂载后初始化屏幕尺寸、构建星空图层并启动流星循环
   */
  mounted() {
    try {
      const sys = uni.getSystemInfoSync();
      this.screenW = sys.windowWidth || 375;
      this.screenH = sys.windowHeight || 667;
    } catch (e) {
      this.screenW = 375;
      this.screenH = 667;
    }
    this.buildLayers();
    this.startLoop();
    uni.$on('palette-change', this.buildLayers);
  },
  /**
   * 组件销毁前清除定时器并移除事件监听
   */
  beforeDestroy() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    uni.$off('palette-change', this.buildLayers);
  },
  methods: {
    /**
     * 根据屏幕尺寸与调色板构建三层星空星点
     */
    buildLayers() {
      const w = this.screenW;
      const h = this.screenH;
      if (!w || !h) return;
      const palette = getPaletteRgb();
      const pick = function () { return palette[Math.floor(Math.random() * palette.length)]; };
      // layer1：细小星点，主体偏白但带一点配色，营造银河底噪
      this.layer1 = buildStars(70, w, h, function () {
        return Math.random() < 0.5
          ? 'rgba(255,255,255,' + (0.3 + Math.random() * 0.3).toFixed(2) + ')'
          : 'rgba(' + pick() + ',' + (0.4 + Math.random() * 0.4).toFixed(2) + ')';
      }, 0);
      // layer2：中等星点，主要采用配色
      this.layer2 = buildStars(50, w, h, function () {
        return 'rgba(' + pick() + ',' + (0.6 + Math.random() * 0.4).toFixed(2) + ')';
      }, 0);
      // layer3：明亮大星，纯配色 + 光晕，最能体现「星球颜色」
      this.layer3 = buildStars(30, w, h, function () {
        return 'rgba(' + pick() + ',' + (0.85 + Math.random() * 0.15).toFixed(2) + ')';
      }, 2);
      this.buildSkyBg();
    },
    /**
     * 星云背景光晕跟随所选星球颜色变化，使配色切换一目了然
     */
    buildSkyBg() {
      const hex = getPaletteHex();
      const c0 = hexToRgb(hex[0]);
      const c1 = hexToRgb(hex[1] || hex[0]);
      const c2 = hexToRgb(hex[2] || hex[0]);
      const rgba = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
      this.skyBg =
        'background:' +
        'radial-gradient(ellipse 60% 50% at 18% 14%, ' + rgba(c0, 0.20) + ', transparent 60%),' +
        'radial-gradient(ellipse 55% 45% at 84% 86%, ' + rgba(c1, 0.18) + ', transparent 60%),' +
        'radial-gradient(ellipse 40% 32% at 76% 22%, ' + rgba(c2, 0.12) + ', transparent 60%);';
    },
    /**
     * 启动流星生成循环
     */
    startLoop() {
      const tick = () => {
        this.spawnMeteor();
        if (Math.random() < 0.18) {
          setTimeout(() => { this.spawnMeteor(); }, 280 + Math.random() * 420);
        }
        this.timer = setTimeout(tick, 5000 + Math.random() * 7000);
      };
      this.timer = setTimeout(tick, 1500 + Math.random() * 2500);
    },
    /**
     * 生成一颗随机方向的流星并记录其生命周期
     */
    spawnMeteor() {
      const w = this.screenW;
      const h = this.screenH;
      if (!w || !h) return;
      const goRight = Math.random() < 0.5;
      const baseAng = (24 + Math.random() * 42) * Math.PI / 180;
      const ang = goRight ? baseAng : (Math.PI - baseAng);
      const dist = 280 + Math.random() * 280;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const sx = goRight ? Math.random() * w * 0.55 : w * 0.45 + Math.random() * w * 0.5;
      const sy = Math.random() * h * 0.35;
      const angDeg = ang * 180 / Math.PI;
      // 进一步放慢流星速度：约 3.6~5.6s，滑动更舒缓、更易点中
      const dur = (3.6 + Math.random() * 2.0).toFixed(2);
      const tailLen = Math.round(80 + Math.random() * 70);
      const id = ++this.meteorId;
      const style =
        'top:' + sy.toFixed(0) + 'px;' +
        'left:' + sx.toFixed(0) + 'px;' +
        '--dx:' + dx.toFixed(0) + 'px;' +
        '--dy:' + dy.toFixed(0) + 'px;' +
        'animation-duration:' + dur + 's;';
      const tail =
        'width:' + tailLen + 'px;' +
        'transform:rotate(' + angDeg.toFixed(1) + 'deg);';
      this.meteors.push({ id: id, style: style, tail: tail });
      const lifetime = Math.round(dur * 1000 + 300);
      const self = this;
      setTimeout(function () {
        self.meteors = self.meteors.filter(function (m) { return m.id !== id; });
      }, lifetime);
    },
    /**
     * 点击流星时随机展示一条星海留言弹窗
     */
    onMeteorTap() {
      const idx = Math.floor(Math.random() * sampleMessages.length);
      this.currentMessage = sampleMessages[idx];
      this.showMessage = true;
    },
    /**
     * 「收下这份温柔」：将当前小行星收入图鉴（按编号去重），记录捕获时间
     */
    captureMessage() {
      const msg = this.currentMessage;
      if (msg && typeof msg === 'object') {
        try {
          const app = getApp();
          if (!app.globalData.capturedAsteroids) app.globalData.capturedAsteroids = [];
          const list = app.globalData.capturedAsteroids;
          const exists = list.some(function (a) { return a.no === msg.no; });
          if (!exists) {
            list.push({
              no: msg.no,
              name: msg.name,
              text: msg.text,
              capturedAt: Date.now(),
            });
            if (typeof app.globalData.saveState === 'function') app.globalData.saveState();
            uni.showToast({ title: '已收入图鉴 🌠', icon: 'none', duration: 1500 });
          } else {
            uni.showToast({ title: '这颗小行星已在图鉴中', icon: 'none', duration: 1500 });
          }
        } catch (e) {}
      }
      this.showMessage = false;
    },
    /**
     * 关闭流星留言弹窗
     */
    closeMessage() {
      this.showMessage = false;
    },
  },
};
</script>

<style>
.star-sky {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 50% at 18% 14%, rgba(82, 52, 142, 0.16), transparent 60%),
    radial-gradient(ellipse 55% 45% at 84% 86%, rgba(22, 70, 132, 0.14), transparent 60%),
    radial-gradient(ellipse 40% 32% at 76% 22%, rgba(124, 42, 112, 0.08), transparent 60%);
}
.star-layer {
  position: absolute;
  top: 0; left: 0;
  width: 1px; height: 1px;
  border-radius: 50%;
}
.star-layer.layer-1 { animation: starTwk1 5s ease-in-out infinite; }
.star-layer.layer-2 { animation: starTwk2 7s ease-in-out infinite 1.2s; }
.star-layer.layer-3 { width: 2px; height: 2px; animation: starTwk3 4.2s ease-in-out infinite 0.6s; }
@keyframes starTwk1 { 0%,100% { opacity: 0.35; } 50% { opacity: 0.8; } }
@keyframes starTwk2 { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes starTwk3 { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }

/* 流星层覆盖全屏，但默认不拦截点击，仅流星本体可点击 */
.meteor-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 60;
  pointer-events: none;
  overflow: hidden;
}
.meteor {
  position: absolute;
  width: 3px; height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px 1px rgba(255,255,255,0.85), 0 0 14px 2px rgba(0,229,255,0.35);
  animation-name: meteorFly;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  pointer-events: auto;
  cursor: pointer;
}
/* 扩大点击命中范围（透明），不影响视觉，且随流星一起移动 */
.meteor::before {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 56px; height: 56px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}
@keyframes meteorFly {
  0% { transform: translate(0, 0); opacity: 0; }
  8% { opacity: 1; }
  82% { opacity: 1; }
  100% { transform: translate(var(--dx, 220px), var(--dy, 220px)); opacity: 0; }
}
.meteor-tail {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -1px;
  height: 2px;
  border-radius: 2px;
  transform-origin: 100% 50%;
  background: linear-gradient(to left, rgba(255,255,255,0.95), rgba(180,222,255,0.5) 16%, rgba(255,255,255,0) 100%);
}

/* 流星留言弹窗 */
.meteor-message-mask {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5,5,20,.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: meteorMsgIn .3s ease;
}
.meteor-message {
  width: 100%;
  max-width: 360px;
  text-align: center;
  padding: 32px 26px 26px;
  background: linear-gradient(135deg, rgba(12,12,36,.97), rgba(20,20,50,.97));
  border: 1px solid rgba(0,229,255,.2);
  border-radius: 24px;
  box-shadow: 0 0 60px rgba(0,229,255,.15);
  animation: meteorMsgPop .35s cubic-bezier(.16,1,.3,1);
}
.meteor-message-star {
  font-size: 40px;
  animation: starPulse 2s ease-in-out infinite;
}
.meteor-message-label {
  margin-top: 14px;
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--cyan);
  text-transform: uppercase;
}
.meteor-message-text {
  margin-top: 16px;
  font-size: 16px;
  line-height: 1.9;
  color: var(--text-1);
}
.meteor-message-no {
  margin-top: 18px;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(0,229,255,.65);
}
.meteor-message-btn {
  margin-top: 26px;
  padding: 12px 30px;
  border: none;
  border-radius: 100px;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  line-height: 1.4;
}
.meteor-message-btn::after { border: none; }
.meteor-message-btn:active { transform: scale(.96); }
@keyframes starPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }
@keyframes meteorMsgIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes meteorMsgPop { from { opacity: 0; transform: scale(.9) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
