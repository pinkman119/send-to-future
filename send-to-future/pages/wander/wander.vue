<template>
  <view class="wander-page">
    <star-sky />
    <view class="wander-header">
      <view class="wander-title-row">
        <view class="wander-title"><text class="grad">漫游</text>星海</view>
        <view class="wander-refresh" :class="{ spinning: isRefreshing }" @click="refreshStars">
          <text class="wander-refresh-icon">↻</text>
          <text>换片星海</text>
        </view>
      </view>
      <view class="wander-subtitle">每一颗星星，都是某人寄出的一封信 · 点击阅读 · 点亮传递温暖</view>
    </view>

    <!-- 左右滑动切换固定星系 -->
    <view
      class="wander-swipe"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <view class="galaxy-track" :class="{ noTransition: dragging }" :style="trackStyle">
        <view class="galaxy-slide" v-for="(g, gi) in rendered" :key="gi">
          <!-- 星座连线层 -->
          <view class="constellation-layer">
            <view
              v-for="(line, idx) in g.lines"
              :key="'line-' + idx"
              class="constellation-line"
              :class="{ mst: line.isMST }"
              :style="{
                left: line.x1 + 'px',
                top: line.y1 + 'px',
                width: line.length + 'px',
                transform: 'rotate(' + line.angle + 'deg)',
                animationDelay: line.delay + 's'
              }"
            ></view>
          </view>

          <!-- 星座名称 -->
          <view class="constellation-name">
            <view class="constellation-name-label">CONSTELLATION · {{ gi + 1 }}/{{ galaxies.length }}</view>
            <view class="constellation-name-text">{{ g.name }}</view>
            <view class="constellation-name-desc">{{ g.desc }}</view>
          </view>

          <view
            v-for="(star, idx) in g.stars"
            :key="idx"
            class="star-letter"
            :class="[star.sizeClass, star.signalClass, { listened: listenedIds.includes(star.letter.id) }]"
            :style="{ left: star.x + 'px', top: star.y + 'px', animationDelay: star.delay + 's', '--sc': star.color, '--glow': star.glow }"
            @click="showLetterModal(star.letter)"
          >
            <view class="star-letter-dot"></view>
            <view class="signal-badge" v-if="star.tier > 0" :class="{ show: star.showBadge, weak: star.tier === 1 }">{{ star.badgeText }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 星系指示点 -->
    <view class="galaxy-dots">
      <view
        v-for="(g, gi) in galaxies"
        :key="gi"
        class="galaxy-dot"
        :class="{ active: galaxyIndex === gi }"
        @click="goGalaxy(gi)"
      ></view>
    </view>
    <view class="galaxy-hint">← 左右滑动切换星系 →</view>

    <!-- Letter Detail Modal -->
    <view class="letter-modal-overlay" v-if="showModal" :class="{ show: showModal }" @click="closeModal">
      <view class="letter-modal" @click.stop>
        <view class="modal-header">
          <view class="modal-avatar">{{ modalAvatar }}</view>
          <view class="modal-header-info">
            <view class="modal-header-name">{{ modalFrom }}</view>
            <view class="modal-header-asteroid">{{ modalAsteroid }}</view>
          </view>
          <view class="modal-signal-tag" :class="modalSignalClass" v-if="modalSignalText" :style="{ display: 'inline-flex' }">{{ modalSignalText }}</view>
        </view>
        <view class="modal-star-row">
          <view class="modal-star">{{ modalStar }}</view>
        </view>
        <view class="modal-date">{{ modalDate }}</view>
        <view class="modal-divider"></view>
        <view class="modal-content">{{ modalContent }}</view>
        <view class="modal-like-bar">
          <view class="modal-like-count">
            <view class="modal-like-num" :class="{ lit: isModalLit }">{{ modalLikeNum }}</view>
            <view class="modal-like-label">人点亮了这颗星</view>
          </view>
          <view class="modal-footer" style="margin:0;">
            <button class="modal-btn close" @click="closeModal">关闭</button>
            <button class="modal-btn light" :class="{ lit: isModalLit }" @click="toggleLight">
              {{ isModalLit ? '✨ 已点亮' : '💡 点亮' }}
            </button>
          </view>
        </view>
        <view class="modal-subscribe-bar">
          <button class="modal-btn subscribe" :class="{ subscribed: isModalSubscribed }" @click="toggleSubscribe">
            {{ isModalSubscribed ? '📡 已收听' : '📻 收听此人' }}
          </button>
          <view class="modal-subscribe-hint" v-if="!isModalSubscribed">收听后将持续收到此人寄出的信件</view>
          <view class="modal-subscribe-hint subscribed-hint" v-if="isModalSubscribed">新信件将推送到收件箱</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const sampleLetters = [
  { id:'L01', content:"亲爱的未来的我：\n\n你还记得2024年那个冬天吗？那时候你刚失业，每天窝在出租屋里投简历。你对自己说，没关系，这只是人生的一个弯道。\n\n现在回头看，那个弯道是不是已经变成了风景线？\n\n我希望你已经找到了真正热爱的事。如果不是，也没关系，继续找。", star:'gold', from:'一位北漂旅人', avatar:'🧑‍🚀', likes:1247 },
  { id:'L02', content:"给十年后的自己：\n\n如果那时候你已经有了孩子，请记得告诉他：妈妈年轻时也是个很酷的人。\n\n我去过12个国家，在冰岛看过极光，在土耳其坐过热气球。我不是一开始就勇敢的，我只是选择了出发。\n\n希望你依然在路上。", star:'gold', from:'一位环球旅者', avatar:'👩‍✈️', likes:3856 },
  { id:'L03', content:"未来的我：\n\n2026年的今天，我终于鼓起勇气辞职了。所有人都觉得我疯了，放弃稳定的工作去创业。\n\n但我知道如果我不试，我会后悔一辈子。\n\n如果你正在读这封信，无论结果如何，谢谢你当时的勇敢。", star:'cyan', from:'一位创业者', avatar:'🧑‍💼', likes:523 },
  { id:'L04', content:"致三十岁的自己：\n\n二十岁的我，正在图书馆里写这封信。窗外是校园的银杏树，叶子黄了。\n\n我不知道三十岁的我是什么样子，有没有变得更成熟，有没有学会好好爱自己。\n\n但我知道，此刻的我在努力。那就够了。", star:'cyan', from:'一位大学生', avatar:'🧑‍🎓', likes:89 },
  { id:'L05', content:"嘿，未来的我：\n\n你还记得那只叫\"橘子\"的猫吗？它现在正趴在我腿上睡觉。\n\n如果你已经有了一只新的猫，请好好对它。如果没有，那就去领养一只吧。\n\n有些温暖，是只有小动物才能给的。", star:'small', from:'一位猫奴', avatar:'🐱', likes:2156 },
  { id:'L06', content:"给未来的自己：\n\n今天是我确诊抑郁症的第三个月。我开始吃药了，开始试着出门了。\n\n我不知道未来的我会不会已经好了。但我知道，此刻的我在挣扎着往上爬。\n\n如果你已经走出来了，恭喜你。如果还没有，没关系，我陪你。", star:'gold', from:'一位勇敢的人', avatar:'🧙‍♀️', likes:4521 },
  { id:'L07', content:"未来的我：\n\n你还记得第一次心动的感觉吗？是高中操场上那个穿白衬衫的男生。\n\n我不知道现在你身边是谁，但希望那个人值得你所有的温柔。\n\n如果没有也没关系。你本身就足够完整。", star:'cyan', from:'一位浪漫主义者', avatar:'🌸', likes:347 },
  { id:'L08', content:"致未来的自己：\n\n今年我50岁了。孩子上了大学，丈夫常出差，家里突然空了。\n\n我决定开始学画画。从零开始，笨手笨脚的。\n\n如果你正在读这封信，希望你还在画。不是为了成为画家，只是为了那份安静的快乐。", star:'gold', from:'一位学习者', avatar:'🧑‍🎨', likes:678 },
  { id:'L09', content:"未来的我：\n\n你还记得外公吗？他走的那天，我在飞机上，没来得及见最后一面。\n\n我欠他一句再见。\n\n如果你有了孩子，请多带他去看望老人。有些再见，不能等。", star:'small', from:'一位思念者', avatar:'🦉', likes:1934 },
  { id:'L10', content:"给五年后的自己：\n\n我正在备考研究生。已经二战了，压力大到失眠。\n\n妈妈昨天打电话来，说考不上就回家，她养我。\n\n我不知道未来会怎样。但我想再试一次。\n\n如果你已经上岸了，替我高兴一下。如果没有，那就换条路走，人生不是只有一条路。", star:'cyan', from:'一位考研人', avatar:'🧑‍🎓', likes:45 },
  { id:'L11', content:"亲爱的未来的我：\n\n今天是我们结婚五周年。他送了我一束向日葵，和五年前一模一样。\n\n我不知道十年后、二十年后，我们还会不会像现在这样。\n\n但我知道，此刻的我很幸福。这就够了。", star:'small', from:'一位妻子', avatar:'👩‍💼', likes:156 },
  { id:'L12', content:"未来的我：\n\n我终于学会说\"不\"了。\n\n30年了，我一直是那个\"好好先生\"。帮同事加班，帮朋友搬家，帮邻居遛狗。\n\n今天我第一次拒绝了。感觉很好。\n\n希望你继续保持。善良要有锋芒。", star:'gold', from:'一位觉醒者', avatar:'🦊', likes:2890 },
  { id:'L13', content:"给未来的自己：\n\n今天是我来这座城市的第一天。拖着行李箱走出地铁站，看着满眼的霓虹灯，既兴奋又害怕。\n\n我不知道自己能在这里待多久，但我想试试。\n\n如果你还在这里，说明我们都撑过来了。如果不在了，那也没关系，至少我们勇敢过。", star:'cyan', from:'一位异乡人', avatar:'🧑‍🚀', likes:412 },
  { id:'L14', content:"未来的我：\n\n你还记得那家巷子里的书店吗？我每周都去，坐在角落看一下午。\n\n老板养了只金毛，总趴在我脚边。\n\n如果那家店还在，替我去看看。如果不在了，就在心里留个位置吧。\n\n有些地方，去过就是永远。", star:'small', from:'一位读书人', avatar:'🧑‍🔬', likes:67 },
  { id:'L15', content:"致十年后的我：\n\n如果那时候你依然单身，请不要焦虑。\n\n28岁的我，一个人看电影，一个人吃火锅，一个人旅行。不是没人陪，是我享受独处。\n\n希望你依然拥有这份自在。也希望你遇到了那个让独处变得更美好的人——如果还没有，也没关系。", star:'gold', from:'一位自由人', avatar:'🌠', likes:1023 },
];

/**
 * 生成随机的小行星编号（年份 + 双字母 + 两位数字）。
 * @returns {string} 形如「小行星 #2023-AB07」的编号
 */
function generateAsteroidId() {
  const year = 2020 + Math.floor(Math.random() * 7);
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `小行星 #${year}-${l1}${l2}${num}`;
}

sampleLetters.forEach(l => { if (!l.asteroid) l.asteroid = generateAsteroidId(); });

const constellationPrefixes = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼','天琴','天鹰','天鹅','飞马','仙女','猎户','大熊','天龙','仙后','英仙','御夫','长蛇','巨爵','麒麟','凤凰','天鸽','狐狸','海豚','小狮','天猫'];
const constellationSuffixes = ['座','星群','之翼','之环','之冠','之痕','之桥','之渊','之径','之纱'];
const constellationDescs = [
  '由 {n} 颗信件之星组成的星座',
  '某位旅人在星海中留下的轨迹',
  '跨越光年的思念连成的图案',
  '匿名信件交织出的星图',
  '无数心声汇聚而成的星群',
  '漂浮在时间河流上的星座',
  '由陌生人的故事编织的星轨',
  '此刻与未来之间的星桥',
];

/**
 * 根据点赞数判断信号强度等级。
 * @param {number} likes - 信件的点赞数
 * @returns {number} 等级：0=无信号，1=微弱信号，2=强烈信号
 */
function getSignalTier(likes) {
  if (likes >= 1000) return 2;
  if (likes >= 100) return 1;
  return 0;
}

/**
 * 根据信号等级返回加权采样权重（等级越高越容易被选中）。
 * @param {number} likes - 信件的点赞数
 * @returns {number} 采样权重
 */
function getSignalWeight(likes) {
  const tier = getSignalTier(likes);
  if (tier === 2) return 5;
  if (tier === 1) return 3;
  return 1;
}

/**
 * 按信号权重随机抽取指定数量的信件（不重复）。
 * @param {number} count - 需要抽取的信件数量
 * @returns {Array<object>} 抽取出的信件数组
 */
function pickWeightedLetters(count) {
  const pool = sampleLetters.map(l => ({ letter: l, weight: getSignalWeight(l.likes) }));
  const picked = [];
  const remaining = [...pool];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].weight;
      if (r <= 0) { idx = j; break; }
    }
    picked.push(remaining[idx].letter);
    remaining.splice(idx, 1);
  }
  return picked;
}

/**
 * 将日期格式化为「年.月.日」字符串。
 * @param {Date} d - 需要格式化的日期对象
 * @returns {string} 形如「2026.07.25」的日期字符串
 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/**
 * 将点赞数格式化为带单位（w/k）的短字符串。
 * @param {number} n - 原始点赞数
 * @returns {string} 压缩显示后的点赞数
 */
function formatLikeCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ===== 固定星系：在模块加载时一次性生成，滑动不会重新随机 =====
const GALAXY_COUNT = 6;

/**
 * 根据星星坐标计算星座连线：先做最小生成树（MST），再补充若干近邻连线。
 * @param {Array<object>} positions - 星星的归一化坐标数组，每项含 x、y
 * @returns {Array<object>} 连线数组，每项含 x1、y1、length、angle、isMST、delay
 */
function computeLines(positions) {
  const n = positions.length;
  const lines = [];
  if (n < 2) return lines;
  const inMST = new Array(n).fill(false);
  const minDist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  minDist[0] = 0;
  const mstEdges = [];
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && (u === -1 || minDist[v] < minDist[u])) u = v;
    }
    inMST[u] = true;
    if (parent[u] !== -1) mstEdges.push([parent[u], u]);
    for (let v = 0; v < n; v++) {
      if (!inMST[v]) {
        const dx = positions[u].x - positions[v].x;
        const dy = positions[u].y - positions[v].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist[v]) { minDist[v] = d; parent[v] = u; }
      }
    }
  }

  const maxExtra = Math.floor(n * 0.4);
  const candidates = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 140 && !mstEdges.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) {
        candidates.push({ i, j, d });
      }
    }
  }
  candidates.sort((a, b) => a.d - b.d);
  const extraEdges = [];
  for (let i = 0; i < Math.min(maxExtra, candidates.length); i++) {
    extraEdges.push([candidates[i].i, candidates[i].j]);
  }
  const allEdges = [...mstEdges, ...extraEdges];
  allEdges.forEach((edge, idx) => {
    const [i, j] = edge;
    const x1 = positions[i].x;
    const y1 = positions[i].y;
    const x2 = positions[j].x;
    const y2 = positions[j].y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    lines.push({
      x1, y1,
      length,
      angle,
      isMST: idx < mstEdges.length,
      delay: idx * 0.08,
    });
  });
  return lines;
}

/**
 * 一次性生成固定数量的星系，每个星系由加权抽取的信件及其坐标、连线组成。
 * @returns {Array<object>} 星系数组，每项含 name、desc、stars
 */
function generateGalaxies() {
  const galaxies = [];
  for (let g = 0; g < GALAXY_COUNT; g++) {
    const count = 11 + Math.floor(Math.random() * 3); // 11~13 颗
    const selected = pickWeightedLetters(count);

    const positions = [];
    const stars = [];
    for (let i = 0; i < selected.length; i++) {
      const letter = selected[i];
      let nx, ny, attempts = 0;
      do {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8 + 0.15;
        nx = 0.5 + Math.cos(angle) * 0.42 * radius;
        ny = 0.5 + Math.sin(angle) * 0.42 * radius;
        nx = Math.max(0.05, Math.min(0.95, nx));
        ny = Math.max(0.05, Math.min(0.95, ny));
        attempts++;
      } while (attempts < 20 && positions.some(p => Math.hypot(p.nx - nx, p.ny - ny) < 0.12));
      positions.push({ nx, ny });

      const tier = getSignalTier(letter.likes);
      const sizeClass = letter.star === 'gold' ? 'large' : letter.star === 'cyan' ? 'medium' : 'small';
      const signalClass = tier === 2 ? 'signal-t2' : tier === 1 ? 'signal-t1' : '';
      const isSignal = tier > 0;
      stars.push({
        nx, ny,
        sizeClass,
        signalClass,
        tier,
        delay: Math.random() * 3,
        letter,
        showBadge: isSignal,
        badgeText: tier === 2 ? '强烈信号' : '微弱信号',
      });
    }

    const name = constellationPrefixes[Math.floor(Math.random() * constellationPrefixes.length)] +
      constellationSuffixes[Math.floor(Math.random() * constellationSuffixes.length)];
    const desc = constellationDescs[Math.floor(Math.random() * constellationDescs.length)].replace('{n}', count);
    galaxies.push({ name, desc, stars });
  }
  return galaxies;
}

const GALAXIES = generateGalaxies();

export default {
  /**
   * 组件的响应式数据。
   * @returns {object} 包含星系、渲染结果、滑动手势及弹窗状态的数据对象
   */
  data() {
    return {
      galaxies: GALAXIES,
      rendered: [],
      galaxyIndex: 0,
      dragX: 0,
      startX: 0,
      startY: 0,
      dragging: false,
      lockDir: '',
      trackWidth: 0,
      justSwiped: false,
      isRefreshing: false,
      showModal: false,
      modalAvatar: '',
      modalFrom: '',
      modalAsteroid: '',
      modalStar: '',
      modalDate: '',
      modalContent: '',
      modalLikeNum: '0',
      modalSignalClass: '',
      modalSignalText: '',
      isModalLit: false,
      currentModalLetter: null,
      isModalSubscribed: false,
      listenedIds: [],
    };
  },
  computed: {
    /**
     * 根据当前星系索引与拖动偏移计算轨道水平位移样式。
     * @returns {object} 含 transform 的样式对象
     */
    trackStyle() {
      const x = -this.galaxyIndex * this.trackWidth + this.dragX;
      return { transform: `translateX(${x}px)` };
    },
  },
  /**
   * 组件挂载后：同步已收听列表、首次渲染星系并监听调色板变化。
   */
  mounted() {
    this.syncListened();
    this.renderAll();
    uni.$on('palette-change', this.onPaletteChange);
  },
  /**
   * 页面显示时：从地球页返回后按最新星球颜色重绘星系。
   */
  onShow() {
    // 从地球页返回时，按最新星球颜色重绘星系
    this.renderAll();
  },
  /**
   * 页面卸载时：移除调色板变化监听，避免内存泄漏。
   */
  onUnload() {
    uni.$off('palette-change', this.onPaletteChange);
  },
  /**
   * 窗口尺寸变化时：重新渲染星系以适配新尺寸。
   */
  onResize() {
    this.renderAll();
  },
  methods: {
    /**
     * 读取「地球-我的星球-星球颜色」当前调色板（每次实时读取，避免 computed 缓存旧值）。
     * @returns {Array<string>} 调色板颜色数组
     */
    getGalaxyPalette() {
      const app = getApp();
      const pals = (app.globalData && app.globalData.satPalettes) || [];
      const idx = (typeof app.globalData.satPalette === 'number') ? app.globalData.satPalette : 0;
      return (pals[idx] && pals[idx].colors) || ['#00e5ff', '#a855f7', '#4facfe', '#ff6b9d', '#4ade80'];
    },
    /**
     * 把归一化坐标映射到当前屏幕尺寸，并计算每个星系的连线后渲染到页面。
     */
    renderAll() {
      const sysInfo = uni.getSystemInfoSync();
      const skyW = sysInfo.windowWidth;
      const skyH = sysInfo.windowHeight;
      const left = 24;
      const right = 24;
      const top = 200;                       // 标题区以下
      const bottom = skyH - 150;             // 给底栏 + 指示点留白
      const baseW = this.trackWidth || skyW; // 用实际 slide 宽度，保证星空与滑动对齐
      const availW = Math.max(50, baseW - left - right);
      const availH = Math.max(50, bottom - top);

      const rendered = this.galaxies.map(g => {
        const positions = g.stars.map(s => ({
          x: left + s.nx * availW,
          y: top + s.ny * availH,
        }));
        const lines = computeLines(positions);
        const pal = this.getGalaxyPalette();
        const stars = g.stars.map((s, i) => {
          let color, glow;
          if (s.sizeClass === 'large') color = pal[0] || '#ffd56b';
          else if (s.sizeClass === 'medium') color = pal[1] || '#00e5ff';
          else color = pal[2] || '#e0e0ff';
          glow = s.tier === 2 ? (pal[3] || pal[0] || '#ff6b9d') : color;
          return { ...s, x: positions[i].x, y: positions[i].y, color, glow };
        });
        return { name: g.name, desc: g.desc, stars, lines };
      });

      this.rendered = rendered;
      this.trackWidth = skyW; // 兜底值
      // 用真实渲染出的 slide 宽度修正 trackWidth，避免 windowWidth 与实际布局宽度
      // 存在微小差异时，每次滑动都累积向左偏移的 bug
      this.$nextTick(() => {
        uni.createSelectorQuery()
          .select('.galaxy-slide')
          .boundingClientRect(rect => {
            if (rect && rect.width) this.trackWidth = rect.width;
          })
          .exec();
      });
    },
    /**
     * 从触摸事件中提取首个触摸点的横坐标。
     * @param {object} e - 触摸事件对象
     * @returns {number} 触摸点横坐标
     */
    getTouchX(e) {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return 0;
      return typeof t.clientX === 'number' ? t.clientX : (t.pageX || 0);
    },
    /**
     * 从触摸事件中提取首个触摸点的纵坐标。
     * @param {object} e - 触摸事件对象
     * @returns {number} 触摸点纵坐标
     */
    getTouchY(e) {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return 0;
      return typeof t.clientY === 'number' ? t.clientY : (t.pageY || 0);
    },
    /**
     * 触摸开始：记录起始坐标并初始化拖动状态。
     * @param {object} e - 触摸事件对象
     */
    onTouchStart(e) {
      this.startX = this.getTouchX(e);
      this.startY = this.getTouchY(e);
      this.dragging = true;
      this.lockDir = '';
    },
    /**
     * 触摸移动：根据移动距离锁定方向并更新水平拖动偏移。
     * @param {object} e - 触摸事件对象
     */
    onTouchMove(e) {
      if (!this.dragging) return;
      const dx = this.getTouchX(e) - this.startX;
      const dy = this.getTouchY(e) - this.startY;
      if (!this.lockDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        this.lockDir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      if (this.lockDir === 'h') {
        this.dragX = dx;
      }
    },
    /**
     * 触摸结束：根据水平位移决定是否切换星系。
     * @param {object} e - 触摸事件对象
     */
    onTouchEnd(e) {
      if (!this.dragging) return;
      this.dragging = false;
      const dx = this.dragX;
      this.dragX = 0;
      if (this.lockDir === 'h' && Math.abs(dx) > 50) {
        let ni = this.galaxyIndex + (dx < 0 ? 1 : -1);
        ni = Math.max(0, Math.min(this.galaxies.length - 1, ni));
        if (ni !== this.galaxyIndex) {
          this.galaxyIndex = ni;
          this.justSwiped = true;
          setTimeout(() => { this.justSwiped = false; }, 350);
        }
      }
    },
    /**
     * 切换到指定索引的星系。
     * @param {number} gi - 目标星系索引
     */
    goGalaxy(gi) {
      if (gi === this.galaxyIndex) return;
      this.galaxyIndex = gi;
    },
    /**
     * 调色板变化时：重新渲染星系。
     */
    onPaletteChange() {
      this.renderAll();
    },
    /**
     * 刷新星海：生成一组全新的、与当前不重复的星系。
     */
    refreshStars() {
      this.isRefreshing = true;
      setTimeout(() => {
        this.isRefreshing = false;
        if (this.galaxies.length <= 1) return;
        // 生成一整组全新的星系，且与上一组不重复
        const newSet = this.generateNonRepeatingGalaxies();
        this.galaxies = newSet;
        this.galaxyIndex = 0;
        this.renderAll();
        uni.showToast({ title: '已生成新的星海 ✨', icon: 'none', duration: 1500 });
      }, 600);
    },
    /**
     * 计算一个星系组的唯一签名（用于避免重复）。
     * @param {Array<object>} set - 星系组
     * @returns {string} 由信件 id 组合而成的签名串
     */
    galaxySignature(set) {
      return set
        .map(g => g.stars.map(s => s.letter.id).sort().join(','))
        .sort()
        .join('|');
    },
    /**
     * 生成与当前组不重复的全新星系组（最多重试 30 次）。
     * @returns {Array<object>} 全新的星系数组
     */
    generateNonRepeatingGalaxies() {
      const prevSig = this.galaxySignature(this.galaxies);
      let newSet;
      let tries = 0;
      do {
        newSet = generateGalaxies();
        tries++;
      } while (tries < 30 && this.galaxySignature(newSet) === prevSig);
      return newSet;
    },
    /**
     * 打开信件详情弹窗，填充头像、信号、内容、点赞等数据。
     * @param {object} letter - 被点击的信件对象
     */
    showLetterModal(letter) {
      if (this.justSwiped) return;
      this.currentModalLetter = letter;
      const app = getApp();
      const likedSet = app.globalData.likedLetterIds || new Set();
      const tier = getSignalTier(letter.likes);
      const starMap = { gold:'⭐', cyan:'✨', small:'·' };

      this.modalAvatar = letter.avatar || '🌙';
      this.modalFrom = letter.from;
      this.modalAsteroid = letter.asteroid;
      this.modalStar = starMap[letter.star] || '✨';

      if (tier === 2) {
        this.modalSignalClass = 't2';
        this.modalSignalText = '📡 强烈信号';
      } else if (tier === 1) {
        this.modalSignalClass = 't1';
        this.modalSignalText = '📡 强烈信号';
      } else {
        this.modalSignalClass = '';
        this.modalSignalText = '';
      }

      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 365) + 1;
      now.setDate(now.getDate() - daysAgo);
      this.modalDate = formatDate(now) + ' 寄出';
      this.modalContent = letter.content;
      this.modalLikeNum = formatLikeCount(letter.likes);
      this.isModalLit = likedSet.has(letter.id);
      const subs = app.globalData.mySubscriptions || [];
      this.isModalSubscribed = subs.some(s => s.letterId === letter.id);
      this.showModal = true;
    },
    /**
     * 关闭信件详情弹窗。
     */
    closeModal() {
      this.showModal = false;
    },
    /**
     * 切换当前信件的「点亮」状态，并同步到全局点亮记录。
     */
    toggleLight() {
      if (!this.currentModalLetter) return;
      const app = getApp();
      if (!app.globalData.likedLetterIds) app.globalData.likedLetterIds = new Set();
      if (!app.globalData.litRecords) app.globalData.litRecords = [];
      const likedSet = app.globalData.likedLetterIds;
      const litRecs = app.globalData.litRecords;
      const id = this.currentModalLetter.id;

      if (!likedSet.has(id)) {
        likedSet.add(id);
        if (!litRecs.some(r => r.id === id)) litRecs.push({ id: id, time: Date.now() });
        this.currentModalLetter.likes++;
        this.isModalLit = true;
        this.modalLikeNum = formatLikeCount(this.currentModalLetter.likes);
        app.globalData.saveState();
        uni.showToast({ title: '已点亮 ⭐', icon: 'none', duration: 1500 });
      } else {
        likedSet.delete(id);
        app.globalData.litRecords = litRecs.filter(r => r.id !== id);
        this.currentModalLetter.likes = Math.max(0, this.currentModalLetter.likes - 1);
        this.isModalLit = false;
        this.modalLikeNum = formatLikeCount(this.currentModalLetter.likes);
        app.globalData.saveState();
      }
    },
    /**
     * 切换「收听此人」状态：订阅时写入收件箱并增加收听计数。
     */
    toggleSubscribe() {
      if (!this.currentModalLetter) return;
      const app = getApp();
      if (!app.globalData.mySubscriptions) app.globalData.mySubscriptions = [];
      const letter = this.currentModalLetter;
      const subs = app.globalData.mySubscriptions;

      if (!this.isModalSubscribed) {
        subs.push({
          id: 'SUB' + Date.now(),
          letterId: letter.id,
          from: letter.from,
          avatar: letter.avatar || '🌙',
          asteroid: letter.asteroid,
          time: formatDate(new Date()),
          pushedAt: Date.now(),
          viewed: false,
        });
        this.isModalSubscribed = true;
        this.syncListened();
        app.globalData.saveState();
        uni.showToast({ title: '已收听 📻', icon: 'none', duration: 1500 });

        if (!app.globalData.inboxItems) app.globalData.inboxItems = [];
        app.globalData.inboxItems.unshift({
          id: 'INB' + Date.now(),
          letterId: letter.id,
          type: 'newListener',
          from: letter.from,
          avatar: letter.avatar || '🌙',
          planetId: 'EARTH-' + String(Math.floor(Math.random() * 100000)).padStart(5, '0'),
          preview: letter.content.replace(/\n/g, ' ').substring(0, 50) + '...',
          time: formatDate(new Date()),
          read: false,
        });
        app.globalData.myListenersCount = (app.globalData.myListenersCount || 0) + 1;
        app.globalData.saveState();
      } else {
        app.globalData.mySubscriptions = subs.filter(s => s.letterId !== letter.id);
        this.isModalSubscribed = false;
        this.syncListened();
        app.globalData.saveState();
        uni.showToast({ title: '已取消收听', icon: 'none', duration: 1500 });
      }
    },
    /**
     * 同步“我收听过的”信件 id 列表，用于星系中金色高亮。
     */
    syncListened() {
      const app = getApp();
      const subs = (app.globalData.mySubscriptions || []) ;
      this.listenedIds = subs.map(s => s.letterId);
    },
  },
};
</script>

<style>
/* ===== Wander Page ===== */
.wander-page { height:100vh; position:relative; overflow:hidden; z-index:1; box-sizing:border-box; padding-bottom:90px; }
.wander-header {
  position:absolute; top:0; left:0; right:0; z-index:10;
  padding:60px 20px 16px;
  background:linear-gradient(to bottom,rgba(5,5,20,.8) 0%,transparent 100%);
}
.wander-title-row { display:flex; align-items:center; justify-content:space-between; }
.wander-title { font-size:22px; font-weight:800; }
.wander-title .grad { background:linear-gradient(135deg,var(--cyan),var(--purple)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.wander-refresh {
  display:flex; align-items:center; gap:6px; padding:8px 16px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:100px;
  color:var(--cyan); font-size:12px; cursor:pointer; transition:all .3s;
}
.wander-refresh:active { transform:scale(.95); }
.wander-refresh-icon { display:inline-block; transition:transform .5s; }
.wander-refresh.spinning .wander-refresh-icon { animation:spin360 .8s ease; }
@keyframes spin360 { to { transform:rotate(360deg); } }
.wander-subtitle { font-size:12px; color:var(--text-2); margin-top:6px; }

/* 滑动区域 */
.wander-swipe {
  position:absolute; inset:0; z-index:2;
  overflow:hidden; touch-action:pan-y;
}
.galaxy-track {
  display:flex; height:100%; width:100%;
  will-change:transform;
  transition:transform .35s cubic-bezier(.22,.61,.36,1);
}
.galaxy-track.noTransition { transition:none; }
.galaxy-slide {
  flex:0 0 100%; width:100%; height:100%;
  position:relative;
}

/* Constellation lines */
.constellation-layer { position:absolute; inset:0; pointer-events:none; z-index:1; }
.constellation-line {
  position:absolute; left:0; top:0; height:1px;
  transform-origin: 0 50%;
  -webkit-transform-origin: 0 50%;
  border-radius:1px;
}
.constellation-line.mst {
  background:linear-gradient(90deg,rgba(0,229,255,.55) 0%,rgba(168,85,247,.4) 50%,rgba(255,213,107,.55) 100%);
  opacity:0;
  animation:drawLine .9s ease forwards;
}
.constellation-line:not(.mst) {
  background:rgba(0,229,255,.18);
  opacity:0;
  animation:drawLine .9s ease forwards;
}
@keyframes drawLine { from { opacity:0; } to { opacity:1; } }

/* Constellation name badge */
.constellation-name {
  position:absolute; top:130px; left:50%; transform:translateX(-50%);
  z-index:5; text-align:center; pointer-events:none; width:90%;
  opacity:0; animation:nameFadeIn 1s ease .5s forwards;
}
@keyframes nameFadeIn { to { opacity:1; } }
.constellation-name-label {
  font-size:10px; color:var(--text-3); letter-spacing:3px; text-transform:uppercase;
}
.constellation-name-text {
  font-size:20px; font-weight:700; margin-top:4px;
  background:linear-gradient(135deg,var(--cyan),var(--purple),var(--gold));
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  letter-spacing:2px;
}
.constellation-name-desc {
  font-size:11px; color:var(--text-2); margin-top:4px;
}

/* Individual star letter */
.star-letter {
  position:absolute; cursor:pointer; transition:opacity .3s, filter .3s;
  animation:starTwinkle 3s ease-in-out infinite;
  display:flex; flex-direction:column; align-items:center;
  transform:translate(-50%,-50%);
  z-index:3;
}
.star-letter-dot {
  width:5px; height:5px; border-radius:50%;
  background:var(--sc); box-shadow:0 0 8px var(--glow);
  transition:all .3s;
}
.star-letter.large .star-letter-dot { width:9px; height:9px; }
.star-letter.medium .star-letter-dot { width:7px; height:7px; }
.star-letter.small .star-letter-dot { width:4px; height:4px; }
.star-letter:active .star-letter-dot { transform:scale(1.3); }

/* 已收听（听过）的星星：变为金色，但保持原尺寸不变 */
.star-letter.listened .star-letter-dot {
  background: var(--gold) !important;
  box-shadow: 0 0 14px rgba(255,213,107,.85), 0 0 28px rgba(255,213,107,.45) !important;
}

@keyframes starTwinkle {
  0%,100% { opacity:.6; }
  50% { opacity:1; }
}

/* Strong Signal Tiers */
.star-letter.signal-t1 .star-letter-dot {
  box-shadow:0 0 20px var(--glow), 0 0 40px var(--glow);
  animation:signalPulseT1 2s ease-in-out infinite;
}
@keyframes signalPulseT1 {
  0%,100% { box-shadow:0 0 20px var(--glow), 0 0 40px var(--glow); }
  50% { box-shadow:0 0 30px var(--glow), 0 0 60px var(--glow); }
}
.star-letter.signal-t2 .star-letter-dot {
  width:12px; height:12px;
  background:var(--sc);
  box-shadow:0 0 26px var(--glow), 0 0 52px var(--glow), 0 0 80px var(--glow);
  animation:signalPulseT2 1.5s ease-in-out infinite;
}
@keyframes signalPulseT2 {
  0%,100% { transform:scale(1); }
  50% { transform:scale(1.3); }
}

/* Signal badge */
.signal-badge {
  position:absolute; top:-28px; left:50%; transform:translateX(-50%);
  white-space:nowrap; padding:3px 10px;
  background:linear-gradient(135deg,var(--signal-bright),var(--pink));
  border-radius:100px; font-size:10px; font-weight:700; color:#fff;
  letter-spacing:1px; pointer-events:none;
  opacity:0; transition:opacity .3s;
  box-shadow:0 2px 12px rgba(255,59,107,.4);
}
.signal-badge.show { opacity:1; }
/* 微弱信号：亮度较浅 */
.signal-badge.weak {
  background:linear-gradient(135deg, rgba(0,229,255,.22), rgba(168,85,247,.22));
  border:1px solid rgba(0,229,255,.32);
  color:#cfeaff;
  box-shadow:0 2px 10px rgba(0,229,255,.15);
}
.signal-badge.weak.show { opacity:.7; }

/* 星系指示点 + 提示 */
.galaxy-dots {
  position:absolute; left:0; right:0;
  bottom:108px; z-index:20;
  display:flex; align-items:center; justify-content:center; flex-wrap:nowrap; gap:8px;
}
.galaxy-dot {
  flex-shrink:0;
  width:7px; height:7px; border-radius:50%;
  background:rgba(255,255,255,.22); transition:all .3s;
}
.galaxy-dot.active {
  width:18px; border-radius:4px;
  background:var(--cyan); box-shadow:0 0 10px rgba(0,229,255,.6);
}
.galaxy-hint {
  position:absolute; left:0; right:0; text-align:center;
  bottom:86px; z-index:20; font-size:11px; color:var(--text-3);
  letter-spacing:1px; pointer-events:none;
}

/* Letter Detail Modal */
.letter-modal-overlay {
  position:fixed; inset:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px;
  background:rgba(5,5,20,.85); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  opacity:0; transition:opacity .3s;
}
.letter-modal-overlay.show { opacity:1; }
.letter-modal {
  width:100%; max-width:380px; max-height:78vh; overflow-y:auto;
  background:linear-gradient(135deg,rgba(12,12,36,.97),rgba(20,20,50,.97));
  border:1px solid rgba(0,229,255,.2); border-radius:24px;
  box-shadow:0 0 60px rgba(0,229,255,.15); padding:28px 24px 24px;
}

.modal-header { display:flex; align-items:center; gap:14px; margin-bottom:18px; }
.modal-avatar {
  width:48px; height:48px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:26px;
  background:linear-gradient(135deg,rgba(0,229,255,.1),rgba(168,85,247,.1));
  border:1px solid rgba(0,229,255,.2);
}
.modal-header-info { flex:1; min-width:0; }
.modal-header-name { font-size:14px; font-weight:600; }
.modal-header-asteroid { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:2px; }
.modal-signal-tag {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 10px; border-radius:100px; font-size:10px; font-weight:700;
  letter-spacing:.5px; white-space:nowrap;
}
.modal-signal-tag.t1 { background:rgba(255,107,157,.15); color:var(--pink); border:1px solid rgba(255,107,157,.3); }
.modal-signal-tag.t2 { background:linear-gradient(135deg,var(--signal-bright),var(--pink)); color:#fff; }

.modal-star-row { display:flex; justify-content:center; margin-bottom:12px; }
.modal-star-row .modal-star { font-size:32px; animation:starPulse 2s ease-in-out infinite; }
@keyframes starPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.2);} }
.modal-date { text-align:center; font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-bottom:16px; }
.modal-divider { height:1px; background:linear-gradient(90deg,transparent,var(--glass-bd),transparent); margin:12px 0 16px; }
.modal-content { font-size:14px; line-height:1.9; color:var(--text-1); white-space:pre-wrap; }

.modal-like-bar {
  display:flex; align-items:center; gap:10px; margin-top:18px;
  padding:12px 16px; background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
}
.modal-like-count { flex:1; }
.modal-like-num { font-size:18px; font-weight:700; }
.modal-like-num.lit { color:var(--pink); }
.modal-like-label { font-size:11px; color:var(--text-3); margin-top:2px; }

.modal-footer { margin-top:18px; display:flex; justify-content:center; gap:12px; }
.modal-btn { padding:10px 24px; border-radius:100px; font-size:13px; cursor:pointer; transition:all .3s; border:none; display:flex; align-items:center; gap:6px; line-height:1.4; }
.modal-btn::after { border:none; }
.modal-btn.close { background:var(--glass); border:1px solid var(--glass-bd); color:var(--text-2); }
.modal-btn.light {
  background:linear-gradient(135deg,var(--pink),var(--purple)); color:#fff;
  box-shadow:0 4px 20px rgba(255,107,157,.3);
}
.modal-btn.light.lit {
  background:linear-gradient(135deg,var(--signal-bright),var(--pink));
  box-shadow:0 4px 20px rgba(255,59,107,.4);
}
.modal-btn:active { transform:scale(.95); }

/* Subscribe bar */
.modal-subscribe-bar { margin-top:14px; text-align:center; }
.modal-btn.subscribe {
  width:100%; padding:12px 20px; border-radius:100px; font-size:13px; cursor:pointer;
  transition:all .3s; border:none; display:flex; align-items:center; justify-content:center; gap:6px;
  background:linear-gradient(135deg,rgba(0,229,255,.15),rgba(168,85,247,.15));
  border:1px solid rgba(0,229,255,.3); color:var(--cyan);
}
.modal-btn.subscribe::after { border:none; }
.modal-btn.subscribe.subscribed {
  background:rgba(0,229,255,.06); border-color:rgba(0,229,255,.15); color:var(--cyan);
  box-shadow:0 0 20px rgba(0,229,255,.15);
}
.modal-btn.subscribe:active { transform:scale(.97); }
.modal-subscribe-hint {
  font-size:11px; color:var(--text-3); margin-top:8px; text-align:center;
}
.modal-subscribe-hint.subscribed-hint { color:var(--cyan); }
</style>
