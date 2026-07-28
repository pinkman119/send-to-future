<template>
  <view class="earth-page">
    <star-sky />

    <!-- 顶部操作：信号箱 + 解码 -->
    <view class="earth-top-actions">
      <view class="earth-decode-trigger" @click="openDecode" hover-class="inbox-trigger-hover">
        <text class="inbox-trigger-icon">🔓</text>
      </view>
      <view class="earth-inbox-trigger" @click="openInbox" hover-class="inbox-trigger-hover">
        <text class="inbox-trigger-icon">📩</text>
        <text v-if="unreadCount > 0" class="inbox-trigger-badge">{{ unreadCount }}</text>
      </view>
    </view>

    <view class="earth-header">
      <view class="earth-avatar-wrap" hover-class="earth-avatar-hover" @click="openPlanetModal">
        <view class="earth-avatar-ring"></view>
        <view class="earth-avatar" :class="{ 'is-earth': currentPlanetId === 'earth' }">
          <image class="earth-avatar-img" :src="currentPlanetImg" mode="aspectFit" />
        </view>
        <view class="satellite-orbit">
          <view
            v-for="n in satelliteCount"
            :key="n"
            class="satellite"
            :style="{ transform: 'rotate(' + (360 / satelliteCount * (n - 1)) + 'deg)' }"
          >
            <view
              class="satellite-spin"
              :style="{ animationDuration: satDurations[n - 1], animationDelay: satDelays[n - 1] }"
              @click.stop="showSatelliteTip"
            >
              <view
                class="satellite-dot"
                :style="{
                  transform: 'translateX(' + satRadii[n - 1] + 'px)',
                  background: satelliteColors[n - 1],
                  borderColor: 'rgba(255,255,255,.55)',
                  boxShadow: '0 0 5px ' + satelliteColors[n - 1] + ', 0 0 10px ' + satelliteColors[n - 1]
                }"
              ></view>
            </view>
          </view>
        </view>
      </view>
      <view class="earth-name">
        <text class="grad">我的星球</text>
        <text class="earth-sat-tag" v-if="1 > 0" @click.stop="showSatelliteTip">🛰️ ×{{ satelliteCount + 1 }}</text>
      </view>
      <view class="earth-id">{{ userId }}</view>
    </view>

    <!-- Planet & Satellite selector -->
    <view class="planet-modal-overlay" v-if="showPlanetModal" :class="{ show: showPlanetModal }" @click="closePlanetModal">
      <view class="planet-modal" @click.stop>
        <view class="planet-modal-head">
          <view class="planet-modal-title">我的星球</view>
          <view class="planet-modal-close" @click="closePlanetModal">✕</view>
        </view>

        <view class="planet-modal-label">选择星球</view>
        <view class="planet-grid">
          <view
            v-for="p in planetOptions"
            :key="p.id"
            class="planet-opt"
            :class="{ active: currentPlanetId === p.id }"
            @click="selectPlanet(p.id)"
          >
            <image class="planet-opt-img" :src="p.img" mode="aspectFit" />
            <view class="planet-opt-name">{{ p.name }}</view>
            <view class="planet-opt-desc">{{ p.desc }}</view>
          </view>
        </view>

        <view class="planet-modal-label">星球颜色</view>
        <view class="palette-row">
          <view
            v-for="(pal, idx) in satPalettes"
            :key="idx"
            class="palette-opt"
            :class="{ active: currentPaletteIndex === idx }"
            @click="selectPalette(idx)"
          >
            <view class="palette-dots">
              <view
                v-for="(c, ci) in pal.colors"
                :key="ci"
                class="palette-dot"
                :style="{ background: c }"
              ></view>
            </view>
            <view class="palette-name">{{ pal.name }}</view>
          </view>
        </view>

        <view class="planet-modal-tip">收听数量越多则会获得更多的卫星</view>
      </view>
    </view>

    <!-- Sub-tab switcher -->
    <view class="earth-section">
      <view class="earth-stats">
        <view class="earth-listened" @click="openListeners" hover-class="earth-listened-hover">
          <text class="earth-listened-icon">📻</text>
          <text class="earth-listened-num">{{ listenersCount }}</text>
          <text class="earth-listened-label">人收听了你</text>
        </view>
        <view class="earth-listened" @click="openInbox" hover-class="earth-listened-hover">
          <text class="earth-listened-icon">✨</text>
          <text class="earth-listened-num">{{ litCount }}</text>
          <text class="earth-listened-label">次点亮</text>
        </view>
      </view>
      <view class="earth-subtabs">
        <view class="earth-subtab" :class="{ active: activeSubtab === 'sent' }" @click="switchSubtab('sent')">
          <text class="icon">🚀</text>
          <text>我寄出的</text>
          <text class="earth-subtab-count">{{ sentCount }}</text>
        </view>
        <view class="earth-subtab" :class="{ active: activeSubtab === 'liked' }" @click="switchSubtab('liked')">
          <text class="icon">✨</text>
          <text>寄给我的</text>
          <text class="earth-subtab-count">{{ receivedCount }}</text>
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
        <view v-for="letter in sentLetters" :key="letter.id" class="sent-card" @click="viewSentLetter(letter)">
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
            <view class="sent-status" :class="letter._isLaunchOnly ? 'launched' : (letter._isDelivered ? 'delivered' : 'traveling')">
              {{ letter._isLaunchOnly ? '🌟 已发射' : (letter._isDelivered ? '✓ 已送达' : '🛸 旅行中') }}
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

      <!-- Received List (寄给我的) -->
      <view class="earth-subtab-content" :class="{ active: activeSubtab === 'liked' }">
        <view v-if="receivedLetters.length === 0" class="earth-empty">
          <view class="earth-empty-icon">✨</view>
          <view class="earth-empty-text">还没有收到任何信件<br>等待穿越时空的星光抵达吧</view>
        </view>
        <view class="received-list">
          <view
            v-for="r in receivedLetters"
            :key="r.id"
            class="received-card"
            :class="{ locked: !r._unlocked }"
            @click="viewReceivedLetter(r)"
          >
            <view class="received-avatar" :class="{ locked: !r._unlocked }">{{ r.avatar || '🪐' }}</view>
            <view class="received-info">
              <view class="received-from">{{ r.planetId }}</view>
              <view v-if="r._unlocked" class="received-preview">{{ r._preview }}</view>
              <view v-else class="received-keyword">
                <text class="received-keyword-icon">🏷️</text>
                <text class="received-keyword-text">{{ r.keyword || '未标记主题' }}</text>
              </view>
              <view class="received-unlock-row">
                <text class="received-unlock-icon">{{ r._unlocked ? '🔓' : '⏳' }}</text>
                <text class="received-unlock-time">{{ r._unlockText }}</text>
              </view>
            </view>
            <view class="received-status" :class="r._unlocked ? 'unlocked' : 'sealed'">
              {{ r._unlocked ? '✓ 已解密' : '🔒 加密中' }}
            </view>
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
    <view class="coord-editor-overlay" v-if="showCoordEditor" @touchmove.stop.prevent="noop">
      <view class="coord-editor-mask" @click="cancelCoordEdit"></view>
      <view class="coord-editor-panel" @click.stop="noop" @touchmove.stop>
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
          type="text"
          v-model="coordInputVal"
          :placeholder="currentCoordPlaceholder"
          :adjust-position="true"
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

        <view class="modal-content" v-if="!modalLocked">{{ modalContent }}</view>
        <view class="modal-locked" v-else>
          <view class="modal-locked-icon">🔒</view>
          <view class="modal-locked-title">信件仍在旅途中</view>
          <view class="modal-locked-desc">这封信尚未送达，送达后才能在「我寄出的」中查看完整内容</view>
          <view class="modal-locked-progress">
            <view class="modal-locked-bar">
              <view class="modal-locked-fill" :style="{ width: (currentModalLetter ? currentModalLetter._percent : 0) + '%' }"></view>
            </view>
            <view class="modal-locked-percent">{{ currentModalLetter ? currentModalLetter._percent : 0 }}%</view>
          </view>
        </view>

        <view class="modal-like-bar" v-if="!modalIsMine">
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
        <view class="modal-like-bar" v-else-if="modalIsMine && !modalLocked">
          <view class="modal-like-count" @click="openLitList">
            <view class="modal-like-num" :class="{ lit: isModalLit }">{{ modalLikeNum }}</view>
            <view class="modal-like-label">人点亮了这封信 · 点击查看</view>
          </view>
          <view class="modal-footer" style="margin:0;">
            <button class="modal-btn close" @click="closeModal">关闭</button>
            <button class="modal-btn light" :class="{ lit: isModalLit }" @click="toggleLight">
              {{ isModalLit ? '✨ 已点亮' : '💡 点亮' }}
            </button>
          </view>
        </view>
        <view class="modal-footer" v-else style="margin-top:18px;">
          <button class="modal-btn close" @click="closeModal">关闭</button>
        </view>
      </view>
    </view>

    <!-- Listeners Popup -->
    <view class="atlas-modal-overlay" v-if="showListeners" :class="{ show: showListeners }" @click="closeListeners">
      <view class="atlas-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">收听我的人</view>
          <view class="inbox-modal-close" @click="closeListeners">✕</view>
        </view>

        <view v-if="listeners.length === 0" class="listen-empty">
          <view class="listen-empty-icon">📻</view>
          <view class="listen-empty-text">还没有人收听你<br>去"星系"页分享你的星频，吸引旅人吧</view>
        </view>

        <scroll-view v-else scroll-y class="inbox-scroll">
          <view v-for="l in listeners" :key="l.id" class="atlas-card">
            <view class="atlas-avatar">{{ l.avatar }}</view>
            <view class="atlas-info">
              <view class="atlas-name">{{ l.from }}</view>
              <view class="atlas-planet">{{ l.planetId }}</view>
              <view class="atlas-time">收听于 {{ l.time }}</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 信号箱 Popup (moved from 信号 page) -->
    <view class="inbox-modal-overlay" v-if="showInbox" :class="{ show: showInbox }" @click="closeInbox">
      <view class="inbox-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">信号箱</view>
          <view class="inbox-modal-close" @click="closeInbox">✕</view>
        </view>

        <view v-if="inboxItems.length === 0" class="listen-empty">
          <view class="listen-empty-icon">📻</view>
          <view class="listen-empty-text">暂无消息<br>当有人收听你或点亮你的信时，会推送到这里</view>
        </view>

        <scroll-view v-else scroll-y class="inbox-scroll">
          <view
            v-for="item in inboxItems"
            :key="item.id"
            class="inbox-card"
            :class="{ unread: !item.read, read: item.read }"
            @click="markInboxRead(item)"
          >
            <view class="inbox-avatar">{{ item.avatar }}</view>
            <view class="inbox-info">
              <view class="inbox-from">
                <text class="inbox-from-name">{{ item.from }}</text>
                <text v-if="!item.read" class="inbox-new-badge">NEW</text>
              </view>
              <view class="inbox-action-text" :class="item.actionClass">{{ item.actionText }}</view>
              <view class="inbox-meta">
                <text class="inbox-time">{{ item.time }}</text>
                <text class="inbox-type-tag" :class="item.typeClass">{{ item.typeLabel }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 解码 Popup -->
    <view class="decode-modal-overlay" v-if="showDecode" :class="{ show: showDecode }" @click="closeDecode">
      <view class="decode-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">解码</view>
          <view class="inbox-modal-close" @click="closeDecode">✕</view>
        </view>

        <view class="decode-body" v-if="!decodedLetter">
          <view class="decode-hint">输入或粘贴一串代码，解码一封跨越星海的信件</view>
          <textarea class="decode-input" v-model="decodeInput" placeholder="在此输入代码，例如 L06、EARTH-8841 …" :maxlength="200" auto-height />
          <view class="decode-tools">
            <view class="decode-paste" @click="pasteCode">📋 粘贴</view>
          </view>
          <button class="decode-btn" @click="decodeLetter">解码</button>
        </view>

        <view class="decode-body" v-else>
          <view class="decode-result-head">
            <text class="decode-result-title">{{ decodedLetter.title }}</text>
            <text class="decode-result-planet">{{ decodedLetter.planetId }}</text>
          </view>

          <view v-if="decodedLetter.locked" class="decode-locked">
            <view class="decode-locked-icon">🔒</view>
            <view class="decode-locked-text">这封信尚未抵达解封日期</view>
            <view class="decode-locked-date">预计解封：{{ decodedLetter.unlockDateText }}</view>
            <view class="decode-garble">{{ decodedLetter.garbled }}</view>
          </view>

          <view v-else class="decode-content">
            <view class="decode-content-text">{{ decodedLetter.content }}</view>
          </view>

          <button class="decode-btn decode-btn-ghost" @click="resetDecode">再解一封</button>
        </view>
      </view>
    </view>

    <!-- 点亮列表 Popup -->
    <view class="atlas-modal-overlay" v-if="showLitList" :class="{ show: showLitList }" @click="closeLitList">
      <view class="atlas-modal" @click.stop>
        <view class="inbox-modal-head">
          <view class="inbox-modal-title">点亮这封信的人</view>
          <view class="inbox-modal-close" @click="closeLitList">✕</view>
        </view>

        <view v-if="litList.length === 0" class="listen-empty">
          <view class="listen-empty-icon">✨</view>
          <view class="listen-empty-text">还没有人点亮这封信<br>点亮它，让更多星光看见</view>
        </view>

        <scroll-view v-else scroll-y class="inbox-scroll">
          <view v-for="(u, idx) in litList" :key="idx" class="atlas-card">
            <view class="atlas-avatar">{{ u.avatar }}</view>
            <view class="atlas-info">
              <view class="atlas-name">{{ u.planetId === userId ? '我（来自 ' + userId + '）' : '一位旅人' }}</view>
              <view class="atlas-planet">{{ u.planetId }}</view>
              <view class="atlas-time">点亮于 {{ u.time }}</view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import marsImg from '@/img/火星.png';
import venusImg from '@/img/金星.png';
import moonImg from '@/img/月球.png';
import saturnImg from '@/img/土星.png';
import uranusImg from '@/img/天王星.png';
import neptuneImg from '@/img/海王星.png';
import plutoImg from '@/img/冥王星.png';
import { get, post, put, del } from '@/uni-app/utils/request.js';
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
 * 根据种子字符串生成稳定的星球编号（EARTH-xxxxx）。
 * @param {string|number} seed - 用于生成编号的种子
 * @returns {string} 形如「EARTH-12345」的星球编号
 */
function genPlanetCode(seed) {
  let h = 0;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 'EARTH-' + String(h % 100000).padStart(5, '0');
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

const planetLitAvatars = ['🪐','🌕','🌖','🌗','🌘','☄️','🌠','🌟','⭐','🌌','🛸','👾','🛰️','🌝','🌚'];
const planetLitNames = ['MARS','LUNA','VENUS','JUPITER','SATURN','NEPTUNE','PLUTO','CERES','ORION','ANDROMEDA','POLARIS','VEGA','SIRIUS','ALTAIR'];

const PLANET_IMAGES = {
  mars: marsImg,
  venus: venusImg,
  moon: moonImg,
  saturn: saturnImg,
  uranus: uranusImg,
  neptune: neptuneImg,
  pluto: plutoImg,
};
/**
 * 随机生成一个演示用的星球编号。
 * @returns {string} 形如「MARS-12345」的星球编号
 */
function randPlanetId() {
  const n = planetLitNames[Math.floor(Math.random() * planetLitNames.length)];
  return n + '-' + String(Math.floor(Math.random() * 90000) + 10000);
}
/**
 * 生成指定数量的演示点赞用户列表。
 * @param {number} count - 需要生成的用户数量
 * @returns {Array<object>} 点赞用户数组
 */
function genDemoLitUsers(count) {
  const list = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    const d = new Date(now - Math.floor(Math.random() * 150) * dayMs - Math.floor(Math.random() * dayMs));
    list.push({
      avatar: planetLitAvatars[Math.floor(Math.random() * planetLitAvatars.length)],
      planetId: randPlanetId(),
      time: formatDate(d),
    });
  }
  return list;
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

/**
 * 对字符串做简单的 31 进制哈希，用于生成稳定的伪随机值。
 * @param {string} str - 待哈希的字符串
 * @returns {number} 无符号整型哈希值
 */
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}
/**
 * 将文本字符替换为随机的乱码符号（空格与换行保留），用于加密预览。
 * @param {string} text - 原始文本
 * @returns {string} 乱码化后的字符串
 */
function garble(text) {
  if (!text) return '';
  const pool = '█▓▒░✦✧⚡☄★☆♺♻⍰⍾⧫⬡◈⟁⌗▦▩⍢⍣⍤⍥⍨◇◆▢▣§¶†‡';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ' || ch === '\n') { out += ch; continue; }
    out += pool[Math.floor(Math.random() * pool.length)];
  }
  return out;
}

export default {
  /**
   * 组件的响应式数据。
   * @returns {object} 包含用户信息、各子标签页数据、弹窗状态及模态框数据的数据对象
   */
  data() {
    return {
      userId: '',
      listenersCount: 0,
      listeners: [],
      showListeners: false,
      showInbox: false,
      inboxItems: [],
      showDecode: false,
      decodeInput: '',
      decodedLetter: null,
      satDurations: ['12s', '21s', '30s', '16s', '25s'],
      satDelays: ['0s', '-5s', '-12s', '-3s', '-9s'],
      satRadii: [50, 60, 70, 80, 90],
      planetOptions: [
        { id: 'mars', name: '火星', img: PLANET_IMAGES.mars, desc: '红色行星' },
        { id: 'venus', name: '金星', img: PLANET_IMAGES.venus, desc: '启明星' },
        { id: 'moon', name: '月球', img: PLANET_IMAGES.moon, desc: '地球的卫星' },
        { id: 'saturn', name: '土星', img: PLANET_IMAGES.saturn, desc: '带光环' },
        { id: 'uranus', name: '天王星', img: PLANET_IMAGES.uranus, desc: '侧躺自转' },
        { id: 'neptune', name: '海王星', img: PLANET_IMAGES.neptune, desc: '深蓝远星' },
        { id: 'pluto', name: '冥王星', img: PLANET_IMAGES.pluto, desc: '矮行星' },
      ],
      currentPlanetId: 'mars',
      currentPaletteIndex: 0,
      showPlanetModal: false,
      activeSubtab: 'sent',
      sentLetters: [],
      likedLetters: [],
      receivedLetters: [],
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
      modalIsMine: false,
      modalLocked: false,
      litList: [],
      showLitList: false,
    };
  },
  computed: {
    /**
     * 我寄出的信件数量。
     * @returns {number} 寄出信件数
     */
    sentCount() { return this.sentLetters.length; },
    /**
     * 我寄出信件累计被点亮的总次数。
     * @returns {number} 总点亮次数
     */
    litCount() {
      return (this.sentLetters || []).reduce((sum, l) => sum + (Number(l.likes) || 0), 0);
    },
    /**
     * 我点过赞的信件数量。
     * @returns {number} 点赞信件数
     */
    likedCount() {
      const app = getApp();
      const liked = app.globalData.likedLetterIds || new Set();
      return liked.size;
    },
    /**
     * 寄给我的信件数量。
     * @returns {number} 收到的信件数
     */
    receivedCount() { return this.receivedLetters.length; },
    /**
     * 已保存的联络坐标数量。
     * @returns {number} 坐标数量
     */
    coordsCount() { return this.myCoords.length; },
    /**
     * 信号箱中未读消息数量。
     * @returns {number} 未读数
     */
    unreadCount() { return this.inboxItems.filter(i => !i.read).length; },
    /**
     * 根据收听者数量计算环绕的卫星数量（1~5 颗）。
     * @returns {number} 卫星数量
     */
    satelliteCount() {
      return Math.min(5, Math.max(1, this.listenersCount));
    },

    /**
     * 当前选中星球对应的图片。
     * @returns {string} 星球图片路径
     */
    currentPlanetImg() {
      const p = this.planetOptions.find(o => o.id === this.currentPlanetId);
      return p ? p.img : PLANET_IMAGES.mars;
    },
    /**
     * 当前可用的星球调色板列表。
     * @returns {Array<object>} 调色板数组
     */
    satPalettes() {
      const app = getApp();
      return (app.globalData && app.globalData.satPalettes) || [];
    },
    /**
     * 根据当前调色板索引取颜色数组。
     * @returns {Array<string>} 颜色数组
     */
    satelliteColors() {
      const pal = this.satPalettes[this.currentPaletteIndex];
      return pal ? pal.colors : ['#00e5ff', '#a855f7', '#4facfe', '#ff6b9d', '#4ade80'];
    },
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
     * 空操作占位函数（用于阻止弹窗冒泡穿透）。
     */
    noop() {},
    /**
     * 提示卫星数量随收听者数量增加的规则。
     */
    showSatelliteTip() {
      uni.showToast({ title: '卫星数量会随收听者数量而增加', icon: 'none', duration: 2000 });
    },
    /**
     * 打开「我的星球」选择弹窗。
     */
    openPlanetModal() {
      this.showPlanetModal = true;
    },
    /**
     * 关闭「我的星球」选择弹窗。
     */
    closePlanetModal() {
      this.showPlanetModal = false;
    },
    /**
     * 选择星球并同步到全局状态与底部 tab 图标。
     * @param {string} id - 星球标识
     */
    selectPlanet(id) {
      this.currentPlanetId = id;
      const app = getApp();
      app.globalData.myPlanet = id;
      app.globalData.saveState();
      this.syncPlanetToTab();
    },
    /**
     * 将当前星球图片同步到全局状态并广播给底部 tab 栏。
     */
    syncPlanetToTab() {
      const app = getApp();
      const img = this.currentPlanetImg;
      if (app.globalData) app.globalData.myPlanetImg = img;
      uni.$emit('planet-change', img);
    },
    /**
     * 选择星球调色板并广播调色板变化事件。
     * @param {number} idx - 调色板索引
     */
    selectPalette(idx) {
      this.currentPaletteIndex = idx;
      const app = getApp();
      app.globalData.satPalette = idx;
      app.globalData.saveState();
      uni.$emit('palette-change', idx);
    },
    /**
     * 渲染页面：整合收听者、信号箱、寄出/收到/点赞信件与坐标等全部数据。
     */
    async renderPage() {
      const app = getApp();

      // 收听者数量（被他人收听）直接决定卫星数量：1 位收听者 = 1 颗卫星，最多 5 颗
      let listeners = app.globalData.myListenersCount;
      if (!listeners) {
        listeners = Math.floor(Math.random() * 5) + 1;
        app.globalData.myListenersCount = listeners;
        app.globalData.saveState();
      }
      this.listenersCount = listeners;
      const savedPlanet = app.globalData.myPlanet;
      if (this.planetOptions.some(p => p.id === savedPlanet)) {
        this.currentPlanetId = savedPlanet;
      } else {
        this.currentPlanetId = this.planetOptions[0].id;
        if (app.globalData) app.globalData.myPlanet = this.currentPlanetId;
      }
      this.syncPlanetToTab();

      // 信号箱 demo 数据（收听者 + 点亮者），仅首次初始化
      let inbox = app.globalData.inboxItems || [];
      if (inbox.length === 0) {
        const now3 = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const dAgo = (n) => formatDate(new Date(now3 - n * dayMs));
        inbox = [
          { id: 'INB-1', letterId: 'L01', type: 'newListener', from: '一位北漂旅人', avatar: '🧑‍🚀', planetId: 'EARTH-12138', time: dAgo(2), read: false },
          { id: 'INB-2', letterId: 'L06', type: 'newLit', from: '一位勇敢的人', avatar: '🧙‍♀️', planetId: 'EARTH-88521', time: dAgo(5), read: false },
          { id: 'INB-3', letterId: 'L03', type: 'newListener', from: '一位创业者', avatar: '🧑‍💼', planetId: 'EARTH-30467', time: dAgo(9), read: true },
          { id: 'INB-4', letterId: 'L11', type: 'newLit', from: '一位妻子', avatar: '👩‍💼', planetId: 'EARTH-55210', time: dAgo(14), read: true },
        ];
        app.globalData.inboxItems = inbox;
        app.globalData.saveState();
      } else if (!inbox.some(i => i.type === 'newLit')) {
        // 已有数据但缺少「点亮者」消息，补一条未读的点亮消息，方便查看交互
        const now4 = Date.now();
        inbox.unshift({
          id: 'INB-LIT-' + now4,
          letterId: 'L06',
          type: 'newLit',
          from: '一位深夜的陌生人',
          avatar: '🌟',
          planetId: 'EARTH-' + Math.floor(Math.random() * 90000 + 10000),
          time: formatDate(new Date(now4)),
          read: false,
        });
        app.globalData.inboxItems = inbox;
        app.globalData.saveState();
      }

      // Listeners (people who subscribed to this user) — 被收听
      this.listeners = inbox
        .filter(i => i.type === 'newListener')
        .map(i => {
          const letter = sampleLetters.find(l => l.id === i.letterId) || {};
          return {
            id: i.id,
            planetId: i.planetId || genPlanetCode(i.id),
            from: i.from || letter.from || '匿名旅人',
            avatar: i.avatar || letter.avatar || '🌙',
            text: i.text || letter.content || '',
            time: i.time || formatDate(new Date()),
          };
        });
      this.currentPaletteIndex = (typeof app.globalData.satPalette === 'number') ? app.globalData.satPalette : 0;

      // 信号箱 items（从「信号」页迁移过来）
      this.inboxItems = inbox.map(item => {
        const letter = sampleLetters.find(l => l.id === item.letterId) || {};
        const preview = letter.content
          ? letter.content.replace(/\n/g, ' ').substring(0, 60) + '...'
          : item.preview || '新信件信号';
        const isListener = item.type === 'newListener';
        const isLit = item.type === 'newLit';
        const letterName = letter.asteroid || letter.from || '一封信';
        const actionText = letter.from
          ? (isListener ? '收听了你的信 · ' + letterName
            : isLit ? '点亮了你的信 · ' + letterName
            : '')
          : '';
        return {
          id: item.id,
          letterId: item.letterId || letter.id,
          avatar: item.avatar || letter.avatar || '🌙',
          from: item.from || letter.from || '一位旅人',
          actionText: actionText,
          preview: preview,
          time: item.time || formatDate(new Date()),
          read: item.read || false,
          actionClass: isLit ? 'action-lit' : '',
          typeClass: isListener ? 'tag-listen' : (isLit ? 'tag-lit' : 'tag-letter'),
          typeLabel: isListener ? '有人收听了你' : (isLit ? '有人点亮了你的信' : '新信件推送'),
        };
      });

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
        const demoLight = { DEMO1: 9, DEMO2: 4, DEMO3: 1, DEMO4: 18 };
        sent.forEach(s => {
          if (typeof s.likes !== 'number') {
            s.likes = demoLight[s.id] || 0;
            s.litUsers = genDemoLitUsers(s.likes);
          }
        });
        app.globalData.mySentLetters = sent;
        app.globalData.saveState();
      }

      const now = Date.now();
      let litMigrated = false;
      this.sentLetters = sent.map(l => {
        if (typeof l.likes !== 'number') { l.likes = 0; litMigrated = true; }
        if (!Array.isArray(l.litUsers)) {
          l.litUsers = genDemoLitUsers(Math.floor(Math.random() * 8));
          l.likes = l.litUsers.length;
          litMigrated = true;
        }
        const hasDelivery = !!l.deliveryTimestamp;
        const isDelivered = hasDelivery ? now >= l.deliveryTimestamp : false;
        const totalDuration = hasDelivery ? l.deliveryTimestamp - l.sentTimestamp : 0;
        const elapsed = hasDelivery ? now - l.sentTimestamp : 0;
        const percent = hasDelivery ? (isDelivered ? 100 : Math.min(99.9, Math.max(0, (elapsed / totalDuration) * 100))) : 100;
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
          _isLaunchOnly: !hasDelivery,
          _percent: percent.toFixed(1),
          _preview: preview,
          _blocks: blocks,
          _channelName: channelNames[l.channel] || (l.channel === 'launch' ? '仅发射' : l.channel),
          _progressTime: hasDelivery
            ? (isDelivered ? `已于 ${l.deliveryDate} 送达` : `预计 ${l.deliveryDate} 送达 · 还剩 ${getDateDiff(new Date(l.deliveryTimestamp))}`)
            : '收藏于星海 · 不推送',
          _contactsSummary: contactsSummary,
        };
      });
      if (litMigrated) { app.globalData.mySentLetters = sent; app.globalData.saveState(); }

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

      // Received letters (别人寄给我的信，需到解密时间才能查看)
      let received = app.globalData.receivedLetters || [];
      if (received.length === 0) {
        const now2 = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        received = [
          { id: 'R01', planetId: 'EARTH-12138', avatar: '🪐', keyword: '时光的约定', sentTimestamp: now2 - 90 * dayMs, unlockTimestamp: now2 - 3 * dayMs, content: '嘿，收到这封信的你：\n\n还记得三个月前的那个约定吗？我说过要成为更好的人。\n\n如果你正在读这封信，说明时间到了。希望此刻的你，正如我期待的那样闪闪发光。' },
          { id: 'R02', planetId: 'EARTH-88521', avatar: '🌕', keyword: '封存的心意', sentTimestamp: now2 - 10 * dayMs, unlockTimestamp: now2 + 45 * dayMs, content: '给未来的你：\n\n这封信被我封存了很久，只有当星光穿越了足够的距离，它才会抵达你手中。\n\n愿那时的你，已经放下了现在的焦虑。' },
          { id: 'R03', planetId: 'EARTH-30467', avatar: '🔴', keyword: '写给一年后的你', sentTimestamp: now2 - 30 * dayMs, unlockTimestamp: now2 + 300 * dayMs, content: '写给一年后的你：\n\n此刻我不知道你会变成什么样子，但我把这份心意交给了时间。\n\n请一定要幸福。' },
          { id: 'R04', planetId: 'EARTH-55210', avatar: '🌏', keyword: '为你而亮的星', sentTimestamp: now2 - 200 * dayMs, unlockTimestamp: now2 - 40 * dayMs, content: '亲爱的你：\n\n当你读到这封信时，我们之间已经隔了很长的时光。\n\n谢谢你一直没有放弃，谢谢你走到了这里。这颗星，为你而亮。' },
        ];
        app.globalData.receivedLetters = received;
        app.globalData.saveState();
      }
      this.receivedLetters = received.map(r => {
        const unlocked = now >= r.unlockTimestamp;
        return {
          ...r,
          _unlocked: unlocked,
          _preview: r.content.replace(/\n/g, ' ').substring(0, 40) + (r.content.length > 40 ? '...' : ''),
          _unlockText: unlocked
            ? `已于 ${formatDate(new Date(r.unlockTimestamp))} 解密`
            : `${formatDate(new Date(r.unlockTimestamp))} 解密`,
        };
      });

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
     * 切换当前的子标签页（寄出/寄给我的/坐标）。
     * @param {string} tab - 子标签标识
     */
    switchSubtab(tab) {
      this.activeSubtab = tab;
    },
    /**
     * 打开「收听我的人」列表弹窗。
     */
    openListeners() {
      this.showListeners = true;
    },
    /**
     * 关闭「收听我的人」列表弹窗。
     */
    closeListeners() {
      this.showListeners = false;
    },
    /**
     * 打开信号箱弹窗。
     */
    openInbox() {
      this.showInbox = true;
    },
    /**
     * 关闭信号箱弹窗。
     */
    closeInbox() {
      this.showInbox = false;
    },
    /**
     * 打开解码弹窗。
     */
    openDecode() {
      this.showDecode = true;
    },
    /**
     * 关闭解码弹窗。
     */
    closeDecode() {
      this.showDecode = false;
    },
    /**
     * 从剪贴板粘贴解码代码到输入框。
     */
    pasteCode() {
      const that = this;
      uni.getClipboardData({
        success(res) { that.decodeInput = res.data || ''; },
        fail() { uni.showToast({ title: '粘贴失败，请手动输入', icon: 'none' }); }
      });
    },
    /**
     * 根据输入或粘贴的代码解码一封星际信件，并处理加锁/解锁逻辑。
     */
    decodeLetter() {
      const raw = (this.decodeInput || '').trim();
      if (!raw) {
        uni.showToast({ title: '请先输入或粘贴一串代码', icon: 'none' });
        return;
      }
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const upper = raw.toUpperCase();
      const idx = sampleLetters.findIndex(l => l.id.toUpperCase() === upper);
      let title, planetId, content, unlockTs;
      if (idx >= 0) {
        const hit = sampleLetters[idx];
        title = hit.from;
        planetId = 'EARTH-' + (10000 + (hashStr(hit.id) % 90000));
        content = hit.content;
        const offsets = [-30, 5, -90, 12, -3, 45, -15, 200, -120, 8, 60, -7, 30, -10, 90];
        unlockTs = now + offsets[idx % offsets.length] * dayMs;
      } else {
        const seed = hashStr(raw);
        const planets = ['EARTH', 'MARS', 'LUNA', 'VENUS', 'JUPITER', 'SATURN', 'NEPTUNE', 'PLUTO', 'CERES', 'ORION', 'ANDROMEDA', 'POLARIS'];
        planetId = planets[seed % planets.length] + '-' + (10000 + (seed % 90000));
        title = '来自星海的信 · ' + raw.slice(0, 8);
        content = '这是用代码「' + raw + '」解码出的一封星际信件。\n\n在宇宙的另一头，有人把心事折进光里，跨越星海抵达你的星球。愿你读到的每一句话，都被温柔以待。';
        const offsetDays = (seed % 66) - 25;
        unlockTs = now + offsetDays * dayMs;
      }
      const locked = now < unlockTs;
      this.decodedLetter = {
        code: raw,
        title,
        planetId,
        content,
        unlockTs,
        unlockDateText: formatDate(new Date(unlockTs)),
        locked,
        garbled: garble(content),
      };
    },
    /**
     * 重置解码结果，清空输入框以便再解一封。
     */
    resetDecode() {
      this.decodedLetter = null;
      this.decodeInput = '';
    },
    /**
     * 将信号箱某条消息标记为已读并同步全局状态。
     * @param {object} item - 信号箱消息对象
     */
    markInboxRead(item) {
      if (item.read) return;
      item.read = true;
      const app = getApp();
      const inbox = app.globalData.inboxItems || [];
      const entry = inbox.find(i => i.id === item.id);
      if (entry && !entry.read) {
        entry.read = true;
        app.globalData.saveState();
      }
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
     * 打开「我点赞的信件」详情弹窗并填充数据。
     * @param {object} l - 点赞的信件对象
     */
    viewLikedLetter(l) {
      const app = getApp();
      const likedSet = app.globalData.likedLetterIds || new Set();
      this.currentModalLetter = l;
      this.modalIsMine = false;
      this.modalLocked = false;
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
     * 打开「我寄出的信」详情弹窗，按送达/锁定状态填充内容。
     * @param {object} l - 寄出的信件对象
     */
    viewSentLetter(l) {
      this.currentModalLetter = l;
      this.modalIsMine = true;
      this.modalLocked = !l._isDelivered;
      this.modalAvatar = '🌍';
      this.modalFrom = '我寄出的信';
      this.modalAsteroid = l.keyword ? '主题 · ' + l.keyword : '未标记主题';
      this.modalStar = '✉️';
      this.modalDate = (l.sentDate || '') + ' 寄出';
      this.isModalLit = !!(l.litUsers && l.litUsers.some(u => u.planetId === this.userId));
      this.modalLikeNum = formatLikeCount(l.likes || 0);
      if (l._isDelivered) {
        this.modalContent = l.content;
        this.modalSignalText = '✓ 已送达';
        this.modalSignalClass = 'delivered';
      } else {
        this.modalContent = '';
        this.modalSignalText = l._isLaunchOnly ? '🌟 已发射' : '🛸 旅行中';
        this.modalSignalClass = l._isLaunchOnly ? 'launched' : 'traveling';
      }
      this.showModal = true;
    },
    /**
     * 查看寄给我的信件：未解密时震动提示，已解密则填充弹窗数据。
     * @param {object} r - 收到的信件对象
     */
    viewReceivedLetter(r) {
      // 未到解密时间：震动并提示，无法查看内容
      if (!r._unlocked) {
        uni.vibrateShort({ fail: () => {} });
        uni.showToast({ title: '信件正在穿越时空来寻找你', icon: 'none', duration: 2000 });
        return;
      }
      // 已解密：查看信件内容
      this.currentModalLetter = r;
      this.modalIsMine = true;
      this.modalLocked = false;
      this.modalAvatar = r.avatar || '🪐';
      this.modalFrom = '来自 ' + r.planetId;
      this.modalAsteroid = r._unlockText;
      this.modalStar = '💌';
      this.modalDate = (r.sentTimestamp ? formatDate(new Date(r.sentTimestamp)) : '') + ' 寄出';
      this.modalContent = r.content;
      this.modalSignalText = '✓ 已解密';
      this.modalSignalClass = 'delivered';
      this.isModalLit = false;
      this.modalLikeNum = '';
      this.showModal = true;
    },
    /**
     * 关闭信件详情弹窗。
     */
    closeModal() { this.showModal = false; },
    /**
     * 切换当前信件的「点亮」状态，并区分自己/他人信件的存储逻辑。
     */
    toggleLight() {
      if (!this.currentModalLetter) return;
      const app = getApp();
      const letter = this.currentModalLetter;
      if (this.modalIsMine) {
        if (!letter.litUsers) letter.litUsers = [];
        const idx = letter.litUsers.findIndex(u => u.planetId === this.userId);
        if (idx === -1) {
          letter.litUsers.push({ avatar: '🌍', planetId: this.userId, time: formatDate(new Date()) });
          letter.likes = (letter.likes || 0) + 1;
          this.isModalLit = true;
          this.modalLikeNum = formatLikeCount(letter.likes);
          uni.showToast({ title: '已点亮 ⭐', icon: 'none', duration: 1500 });
        } else {
          letter.litUsers.splice(idx, 1);
          letter.likes = Math.max(0, (letter.likes || 0) - 1);
          this.isModalLit = false;
          this.modalLikeNum = formatLikeCount(letter.likes);
          uni.showToast({ title: '已取消点亮', icon: 'none', duration: 1500 });
        }
        const src = (app.globalData.mySentLetters || []).find(x => x.id === letter.id);
        if (src) { src.litUsers = letter.litUsers; src.likes = letter.likes; }
      } else {
        if (!app.globalData.likedLetterIds) app.globalData.likedLetterIds = new Set();
        const likedSet = app.globalData.likedLetterIds;
        const id = letter.id;
        if (!likedSet.has(id)) {
          likedSet.add(id);
          letter.likes++;
          this.isModalLit = true;
          this.modalLikeNum = formatLikeCount(letter.likes);
          uni.showToast({ title: '已点亮 ⭐', icon: 'none', duration: 1500 });
        } else {
          likedSet.delete(id);
          letter.likes = Math.max(0, letter.likes - 1);
          this.isModalLit = false;
          this.modalLikeNum = formatLikeCount(letter.likes);
          uni.showToast({ title: '已取消点亮', icon: 'none', duration: 1500 });
        }
      }
      app.globalData.saveState();
      this.renderPage();
    },
    /**
     * 打开当前信件的点亮者列表弹窗。
     */
    openLitList() {
      this.litList = (this.currentModalLetter && this.currentModalLetter.litUsers)
        ? this.currentModalLetter.litUsers.slice()
        : [];
      this.showLitList = true;
    },
    /**
     * 关闭点亮者列表弹窗。
     */
    closeLitList() {
      this.showLitList = false;
    },
  },
};
</script>

<style>
/* ===== Earth Page ===== */
.earth-page { padding:0 20px 90px; min-height:100vh; position:relative; z-index:1; }
.earth-header { text-align:center; padding:56px 0 24px; }
.earth-avatar-wrap {
  position:relative; width:80px; height:80px; margin:0 auto 14px;
}
.earth-avatar {
  width:80px; height:80px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  background:transparent;
  border:2px solid rgba(0,229,255,.2);
  box-shadow:0 0 30px rgba(0,229,255,.15);
}
.earth-avatar-img { width:67px; height:67px; display:block; }
.earth-avatar.is-earth .earth-avatar-img { width:10px; height:10px; }
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
.earth-avatar-wrap { cursor:pointer; }
.earth-avatar-hover { transform:scale(.97); transition:transform .2s; }
/* Orbiting satellites */
.satellite-orbit {
  position:absolute; top:50%; left:50%; width:0; height:0;
  pointer-events:none; transform-origin:center;
}
.satellite {
  position:absolute; top:0; left:0;
  pointer-events:auto;
}
.satellite-spin {
  animation-name:satSpin;
  animation-timing-function:linear;
  animation-iteration-count:infinite;
  transform-origin:0 0;
}
.satellite-dot {
  width:6px; height:6px; border-radius:50%;
  margin:-3px 0 0 -3px;
  border:1px solid rgba(255,255,255,.55);
}
@keyframes satSpin { to { transform:rotate(360deg); } }
.earth-sat-tag {
  font-size:12px; font-weight:600; color:var(--cyan);
  margin-left:8px; cursor:pointer; vertical-align:middle; opacity:.85;
}
.earth-sat-tag:active { opacity:1; }

/* Planet & Satellite selector modal */
.planet-modal-overlay {
  position:fixed; inset:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px;
  background:rgba(5,5,20,.85); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  opacity:0; transition:opacity .3s;
}
.planet-modal-overlay.show { opacity:1; }
.planet-modal {
  width:100%; max-width:380px;
  background:linear-gradient(135deg,rgba(12,12,36,.97),rgba(20,20,50,.97));
  border:1px solid rgba(0,229,255,.2); border-radius:24px;
  box-shadow:0 0 60px rgba(0,229,255,.15); padding:24px;
  animation:pageIn .3s ease;
}
.planet-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.planet-modal-title { font-size:18px; font-weight:700; }
.planet-modal-close {
  width:30px; height:30px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--glass); border:1px solid var(--glass-bd);
  color:var(--text-2); font-size:14px; cursor:pointer; transition:all .25s;
}
.planet-modal-close:active { transform:scale(.92); background:rgba(255,107,157,.08); }
.planet-modal-label { font-size:13px; color:var(--cyan); font-weight:600; margin:6px 0 12px; letter-spacing:1px; }
.planet-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.planet-opt {
  flex:1; text-align:center; padding:14px 8px; cursor:pointer;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  transition:all .25s;
}
.planet-opt.active {
  border-color:rgba(0,229,255,.5);
  background:rgba(0,229,255,.1);
  box-shadow:0 2px 14px rgba(0,229,255,.15);
}
.planet-opt-img { width:46px; height:46px; margin:0 auto; display:block; }
.planet-opt-name { font-size:11px; font-weight:600; margin-top:8px; color:var(--text-1); }
.planet-opt-desc { font-size:10px; color:var(--text-3); margin-top:3px; }
.planet-opt:active { transform:scale(.97); }
.palette-row { display:flex; gap:10px; flex-wrap:wrap; }
.palette-opt {
  flex:1; min-width:64px; text-align:center; padding:12px 6px; cursor:pointer;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  transition:all .25s;
}
.palette-opt.active {
  border-color:rgba(168,85,247,.5);
  background:rgba(168,85,247,.1);
  box-shadow:0 2px 14px rgba(168,85,247,.15);
}
.palette-dots { display:flex; justify-content:center; gap:3px; margin-bottom:8px; }
.palette-dot { width:9px; height:9px; border-radius:50%; }
.palette-name { font-size:11px; color:var(--text-2); font-weight:600; }
.palette-opt.active .palette-name { color:var(--text-1); }
.planet-modal-tip {
  margin-top:18px; padding:12px 14px; border-radius:12px;
  background:rgba(0,229,255,.06); border:1px solid rgba(0,229,255,.18);
  font-size:12px; color:var(--cyan); text-align:center; line-height:1.6;
}
.earth-name { font-size:20px; font-weight:700; }
.earth-name .grad { background:linear-gradient(135deg,var(--cyan),var(--gold)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.earth-id { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:4px; }

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
  background:var(--bg-card); border:1px solid rgba(255,255,255,.2); border-radius:16px;
  padding:18px 18px; margin-bottom:18px; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  transition:all .3s;
  box-shadow:0 4px 24px rgba(0,0,0,.35);
  position:relative;
  cursor:pointer;
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
.sent-status.launched { background:rgba(168,85,247,.1); color:var(--purple); border:1px solid rgba(168,85,247,.2); }

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
.liked-list { display:flex; flex-direction:column; gap:12px; }
.liked-card {
  display:flex; align-items:center; gap:12px; padding:16px;
  background:var(--glass); border:1px solid rgba(255,255,255,.17); border-radius:14px;
  cursor:pointer; transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
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

/* Received list (寄给我的) */
.received-list { display:flex; flex-direction:column; gap:12px; }
.received-card {
  display:flex; align-items:center; gap:12px; padding:16px;
  background:var(--glass); border:1px solid rgba(255,255,255,.17); border-radius:14px;
  cursor:pointer; transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.received-card:active { transform:scale(.97); }
.received-card.locked {
  background:rgba(168,85,247,.05);
  border-color:rgba(168,85,247,.18);
}
.received-avatar {
  width:44px; height:44px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:24px;
  background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(168,85,247,.08));
  border:1px solid rgba(0,229,255,.2);
}
.received-avatar.locked {
  filter:grayscale(.4) brightness(.9);
  border-color:rgba(168,85,247,.25);
}
.received-info { flex:1; min-width:0; }
.received-from { font-size:13px; font-weight:700; color:var(--cyan); font-family:'SF Mono',monospace; letter-spacing:.5px; }
.received-preview { font-size:12px; color:var(--text-2); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.received-keyword {
  display:inline-flex; align-items:center; gap:5px; margin-top:5px;
  padding:3px 10px; border-radius:100px;
  background:rgba(168,85,247,.08); border:1px solid rgba(168,85,247,.25);
  color:var(--purple); font-size:11px; font-weight:600;
}
.received-keyword-icon { font-size:10px; }
.received-keyword-text { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.received-locked-preview { display:flex; align-items:center; gap:6px; margin-top:5px; }
.received-lock { font-size:13px; flex-shrink:0; }
.received-lock-text { display:inline-flex; align-items:center; gap:3px; }
.received-block {
  display:inline-block; width:14px; height:6px; border-radius:2px;
  background:var(--text-3); opacity:.35;
}
.received-unlock-row { display:flex; align-items:center; gap:4px; margin-top:6px; }
.received-unlock-icon { font-size:11px; }
.received-unlock-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; }
.received-status {
  font-size:11px; font-weight:600; padding:4px 10px; border-radius:100px;
  white-space:nowrap; flex-shrink:0;
}
.received-status.unlocked { background:rgba(255,213,107,.1); color:var(--gold); border:1px solid rgba(255,213,107,.2); }
.received-status.sealed { background:rgba(168,85,247,.1); color:var(--purple); border:1px solid rgba(168,85,247,.2); }

/* Coordinate Cards */
.coord-intro {
  font-size:12px; color:var(--text-2); line-height:1.7; margin-bottom:16px;
  padding:14px 16px; border-radius:14px; background:var(--glass); border:1px solid var(--glass-bd);
}
.coord-intro .icon { margin-right:4px; }
.coord-card {
  position:relative; padding:16px; margin-bottom:16px;
  background:var(--glass); border:1px solid rgba(255,255,255,.17); border-radius:14px;
  transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
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
  width:100%; height:44px; padding:0 12px; border-radius:10px; border:1px solid var(--glass-bd);
  background:rgba(0,0,0,.2); color:var(--text-1); font-size:14px;
  transition:all .25s; outline:none; box-sizing:border-box;
}
.coord-input:focus { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,229,255,.1); }
.coord-input::placeholder { color:var(--text-3); }

/* Coordinator editor */
.coord-editor-overlay {
  position:fixed; inset:0; z-index:99998;
  display:flex; align-items:center; justify-content:center;
  padding:24px; animation:pageIn .3s ease;
}
.coord-editor-mask {
  position:absolute; inset:0;
  background:rgba(0,0,0,.6); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
}
.coord-editor-panel {
  position:relative; z-index:1;
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
.modal-signal-tag.delivered { background:rgba(255,213,107,.15); color:var(--gold); border:1px solid rgba(255,213,107,.3); }
.modal-signal-tag.traveling { background:rgba(0,229,255,.15); color:var(--cyan); border:1px solid rgba(0,229,255,.3); }
.modal-signal-tag.launched { background:rgba(168,85,247,.15); color:var(--purple); border:1px solid rgba(168,85,247,.3); }
.modal-star-row { display:flex; justify-content:center; margin-bottom:12px; }
.modal-star { font-size:32px; animation:starPulse 2s ease-in-out infinite; }
@keyframes starPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.2);} }
.modal-date { text-align:center; font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-bottom:16px; }
.modal-divider { height:1px; background:linear-gradient(90deg,transparent,var(--glass-bd),transparent); margin:12px 0 16px; }
.modal-content { font-size:14px; line-height:1.9; color:var(--text-1); white-space:pre-wrap; }
.modal-locked { text-align:center; padding:20px 8px 8px; }
.modal-locked-icon { font-size:46px; margin-bottom:12px; opacity:.55; }
.modal-locked-title { font-size:16px; font-weight:700; color:var(--text-1); margin-bottom:8px; }
.modal-locked-desc { font-size:12px; color:var(--text-3); line-height:1.7; margin-bottom:20px; }
.modal-locked-progress { display:flex; align-items:center; gap:10px; }
.modal-locked-bar { flex:1; height:8px; background:rgba(255,255,255,.06); border-radius:100px; overflow:hidden; }
.modal-locked-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,var(--cyan),var(--purple)); transition:width 1s ease; }
.modal-locked-percent { font-size:12px; font-weight:700; color:var(--cyan); font-family:'SF Mono',monospace; }
.modal-like-bar {
  display:flex; align-items:center; gap:10px; margin-top:18px;
  padding:12px 16px; background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
}
.modal-like-count { flex:1; cursor:pointer; }
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

/* Listened-by (被收听) entry under 我的 */
.earth-stats { display:flex; gap:12px; }
.earth-listened {
  flex:1; display:flex; align-items:center; gap:8px; margin-bottom:0; cursor:pointer;
  padding:12px 16px; border-radius:14px;
  background:var(--glass); border:1px solid var(--glass-bd);
  transition:all .25s;
}
.earth-listened-hover { transform:scale(.98); border-color:rgba(168,85,247,.3); background:rgba(168,85,247,.06); }
.earth-listened-icon { font-size:18px; }
.earth-listened-num { font-size:18px; font-weight:800; background:linear-gradient(135deg,var(--purple),var(--cyan)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.earth-listened-label { font-size:13px; color:var(--text-2); }

/* Asteroid / Listeners Popup (shared) */
.atlas-modal-overlay {
  position:fixed; top:0; left:0; right:0; bottom:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;
  background:rgba(5,5,20,.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  opacity:0; transition:opacity .3s;
}
.atlas-modal-overlay.show { opacity:1; }
.atlas-modal {
  width:100%; max-width:420px; box-sizing:border-box;
  max-height:78vh; display:flex; flex-direction:column;
  background:linear-gradient(135deg,rgba(12,12,36,.98),rgba(20,20,50,.98));
  border:1px solid rgba(0,229,255,.2); border-radius:24px;
  box-shadow:0 0 60px rgba(0,229,255,.18);
  transform:scale(.92); opacity:0; transition:transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
}
.atlas-modal-overlay.show .atlas-modal { transform:scale(1); opacity:1; }

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
.inbox-scroll .atlas-card:last-child { margin-bottom:0; }

.listen-empty { text-align:center; padding:36px 20px; color:var(--text-3); }
.listen-empty-icon { font-size:36px; margin-bottom:10px; opacity:.4; }
.listen-empty-text { font-size:13px; line-height:1.7; }

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
.atlas-name { font-size:13px; font-weight:600; color:var(--text-1); }
.atlas-planet { font-size:10px; color:var(--text-3); font-family:'SF Mono',monospace; letter-spacing:.5px; margin-top:3px; }
.atlas-text { font-size:13px; line-height:1.7; color:var(--text-2); margin-top:6px; }
.atlas-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; margin-top:8px; }

/* ===== 顶部操作：信号箱 + 解码 (top-right) ===== */
.earth-top-actions {
  position:absolute; top:52px; right:20px; z-index:50;
  display:flex; align-items:center; gap:10px;
}
.earth-inbox-trigger {
  position:relative;
  width:40px; height:40px;
  display:flex; align-items:center; justify-content:center;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:50%;
  font-size:18px; cursor:pointer; transition:all .25s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.earth-decode-trigger {
  width:40px; height:40px;
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

/* ===== 信号箱 Popup (centered) ===== */
.inbox-modal-overlay {
  position:fixed; top:0; left:0; right:0; bottom:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;
  background:rgba(5,5,20,.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  opacity:0; transition:opacity .3s;
}
.inbox-modal-overlay.show { opacity:1; }
.inbox-modal {
  width:100%; max-width:420px; box-sizing:border-box;
  max-height:78vh; display:flex; flex-direction:column;
  background:linear-gradient(135deg,rgba(12,12,36,.98),rgba(20,20,50,.98));
  border:1px solid rgba(0,229,255,.2);
  border-radius:24px;
  box-shadow:0 0 60px rgba(0,229,255,.18);
  transform:scale(.92); opacity:0; transition:transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
}
.inbox-modal-overlay.show .inbox-modal { transform:scale(1); opacity:1; }

/* ===== 解码 Popup ===== */
.decode-modal-overlay {
  position:fixed; top:0; left:0; right:0; bottom:0; z-index:200;
  display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;
  background:rgba(5,5,20,.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  opacity:0; transition:opacity .3s;
}
.decode-modal-overlay.show { opacity:1; }
.decode-modal {
  width:100%; max-width:420px; max-height:82vh; display:flex; flex-direction:column;
  background:linear-gradient(135deg,rgba(12,12,36,.98),rgba(20,20,50,.98));
  border:1px solid rgba(168,85,247,.25); border-radius:24px;
  box-shadow:0 0 60px rgba(168,85,247,.2);
  transform:scale(.92); opacity:0; transition:transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
}
.decode-modal-overlay.show .decode-modal { transform:scale(1); opacity:1; }
.decode-body { padding:18px 20px 22px; }
.decode-hint { font-size:13px; color:var(--text-2); line-height:1.7; margin-bottom:14px; }
.decode-input {
  width:100%; min-height:88px; padding:14px; box-sizing:border-box;
  background:rgba(255,255,255,.04); border:1px solid var(--glass-bd); border-radius:14px;
  color:var(--text-1); font-size:14px; line-height:1.6;
}
.decode-tools { display:flex; justify-content:flex-end; margin-top:8px; }
.decode-paste {
  font-size:12px; color:var(--cyan); padding:6px 12px; border-radius:100px;
  background:rgba(0,229,255,.08); border:1px solid rgba(0,229,255,.2);
}
.decode-btn {
  width:100%; margin-top:14px; padding:13px 0; border:none; border-radius:14px;
  background:linear-gradient(135deg,var(--purple),var(--cyan)); color:#fff;
  font-size:15px; font-weight:700; cursor:pointer;
}
.decode-btn:active { transform:scale(.98); }
.decode-btn-ghost {
  background:transparent; border:1px solid var(--glass-bd); color:var(--text-2); font-weight:600;
}
.decode-result-head {
  padding:16px 20px; border-bottom:1px solid var(--glass-bd);
  display:flex; flex-direction:column; gap:6px;
}
.decode-result-title { font-size:17px; font-weight:700; }
.decode-result-planet {
  font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; letter-spacing:.5px;
}
.decode-locked { padding:22px 20px; text-align:center; }
.decode-locked-icon { font-size:34px; margin-bottom:10px; opacity:.5; }
.decode-locked-text { font-size:14px; color:var(--text-2); }
.decode-locked-date { font-size:12px; color:var(--text-3); margin-top:6px; font-family:'SF Mono',monospace; }
.decode-garble {
  margin-top:16px; text-align:left; font-size:14px; line-height:2; color:var(--text-3);
  word-break:break-all; letter-spacing:1px;
  background:rgba(255,255,255,.03); border:1px solid var(--glass-bd); border-radius:12px; padding:12px 14px;
}
.decode-content { padding:18px 20px; }
.decode-content-text { font-size:14px; line-height:1.85; color:var(--text-1); white-space:pre-wrap; }

/* 信号箱 cards */
.inbox-card {
  display:flex; align-items:center; gap:12px; padding:14px 16px; margin-bottom:10px;
  background:var(--glass); border:1px solid var(--glass-bd); border-radius:14px;
  cursor:pointer; transition:all .3s;
  box-shadow:0 2px 12px rgba(0,0,0,.2);
}
.inbox-card:last-child { margin-bottom:0; }
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
.inbox-action-text { font-size:11px; color:var(--cyan); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inbox-action-text.action-lit { color:#ff7eb3; font-weight:600; }
.inbox-new-badge {
  font-size:9px; font-weight:800; letter-spacing:.5px; flex-shrink:0;
  padding:1px 6px; border-radius:100px;
  background:linear-gradient(135deg,var(--pink),var(--purple)); color:#fff;
  box-shadow:0 1px 6px rgba(255,107,157,.4);
}
.inbox-preview { font-size:12px; color:var(--text-2); margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inbox-meta { display:flex; align-items:center; gap:8px; margin-top:4px; }
.inbox-time { font-size:11px; color:var(--text-3); font-family:'SF Mono',monospace; }
.inbox-type-tag {
  font-size:10px; padding:2px 8px; border-radius:100px;
  border:1px solid var(--glass-bd); background:var(--glass);
}
.inbox-type-tag.tag-listen { color:var(--cyan); border-color:rgba(0,229,255,.2); background:rgba(0,229,255,.06); }
.inbox-type-tag.tag-lit { color:#ff7eb3; border-color:rgba(255,126,179,.3); background:rgba(255,126,179,.08); }
.inbox-type-tag.tag-letter { color:var(--gold); border-color:rgba(255,213,107,.2); background:rgba(255,213,107,.06); }
/* 已读：动作文案与类型标签统一置灰，颜色与「我寄出的」信件内容一致（--text-2） */
.inbox-card.read .inbox-action-text,
.inbox-card.read .inbox-action-text.action-lit { color:var(--text-2); font-weight:400; }
.inbox-card.read .inbox-type-tag,
.inbox-card.read .inbox-type-tag.tag-listen,
.inbox-card.read .inbox-type-tag.tag-lit,
.inbox-card.read .inbox-type-tag.tag-letter {
  color:var(--text-2); border-color:var(--glass-bd); background:var(--glass);
}
.inbox-action { flex-shrink:0; }
.inbox-arrow { font-size:18px; color:var(--text-3); font-weight:700; }
</style>
