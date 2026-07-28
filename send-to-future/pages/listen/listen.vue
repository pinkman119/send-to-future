<template>
  <view class="listen-page">
    <star-sky />
    <view class="listen-header">
      <view class="listen-title-row">
        <view class="listen-title"><text class="grad">收听</text>星频</view>
        <view class="listen-actions">
          <view class="listen-badge">
            <text class="listen-badge-icon">📡</text>
            <text class="listen-badge-text">持续接收信号</text>
          </view>
        </view>
      </view>
      <view class="listen-subtitle">收听他人的星频，持续接收他们寄出的信件</view>
    </view>

    <!-- Stats -->
    <view class="listen-stats">
      <view class="listen-stat listen-stat-clickable" @click="openSubs" hover-class="listen-stat-hover">
        <view class="listen-stat-icon">📡</view>
        <view class="listen-stat-num grad-cyan">{{ subscribedCount }}</view>
        <view class="listen-stat-label">我收听的人</view>
      </view>
      <view class="listen-stat listen-stat-clickable" @click="openLit" hover-class="listen-stat-hover">
        <view class="listen-stat-icon">✨</view>
        <view class="listen-stat-num grad-gold">{{ litCount }}</view>
        <view class="listen-stat-label">我点亮的星</view>
      </view>
      <view class="listen-stat listen-stat-clickable" @click="openAtlas" hover-class="listen-stat-hover">
        <view class="listen-stat-icon">🌠</view>
        <view class="listen-stat-num grad-cyan">{{ capturedCount }}</view>
        <view class="listen-stat-label">小行星图鉴</view>
      </view>
    </view>

    <!-- Asteroid Atlas Popup -->
    <view class="atlas-modal-overlay" v-if="showAtlas" :class="{ show: showAtlas }" @click="closeAtlas">
      <view class="atlas-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">小行星图鉴</view>
          <view class="inbox-modal-close" @click="closeAtlas">✕</view>
        </view>

        <view v-if="capturedAsteroids.length === 0" class="listen-empty">
          <view class="listen-empty-icon">🌠</view>
          <view class="listen-empty-text">图鉴还是空的<br>点击屏幕背景的流星，收下那份温柔吧</view>
        </view>

        <scroll-view v-else scroll-y class="inbox-scroll">
          <view
            v-for="item in capturedAsteroids"
            :key="item.no"
            class="atlas-card"
          >
            <view class="atlas-avatar">🌠</view>
            <view class="atlas-info">
              <view class="atlas-name">小行星 {{ item.no }} 号 · {{ item.name }}</view>
              <view class="atlas-text">{{ item.text }}</view>
              <view class="atlas-time">捕获于 {{ item.capturedText }}</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- My Subscriptions Popup -->
    <view class="atlas-modal-overlay" v-if="showSubs" :class="{ show: showSubs }" @click="closeSubs">
      <view class="atlas-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">我收听的人</view>
          <view class="inbox-modal-close" @click="closeSubs">✕</view>
        </view>
        <view v-if="subscriptions.length === 0" class="listen-empty">
          <view class="listen-empty-icon">📡</view>
          <view class="listen-empty-text">还没有收听任何信件<br>去"星系"页点击收听按钮开始吧</view>
        </view>
        <scroll-view v-else scroll-y class="inbox-scroll">
          <view v-for="sub in subscriptions" :key="sub.id" class="subs-card">
            <view class="subs-avatar">{{ sub.avatar }}</view>
            <view class="subs-info">
              <view class="subs-asteroid">{{ sub.asteroid }}</view>
              <view class="subs-time">收听于 {{ sub.time }}</view>
            </view>
            <button class="subs-unsub-btn" @click.stop="unsubscribe(sub.id)">取消收听</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- Lit Letters Popup -->
    <view class="atlas-modal-overlay" v-if="showLit" :class="{ show: showLit }" @click="closeLit">
      <view class="atlas-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">我点亮的星</view>
          <view class="inbox-modal-close" @click="closeLit">✕</view>
        </view>
        <view v-if="litList.length === 0" class="listen-empty">
          <view class="listen-empty-icon">✨</view>
          <view class="listen-empty-text">还没有点亮任何星<br>去"星系"或收件箱点亮你喜欢的信件吧</view>
        </view>
        <scroll-view v-else scroll-y class="inbox-scroll">
          <view v-for="l in litList" :key="l.id" class="atlas-card" @click="openLetterBySub(l)">
            <view class="atlas-avatar">{{ l.avatar }}</view>
            <view class="atlas-info">
              <view class="atlas-name">{{ l.from }}<text class="atlas-sub">{{ l.asteroid }}</text></view>
              <view class="atlas-text">{{ l.content }}</view>
              <view class="atlas-time">点亮于 {{ l.time }}</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- Subscriptions Section -->
    <view class="listen-section">
      <view class="listen-section-head">
        <view class="listen-section-label">SUBSCRIPTIONS</view>
        <view class="listen-section-title">我的收听<text class="section-count-badge">{{ subscriptions.length }}</text></view>
        <view class="listen-section-desc">你正在收听这些星频</view>
      </view>

      <view v-if="subscriptions.length === 0" class="listen-empty">
        <view class="listen-empty-icon">📡</view>
        <view class="listen-empty-text">还没有收听任何人<br>去"星系"页点击收听按钮开始吧</view>
      </view>

        <view v-else class="subs-list">
          <view
            v-for="sub in subscriptions"
            :key="sub.id"
            class="subs-card"
            :class="{ 'is-reversed': !sub.viewed }"
            @click="openLetterBySub(sub)"
          >
            <view class="subs-avatar">{{ sub.avatar }}</view>
            <view class="subs-info">
              <view class="subs-from">{{ sub.viewed ? sub.from : sub.garbleFrom }}<text class="subs-asteroid">{{ sub.asteroid }}</text></view>
              <view class="subs-text">{{ sub.viewed ? sub.content : sub.garbleContent }}</view>
              <view class="subs-time">发布于 {{ sub.time }}</view>
            </view>
            <view v-if="!sub.viewed" class="subs-new-tag">🔒 新信号 · 点击解密</view>
          </view>
        </view>
    </view>

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
      </view>
    </view>
  </view>
</template>

<script>
const avatarPool = ['🧑‍🚀','👩‍🚀','🧑‍🎓','👩‍🎓','🧑‍💼','👩‍💼','🧑‍🎨','👩‍🎨','🧑‍✈️','👩‍✈️','🧑‍🔬','👩‍🔬','🧙‍♀️','🧙‍♂️','🦊','🐱','🐨','🦉','🦋','🌙','🌠','🌿','🌸','⛄'];

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
  { id:'L15', content:"致十年后的我：\n\n如果那时候你依然单身，请不要焦虑。\n\n28岁的我，一个人看电影，一个人吃火锅，一个人旅行。不是没人陪，是我享受独处。\n\n希望你依然拥有这份自在。也希望你遇到了那个让独处变得更美好的人——如果还没有，也没关系。", star:'gold', from:'一位自由人', avatar:'🌠', likes:1023 },
];

/**
 * 生成随机小行星编号，形如 "小行星 #2024-AB03"
 * @returns {string} 小行星编号
 */
function generateAsteroidId() {
  const year = 2020 + Math.floor(Math.random() * 7);
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `小行星 #${year}-${l1}${l2}${num}`;
}

/**
 * 根据点赞数计算信号等级
 * @param {number} likes - 点赞数
 * @returns {number} 信号等级：>=1000 为 2，>=100 为 1，否则 0
 */
function getSignalTier(likes) {
  if (likes >= 1000) return 2;
  if (likes >= 100) return 1;
  return 0;
}

/**
 * 将点赞数格式化为带 w/k 单位的简写
 * @param {number} n - 点赞数
 * @returns {string} 格式化后的字符串
 */
function formatLikeCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/**
 * 格式化日期为 YYYY.MM.DD
 * @param {Date} d - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/**
 * 格式化日期时间为 "YYYY.MM.DD HH:mm"
 * @param {number} ts - 时间戳（毫秒）
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mm}`;
}

// 将文本打乱成“乱码”信号，空格/换行保留以维持结构感
const garblePool = '█▓▒░✦✧⚡☄★☆♺♻⍰⍾⧫⬡◈⟁⌗▦▩⍢⍣⍤⍥⍨◇◆▢▣§¶†‡';
/**
 * 将文本打乱成“乱码”信号（空格/换行保留以维持结构感）
 * @param {string} text - 原始文本
 * @returns {string} 乱码化后的文本
 */
function garble(text) {
  if (!text) return '';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ' || ch === '\n') { out += ch; continue; }
    out += garblePool[Math.floor(Math.random() * garblePool.length)];
  }
  return out;
}

export default {
  /**
   * 返回「收听」页的初始数据
   * @returns {object} 包含弹窗、列表与信件详情等状态的初始数据
   */
  data() {
    return {
      subscriptions: [],
      capturedAsteroids: [],
      showAtlas: false,
      showSubs: false,
      showLit: false,
      litList: [],
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
    };
  },
  computed: {
    /**
     * 我收听的人数
     * @returns {number} 收听数
     */
    subscribedCount() {
      return this.subscriptions.length;
    },
    /**
     * 我点亮的星数量
     * @returns {number} 点亮数
     */
    litCount() {
      const app = getApp();
      const liked = app.globalData.likedLetterIds || new Set();
      return liked.size;
    },
    /**
     * 已捕获的小行星数量
     * @returns {number} 图鉴数量
     */
    capturedCount() {
      return this.capturedAsteroids.length;
    },
  },
  /**
   * 组件挂载后渲染页面数据
   */
  mounted() {
    this.renderPage();
  },
  /**
   * 页面显示时重新渲染页面数据
   */
  onShow() {
    this.renderPage();
  },
  methods: {
    /**
     * 打开小行星图鉴弹窗
     */
    openAtlas() {
      this.showAtlas = true;
    },
    /**
     * 关闭小行星图鉴弹窗
     */
    closeAtlas() {
      this.showAtlas = false;
    },
    /**
     * 打开「我收听的人」弹窗
     */
    openSubs() {
      this.showSubs = true;
    },
    /**
     * 关闭「我收听的人」弹窗
     */
    closeSubs() {
      this.showSubs = false;
    },
    /**
     * 打开「我点亮的星」弹窗
     */
    openLit() {
      this.showLit = true;
    },
    /**
     * 关闭「我点亮的星」弹窗
     */
    closeLit() {
      this.showLit = false;
    },
    /**
     * 渲染页面：填充图鉴、收听列表与点亮列表（未读信件以乱码呈现）
     */
    renderPage() {
      const app = getApp();
      const subs = app.globalData.mySubscriptions || [];
      const asteroids = app.globalData.capturedAsteroids || [];

      // Populate captured asteroids (newest first)
      this.capturedAsteroids = asteroids
        .slice()
        .sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0))
        .map(a => ({
          no: a.no,
          name: a.name,
          text: a.text,
          capturedText: a.capturedAt ? formatDateTime(a.capturedAt) : '未知时间',
        }));

      // Populate subscriptions with the received letter data
      this.subscriptions = subs.map(sub => {
        const letter = sampleLetters.find(l => l.id === sub.letterId) || {};
        const raw = letter.content || '这封信的星图已飘远，无法再读取内容';
        const content = raw.replace(/\n/g, ' ').substring(0, 60) + (raw.length > 60 ? '...' : '');
        const from = letter.from || sub.from || '未知旅人';
        const viewed = sub.viewed !== false;
        return {
          id: sub.id,
          letterId: sub.letterId,
          avatar: letter.avatar || sub.avatar || '🌙',
          from: from,
          asteroid: letter.asteroid || sub.asteroid || generateAsteroidId(),
          content: content,
          // 未查看过的信件：把文字打乱成乱码，点击解密后才显示真实内容
          garbleFrom: garble(from),
          garbleContent: garble(content),
          time: sub.time || formatDate(new Date()),
          // 刚推送且从未点开过的信件默认处于“乱码”状态；旧数据（无 viewed 字段）视为已读，避免历史信件突然乱码
          viewed: viewed,
          pushedAt: sub.pushedAt || 0,
        };
      });

      // 新收到的信件排在最上面：优先按推送时间倒序，其次保持较新的在前
      this.subscriptions.sort((a, b) => (b.pushedAt || 0) - (a.pushedAt || 0));

      // Lit letters (letters this user has lit)
      const litRecs = app.globalData.litRecords || [];
      this.litList = litRecs
        .map(rec => {
          const letter = sampleLetters.find(l => l.id === rec.id);
          if (!letter) return null;
          const raw = letter.content || '这封信的星图已飘远，无法再读取内容';
          const content = raw.replace(/\n/g, ' ').substring(0, 40) + (raw.length > 40 ? '...' : '');
          return {
            id: rec.id,
            letterId: letter.id,
            avatar: letter.avatar || '🌙',
            from: letter.from,
            asteroid: letter.asteroid || generateAsteroidId(),
            content: content,
            time: rec.time ? formatDateTime(rec.time) : '未知时间',
          };
        })
        .filter(Boolean);
    },
    /**
     * 打开信件详情弹窗并填充数据
     * @param {object} letter - 选中的信件对象
     */
    showLetterModal(letter) {
      const app = getApp();
      const likedSet = app.globalData.likedLetterIds || new Set();
      const tier = getSignalTier(letter.likes);
      const starMap = { gold:'⭐', cyan:'✨', small:'·' };

      this.currentModalLetter = letter;
      this.modalAvatar = letter.avatar || '🌙';
      this.modalFrom = letter.from;
      this.modalAsteroid = letter.asteroid || generateAsteroidId();
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
      this.showModal = true;
    },
    /**
     * 关闭信件详情弹窗
     */
    closeModal() {
      this.showModal = false;
    },
    /**
     * 切换当前信件的"点亮"状态并持久化
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
     * 点击收听项：首次点击标记为已读后打开对应信件
     * @param {object} sub - 收听项
     */
    openLetterBySub(sub) {
      // 第一次点击：把信件“正过来”（标记为已查看），之后不再处于反转状态
      if (sub.viewed !== undefined && sub.viewed !== true) {
        const app = getApp();
        const orig = (app.globalData.mySubscriptions || []).find(s => s.id === sub.id);
        if (orig) {
          orig.viewed = true;
          orig.pushedAt = orig.pushedAt || Date.now();
          app.globalData.saveState();
        }
        sub.viewed = true;
      }
      const letter = sampleLetters.find(l => l.id === sub.letterId);
      if (letter) this.showLetterModal(letter);
    },
    /**
     * 取消收听某项并刷新页面
     * @param {string} subId - 收听项 id
     */
    unsubscribe(subId) {
      const app = getApp();
      app.globalData.mySubscriptions = (app.globalData.mySubscriptions || []).filter(s => s.id !== subId);
      app.globalData.saveState();
      uni.showToast({ title: '已取消收听', icon: 'none', duration: 1500 });
      this.renderPage();
    },
  },
};
</script>

<style>
/* ===== Listen Page ===== */
.listen-page { padding:0 20px 90px; min-height:100vh; position:relative; z-index:1; }

.listen-header { text-align:center; padding:56px 0 20px; }
.listen-title-row { display:flex; align-items:center; justify-content:space-between; }
.listen-title { font-size:22px; font-weight:800; }
.listen-title .grad { background:linear-gradient(135deg,var(--cyan),var(--gold)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.listen-badge {
  display:flex; align-items:center; gap:6px; padding:8px 14px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:100px;
  color:var(--cyan); font-size:12px;
}
.listen-badge-icon { font-size:14px; }
.listen-badge-text { font-weight:600; }
.listen-subtitle { font-size:12px; color:var(--text-2); margin-top:6px; }

/* Header actions (badge + inbox trigger) */
.listen-actions { display:flex; align-items:center; gap:10px; }
.inbox-trigger {
  position:relative; width:40px; height:40px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:50%;
  font-size:18px; cursor:pointer; transition:all .25s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.inbox-trigger-hover { transform:scale(.94); background:rgba(0,229,255,.08); border-color:rgba(0,229,255,.3); }
.inbox-trigger-icon { line-height:1; }
.inbox-trigger-badge {
  position:absolute; top:-4px; right:-4px; min-width:18px; height:18px; padding:0 5px;
  border-radius:100px; background:linear-gradient(135deg,var(--pink),var(--purple));
  color:#fff; font-size:10px; font-weight:700; line-height:18px; text-align:center;
  box-shadow:0 2px 8px rgba(255,107,157,.4);
}

/* Stats */
.listen-stats { display:flex; gap:12px; margin-top:20px; }
.listen-stat {
  flex:1; text-align:center; padding:16px 8px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
}
.listen-stat-icon { font-size:18px; margin-bottom:6px; }
.listen-stat-num { font-size:24px; font-weight:800; line-height:1; }
.listen-stat-num.grad-cyan { background:linear-gradient(135deg,var(--cyan),var(--blue)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.listen-stat-num.grad-gold { background:linear-gradient(135deg,var(--gold),var(--pink)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.listen-stat-num.grad-purple { background:linear-gradient(135deg,var(--purple),var(--cyan)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.listen-stat-label { font-size:11px; color:var(--text-2); margin-top:6px; }

/* Section */
.listen-section { margin-top:28px; }
.listen-section-head { margin-bottom:14px; }
.listen-section-label { font-size:11px; color:var(--cyan); letter-spacing:3px; font-weight:600; }
.listen-section-title { font-size:18px; font-weight:700; margin-top:4px; display:flex; align-items:center; gap:8px; }
.section-count-badge {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:22px; height:22px; padding:0 7px; border-radius:100px;
  background:linear-gradient(135deg,var(--cyan),var(--purple)); color:#fff;
  font-size:12px; font-weight:700; line-height:1;
}
.listen-section-desc { font-size:12px; color:var(--text-2); margin-top:4px; }

/* Empty */
.listen-empty { text-align:center; padding:36px 20px; color:var(--text-3); }
.listen-empty-icon { font-size:36px; margin-bottom:10px; opacity:.4; }
.listen-empty-text { font-size:13px; line-height:1.7; }

/* Inbox */
.inbox-list { display:flex; flex-direction:column; gap:10px; }
.inbox-card {
  display:flex; align-items:center; gap:12px; padding:14px 16px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.inbox-card.unread {
  border-color:rgba(0,229,255,.3);
  background:rgba(0,229,255,.06);
  box-shadow:0 2px 16px rgba(0,229,255,.12);
}
.inbox-card:active { transform:scale(.97); }
.inbox-avatar {
  width:40px; height:40px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:22px;
  background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(168,85,247,.08));
  border:1px solid rgba(0,229,255,.15);
}
.inbox-info { flex:1; min-width:0; }
.inbox-from { font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
.inbox-from-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inbox-unread-dot { color:var(--cyan); font-size:8px; flex-shrink:0; }
.inbox-preview { font-size:12px; color:var(--text-2); margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inbox-meta { display:flex; align-items:center; gap:8px; margin-top:4px; }
.inbox-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; }
.inbox-type-tag {
  font-size:10px; padding:2px 8px; border-radius:100px;
  border:1px solid var(--glass-bd); background:var(--glass);
}
.inbox-type-tag.tag-listen { color:var(--cyan); border-color:rgba(0,229,255,.2); background:rgba(0,229,255,.06); }
.inbox-type-tag.tag-letter { color:var(--gold); border-color:rgba(255,213,107,.2); background:rgba(255,213,107,.06); }
.inbox-action { flex-shrink:0; }
.inbox-arrow { font-size:18px; color:var(--text-3); font-weight:700; }

/* Inbox Popup */
.inbox-modal-overlay {
  position:fixed; inset:0; z-index:200;
  display:flex; align-items:flex-end; justify-content:center;
  background:rgba(5,5,20,.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  opacity:0; transition:opacity .3s;
}
.inbox-modal-overlay.show { opacity:1; }
.inbox-modal {
  width:100%; max-width:420px;
  max-height:78vh; display:flex; flex-direction:column;
  background:linear-gradient(135deg,rgba(12,12,36,.98),rgba(20,20,50,.98));
  border:1px solid rgba(0,229,255,.2); border-bottom:none;
  border-radius:24px 24px 0 0;
  box-shadow:0 -8px 60px rgba(0,229,255,.18);
  transform:translateY(100%); transition:transform .3s cubic-bezier(.22,1,.36,1);
}
.inbox-modal-overlay.show .inbox-modal { transform:translateY(0); }
.inbox-modal-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 20px 14px; border-bottom:1px solid var(--glass-bd);
}
.inbox-modal-title { font-size:18px; font-weight:700; }
.inbox-modal-close {
  width:30px; height:30px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--glass); border:1px solid var(--glass-bd);
  color:var(--text-2); font-size:14px; cursor:pointer; transition:all .25s;
}
.inbox-modal-close:active { transform:scale(.92); background:rgba(255,107,157,.08); }
.inbox-scroll { flex:1; overflow-y:auto; padding:14px 16px calc(14px + env(safe-area-inset-bottom)); }
.inbox-scroll .inbox-card:last-child { margin-bottom:0; }

/* Clickable stat (asteroid atlas entry) */
.listen-stat-clickable { cursor:pointer; transition:all .25s; }
.listen-stat-hover { transform:scale(.96); border-color:rgba(0,229,255,.3); background:rgba(0,229,255,.06); }

/* Asteroid Atlas cards */
.atlas-card {
  display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:10px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.atlas-card:last-child { margin-bottom:0; }
.atlas-avatar {
  width:40px; height:40px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:22px;
  background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(168,85,247,.08));
  border:1px solid rgba(0,229,255,.15);
}
.atlas-info { flex:1; min-width:0; }
.atlas-name { font-size:12px; color:var(--cyan); font-weight:600; letter-spacing:.5px; display:flex; align-items:center; gap:6px; }
.atlas-sub { font-size:10px; color:var(--text-3); font-family:'SF Mono',monospace; }
.atlas-text { font-size:14px; line-height:1.7; color:var(--text-1); margin-top:6px; }
.atlas-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:8px; }

/* Asteroid Atlas Popup (centered) */
.atlas-modal-overlay {
  position:fixed; inset:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px;
  background:rgba(5,5,20,.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  opacity:0; transition:opacity .3s;
}
.atlas-modal-overlay.show { opacity:1; }
.atlas-modal {
  width:100%; max-width:420px;
  max-height:78vh; display:flex; flex-direction:column;
  background:linear-gradient(135deg,rgba(12,12,36,.98),rgba(20,20,50,.98));
  border:1px solid rgba(0,229,255,.2); border-radius:24px;
  box-shadow:0 0 60px rgba(0,229,255,.18);
  transform:scale(.92); opacity:0; transition:transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
}
.atlas-modal-overlay.show .atlas-modal { transform:scale(1); opacity:1; }

/* Subscriptions */
.subs-list { display:flex; flex-direction:column; gap:10px; }
.subs-card {
  position:relative;
  display:flex; align-items:center; gap:12px; padding:14px 16px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
  overflow:hidden;
}
/* 刚推送、尚未点开过的信件：乱码 + 高亮提示 */
.subs-card.is-reversed {
  border-color:rgba(0,229,255,.45);
  background:rgba(0,229,255,.05);
  box-shadow:0 2px 18px rgba(0,229,255,.18);
  padding-top:24px;
}
.subs-text { font-family:'SF Mono',monospace; letter-spacing:1px; }
.subs-card.is-reversed .subs-text { color:var(--cyan); }
.subs-new-tag {
  position:absolute; top:6px; left:50%; transform:translateX(-50%);
  font-size:10px; font-weight:700; color:#fff; white-space:nowrap; z-index:2;
  padding:2px 10px; border-radius:100px;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  box-shadow:0 2px 10px rgba(0,229,255,.3);
}
.subs-avatar {
  width:40px; height:40px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:22px;
  background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(255,213,107,.08));
  border:1px solid rgba(0,229,255,.2);
}
.subs-info { flex:1; min-width:0; }
.subs-from { font-size:14px; font-weight:600; color:var(--text-1); display:flex; align-items:center; gap:6px; }
.subs-asteroid { font-size:10px; color:var(--text-3); font-family:'SF Mono',monospace; }
.subs-text { font-size:13px; line-height:1.7; color:var(--text-2); margin-top:6px; word-break:break-all; overflow-wrap:anywhere; }
.subs-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:8px; }
.subs-unsub-btn {
  padding:8px 16px; border-radius:100px; border:1px solid rgba(255,107,157,.2);
  background:rgba(255,107,157,.06); color:var(--pink); font-size:12px; font-weight:600;
  cursor:pointer; transition:all .25s; flex-shrink:0;
  line-height:1.4;
}
.subs-unsub-btn::after { border:none; }
.subs-unsub-btn:active { transform:scale(.95); background:rgba(255,107,157,.12); }

/* Letter Modal (shared styles) */
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
.modal-star { font-size:32px; animation:starPulse 2s ease-in-out infinite; }
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
.modal-btn.light { background:linear-gradient(135deg,var(--pink),var(--purple)); color:#fff; box-shadow:0 4px 20px rgba(255,107,157,.3); }
.modal-btn.light.lit { background:linear-gradient(135deg,var(--signal-bright),var(--pink)); box-shadow:0 4px 20px rgba(255,59,107,.4); }
.modal-btn:active { transform:scale(.95); }
</style>
