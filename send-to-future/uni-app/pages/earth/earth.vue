<template>
  <view class="earth-page">
    <view class="earth-header">
      <view class="earth-avatar-wrap">
        <view class="earth-avatar-ring"></view>
        <view class="earth-avatar">🌍</view>
      </view>
      <view class="earth-name"><text class="grad">我的星球</text></view>
      <view class="earth-id">{{ userId }}</view>
    </view>

    <view class="earth-stats">
      <view class="earth-stat">
        <view class="earth-stat-num grad">{{ statSent }}</view>
        <view class="earth-stat-label">已发射信件</view>
      </view>
      <view class="earth-stat">
        <view class="earth-stat-num grad-gold">{{ statLit }}</view>
        <view class="earth-stat-label">已点亮</view>
      </view>
      <view class="earth-stat">
        <view class="earth-stat-num grad">{{ statTraveling }}</view>
        <view class="earth-stat-label">旅行中</view>
      </view>
    </view>

    <!-- Sub-tab switcher -->
    <view class="earth-section">
      <view class="earth-subtabs">
        <view class="earth-subtab" :class="{ active: activeSubtab === 'sent' }" @click="switchSubtab('sent')">
          <text class="icon">🚀</text>
          <text>我的</text>
          <text class="earth-subtab-count">{{ sentCount }}</text>
        </view>
        <view class="earth-subtab" :class="{ active: activeSubtab === 'liked' }" @click="switchSubtab('liked')">
          <text class="icon">✨</text>
          <text>点亮</text>
          <text class="earth-subtab-count">{{ likedCount }}</text>
        </view>
        <view class="earth-subtab" :class="{ active: activeSubtab === 'coords' }" @click="switchSubtab('coords')">
          <text class="icon">📡</text>
          <text>坐标</text>
          <text class="earth-subtab-count">{{ coordsCount }}</text>
        </view>
      </view>

      <!-- Sent Letters -->
      <view class="earth-subtab-content" :class="{ active: activeSubtab === 'sent' }">
        <view v-if="sentLetters.length === 0" class="earth-empty">
          <view class="earth-empty-icon">🚀</view>
          <view class="earth-empty-text">还没有发射过信件<br>去"发射"页写下第一封吧</view>
        </view>
        <view v-for="letter in sentLetters" :key="letter.id" class="sent-card">
          <view class="sent-card-head">
            <view class="sent-card-info">
              <view class="keyword-tag"><text class="tag-icon">🏷️</text>{{ letter.keyword || '未标记主题' }}</view>
              <view v-if="letter._isDelivered" class="sent-card-preview">{{ letter._preview }}</view>
              <view v-else class="encrypted-preview">
                <text class="encrypted-lock">🔒</text>
                <text class="encrypted-text">
                  <text v-for="(w, bi) in letter._blocks" :key="bi" class="block" :style="{ width: w + 'px' }"></text>
                </text>
              </view>
              <view class="sent-card-meta">
                <text class="sent-channel-tag" :class="letter.channel === 'unbreakable' ? 'vow-tag' : ''">
                  {{ letter.channel === 'unbreakable' ? '🛡️ ' : '' }}{{ letter._channelName }}
                </text>
                <text class="sent-channel-tag" :class="letter.isEncrypted ? 'enc-tag' : 'pub-tag'">
                  {{ letter.isEncrypted ? '🔒 加密' : '🌐 公开' }}
                </text>
                <text class="sent-channel-tag">{{ letter.sentDate }} 寄出</text>
              </view>
              <view v-if="letter.deliveryContacts" class="vow-contacts">{{ letter._contactsSummary }}</view>
            </view>
            <view class="sent-status" :class="letter._isDelivered ? 'delivered' : 'traveling'">
              {{ letter._isDelivered ? '✓ 已送达' : '🛸 旅行中' }}
            </view>
          </view>
          <view class="progress-wrap">
            <view class="progress-info">
              <view class="progress-percent">
                <text class="grad">{{ letter._percent }}%</text> {{ letter._isDelivered ? '已完成' : '时间进度' }}
              </view>
              <view class="progress-time">{{ letter._progressTime }}</view>
            </view>
            <view class="progress-bar">
              <view class="progress-streaks"></view>
              <view class="progress-fill" :class="{ delivered: letter._isDelivered }" :style="{ width: letter._percent + '%' }">
                <text v-if="!letter._isDelivered" class="progress-rocket"><text class="rocket-glyph">🚀</text></text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Liked List -->
      <view class="earth-subtab-content" :class="{ active: activeSubtab === 'liked' }">
        <view v-if="likedLetters.length === 0" class="earth-empty">
          <view class="earth-empty-icon">✨</view>
          <view class="earth-empty-text">还没有点亮过信件<br>去"星系"页点亮一颗星吧</view>
        </view>
        <view class="liked-list">
          <view v-for="l in likedLetters" :key="l.id" class="liked-card" @click="viewLikedLetter(l)">
            <view class="liked-avatar">{{ l.avatar || '🌙' }}</view>
            <view class="liked-info">
              <view class="liked-from">
                {{ l.from }}
                <text v-if="l._signalIcon" style="font-size:10px;">{{ l._signalIcon }} 强烈信号</text>
              </view>
              <view class="liked-asteroid">{{ l.asteroid }}</view>
              <view class="liked-preview">{{ l._preview }}</view>
            </view>
            <view class="liked-likes">💡 {{ l._likeStr }}</view>
          </view>
        </view>
      </view>

      <!-- Coordinates -->
      <view class="earth-subtab-content" :class="{ active: activeSubtab === 'coords' }">
        <view class="coord-intro"><text class="icon">📡</text>保存你的联络坐标，发射信件时可快速选择送达渠道，无需重复填写。</view>
        <view v-for="c in myCoords" :key="c.id" class="coord-card">
          <view class="coord-card-head">
            <view class="coord-card-icon" :style="{ background: c._meta.bg }">{{ c._meta.icon }}</view>
            <view class="coord-card-title">{{ c._meta.label }}</view>
            <view class="coord-card-actions">
              <button class="coord-action-btn edit" @click="editCoord(c)">✎</button>
              <button class="coord-action-btn del" @click="deleteCoord(c.id)">✕</button>
            </view>
          </view>
          <view class="coord-value">{{ c.value }}</view>
        </view>
        <button class="coord-add-btn" @click="addCoord"><text style="font-size:18px;">＋</text> 添加坐标</button>
      </view>
    </view>

    <!-- Coordinate Editor Overlay -->
    <view class="coord-editor-overlay" v-if="showCoordEditor" @click="cancelCoordEdit">
      <view class="coord-editor-panel" @click.stop>
        <view style="font-size:18px;font-weight:700;margin-bottom:4px;">{{ editingCoordId ? '编辑坐标' : '添加坐标' }}</view>
        <view style="font-size:12px;color:var(--text-2);margin-bottom:20px;">选择类型并填写你的联络信息</view>
        <view style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <view
            v-for="t in coordTypes"
            :key="t.type"
            class="coord-type-chip"
            :style="selectedCoordType === t.type ? 'border-color:var(--cyan);background:rgba(0,229,255,.1);color:var(--cyan);' : 'color:var(--text-2);'"
            @click="selectedCoordType = t.type"
          >
            <text>{{ t.icon }}</text><text>{{ t.label }}</text>
          </view>
        </view>
        <input
          class="coord-input"
          v-model="coordInputVal"
          :placeholder="currentCoordPlaceholder"
        />
        <view style="display:flex;gap:8px;margin-top:16px;">
          <button class="coord-editor-cancel" @click="cancelCoordEdit">取消</button>
          <button class="coord-editor-save" @click="saveCoord">保存</button>
        </view>
      </view>
    </view>

    <!-- Letter Detail Modal (reused from wander) -->
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
import { get, post, put, del } from '../../utils/request.js';

const channelNames = { mail: '手写信件', qqmail: 'QQ邮箱', sms: '短信推送', unbreakable: '牢不可破的誓言' };
const coordTypes = [
  { type: 'phone',  icon: '📱', label: '手机号',   placeholder: '请输入手机号',     bg: 'rgba(255,213,107,.1)' },
  { type: 'wechat', icon: '💬', label: '微信号',   placeholder: '请输入微信号',     bg: 'rgba(7,193,96,.1)' },
  { type: 'email',  icon: '📧', label: '邮箱地址', placeholder: '请输入邮箱地址',   bg: 'rgba(18,183,245,.1)' },
  { type: 'address',icon: '📮', label: '邮寄地址', placeholder: '请输入邮寄地址',   bg: 'rgba(168,85,247,.1)' },
];

const sampleLetters = [
  { id:'L01', content:"亲爱的未来的我：\n\n你还记得2024年那个冬天吗？那时候你刚失业，每天窝在出租屋里投简历。你对自己说，没关系，这只是人生的一个弯道。\n\n现在回头看，那个弯道是不是已经变成了风景线？\n\n我希望你已经找到了真正热爱的事。如果不是，也没关系，继续找。", star:'gold', from:'一位北漂旅人', avatar:'🧑‍🚀', likes:1247, asteroid:'小行星 #2024-AA12' },
  { id:'L02', content:"给十年后的自己：\n\n如果那时候你已经有了孩子，请记得告诉他：妈妈年轻时也是个很酷的人。\n\n我去过12个国家，在冰岛看过极光，在土耳其坐过热气球。我不是一开始就勇敢的，我只是选择了出发。\n\n希望你依然在路上。", star:'gold', from:'一位环球旅者', avatar:'👩‍✈️', likes:3856, asteroid:'小行星 #2023-BC34' },
  { id:'L03', content:"未来的我：\n\n2026年的今天，我终于鼓起勇气辞职了。所有人都觉得我疯了，放弃稳定的工作去创业。\n\n但我知道如果我不试，我会后悔一辈子。\n\n如果你正在读这封信，无论结果如何，谢谢你当时的勇敢。", star:'cyan', from:'一位创业者', avatar:'🧑‍💼', likes:523, asteroid:'小行星 #2026-CD56' },
  { id:'L04', content:"致三十岁的自己：\n\n二十岁的我，正在图书馆里写这封信。窗外是校园的银杏树，叶子黄了。\n\n我不知道三十岁的我是什么样子，有没有变得更成熟，有没有学会好好爱自己。\n\n但我知道，此刻的我在努力。那就够了。", star:'cyan', from:'一位大学生', avatar:'🧑‍🎓', likes:89, asteroid:'小行星 #2025-DE78' },
  { id:'L05', content:"嘿，未来的我：\n\n你还记得那只叫\"橘子\"的猫吗？它现在正趴在我腿上睡觉。\n\n如果你已经有了一只新的猫，请好好对它。如果没有，那就去领养一只吧。\n\n有些温暖，是只有小动物才能给的。", star:'small', from:'一位猫奴', avatar:'🐱', likes:2156, asteroid:'小行星 #2021-EF90' },
  { id:'L06', content:"给未来的自己：\n\n今天是我确诊抑郁症的第三个月。我开始吃药了，开始试着出门了。\n\n我不知道未来的我会不会已经好了。但我知道，此刻的我在挣扎着往上爬。\n\n如果你已经走出来了，恭喜你。如果还没有，没关系，我陪你。", star:'gold', from:'一位勇敢的人', avatar:'🧙‍♀️', likes:4521, asteroid:'小行星 #2022-FG12' },
  { id:'L07', content:"未来的我：\n\n你还记得第一次心动的感觉吗？是高中操场上那个穿白衬衫的男生。\n\n我不知道现在你身边是谁，但希望那个人值得你所有的温柔。\n\n如果没有也没关系。你本身就足够完整。", star:'cyan', from:'一位浪漫主义者', avatar:'🌸', likes:347, asteroid:'小行星 #2023-GH34' },
  { id:'L08', content:"致未来的自己：\n\n今年我50岁了。孩子上了大学，丈夫常出差，家里突然空了。\n\n我决定开始学画画。从零开始，笨手笨脚的。\n\n如果你正在读这封信，希望你还在画。不是为了成为画家，只是为了那份安静的快乐。", star:'gold', from:'一位学习者', avatar:'🧑‍🎨', likes:678, asteroid:'小行星 #2024-HJ56' },
  { id:'L09', content:"未来的我：\n\n你还记得外公吗？他走的那天，我在飞机上，没来得及见最后一面。\n\n我欠他一句再见。\n\n如果你有了孩子，请多带他去看望老人。有些再见，不能等。", star:'small', from:'一位思念者', avatar:'🦉', likes:1934, asteroid:'小行星 #2025-JK78' },
  { id:'L10', content:"给五年后的自己：\n\n我正在备考研究生。已经二战了，压力大到失眠。\n\n妈妈昨天打电话来，说考不上就回家，她养我。\n\n我不知道未来会怎样。但我想再试一次。\n\n如果你已经上岸了，替我高兴一下。如果没有，那就换条路走，人生不是只有一条路。", star:'cyan', from:'一位考研人', avatar:'🧑‍🎓', likes:45, asteroid:'小行星 #2026-KL90' },
  { id:'L11', content:"亲爱的未来的我：\n\n今天是我们结婚五周年。他送了我一束向日葵，和五年前一模一样。\n\n我不知道十年后、二十年后，我们还会不会像现在这样。\n\n但我知道，此刻的我很幸福。这就够了。", star:'small', from:'一位妻子', avatar:'👩‍💼', likes:156, asteroid:'小行星 #2021-MN12' },
  { id:'L12', content:"未来的我：\n\n我终于学会说\"不\"了。\n\n30年了，我一直是那个\"好好先生\"。帮同事加班，帮朋友搬家，帮邻居遛狗。\n\n今天我第一次拒绝了。感觉很好。\n\n希望你继续保持。善良要有锋芒。", star:'gold', from:'一位觉醒者', avatar:'🦊', likes:2890, asteroid:'小行星 #2022-OP34' },
  { id:'L13', content:"给未来的自己：\n\n今天是我来这座城市的第一天。拖着行李箱走出地铁站，看着满眼的霓虹灯，既兴奋又害怕。\n\n我不知道自己能在这里待多久，但我想试试。\n\n如果你还在这里，说明我们都撑过来了。如果不在了，那也没关系，至少我们勇敢过。", star:'cyan', from:'一位异乡人', avatar:'🧑‍🚀', likes:412, asteroid:'小行星 #2023-QR56' },
  { id:'L14', content:"未来的我：\n\n你还记得那家巷子里的书店吗？我每周都去，坐在角落看一下午。\n\n老板养了只金毛，总趴在我脚边。\n\n如果那家店还在，替我去看看。如果不在了，就在心里留个位置吧。\n\n有些地方，去过就是永远。", star:'small', from:'一位读书人', avatar:'🧑‍🔬', likes:67, asteroid:'小行星 #2024-ST78' },
  { id:'L15', content:"致十年后的我：\n\n如果那时候你依然单身，请不要焦虑。\n\n28岁的我，一个人看电影，一个人吃火锅，一个人旅行。不是没人陪，是我享受独处。\n\n希望你依然拥有这份自在。也希望你遇到了那个让独处变得更美好的人——如果还没有，也没关系。", star:'gold', from:'一位自由人', avatar:'🌠', likes:1023, asteroid:'小行星 #2025-UV90' },
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
 * 将点赞数格式化为带单位（w/k）的短字符串。
 * @param {number} n - 原始点赞数
 * @returns {string} 压缩显示后的点赞数
 */
function formatLikeCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
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
 * 计算未来日期距离今天的时间差，并转为「天/月/年」文本。
 * @param {Date} futureDate - 目标未来日期
 * @returns {string} 人类可读的时间差
 */
function getDateDiff(futureDate) {
  const now = new Date();
  const diff = futureDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} 天`;
  if (days < 365) return `${Math.floor(days / 30)} 个月`;
  return `${Math.floor(days / 365)} 年`;
}

export default {
  /**
   * 组件的响应式数据。
   * @returns {object} 包含用户信息、各子标签页数据、坐标编辑器及模态框数据的数据对象
   */
  data() {
    return {
      userId: '',
      activeSubtab: 'sent',
      sentLetters: [],
      likedLetters: [],
      myCoords: [],
      showCoordEditor: false,
      editingCoordId: null,
      selectedCoordType: 'phone',
      coordInputVal: '',
      coordTypes,
      progressTimer: null,
      // Modal
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
     * 已发射信件数量（与 sentCount 相同，用于顶部统计）。
     * @returns {number} 寄出信件数
     */
    statSent() { return this.sentLetters.length; },
    /**
     * 我已点亮过的信件总数。
     * @returns {number} 点亮信件数
     */
    statLit() {
      const app = getApp();
      const liked = app.globalData.likedLetterIds || new Set();
      return liked.size;
    },
    /**
     * 仍在旅行中（未送达）的寄出信件数量。
     * @returns {number} 旅行中信件数
     */
    statTraveling() {
      return this.sentLetters.filter(l => !l._isDelivered).length;
    },
    /**
     * 我寄出的信件数量。
     * @returns {number} 寄出信件数
     */
    sentCount() { return this.sentLetters.length; },
    /**
     * 我点赞过的信件数量。
     * @returns {number} 点赞信件数
     */
    likedCount() {
      const app = getApp();
      const liked = app.globalData.likedLetterIds || new Set();
      return liked.size;
    },
    /**
     * 已保存的联络坐标数量。
     * @returns {number} 坐标数量
     */
    coordsCount() { return this.myCoords.length; },
    /**
     * 根据选中的坐标类型取对应的输入占位提示。
     * @returns {string} 占位提示文本
     */
    currentCoordPlaceholder() {
      const t = coordTypes.find(ct => ct.type === this.selectedCoordType);
      return t ? t.placeholder : '请输入';
    },
  },
  /**
   * 组件挂载后：生成用户 ID 并渲染页面数据。
   */
  mounted() {
    this.userId = 'EARTH-' + String(Math.floor(Math.random() * 9000) + 1000);
    this.renderPage();
  },
  /**
   * 页面显示时：重新渲染页面数据。
   */
  onShow() {
    this.renderPage();
  },
  /**
   * 页面隐藏时：停止进度定时器。
   */
  onHide() {
    this.stopProgressTimer();
  },
  /**
   * 页面卸载时：停止进度定时器，避免内存泄漏。
   */
  onUnload() {
    this.stopProgressTimer();
  },
  methods: {
    /**
     * 渲染页面：整合寄出信件、点赞信件与坐标等数据并启动进度定时器。
     */
    async renderPage() {
      const app = getApp();
      let sent = app.globalData.mySentLetters || [];
      if (sent.length === 0) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        sent = [
          { id: 'DEMO1', content: '亲爱的未来的我：\n\n你还好吗？那时候的我刚换工作，一切都是新的开始。我有点紧张，但更多的是期待。\n\n希望你已经在新的领域站稳了脚跟。如果还没有，也没关系，我们一直在路上。', keyword: '新的开始', channel: 'mail', isEncrypted: false, sentDate: '2025.01.15', sentTimestamp: now - 180 * dayMs, deliveryDate: '2026.01.15', deliveryTimestamp: now + 185 * dayMs, years: 1 },
          { id: 'DEMO2', content: '给三年后的自己：\n\n今天是我和小李在一起1000天。我写了一封信给他，也给自己写了一封。\n\n希望三年后我们还在彼此身边。如果不在了，也希望你过得好。', keyword: '写给爱情', channel: 'qqmail', isEncrypted: true, sentDate: '2024.07.01', sentTimestamp: now - 365 * dayMs, deliveryDate: '2027.07.01', deliveryTimestamp: now + 730 * dayMs, years: 3 },
          { id: 'DEMO3', content: '十年后的我：\n\n此刻的我25岁，在出租屋里写下这封信。窗外是城市的灯火，很亮，但不属于我。\n\n十年后你35岁了，不知道有没有属于自己的灯。', keyword: '25岁的独白', channel: 'sms', isEncrypted: false, sentDate: '2023.06.20', sentTimestamp: now - 740 * dayMs, deliveryDate: '2033.06.20', deliveryTimestamp: now + 2910 * dayMs, years: 10 },
          { id: 'DEMO4', content: '一年后的自己：\n\n谢谢你坚持了下来。不管现在结果如何，我都知道你尽力了。\n\n希望明年的今天，你会笑着读这封信。', keyword: '考研纪念', channel: 'mail', isEncrypted: true, sentDate: '2024.07.02', sentTimestamp: now - 365 * dayMs, deliveryDate: '2025.07.02', deliveryTimestamp: now - 5 * dayMs, years: 1 },
        ];
        app.globalData.mySentLetters = sent;
        app.globalData.saveState();
      }

      const now = Date.now();
      this.sentLetters = sent.map(l => {
        const isDelivered = now >= l.deliveryTimestamp;
        const totalDuration = l.deliveryTimestamp - l.sentTimestamp;
        const elapsed = now - l.sentTimestamp;
        const percent = isDelivered ? 100 : Math.min(99.9, Math.max(0, (elapsed / totalDuration) * 100));
        const preview = l.content.substring(0, 80) + (l.content.length > 80 ? '...' : '');
        const blockCount = Math.min(20, Math.max(8, Math.floor(l.content.length / 4)));
        const blocks = [];
        for (let b = 0; b < blockCount; b++) blocks.push(5 + Math.floor(Math.random() * 6));
        let contactsSummary = '';
        if (l.deliveryContacts) {
          const vc = l.deliveryContacts;
          const parts = [];
          if (vc.phone) parts.push('📱' + vc.phone.substring(0, 3) + '****' + vc.phone.slice(-4));
          if (vc.email) parts.push('📧' + vc.email.split('@')[0].substring(0, 6) + '...');
          if (vc.address) parts.push('📮已填');
          const contactCount = Object.keys(vc).length;
          contactsSummary = l.channel === 'unbreakable'
            ? `誓言送达 · ${contactCount}条联络通道 · ${parts.join(' · ')}`
            : `送达坐标 · ${parts.join(' · ')}`;
        }
        return {
          ...l,
          _isDelivered: isDelivered,
          _percent: percent.toFixed(1),
          _preview: preview,
          _blocks: blocks,
          _channelName: channelNames[l.channel] || l.channel,
          _progressTime: isDelivered ? `已于 ${l.deliveryDate} 送达` : `预计 ${l.deliveryDate} 送达 · 还剩 ${getDateDiff(new Date(l.deliveryTimestamp))}`,
          _contactsSummary: contactsSummary,
        };
      });

      // Liked
      const likedSet = app.globalData.likedLetterIds || new Set();
      const likedArr = [];
      for (const id of likedSet) {
        const letter = sampleLetters.find(l => l.id === id);
        if (letter) {
          const tier = getSignalTier(letter.likes);
          likedArr.push({
            ...letter,
            _preview: letter.content.replace(/\n/g, ' ').substring(0, 40) + '...',
            _signalIcon: tier === 2 ? '🔴' : tier === 1 ? '🟠' : '',
            _likeStr: formatLikeCount(letter.likes),
          });
        }
      }
      this.likedLetters = likedArr;

      // Coords：以接口返回为唯一来源，移除对 globalData.myCoords 的本地读写
      await this.loadCoords();

      this.startProgressTimer();
    },
    /**
     * 启动每秒刷新寄出信件送达进度的定时器。
     */
    startProgressTimer() {
      this.stopProgressTimer();
      this.progressTimer = setInterval(() => {
        const now = Date.now();
        const updated = this.sentLetters.map(l => {
          if (l._isDelivered) return l;
          const totalDuration = l.deliveryTimestamp - l.sentTimestamp;
          const elapsed = now - l.sentTimestamp;
          const percent = Math.min(99.9, Math.max(0, (elapsed / totalDuration) * 100));
          const isDelivered = now >= l.deliveryTimestamp;
          return {
            ...l,
            _isDelivered: isDelivered,
            _percent: percent.toFixed(1),
            _progressTime: isDelivered ? `已于 ${l.deliveryDate} 送达` : `预计 ${l.deliveryDate} 送达 · 还剩 ${getDateDiff(new Date(l.deliveryTimestamp))}`,
          };
        });
        this.sentLetters = updated;
      }, 1000);
    },
    /**
     * 停止并清空寄出信件进度定时器。
     */
    stopProgressTimer() {
      if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
    },
    /**
     * 切换当前的子标签页（我的/点亮/坐标）。
     * @param {string} tab - 子标签标识
     */
    switchSubtab(tab) {
      this.activeSubtab = tab;
    },
    /**
     * 新增坐标：重置编辑状态并打开坐标编辑器。
     */
    addCoord() {
      this.editingCoordId = null;
      this.selectedCoordType = 'phone';
      this.coordInputVal = '';
      this.showCoordEditor = true;
    },
    /**
     * 编辑已有坐标：回填数据并打开坐标编辑器。
     * @param {object} c - 待编辑的坐标对象
     */
    editCoord(c) {
      this.editingCoordId = c.id;
      this.selectedCoordType = c.type;
      this.coordInputVal = c.value;
      this.showCoordEditor = true;
    },
    /**
     * 取消坐标编辑，关闭编辑器。
     */
    cancelCoordEdit() {
      this.showCoordEditor = false;
    },
    /**
     * 确保已登录：本地无令牌时调用 mock 登录（仅联调用）获取并缓存 token。
     */
    async ensureLogin() {
      const token = uni.getStorageSync('stf_token');
      if (token) return;
      try {
        const res = await post('/wechat/mock-login', {});
        if (res && res.token) {
          uni.setStorageSync('stf_token', res.token);
          uni.setStorageSync('stf_user', res.user);
        }
      } catch (e) {
        // 忽略：loadCoords 会因未登录返回错误并提示
      }
    },
    /**
     * 从后端拉取当前用户全部未删除坐标，并映射为页面渲染所需的 myCoords。
     */
    async loadCoords() {
      await this.ensureLogin();
      try {
        const list = await get('/coord');
        this.myCoords = (list || []).map(c => {
          const meta = coordTypes.find(t => t.type === c.coordType) || coordTypes[0];
          return { id: c.coordId, type: c.coordType, value: c.coordValue, _meta: meta };
        });
      } catch (e) {
        uni.showToast({ title: '坐标加载失败', icon: 'none' });
      }
    },
    /**
     * 保存坐标：新增走 POST，编辑走 PUT；成功后以接口最新列表刷新页面。
     */
    async saveCoord() {
      const val = this.coordInputVal.trim();
      if (!val) { uni.showToast({ title: '请输入内容', icon: 'none' }); return; }
      await this.ensureLogin();
      try {
        if (this.editingCoordId) {
          await put('/coord/' + this.editingCoordId, { coordType: this.selectedCoordType, coordValue: val });
          uni.showToast({ title: '坐标已更新', icon: 'none' });
        } else {
          await post('/coord', { coordType: this.selectedCoordType, coordValue: val });
          uni.showToast({ title: '坐标已保存', icon: 'none' });
        }
        this.showCoordEditor = false;
        await this.loadCoords();
      } catch (e) {
        // request.js 已统一提示错误信息
      }
    },
    /**
     * 删除指定坐标（调用后端软删除），成功后以最新列表刷新页面。
     * @param {string} id - 待删除的坐标 id
     */
    async deleteCoord(id) {
      await this.ensureLogin();
      try {
        await del('/coord/' + id);
        uni.showToast({ title: '已删除该坐标', icon: 'none' });
        await this.loadCoords();
      } catch (e) {
        // request.js 已统一提示错误信息
      }
    },
    /**
     * 打开「我点亮过的信」详情弹窗并填充数据。
     * @param {object} l - 点赞的信件对象
     */
    viewLikedLetter(l) {
      const app = getApp();
      const likedSet = app.globalData.likedLetterIds || new Set();
      this.currentModalLetter = l;
      const tier = getSignalTier(l.likes);
      const starMap = { gold:'⭐', cyan:'✨', small:'·' };
      this.modalAvatar = l.avatar || '🌙';
      this.modalFrom = l.from;
      this.modalAsteroid = l.asteroid;
      this.modalStar = starMap[l.star] || '✨';
      if (tier === 2) { this.modalSignalClass = 't2'; this.modalSignalText = '📡 强烈信号'; }
      else if (tier === 1) { this.modalSignalClass = 't1'; this.modalSignalText = '📡 强烈信号'; }
      else { this.modalSignalClass = ''; this.modalSignalText = ''; }
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 365) + 1;
      now.setDate(now.getDate() - daysAgo);
      this.modalDate = formatDate(now) + ' 寄出';
      this.modalContent = l.content;
      this.modalLikeNum = formatLikeCount(l.likes);
      this.isModalLit = likedSet.has(l.id);
      this.showModal = true;
    },
    /**
     * 关闭信件详情弹窗。
     */
    closeModal() { this.showModal = false; },
    /**
     * 切换当前信件的「点亮」状态，并同步到全局点赞集合。
     */
    toggleLight() {
      if (!this.currentModalLetter) return;
      const app = getApp();
      if (!app.globalData.likedLetterIds) app.globalData.likedLetterIds = new Set();
      const likedSet = app.globalData.likedLetterIds;
      const id = this.currentModalLetter.id;
      if (!likedSet.has(id)) {
        likedSet.add(id);
        this.currentModalLetter.likes++;
        this.isModalLit = true;
        this.modalLikeNum = formatLikeCount(this.currentModalLetter.likes);
        app.globalData.saveState();
        uni.showToast({ title: '已点亮 ⭐', icon: 'none', duration: 1500 });
      } else {
        likedSet.delete(id);
        this.currentModalLetter.likes = Math.max(0, this.currentModalLetter.likes - 1);
        this.isModalLit = false;
        this.modalLikeNum = formatLikeCount(this.currentModalLetter.likes);
        app.globalData.saveState();
      }
      this.renderPage();
    },
  },
};
</script>

<style>
/* ===== Earth Page ===== */
.earth-page { padding:0 20px 40px; min-height:100vh; }
.earth-header { text-align:center; padding:56px 0 24px; }
.earth-avatar-wrap {
  position:relative; width:80px; height:80px; margin:0 auto 14px;
}
.earth-avatar {
  width:80px; height:80px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-size:40px;
  background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(168,85,247,.08));
  border:2px solid rgba(0,229,255,.2);
  box-shadow:0 0 30px rgba(0,229,255,.15);
}
.earth-avatar-ring {
  position:absolute; inset:-6px; border-radius:50%;
  border:1px solid rgba(0,229,255,.15);
  animation:earthRingRotate 8s linear infinite;
}
.earth-avatar-ring::before {
  content:''; position:absolute; top:-3px; left:50%; transform:translateX(-50%);
  width:6px; height:6px; border-radius:50%; background:var(--cyan);
  box-shadow:0 0 8px var(--cyan);
}
@keyframes earthRingRotate { to { transform:rotate(360deg); } }
.earth-name { font-size:20px; font-weight:700; }
.earth-name .grad { background:linear-gradient(135deg,var(--cyan),var(--gold)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.earth-id { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:4px; }

/* Stats row */
.earth-stats { display:flex; gap:12px; margin-top:20px; }
.earth-stat {
  flex:1; text-align:center; padding:16px 8px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
}
.earth-stat-num { font-size:24px; font-weight:800; line-height:1; }
.earth-stat-num.grad { background:linear-gradient(135deg,var(--cyan),var(--purple)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.earth-stat-num.grad-gold { background:linear-gradient(135deg,var(--gold),var(--pink)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.earth-stat-label { font-size:11px; color:var(--text-2); margin-top:6px; }

/* Sub-tab switcher */
.earth-subtabs {
  display:flex; gap:0; margin-bottom:16px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  padding:4px;
}
.earth-subtab {
  flex:1; display:flex; align-items:center; justify-content:center; gap:4px;
  padding:11px 4px; border-radius:10px; cursor:pointer; transition:all .3s;
  font-size:13px; font-weight:600; color:var(--text-2);
  position:relative;
}
.earth-subtab .icon { font-size:15px; }
.earth-subtab-count {
  font-size:11px; font-weight:700; padding:1px 7px; border-radius:100px;
  background:rgba(255,255,255,.06); color:var(--text-3); transition:all .3s;
}
.earth-subtab.active {
  background:linear-gradient(135deg,rgba(0,229,255,.12),rgba(168,85,247,.12));
  color:var(--text-1);
  box-shadow:0 2px 12px rgba(0,229,255,.1);
}
.earth-subtab.active .earth-subtab-count {
  background:linear-gradient(135deg,var(--cyan),var(--purple)); color:#fff;
}
.earth-subtab:active { transform:scale(.97); }
.earth-subtab-content { display:none; animation:pageIn .35s ease; }
.earth-subtab-content.active { display:block; }

/* Section */
.earth-section { margin-top:32px; }

/* Sent letter card */
.sent-card {
  background:var(--bg-card); border:1px solid var(--glass-bd); border-radius:16px;
  padding:16px; margin-bottom:12px; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  transition:all .3s;
}
.sent-card:active { transform:scale(.98); }
.sent-card-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
.sent-card-info { flex:1; }
.sent-card-preview { font-size:13px; color:var(--text-2); line-height:1.6; max-height:40px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.sent-card-meta { display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }
.sent-channel-tag {
  font-size:10px; padding:2px 8px; border-radius:100px;
  background:var(--glass); border:1px solid var(--glass-bd); color:var(--text-2);
}
.sent-channel-tag.vow-tag { color:var(--pink); border-color:rgba(255,107,157,.2); background:rgba(255,107,157,.08); }
.sent-channel-tag.enc-tag { color:var(--purple); border-color:rgba(168,85,247,.2); background:rgba(168,85,247,.08); }
.sent-channel-tag.pub-tag { color:var(--cyan); border-color:rgba(0,229,255,.2); background:rgba(0,229,255,.06); }
.sent-status {
  font-size:11px; font-weight:600; padding:4px 10px; border-radius:100px;
  display:flex; align-items:center; gap:4px; white-space:nowrap;
}
.sent-status.traveling { background:rgba(0,229,255,.1); color:var(--cyan); border:1px solid rgba(0,229,255,.2); }
.sent-status.delivered { background:rgba(255,213,107,.1); color:var(--gold); border:1px solid rgba(255,213,107,.2); }

/* Keyword tag */
.keyword-tag {
  display:inline-flex; align-items:center; gap:4px;
  padding:2px 10px; border-radius:100px;
  background:linear-gradient(135deg,rgba(168,85,247,.15),rgba(0,229,255,.1));
  border:1px solid rgba(168,85,247,.2);
  font-size:11px; font-weight:600; color:var(--purple);
  max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.keyword-tag .tag-icon { font-size:10px; }

/* Encrypted preview */
.encrypted-preview {
  display:flex; align-items:center; gap:8px; padding:10px 14px;
  background:rgba(168,85,247,.06); border:1px solid rgba(168,85,247,.15);
  border-radius:10px; font-size:13px;
}
.encrypted-lock { font-size:16px; flex-shrink:0; }
.encrypted-text {
  color:var(--text-3); font-family:'SF Mono',monospace; letter-spacing:1px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.block {
  display:inline-block; width:7px; height:7px; margin:0 1px;
  background:var(--text-3); border-radius:2px; opacity:.4;
}

.vow-contacts { margin-top:6px; font-size:11px; color:var(--text-3); line-height:1.6; }

/* Progress bar */
.progress-wrap { margin-top:10px; }
.progress-info { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.progress-percent { font-size:13px; font-weight:700; }
.progress-percent .grad { background:linear-gradient(135deg,var(--cyan),var(--gold)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.progress-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; }
.progress-bar {
  height:12px; background:rgba(255,255,255,.04); border-radius:100px; position:relative;
  overflow:visible;
}
.progress-streaks {
  position:absolute; inset:0; border-radius:100px; overflow:hidden; pointer-events:none; z-index:0;
}
.progress-streaks::before {
  content:''; position:absolute; inset:0;
  background:repeating-linear-gradient(90deg,
    transparent 0, transparent 10px,
    rgba(0,229,255,.12) 10px, rgba(0,229,255,.12) 11px,
    transparent 11px, transparent 20px,
    rgba(168,85,247,.08) 20px, rgba(168,85,247,.08) 21px,
    transparent 21px, transparent 32px,
    rgba(255,213,107,.06) 32px, rgba(255,213,107,.06) 33px
  );
  animation:warpSpeed 4s linear infinite;
}
@keyframes warpSpeed {
  from { transform:translateX(0); }
  to { transform:translateX(32px); }
}
.progress-fill {
  height:100%; border-radius:100px;
  background:linear-gradient(90deg,var(--cyan),var(--purple),var(--gold));
  background-size:200% 100%;
  animation:progressFlow 6s linear infinite;
  position:relative; transition:width 1s ease;
  box-shadow:0 0 14px rgba(0,229,255,.15);
  z-index:1;
}
@keyframes progressFlow {
  0% { background-position:0% 0%; }
  100% { background-position:200% 0%; }
}
.progress-rocket {
  position:absolute; right:-5px; top:50%; transform:translateY(-50%);
  font-size:13px; line-height:1; z-index:3;
  filter:drop-shadow(0 0 5px rgba(255,213,107,.9)) drop-shadow(0 0 10px rgba(255,107,157,.3));
  animation:rocketVibrate .8s ease-in-out infinite alternate;
  pointer-events:none;
}
.rocket-glyph { display:inline-block; transform:rotate(45deg); }
@keyframes rocketVibrate {
  from { transform:translateY(-50%) translateY(-1.5px); }
  to { transform:translateY(-50%) translateY(1.5px); }
}
.progress-fill.delivered {
  background:linear-gradient(90deg,var(--gold),var(--pink));
  box-shadow:0 0 14px rgba(255,213,107,.2);
}

/* Liked list */
.liked-list { display:flex; flex-direction:column; gap:10px; }
.liked-card {
  display:flex; align-items:center; gap:12px; padding:14px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s;
}
.liked-card:active { transform:scale(.97); }
.liked-avatar {
  width:40px; height:40px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:22px;
  background:linear-gradient(135deg,rgba(255,107,157,.08),rgba(168,85,247,.08));
  border:1px solid rgba(255,107,157,.15);
}
.liked-info { flex:1; min-width:0; }
.liked-from { font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
.liked-asteroid { font-size:10px; color:var(--text-3); font-family:'SF Mono',monospace; }
.liked-preview { font-size:12px; color:var(--text-2); margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.liked-likes { display:flex; align-items:center; gap:3px; font-size:12px; color:var(--pink); font-weight:600; flex-shrink:0; }

/* Coordinate Cards */
.coord-intro {
  font-size:12px; color:var(--text-2); line-height:1.7; margin-bottom:16px;
  padding:14px 16px; border-radius:14px; background:var(--glass); border:1px solid var(--glass-bd);
}
.coord-intro .icon { margin-right:4px; }
.coord-card {
  position:relative; padding:16px; margin-bottom:12px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  transition:all .3s;
}
.coord-card:active { transform:scale(.99); }
.coord-card-head { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.coord-card-icon {
  width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;
  font-size:18px; flex-shrink:0;
}
.coord-card-title { font-size:15px; font-weight:700; flex:1; }
.coord-card-actions { display:flex; gap:6px; }
.coord-action-btn {
  width:30px; height:30px; border-radius:8px; border:1px solid var(--glass-bd);
  background:var(--glass); color:var(--text-2); font-size:13px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .25s;
  line-height:1; padding:0;
}
.coord-action-btn::after { border:none; }
.coord-action-btn:active { transform:scale(.9); }
.coord-value {
  font-size:14px; color:var(--text-1); padding:8px 12px; border-radius:8px;
  background:rgba(0,0,0,.15); word-break:break-all; font-family:'SF Mono',monospace; font-size:13px;
}
.coord-add-btn {
  width:100%; padding:14px; border:1px dashed var(--glass-bd); border-radius:14px;
  background:transparent; color:var(--text-2); font-size:14px; font-weight:600;
  cursor:pointer; transition:all .25s; display:flex; align-items:center; justify-content:center; gap:6px;
  line-height:1.4;
}
.coord-add-btn::after { border:none; }
.coord-add-btn:active { transform:scale(.97); }
.coord-input {
  width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--glass-bd);
  background:rgba(0,0,0,.2); color:var(--text-1); font-size:14px; font-family:inherit;
  transition:all .25s; outline:none;
}
.coord-input:focus { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,229,255,.1); }
.coord-input::placeholder { color:var(--text-3); }

/* Coordinator editor */
.coord-editor-overlay {
  position:fixed; inset:0; z-index:99998; background:rgba(0,0,0,.6);
  backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;
  padding:24px; animation:pageIn .3s ease;
}
.coord-editor-panel {
  width:100%; max-width:360px; background:var(--bg-mid);
  border:1px solid var(--glass-bd); border-radius:20px; padding:24px;
}
.coord-type-chip {
  display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:100px;
  cursor:pointer; font-size:13px; font-weight:600;
  border:1px solid var(--glass-bd); background:var(--glass);
  transition:all .25s;
}
.coord-editor-cancel {
  flex:1; padding:12px; border-radius:12px; border:1px solid var(--glass-bd);
  background:var(--glass); color:var(--text-2); font-size:14px; font-weight:600; cursor:pointer;
  line-height:1.4;
}
.coord-editor-cancel::after { border:none; }
.coord-editor-save {
  flex:1; padding:12px; border-radius:12px; border:none;
  background:linear-gradient(135deg,var(--cyan),var(--blue)); color:#fff;
  font-size:14px; font-weight:600; cursor:pointer; line-height:1.4;
}
.coord-editor-save::after { border:none; }

/* Empty state */
.earth-empty {
  text-align:center; padding:40px 20px; color:var(--text-3);
}
.earth-empty-icon { font-size:36px; margin-bottom:10px; opacity:.4; }
.earth-empty-text { font-size:13px; }

/* Letter Modal (shared) */
.letter-modal-overlay {
  position:fixed; inset:0; z-index:200;
  align-items:center; justify-content:center; padding:24px;
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
.modal-btn.light {
  background:linear-gradient(135deg,var(--pink),var(--purple)); color:#fff;
  box-shadow:0 4px 20px rgba(255,107,157,.3);
}
.modal-btn.light.lit {
  background:linear-gradient(135deg,var(--signal-bright),var(--pink));
  box-shadow:0 4px 20px rgba(255,59,107,.4);
}
.modal-btn:active { transform:scale(.95); }

@keyframes pageIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
</style>
