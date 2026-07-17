<template>
  <view class="launch-page" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
    <star-sky />
    <view class="launch-header">
      <view class="launch-logo">STARLETTER</view>
      <view class="launch-tagline">寄给未来的信</view>
      <view class="launch-title">写一封信<br><text class="grad">寄给未来的自己/某人</text></view>
      <view class="launch-sub">在此刻写下心声，设定未来的送达时间<br>通过手写信件、QQ邮箱或短信送达</view>
    </view>

    <view class="mode-tabs">
      <view class="mode-tab" :class="{ active: mode === 'self' }" @click="setMode('self')">✉️ 寄给自己</view>
      <view class="mode-tab" :class="{ active: mode === 'someone' }" @click="setMode('someone')"><text class="tab-ico tab-ico-someone">📪</text> 寄给某人</view>
      <view class="mode-indicator" :class="mode === 'self' ? 'left' : 'right'"></view>
    </view>

    <view class="letter-card">
      <view class="letter-head">
        <view class="letter-from">来自 <text class="cyan" v-if="mode === 'self'">现在的我</text><input v-else class="letter-edit-input" v-model="current.from" placeholder="你的名字 / 昵称" :maxlength="20" :adjust-position="true" /></view>
        <view class="letter-date">{{ currentDate }}</view>
      </view>
      <view class="letter-body">
        <view class="letter-to">寄至 <text class="gold" v-if="mode === 'self'">未来的我</text><input v-else class="letter-edit-input letter-edit-input-gold" v-model="current.to" placeholder="对方的名字 / 昵称" :maxlength="20" :adjust-position="true" /></view>
        <textarea
          class="letter-input"
          v-model="current.letterContent"
          placeholder="亲爱的未来的我：&#10;&#10;当你读到这封信的时候，也许一切都已经不同了。&#10;我想告诉你，此刻的我正在……&#10;&#10;那些未完成的心愿，那些来不及说的话，&#10;那些藏在心底的秘密，我都写在了这里。&#10;&#10;希望你现在过得很好。"
          :maxlength="5000"
        />
      </view>
      <view class="letter-foot">
        <view class="char-count"><text class="cyan">{{ current.letterContent.length }}</text> / 5000 字</view>
      </view>
    </view>

    <view class="keyword-section">
      <view class="keyword-label"><text class="icon">🏷️</text> <text>标记主题关键字</text> <text style="color:var(--text-3);font-size:11px;font-weight:400;">（请注意，标题关键字会展示给对方！！！）</text></view>
      <input
        class="keyword-input"
        type="text"
        v-model="current.keyword"
        placeholder="如：给25岁的自己 / 考研纪念 / 写给爱情，最长15个字哦 ~ "
        :maxlength="20"
        :adjust-position="true"
      />
    </view>

    <view v-if="mode === 'self'" class="launch-only-toggle" :class="{ active: current.launchOnlyMode }" @click="toggleLaunchOnly">
      <view class="corner-ribbon free">免费</view>
      <view class="lot-icon">✨</view>
      <view class="lot-text">
        <view class="lot-title">仅发射 · 不推送</view>
        <view class="lot-desc">信件化作星海中的一颗星，可以被其他星系容纳，但不进行任何渠道推送</view>
      </view>
      <view class="vis-toggle" :class="{ encrypted: current.launchOnlyMode }">
        <view class="vis-knob"></view>
      </view>
    </view>
    <view class="section" v-if="!current.launchOnlyMode">
      <view class="section-label">DELIVERY</view>
      <view class="section-title-row">
        <view class="section-title">选择送达方式</view>
        <view class="vis-toggle-wrap" @click="toggleVisibility">
          <text class="vis-state" :class="current.isEncrypted ? 'encrypted' : 'public'">{{ current.isEncrypted ? '加密' : '公开' }}</text>
          <view class="vis-toggle" :class="{ encrypted: current.isEncrypted }">
            <view class="vis-knob"></view>
          </view>
        </view>
      </view>
      <view class="section-desc">信件将在指定日期通过此渠道送达</view>
      <view class="delivery-list">
        <view
          class="delivery-card"
          :class="{ selected: current.selectedChannel === 'mail' }"
          @click="selectChannel('mail')"
        >
          <view class="delivery-price" :class="{ free: priceMap.mail === 0 }">{{ priceMap.mail === 0 ? '免费' : '¥ ' + priceMap.mail.toFixed(2) }}</view>
          <view class="delivery-icon" style="background:rgba(168,85,247,.1);">📮</view>
          <view class="delivery-info">
            <view class="delivery-name">手写信件</view>
            <view class="delivery-desc">寄托于中国邮政不畏山海的能力，来一次跨越时空的邂逅</view>
          </view>
          <view class="delivery-check" :class="{ active: current.selectedChannel === 'mail' }">✓</view>
        </view>
        <view
          class="delivery-card"
          :class="{ selected: current.selectedChannel === 'qqmail' }"
          @click="selectChannel('qqmail')"
        >
          <view class="delivery-price" :class="{ free: priceMap.qqmail === 0 }">{{ priceMap.qqmail === 0 ? '免费' : '¥ ' + priceMap.qqmail.toFixed(2) }}</view>
          <view class="delivery-icon" style="background:rgba(18,183,245,.1);">📧</view>
          <view class="delivery-info">
            <view class="delivery-name">QQ 邮箱</view>
            <view class="delivery-desc">到期后您将收到我们精心准备的邮件，如果那时邮件还存的话</view>
          </view>
          <view class="delivery-check" :class="{ active: current.selectedChannel === 'qqmail' }">✓</view>
        </view>
        <view
          class="delivery-card"
          :class="{ selected: current.selectedChannel === 'sms' }"
          @click="selectChannel('sms')"
        >
          <view class="delivery-price" :class="{ free: priceMap.sms === 0 }">{{ priceMap.sms === 0 ? '免费' : '¥ ' + priceMap.sms.toFixed(2) }}</view>
          <view class="delivery-icon" style="background:rgba(255,213,107,.1);">📱</view>
          <view class="delivery-info">
            <view class="delivery-name">短信推送</view>
            <view class="delivery-desc">一条封存时光的短信，让您的思绪重新回到今天</view>
          </view>
          <view class="delivery-check" :class="{ active: current.selectedChannel === 'sms' }">✓</view>
        </view>
        <view
          class="delivery-card delivery-card-vow"
          :class="{ selected: current.selectedChannel === 'unbreakable' }"
          @click="selectChannel('unbreakable')"
        >
          <view class="delivery-price" :class="{ free: priceMap.unbreakable === 0 }">{{ priceMap.unbreakable === 0 ? '免费' : '¥ ' + priceMap.unbreakable.toFixed(2) }}</view>
          <view class="delivery-icon" style="background:rgba(255,107,157,.12);">🛡️</view>
          <view class="delivery-info">
            <view class="delivery-name">牢不可破的誓言 <text style="font-size:10px;color:var(--pink);font-weight:400;margin-left:4px;">S-TIER</text></view>
            <view class="delivery-desc">全渠道推送，我们会拼尽全力将信件交付到您手上，还会将您的信件永远挂到区块链（ETH）主链上，在数字世界里永久留下一个小小的足迹</view>
          </view>
          <view class="delivery-check" :class="{ active: current.selectedChannel === 'unbreakable' }">✓</view>
        </view>
      </view>
    </view>

    <view class="section" v-if="!current.launchOnlyMode">
      <view class="section-label">TIMING</view>
      <view class="section-title">设定送达时间</view>
      <view class="section-desc">选择 1年 / 3年 / 10年后，或自定义一个送达日期</view>
      <view class="time-grid">
        <view
          class="time-card"
          v-for="year in presetYears"
          :key="year"
          :class="{ selected: current.selectedYears === year }"
          @click="selectYears(year)"
        >
          <view class="time-num grad">{{ year }}</view>
          <view class="time-unit">年后</view>
          <view class="time-date">{{ getFutureDate(year) }}</view>
        </view>
        <!-- 自定义 -->
        <view
          v-if="!current.selectedChannel"
          class="time-card"
          @click="showToast('请先选择送达方式哦 ~')"
        >
          <view class="time-num grad" style="font-size:17px;">自定义</view>
          <view class="time-unit">送达</view>
          <view class="time-date">需先选渠道</view>
        </view>
        <picker
          v-else
          mode="date"
          :start="customMinDate"
          :end="customMaxDate"
          :value="customPickerValue"
          @change="onCustomDateChange"
        >
          <view class="time-card" :class="{ selected: !!current.customDate }">
            <view class="time-num grad" style="font-size:17px;">自定义</view>
            <view class="time-unit">送达</view>
            <view class="time-date">{{ current.customDate || customDateHint }}</view>
          </view>
        </picker>
      </view>
    </view>

    <view class="launch-btn-wrap">
      <button
        class="launch-btn"
        :class="{ igniting }"
        :style="igniteStyle"
        @touchstart.prevent="startIgnite"
        @touchend="endPress"
        @touchcancel="cancelIgnite"
        @mousedown.prevent="startIgnite"
        @mouseup="endPress"
        @mouseleave="cancelIgnite"
      >{{ launchBtnText }}</button>
      <view class="launch-ignite-bar" v-if="igniting">
        <view class="launch-ignite-fill" :style="{ width: (igniteProgress * 100).toFixed(0) + '%' }"></view>
      </view>
      <view class="launch-hint">{{ current.launchOnlyMode ? '信件将化作星光，永远闪耀于星海，不会推送' : '长按点火，蓄力越久发射到更远的星系' }}</view>
    </view>

    <!-- Launch Animation Overlay -->
    <view class="launch-overlay" v-if="showOverlay" :class="{ show: showOverlay }">
      <view class="flying-letter" :class="animationStage">
        <view class="flying-letter-icon">✉</view>
        <view class="flying-letter-text">信件正在转化为星光...</view>
      </view>
      <view class="launch-trail" :class="{ active: trailActive }"></view>
      <view class="launch-success" :class="{ show: showSuccess }">
        <view class="launch-success-star">⭐</view>
        <view class="launch-success-title">信件已成为 <text class="grad">一颗星</text></view>
        <view class="launch-success-desc">{{ successDesc }}</view>
        <view class="launch-success-info">
          <view class="launch-success-info-item">
            <view class="launch-success-info-label">送达时间</view>
            <view class="launch-success-info-value">{{ successDate }}</view>
          </view>
          <view class="launch-success-info-item">
            <view class="launch-success-info-label">送达方式</view>
            <view class="launch-success-info-value">{{ successChannel }}</view>
          </view>
          <view class="launch-success-info-item">
            <view class="launch-success-info-label">旅行时长</view>
            <view class="launch-success-info-value">{{ successDuration }}</view>
          </view>
        </view>
        <button class="launch-success-btn" @click="closeOverlay">继续探索星海</button>
      </view>
    </view>

    <!-- Coordinate Popup -->
    <view class="coord-popup-overlay" v-if="showCoordPopup" @click="closeCoordPopup" @touchmove.stop.prevent="noop">
      <view class="coord-popup-mask" @click="closeCoordPopup"></view>
      <view class="coord-popup" @click.stop="noop" @touchmove.stop>
        <view class="coord-popup-header">
          <view class="coord-popup-icon">📡</view>
          <view>
            <view class="coord-popup-title">坐标</view>
            <view class="coord-popup-sub">填写收件坐标，确保信件准确送达</view>
          </view>
          <button class="coord-popup-close" @click="closeCoordPopup">✕</button>
        </view>
        <view class="coord-channel-badge" :class="coordChannel">{{ coordChannelIcon }} {{ coordChannelName }}</view>

        <!-- Saved coords -->
        <view class="coord-saved-section" v-if="coordSavedList.length > 0">
          <view class="coord-saved-label">🗂️ 从地球坐标选择</view>
          <view class="coord-saved-list">
            <view
              class="coord-saved-chip"
              v-for="c in coordSavedList"
              :key="c.id"
              @click="fillFromSavedCoord(c)"
            >
              <text class="chip-icon">{{ c.icon }}</text>
              <text class="chip-text">{{ c.value }}</text>
            </view>
          </view>
        </view>
        <view class="coord-saved-section" v-else>
          <view class="coord-saved-label">🗂️ 从地球坐标选择</view>
          <view class="coord-saved-empty">暂无保存的坐标 · 可在「地球 → 坐标」中预先添加</view>
        </view>

        <view class="coord-popup-fields">
          <view class="coord-popup-field" v-for="f in coordFields" :key="f.key">
            <view class="coord-popup-field-label">{{ f.icon }} {{ f.label }} <text class="required" v-if="f.required">必填</text></view>
            <input
              class="coord-popup-input"
              :class="{ 'unbreakable-focus': isUnbreakableChannel }"
              v-model="coordFieldValues[f.key]"
              :placeholder="f.placeholder"
              :adjust-position="true"
            />
          </view>
        </view>

        <view v-if="isUnbreakableChannel">
          <view v-for="(_, idx) in coordExtraContacts" :key="idx" class="coord-extra-row">
            <view class="coord-popup-field">
              <view class="coord-popup-field-label">👤 备选联系人 {{ idx + 4 }}</view>
              <input
                class="coord-popup-input unbreakable-focus"
                v-model="coordExtraContacts[idx]"
                placeholder="姓名 + 手机号 · 紧急转交"
                :adjust-position="true"
              />
            </view>
            <button class="coord-extra-remove" @click="removeExtraContact(idx)">✕</button>
          </view>
          <button class="coord-add-extra" @click="addExtraContact">＋ 添加更多备选联系人</button>
        </view>

        <button
          class="coord-confirm-btn"
          :class="{ unbreakable: isUnbreakableChannel }"
          @click="confirmCoord"
        >
          {{ isUnbreakableChannel ? '🛡️ 确认并封印誓言' : '🚀 确认并发射' }}
        </button>
      </view>
    </view>

    <!-- Toast -->
    <view class="toast" v-if="toastMsg" :style="{ opacity: toastOpacity }">{{ toastMsg }}</view>

  </view>
</template>

<script>
const channelNames = { mail: '手写信件', qqmail: 'QQ邮箱', sms: '短信推送', unbreakable: '牢不可破的誓言' };
const channelFieldMap = {
  mail: [{ key: 'address', icon: '📮', label: '对方邮寄地址', placeholder: '请输入对方邮寄地址', required: true }],
  qqmail: [{ key: 'email', icon: '📧', label: '对方邮箱地址', placeholder: '请输入对方邮箱地址', required: true }],
  sms: [{ key: 'phone', icon: '📱', label: '对方手机号', placeholder: '请输入对方手机号', required: true }],
  unbreakable: [
    { key: 'phone', icon: '📱', label: '对方手机号', placeholder: '必填 · 用于短信/电话送达', required: true },
    { key: 'email', icon: '📧', label: '对方邮箱地址', placeholder: '必填 · 用于邮件送达', required: true },
    { key: 'address', icon: '📮', label: '对方邮寄地址', placeholder: '必填 · 用于手写信件邮寄', required: true },
    { key: 'contact2', icon: '👤', label: '备选联系人 2', placeholder: '姓名 + 手机号 · 紧急转交', required: false },
    { key: 'contact3', icon: '👤', label: '备选联系人 3', placeholder: '姓名 + 手机号 · 紧急转交', required: false },
  ],
};
const coordTypeMap = {
  phone: { icon: '📱', label: '手机号', bg: 'rgba(255,213,107,.1)' },
  email: { icon: '📧', label: '邮箱地址', bg: 'rgba(18,183,245,.1)' },
  address: { icon: '📮', label: '邮寄地址', bg: 'rgba(168,85,247,.1)' },
  wechat: { icon: '💬', label: '微信号', bg: 'rgba(7,193,96,.1)' },
};

export default {
  data() {
    return {
      mode: 'self',
      self: {
        letterContent: '',
        keyword: '',
        selectedChannel: '',
        selectedYears: null,
        customDate: null,
        isEncrypted: false,
        launchOnlyMode: false,
      },
      someone: {
        letterContent: '',
        keyword: '',
        selectedChannel: '',
        selectedYears: null,
        customDate: null,
        isEncrypted: false,
        from: '',
        to: '',
      },
      currentDate: '',
      priceMap: { mail: 9.9, qqmail: 0, sms: 0.99, unbreakable: 19.9 },
      showOverlay: false,
      animationStage: '',
      trailActive: false,
      showSuccess: false,
      successDate: '',
      successChannel: '',
      successDuration: '',
      successDesc: '',
      showCoordPopup: false,
      coordChannel: '',
      coordChannelName: '',
      coordChannelIcon: '',
      coordFields: [],
      coordFieldValues: {},
      coordExtraContacts: [],
      toastMsg: '',
      toastOpacity: 1,
      toastTimer: null,
      pendingChannel: '',
      _swipeStartX: 0,
      _swipeStartY: 0,
      igniting: false,
      igniteStyle: '',
      igniteProgress: 0,
    };
  },
  computed: {
    current() {
      return this.mode === 'self' ? this.self : this.someone;
    },
    presetYears() {
      return [1, 3, 10];
    },
    // 自定义日期最早可选范围：根据所选送达渠道而定
    customMinDate() {
      const ch = this.current.selectedChannel;
      let addDays = 1;
      if (ch === 'mail' || ch === 'unbreakable') addDays = 30;
      else if (ch === 'sms') addDays = 7;
      else if (ch === 'qqmail') addDays = 1;
      else addDays = 1; // 默认（理论上需先选渠道）
      const d = new Date();
      d.setDate(d.getDate() + addDays);
      return this.formatDateISO(d);
    },
    customMaxDate() {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 100);
      return this.formatDateISO(d);
    },
    customPickerValue() {
      if (this.current.customDate) {
        return this.formatDateISO(this.parseDotDate(this.current.customDate));
      }
      return this.customMinDate;
    },
    customDateHint() {
      return this.customMinDate.replace(/-/g, '.');
    },
    isUnbreakableChannel() {
      return this.coordChannel === 'unbreakable';
    },
    coordSavedList() {
      const relevantTypes = this.isUnbreakableChannel
        ? ['phone', 'email', 'address']
        : this.coordFields.map(f => f.key);
      const myCoords = getApp().globalData.myCoords || [];
      return myCoords.filter(c => {
        const fieldKey = this.coordTypeToFieldKey(c.type);
        return relevantTypes.includes(fieldKey);
      }).map(c => {
        const meta = coordTypeMap[c.type] || coordTypeMap.phone;
        return { ...c, icon: meta.icon };
      });
    },
    launchBtnText() {
      if (this.igniting) return '🔥 点火中…';
      return this.current.launchOnlyMode ? '✨ 仅发射到星海' : '🚀 发射至星际';
    },
  },
  mounted() {
    this.currentDate = this.formatDate(new Date());
  },
  methods: {
    noop() {},
    formatDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}.${m}.${day}`;
    },
    getFutureDate(years) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + years);
      return this.formatDate(d);
    },
    formatDateISO(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    formatDateFromISO(s) {
      return s.replace(/-/g, '.');
    },
    parseDotDate(s) {
      const [y, m, d] = s.split('.').map(Number);
      return new Date(y, m - 1, d);
    },
    getDateDiff(futureDate) {
      const now = new Date();
      const diff = futureDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days < 30) return `${days} 天`;
      if (days < 365) return `${Math.floor(days / 30)} 个月`;
      return `${Math.floor(days / 365)} 年`;
    },
    coordTypeToFieldKey(type) {
      const map = { phone: 'phone', wechat: 'wechat', email: 'email', address: 'address' };
      return map[type] || type;
    },
    selectChannel(channel) {
      this.current.selectedChannel = channel;
      this.current.customDate = null;
    },
    selectYears(years) {
      this.current.selectedYears = years;
      this.current.customDate = null;
    },
    onCustomDateChange(e) {
      this.current.customDate = this.formatDateFromISO(e.detail.value);
      this.current.selectedYears = null;
    },
    toggleVisibility() {
      this.current.isEncrypted = !this.current.isEncrypted;
      if (this.current.isEncrypted) {
        this.showToast('🔒 加密信件不会出现在「星系」星海\n将使用加密算法保护内容\n直到送达之日才会推送给您');
      } else {
        this.showToast('🌐 信件已设为公开，将出现在「星系」星海');
      }
    },
    showToast(msg) {
      this.toastMsg = msg;
      this.toastOpacity = 1;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastOpacity = 0;
        setTimeout(() => { this.toastMsg = ''; }, 300);
      }, 3000);
    },
    startIgnite() {
      if (this.igniting || this.showOverlay || this.showCoordPopup) return;
      if (!this.current.letterContent.trim()) { this.showToast('请先写下你的信件内容'); return; }
      if (!this.current.launchOnlyMode) {
        if (!this.current.selectedChannel) { this.showToast('请选择送达方式'); return; }
        if (!this.current.selectedYears && !this.current.customDate) { this.showToast('请选择送达时间'); return; }
      }
      this.igniting = true;
      this.igniteProgress = 0;
      this._igniteT0 = this._now();
      this._lastTs = 0;
      this._phase = 0;
      this._pressStart = Date.now();
      this._igniteFull = 1000;
      if (this._igniteTimer) clearTimeout(this._igniteTimer);
      this._igniteTimer = setTimeout(() => this.fireLaunch(), this._igniteFull);
      this._scheduleFrame();
    },
    _scheduleFrame() {
      if (!this._rafFn) {
        const w = (typeof window !== 'undefined') ? window : {};
        this._rafFn = w.requestAnimationFrame ? w.requestAnimationFrame.bind(w) : (cb) => setTimeout(() => cb(this._now()), 16);
        this._cafFn = w.cancelAnimationFrame ? w.cancelAnimationFrame.bind(w) : clearTimeout;
      }
      this._igniteRAF = this._rafFn(this.igniteLoop);
    },
    _now() {
      return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    },
    _lerpColor(a, b, t) {
      const r = Math.round(a[0] + (b[0] - a[0]) * t);
      const g = Math.round(a[1] + (b[1] - a[1]) * t);
      const bl = Math.round(a[2] + (b[2] - a[2]) * t);
      return `rgb(${r},${g},${bl})`;
    },
    igniteLoop(ts) {
      if (!this.igniting) return;
      if (!this._lastTs) this._lastTs = ts;
      const dt = ts - this._lastTs;
      this._lastTs = ts;
      const t = ts - this._igniteT0;
      const p = Math.min(Math.max(t, 0), this._igniteFull) / this._igniteFull;
      const freq = 8 + 32 * p; // Hz，随蓄力不断提升
      this._phase += (freq * dt / 1000) * 2 * Math.PI;
      const ampX = 2 + 9 * p;
      const ampY = 1 + 3 * p;
      const rot = (0.8 + 3 * p) * Math.sin(this._phase * 0.8);
      const x = ampX * Math.sin(this._phase);
      const y = ampY * Math.cos(this._phase * 1.2);
      // 颜色随蓄力从蓝紫逐渐变红，最终与「发射中」进度条最终色一致（#ff5e3a → #ff2d00）
      const c1 = this._lerpColor([0, 229, 255], [255, 94, 58], p);   // → #ff5e3a
      const c2 = this._lerpColor([168, 85, 247], [255, 45, 0], p);   // → #ff2d00
      const glow = (0.15 + 0.6 * p).toFixed(2);
      this.igniteStyle =
        `transform:translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(0.98 - 0.02 * p).toFixed(3)});` +
        `background:linear-gradient(135deg,${c1},${c2});` +
        `box-shadow:0 0 ${(60 * p).toFixed(0)}px rgba(255,90,0,${glow}),0 0 ${(120 * p).toFixed(0)}px rgba(255,45,0,${(glow * 0.5).toFixed(2)});`;
      this.igniteProgress = p;
      if (this.igniting) this._scheduleFrame();
    },
    endPress() {
      if (!this.igniting) return;
      const held = Date.now() - this._pressStart;
      if (held < 200) {
        // 极短轻点：直接发射，不走蓄力
        this.clearIgnite();
        this.handleLaunch();
      }
      // 其余情况：持续蓄力至满，由 fireLaunch 触发
    },
    fireLaunch() {
      if (!this.igniting) return;
      this.clearIgnite();
      this.handleLaunch();
    },
    cancelIgnite() {
      if (!this.igniting) return;
      this.clearIgnite();
      this.showToast('点火中断，松手太快啦');
    },
    clearIgnite() {
      this.igniting = false;
      this.igniteProgress = 0;
      this.igniteStyle = '';
      if (this._igniteRAF && this._cafFn) this._cafFn(this._igniteRAF);
      this._igniteRAF = null;
      if (this._igniteTimer) clearTimeout(this._igniteTimer);
      this._igniteTimer = null;
    },
    handleLaunch() {
      if (!this.current.letterContent.trim()) { this.showToast('请先写下你的信件内容'); return; }
      if (this.current.launchOnlyMode) {
        this.showCoordPopup = false;
        this.proceedWithLaunch(null, true);
        return;
      }
      if (!this.current.selectedChannel) { this.showToast('请选择送达方式'); return; }
      if (!this.current.selectedYears) { this.showToast('请选择送达时间'); return; }
      this.pendingChannel = this.current.selectedChannel;
      this.showCoordPopup = true;
      this.coordChannel = this.current.selectedChannel;
      this.coordChannelName = channelNames[this.current.selectedChannel] || this.current.selectedChannel;
      this.coordChannelIcon = { mail: '📮', qqmail: '📧', sms: '📱', unbreakable: '🛡️' }[this.current.selectedChannel] || '📡';
      this.coordFields = channelFieldMap[this.current.selectedChannel] || [];
      const fieldValues = {};
      this.coordFields.forEach(f => { fieldValues[f.key] = ''; });
      this.coordFieldValues = fieldValues;
      this.coordExtraContacts = [];
    },
    closeCoordPopup() {
      this.showCoordPopup = false;
    },
    fillFromSavedCoord(c) {
      const fieldKey = this.coordTypeToFieldKey(c.type);
      this.coordFieldValues[fieldKey] = c.value;
      this.showToast(`已填入：${c.value}`);
    },
    addExtraContact() {
      this.coordExtraContacts.push('');
    },
    removeExtraContact(idx) {
      this.coordExtraContacts.splice(idx, 1);
    },
    confirmCoord() {
      const contacts = {};
      let valid = true;
      const missingLabels = [];

      for (const f of this.coordFields) {
        const val = (this.coordFieldValues[f.key] || '').trim();
        if (f.required && !val) {
          valid = false;
          missingLabels.push(f.label);
        }
        if (val) contacts[f.key] = val;
      }
      this.coordExtraContacts.forEach((val, idx) => {
        if (val.trim()) contacts['contactExtra' + (idx + 1)] = val.trim();
      });

      if (!valid) {
        this.showToast('请填写：' + missingLabels.join('、'));
        return;
      }

      this.showCoordPopup = false;
      const payPrice = this.priceMap[this.current.selectedChannel] || 0;
      if (payPrice > 0) {
        this.simulateWechatPay(payPrice, contacts);
      } else {
        this.proceedWithLaunch(contacts);
      }
    },
    simulateWechatPay(price, contacts) {
      this.showToast(`💳 正在发起微信支付\n ${price.toFixed(2)}`);
      // 真实环境调用 uni.requestPayment({ provider: 'wxpay', ... }) 完成支付
      setTimeout(() => {
        this.showToast(`✅ 微信支付成功\n¥ ${price.toFixed(2)}`);
        this.proceedWithLaunch(contacts);
      }, 1200);
    },
    proceedWithLaunch(contacts, isLaunchOnly) {
      const mode = this.mode;
      const content = this.current.letterContent.trim();
      const channel = isLaunchOnly ? 'launch' : this.current.selectedChannel;
      const isCustom = !isLaunchOnly && !!this.current.customDate;
      const years = isLaunchOnly ? null : (isCustom ? null : this.current.selectedYears);
      const keyword = this.current.keyword.trim() || '未标记主题';

      let deliveryDate = '';
      let deliveryDateObj = new Date();
      if (!isLaunchOnly) {
        if (isCustom) {
          deliveryDate = this.current.customDate;
          deliveryDateObj = this.parseDotDate(deliveryDate);
        } else {
          deliveryDate = this.getFutureDate(years);
          deliveryDateObj.setFullYear(deliveryDateObj.getFullYear() + years);
        }
      }
      const duration = isLaunchOnly ? '' : this.getDateDiff(deliveryDateObj);

      const sentLetter = {
        id: 'MY' + Date.now(),
        content,
        keyword,
        channel,
        mode,
        isEncrypted: this.current.isEncrypted,
        deliveryContacts: isLaunchOnly ? null : contacts,
        sentDate: this.formatDate(new Date()),
        sentTimestamp: Date.now(),
        deliveryDate,
        deliveryTimestamp: isLaunchOnly ? 0 : deliveryDateObj.getTime(),
        years,
        customDate: isCustom ? deliveryDate : null,
      };

      const app = getApp();
      if (!app.globalData.mySentLetters) app.globalData.mySentLetters = [];
      app.globalData.mySentLetters.unshift(sentLetter);
      app.globalData.saveState();

      this.successDate = deliveryDate || '永久闪耀';
      this.successChannel = isLaunchOnly ? '仅发射' : channelNames[channel];
      this.successDuration = isLaunchOnly ? '—' : duration;

      if (isLaunchOnly) {
        this.successDesc = `你的信已化作星光，融入浩瀚星海\n它将作为一颗星永远闪耀\n不进行任何渠道推送送达`;
      } else if (channel === 'unbreakable') {
        const contactCount = contacts ? Object.keys(contacts).length : 0;
        this.successDesc = `誓言已封印 · ${contactCount}条联络通道已激活\n我们将动用一切手段，层层接力\n确保这封信抵达对方手中`;
      } else if (channel === 'mail') {
        this.successDesc = `你的信已化作星光，融入浩瀚星海\n到达之日将亲笔手写邮寄送达\n尽量保证当天寄达，前后不超三天`;
      } else {
        this.successDesc = mode === 'someone'
          ? `你的信已化作星光，融入浩瀚星海\n它将在指定日期，照亮那个重要的人`
          : `你的信已化作星光，融入浩瀚星海\n它将在指定日期，照亮未来的你`;
      }

      this.showOverlay = true;
      this.animationStage = 'stage-1';
      this.trailActive = false;
      this.showSuccess = false;

      setTimeout(() => {
        this.animationStage = 'stage-2';
        this.trailActive = true;
      }, 600);
      setTimeout(() => {
        this.animationStage = 'stage-3';
      }, 1400);
      setTimeout(() => {
        this.showSuccess = true;
      }, 2200);
    },
    closeOverlay() {
      this.showOverlay = false;
      this.animationStage = '';
      this.trailActive = false;
      this.showSuccess = false;
      this.current.letterContent = '';
      this.current.keyword = '';
      this.current.selectedChannel = '';
      this.current.selectedYears = null;
      this.current.customDate = null;
      this.current.isEncrypted = false;
      if (this.current.launchOnlyMode !== undefined) this.current.launchOnlyMode = false;
      this.current.from = '';
      this.current.to = '';
    },
    toggleLaunchOnly() {
      this.current.launchOnlyMode = !this.current.launchOnlyMode;
      if (this.current.launchOnlyMode) {
        this.showToast('✨ 仅发射模式已开启\n信件将化作星海中的一颗星\n不进行任何推送送达');
      } else {
        this.showToast('已切换回常规发射\n可选择送达方式与日期');
      }
    },
    setMode(mode) {
      this.mode = mode;
    },
    onSwipeStart(e) {
      const t = e.touches && e.touches[0];
      this._swipeStartX = t ? t.clientX : 0;
      this._swipeStartY = t ? t.clientY : 0;
    },
    onSwipeEnd(e) {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - this._swipeStartX;
      const dy = t.clientY - this._swipeStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && this.mode === 'self') this.mode = 'someone';
        else if (dx > 0 && this.mode === 'someone') this.mode = 'self';
      }
    },
  },
};
</script>

<style>
/* ===== Launch Page ===== */
.launch-page { padding:0 20px 90px; min-height:100vh; position:relative; z-index:1; }
.launch-header { text-align:center; padding:60px 0 28px; }
.launch-logo {
  font-size:13px; font-weight:700; letter-spacing:4px;
  background:linear-gradient(135deg,var(--cyan),var(--gold));
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
}
.launch-tagline { font-size:11px; color:var(--text-3); margin-top:4px; letter-spacing:2px; }
.launch-title { font-size:28px; font-weight:800; margin-top:24px; letter-spacing:-.5px; }
.launch-title .grad {
  background:linear-gradient(135deg,var(--cyan) 0%,var(--purple) 50%,var(--gold) 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
}
.launch-sub { font-size:13px; color:var(--text-2); margin-top:10px; line-height:1.6; }

/* Mode Tabs (self / someone) */
.mode-tabs {
  display:flex; margin-top:24px; position:relative; z-index:2;
  background:var(--glass); border:1px solid var(--glass-bd);
  border-radius:100px; padding:5px;
}
.mode-tab {
  position:relative; z-index:2; flex:1; text-align:center; padding:11px 8px;
  border-radius:100px; font-size:14px; font-weight:600; color:var(--text-2);
  cursor:pointer; transition:color .35s cubic-bezier(.16,1,.3,1);
}
.mode-tab.active { color:#fff; }
.tab-ico { display:inline-block; width:14px; height:14px; margin-right:5px; vertical-align:-2px; }
.tab-ico-someone {
  background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12h-6l-2 3h-4l-2-3H2'/><path d='M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'/></svg>") no-repeat center / contain;
}
.mode-indicator {
  position:absolute; top:5px; left:5px; z-index:1;
  width:calc(50% - 5px); height:calc(100% - 10px); border-radius:100px;
  background:linear-gradient(135deg,var(--cyan),rgba(168,85,247,.5));
  box-shadow:0 0 20px rgba(0,229,255,.3);
  transition:transform .38s cubic-bezier(.16,1,.3,1), background .38s ease, box-shadow .38s ease;
}
.mode-indicator.left {
  background:linear-gradient(135deg,var(--cyan),rgba(168,85,247,.5));
  box-shadow:0 0 20px rgba(0,229,255,.3);
}
.mode-indicator.right {
  transform:translateX(100%);
  background:linear-gradient(135deg,rgba(0,229,255,.5),var(--purple));
  box-shadow:0 0 20px rgba(168,85,247,.3);
}

/* Editable from/to inputs (someone mode) */
.letter-edit-input {
  display:inline-block; min-width:120px; max-width:60%;
  font-size:13px; color:var(--text-1); background:rgba(0,229,255,.06);
  border:1px solid rgba(0,229,255,.25); border-radius:8px;
  padding:4px 10px; outline:none; vertical-align:baseline;
}
.letter-edit-input::placeholder { color:var(--text-3); }
.letter-edit-input-gold { color:var(--gold); border-color:rgba(255,213,107,.3); background:rgba(255,213,107,.06); }
.letter-edit-input:focus { border-color:var(--cyan); }

/* Letter Card */
.letter-card {
  background:var(--bg-card); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(0,229,255,.12); border-radius:var(--radius);
  overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,.3);
  margin-top:24px;
}
.letter-head { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; }
.letter-from { font-size:13px; color:var(--text-2); }
.letter-from .cyan { color:var(--cyan); font-weight:600; }
.letter-date { font-size:12px; color:var(--text-3); font-family:'SF Mono',monospace; }
.letter-body { padding:0 18px 8px; }
.letter-to { font-size:12px; color:var(--text-3); margin-bottom:10px; }
.letter-to .gold { color:var(--gold); font-weight:600; }
.letter-input {
  width:100%; min-height:200px; background:transparent; border:none; outline:none; resize:none;
  color:var(--text-1); font-size:15px; line-height:1.8; font-family:inherit;
}
.letter-input::placeholder { color:var(--text-3); }
.letter-foot { display:flex; justify-content:flex-end; padding:8px 18px 14px; border-top:1px solid var(--glass-bd); }
.char-count { font-size:12px; color:var(--text-3); font-family:'SF Mono',monospace; }
.char-count .cyan { color:var(--cyan); }

/* Keyword tag input */
.keyword-section { margin-top:16px; }
.keyword-label { font-size:12px; color:var(--text-2); margin-bottom:8px; display:flex; align-items:center; gap:6px; }
.keyword-label .icon { font-size:14px; }
.keyword-input {
  width:100%; height:42px; padding:0 14px;
  background:var(--glass); border:1px solid var(--glass-bd);
  border-radius:10px; color:var(--text-1); font-size:14px; outline:none;
  box-sizing:border-box;
  transition:all .3s;
}
.keyword-input::placeholder { color:var(--text-3); }
.keyword-input:focus { border-color:var(--cyan); background:rgba(0,229,255,.04); }

/* Section */
.section { margin-top:32px; }
.section-label { font-size:11px; color:var(--cyan); letter-spacing:3px; font-weight:600; }
.section-title { font-size:18px; font-weight:700; margin-top:6px; }
.section-desc { font-size:12px; color:var(--text-2); margin-top:4px; }

/* Section Title Row */
.section-title-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:6px; }
.section-title-row .section-title { margin-top:0; }

/* Visibility Toggle */
.vis-toggle-wrap { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.vis-state { font-size:13px; font-weight:600; min-width:28px; text-align:center; transition:color .35s; }
.vis-state.public { color:var(--cyan); }
.vis-state.encrypted { color:var(--purple); }
.vis-toggle {
  position:relative; width:54px; height:28px; border-radius:100px; cursor:pointer; flex-shrink:0;
  background:rgba(0,229,255,.12); border:1px solid rgba(0,229,255,.3);
  transition:all .35s cubic-bezier(.16,1,.3,1);
}
.vis-toggle.encrypted { background:rgba(168,85,247,.15); border-color:rgba(168,85,247,.4); }
.vis-knob {
  position:absolute; top:2px; left:2px; width:22px; height:22px; border-radius:50%;
  background:linear-gradient(135deg,var(--cyan),var(--blue));
  box-shadow:0 0 10px rgba(0,229,255,.5);
  transition:all .35s cubic-bezier(.16,1,.3,1);
}
.vis-toggle.encrypted .vis-knob {
  left:28px; background:linear-gradient(135deg,var(--purple),var(--pink));
  box-shadow:0 0 10px rgba(168,85,247,.5);
}

/* Delivery Cards */
.delivery-list { display:flex; flex-direction:column; gap:12px; margin-top:16px; }
.delivery-card {
  position:relative; display:flex; align-items:center; gap:14px; padding:30px 16px 16px;
  background:var(--glass); border:2px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s cubic-bezier(.16,1,.3,1);
}
.delivery-card.selected { border-color:var(--cyan); background:rgba(0,229,255,.04); }
.delivery-card:active { transform:scale(.98); }
.delivery-icon { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:22px; flex-shrink:0; }
.delivery-info { flex:1; }
.delivery-name { font-size:15px; font-weight:600; }
.delivery-desc { font-size:12px; color:var(--text-2); margin-top:2px; }
.delivery-check {
  position:absolute; top:14px; right:14px; width:22px; height:22px;
  display:flex; align-items:center; justify-content:center; border-radius:50%;
  border:2px solid var(--glass-bd); background:var(--glass); transition:all .3s; font-size:12px;
}
.delivery-check.active { border-color:var(--cyan); background:var(--cyan); color:#000; }

/* Corner Ribbon (free / paid) */
.delivery-price,
.corner-ribbon {
  position:absolute; top:0; left:0; z-index:3;
  font-size:11px; font-weight:400; padding:4px 14px 4px 10px;
  background:linear-gradient(135deg,#2563eb 0%,#06b6d4 100%); color:#ffffff;
  border-top-left-radius:12px; border-bottom-right-radius:10px;
  letter-spacing:.3px; font-family:'SF Mono',monospace;
  box-shadow:0 2px 8px rgba(0,0,0,.25);
}
.delivery-price.free,
.corner-ribbon.free {
  background:rgba(7,193,96,.95); color:#ffffff;
}

/* Delivery Card - Unbreakable Vow */
.delivery-card-vow {
  border-color:rgba(255,107,157,.2);
  background:linear-gradient(135deg,rgba(255,107,157,.04),rgba(168,85,247,.04));
}
.delivery-card-vow.selected {
  border-color:var(--pink);
  background:rgba(255,107,157,.08);
  box-shadow:0 0 24px rgba(255,107,157,.15);
}
.delivery-card-vow.selected .delivery-check { border-color:var(--pink); background:var(--pink); color:#fff; }

/* Coordinate Popup */
.coord-popup-overlay {
  position:fixed; inset:0; z-index:99998;
  display:flex; align-items:flex-end; justify-content:center;
  animation:pageIn .3s ease;
}
.coord-popup-mask {
  position:absolute; inset:0;
  background:rgba(0,0,0,.65); backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}
.coord-popup {
  position:relative; z-index:1;
  width:100%; max-width:420px; max-height:85vh; overflow-y:auto;
  background:linear-gradient(180deg,var(--bg-mid) 0%,var(--bg-deep) 100%);
  border:1px solid var(--glass-bd); border-radius:24px 24px 0 0;
  padding:24px 20px calc(20px + env(safe-area-inset-bottom));
  animation:coordSlideUp .35s cubic-bezier(.16,1,.3,1);
}
@keyframes coordSlideUp {
  from { transform:translateY(100%); opacity:0; }
  to { transform:translateY(0); opacity:1; }
}
.coord-popup-header { display:flex; align-items:center; gap:12px; margin-bottom:4px; }
.coord-popup-icon {
  width:42px; height:42px; border-radius:12px; flex-shrink:0;
  background:linear-gradient(135deg,rgba(0,229,255,.12),rgba(18,183,245,.12));
  display:flex; align-items:center; justify-content:center; font-size:20px;
  border:1px solid rgba(0,229,255,.15);
}
.coord-popup-title { font-size:20px; font-weight:700; }
.coord-popup-sub { font-size:12px; color:var(--text-2); margin-top:2px; }
.coord-popup-close {
  margin-left:auto; width:32px; height:32px; border-radius:10px;
  border:1px solid var(--glass-bd); background:var(--glass);
  color:var(--text-2); font-size:16px; cursor:pointer; flex-shrink:0;
  transition:all .25s;
  display:flex; align-items:center; justify-content:center;
  line-height:1; padding:0;
}

/* Channel badge inside popup */
.coord-channel-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:6px 12px; border-radius:100px; font-size:12px; font-weight:600;
  margin:16px 0 4px;
}
.coord-channel-badge.mail { background:rgba(168,85,247,.1); color:var(--purple); }
.coord-channel-badge.qqmail { background:rgba(18,183,245,.1); color:var(--blue); }
.coord-channel-badge.sms { background:rgba(255,213,107,.1); color:var(--gold); }
.coord-channel-badge.unbreakable { background:rgba(255,107,157,.1); color:var(--pink); }

/* Saved coords picker */
.coord-saved-section { margin:16px 0 8px; }
.coord-saved-label { font-size:12px; font-weight:600; color:var(--text-2); margin-bottom:10px; display:flex; align-items:center; gap:4px; }
.coord-saved-list { display:flex; flex-wrap:wrap; gap:8px; }
.coord-saved-chip {
  display:flex; align-items:center; gap:6px; padding:8px 12px;
  border-radius:100px; border:1px solid var(--glass-bd); background:var(--glass);
  font-size:13px; cursor:pointer; transition:all .25s; max-width:100%;
}
.coord-saved-chip:active { border-color:var(--cyan); background:rgba(0,229,255,.06); }
.coord-saved-chip .chip-icon { font-size:15px; flex-shrink:0; }
.coord-saved-chip .chip-text { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; }
.coord-saved-empty { font-size:12px; color:var(--text-3); padding:10px 0; }

/* Coord popup fields */
.coord-popup-fields { display:flex; flex-direction:column; gap:14px; margin-top:16px; }
.coord-popup-field { display:flex; flex-direction:column; gap:6px; }
.coord-popup-field-label { font-size:12px; font-weight:600; color:var(--text-1); display:flex; align-items:center; gap:4px; }
.coord-popup-field .required { color:var(--pink); font-size:10px; }
.coord-popup-input {
  width:100%; height:44px; padding:0 14px; border-radius:12px;
  border:1px solid var(--glass-bd); background:rgba(0,0,0,.2);
  color:var(--text-1); font-size:14px; outline:none;
  box-sizing:border-box;
  transition:all .25s;
}
.coord-popup-input:focus { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,229,255,.1); }
.coord-popup-input::placeholder { color:var(--text-3); }
.coord-popup-input.unbreakable-focus:focus { border-color:var(--pink); box-shadow:0 0 0 3px rgba(255,107,157,.1); }

/* Extra contact row */
.coord-extra-row { display:flex; gap:8px; align-items:flex-start; }
.coord-extra-row .coord-popup-field { flex:1; }
.coord-extra-remove {
  width:40px; height:40px; border-radius:10px; border:1px solid var(--glass-bd);
  background:var(--glass); color:var(--text-3); font-size:15px; cursor:pointer;
  flex-shrink:0; margin-top:22px; transition:all .25s;
  display:flex; align-items:center; justify-content:center;
  line-height:1; padding:0;
}

.coord-add-extra {
  margin-top:4px; width:100%; padding:11px;
  border:1px dashed rgba(255,107,157,.3); border-radius:10px;
  background:transparent; color:var(--pink); font-size:13px; font-weight:600;
  cursor:pointer; transition:all .25s;
}
.coord-add-extra:active { transform:scale(.97); }

/* Confirm button */
.coord-confirm-btn {
  margin-top:20px; width:100%; padding:14px; border:none; border-radius:14px;
  background:linear-gradient(135deg,var(--cyan),var(--blue)); color:#fff;
  font-size:15px; font-weight:700; cursor:pointer; transition:all .25s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.coord-confirm-btn:active { transform:scale(.97); }
.coord-confirm-btn.unbreakable { background:linear-gradient(135deg,var(--pink),var(--purple)); }

/* Time Grid */
.time-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:16px; }
.time-card {
  display:flex; flex-direction:column; align-items:center; padding:16px 4px;
  background:var(--glass); border:2px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s;
}
.time-card.selected { border-color:var(--gold); background:rgba(255,213,107,.06); box-shadow:0 0 20px rgba(255,213,107,.1); }
.time-card:active { transform:scale(.95); }
.time-num { font-size:28px; font-weight:800; line-height:1; }
.time-num.grad { background:linear-gradient(135deg,var(--gold),var(--pink)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.time-unit { font-size:12px; color:var(--text-2); margin-top:4px; }
.time-date { font-size:10px; color:var(--text-3); margin-top:8px; padding-top:8px; border-top:1px solid var(--glass-bd); width:100%; text-align:center; }

/* Launch Button */
.launch-btn-wrap { margin-top:36px; text-align:center; padding-bottom:20px; }

/* Launch Only Toggle */
.launch-only-toggle {
  position:relative;
  display:flex; align-items:center; gap:12px; text-align:left;
  padding:30px 16px 14px; margin-top:32px; margin-bottom:8px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s cubic-bezier(.16,1,.3,1);
}
.launch-only-toggle.active {
  border-color:var(--gold);
  background:rgba(255,213,107,.06);
  box-shadow:0 0 20px rgba(255,213,107,.1);
}
.launch-only-toggle:active { transform:scale(.98); }
.lot-icon { font-size:20px; flex-shrink:0; }
.lot-text { flex:1; }
.lot-title { font-size:14px; font-weight:600; color:var(--text-1); }
.lot-desc { font-size:11px; color:var(--text-3); margin-top:2px; line-height:1.4; }
.launch-only-toggle.active .lot-title { color:var(--gold); }

.launch-btn {
  width:100%; max-width:320px; padding:16px; border:none; border-radius:100px;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  color:#fff; font-size:17px; font-weight:700; letter-spacing:1px; cursor:pointer;
  box-shadow:0 0 40px rgba(0,229,255,.35),0 0 80px rgba(168,85,247,.15);
  transition:all .3s; position:relative; overflow:hidden;
  line-height:1.4;
}
.launch-btn::after { border:none; }
.launch-btn:active { transform:scale(.97); }
.launch-ignite-bar {
  width:100%; max-width:320px; height:5px; margin:12px auto 0; border-radius:100px;
  background:rgba(255,255,255,.08); overflow:hidden;
}
.launch-ignite-fill {
  height:100%; width:0; border-radius:100px;
  background:linear-gradient(90deg,#ffb347,#ff5e3a,#ff2d00);
  box-shadow:0 0 12px rgba(255,90,0,.7);
  transition:width .05s linear;
}
.launch-hint { font-size:12px; color:var(--text-3); margin-top:12px; }

/* Launch Animation Overlay */
.launch-overlay {
  position:fixed; inset:0; z-index:9999; display:none;
  align-items:center; justify-content:center; flex-direction:column;
  background:radial-gradient(ellipse at center,rgba(10,10,36,.95) 0%,rgba(5,5,20,.98) 100%);
}
.launch-overlay.show { display:flex; }

.flying-letter {
  position:relative; width:220px; height:140px;
  background:linear-gradient(135deg,rgba(12,12,36,.95),rgba(20,20,50,.95));
  border:1px solid rgba(0,229,255,.3); border-radius:12px;
  box-shadow:0 0 40px rgba(0,229,255,.2);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:20px; transform:scale(1);
}
.flying-letter-icon { font-size:32px; margin-bottom:8px; }
.flying-letter-text { font-size:12px; color:var(--text-2); text-align:center; }

.flying-letter.stage-1 { animation:letterShrink .6s ease forwards; }
@keyframes letterShrink {
  0% { transform:scale(1); opacity:1; }
  100% { transform:scale(.3) translateY(-100px); opacity:.8; }
}
.flying-letter.stage-2 { animation:letterToStar .8s ease forwards; }
@keyframes letterToStar {
  0% { transform:scale(.3) translateY(-100px); opacity:.8; width:220px; height:140px; border-radius:12px; }
  50% { transform:scale(.15) translateY(-200px); opacity:1; width:40px; height:40px; border-radius:50%; box-shadow:0 0 60px rgba(0,229,255,.8); }
  100% { transform:scale(.1) translateY(-350px); opacity:1; width:20px; height:20px; border-radius:50%; box-shadow:0 0 80px rgba(255,213,107,.8),0 0 120px rgba(0,229,255,.4); background:var(--gold); }
}
.flying-letter.stage-3 { animation:starFly .8s ease forwards; }
@keyframes starFly {
  0% { transform:scale(.1) translateY(-350px); opacity:1; }
  100% { transform:scale(.05) translateY(-600px) translateX(50px); opacity:0; }
}

.launch-trail {
  position:absolute; width:4px; height:0;
  background:linear-gradient(to top,transparent,var(--cyan),var(--gold),transparent);
  border-radius:4px; opacity:0;
}
.launch-trail.active { animation:trailGrow 1.6s ease forwards; }
@keyframes trailGrow {
  0% { height:0; opacity:0; }
  20% { height:300px; opacity:1; }
  100% { height:500px; opacity:0; }
}

.launch-success { opacity:0; text-align:center; transition:opacity .5s .3s; }
.launch-success.show { opacity:1; }
.launch-success-star { font-size:48px; animation:starPulse 2s ease-in-out infinite; }
@keyframes starPulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 20px var(--gold))} 50%{transform:scale(1.2);filter:drop-shadow(0 0 40px var(--gold))} }
.launch-success-title { font-size:22px; font-weight:700; margin-top:16px; }
.launch-success-title .grad { background:linear-gradient(135deg,var(--cyan),var(--gold)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.launch-success-desc { font-size:13px; color:var(--text-2); margin-top:8px; max-width:280px; line-height:1.7; white-space:pre-line; }
.launch-success-info { display:flex; gap:20px; margin-top:24px; padding:16px 24px; background:var(--glass); border:1px solid var(--glass-bd); border-radius:12px; }
.launch-success-info-item { text-align:center; }
.launch-success-info-label { font-size:10px; color:var(--text-3); margin-bottom:4px; }
.launch-success-info-value { font-size:13px; font-weight:600; color:var(--cyan); }
.launch-success-btn { margin-top:28px; padding:12px 36px; background:var(--glass); border:1px solid var(--glass-bd); border-radius:100px; color:var(--text-1); font-size:14px; cursor:pointer; transition:all .3s; line-height:1.4; }
.launch-success-btn::after { border:none; }
.launch-success-btn:active { transform:scale(.95); }

/* Toast */
.toast {
  position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
  background:rgba(0,0,0,.85); color:#fff; padding:14px 24px; border-radius:14px;
  font-size:13px; line-height:1.7; z-index:99999; pointer-events:none;
  transition:opacity .3s; white-space:pre-line; text-align:center;
  max-width:80vw; border:1px solid rgba(255,255,255,.1);
}

@keyframes pageIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
</style>
