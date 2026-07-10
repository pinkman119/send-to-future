<template>
  <view class="wander-page">
    <view class="wander-header">
      <view class="wander-title-row">
        <view class="wander-title"><text class="grad">星系</text>星海</view>
        <view class="wander-refresh" :class="{ spinning: isRefreshing }" @click="refreshStars">
          <text class="wander-refresh-icon">↻</text>
          <text>刷新星图</text>
        </view>
      </view>
      <view class="wander-subtitle">每一颗星星，都是某人寄出的一封信 · 点击阅读 · 点亮传递温暖</view>
    </view>

    <view class="wander-sky" id="wanderSky">
      <view
        v-for="(star, idx) in currentStars"
        :key="idx"
        class="star-letter"
        :class="[star.sizeClass, star.signalClass]"
        :style="{ left: star.x + 'px', top: star.y + 'px', animationDelay: star.delay + 's' }"
        @click="showLetterModal(star.letter)"
      >
        <view class="star-letter-dot"></view>
        <view class="signal-badge" v-if="star.tier > 0" :class="{ show: star.showBadge }">强烈信号</view>
      </view>

      <view class="wander-hint" v-if="currentStars.length === 0">
        <view class="wander-hint-icon">🌌</view>
        <view>正在生成星图...</view>
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
  { id:'L11', content:"亲爱的未来的我：\n\n今天是我们结婚五周年。他送了我一束向日葵，和五年前一模一样。\n\n我不知道十年后、二十年后，我们还会不会像现在这样。\n\n但我知道，此刻的我很幸福。这就够了。", star:'small', from:'一位妻子', avatar:'👩‍💼', likes:156 },
  { id:'L12', content:"未来的我：\n\n我终于学会说\"不\"了。\n\n30年了，我一直是那个\"好好先生\"。帮同事加班，帮朋友搬家，帮邻居遛狗。\n\n今天我第一次拒绝了。感觉很好。\n\n希望你继续保持。善良要有锋芒。", star:'gold', from:'一位觉醒者', avatar:'🦊', likes:2890 },
  { id:'L13', content:"给未来的自己：\n\n今天是我来这座城市的第一天。拖着行李箱走出地铁站，看着满眼的霓虹灯，既兴奋又害怕。\n\n我不知道自己能在这里待多久，但我想试试。\n\n如果你还在这里，说明我们都撑过来了。如果不在了，那也没关系，至少我们勇敢过。", star:'cyan', from:'一位异乡人', avatar:'🧑‍🚀', likes:412 },
  { id:'L14', content:"未来的我：\n\n你还记得那家巷子里的书店吗？我每周都去，坐在角落看一下午。\n\n老板养了只金毛，总趴在我脚边。\n\n如果那家店还在，替我去看看。如果不在了，就在心里留个位置吧。\n\n有些地方，去过就是永远。", star:'small', from:'一位读书人', avatar:'🧑‍🔬', likes:67 },
  { id:'L15', content:"致十年后的我：\n\n如果那时候你依然单身，请不要焦虑。\n\n28岁的我，一个人看电影，一个人吃火锅，一个人旅行。不是没人陪，是我享受独处。\n\n希望你依然拥有这份自在。也希望你遇到了那个让独处变得更美好的人——如果还没有，也没关系。", star:'gold', from:'一位自由人', avatar:'🌠', likes:1023 },
];

function generateAsteroidId() {
  const year = 2020 + Math.floor(Math.random() * 7);
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `小行星 #${year}-${l1}${l2}${num}`;
}

sampleLetters.forEach(l => { if (!l.asteroid) l.asteroid = generateAsteroidId(); });

function getSignalTier(likes) {
  if (likes >= 1000) return 2;
  if (likes >= 100) return 1;
  return 0;
}

function getSignalWeight(likes) {
  const tier = getSignalTier(likes);
  if (tier === 2) return 5;
  if (tier === 1) return 3;
  return 1;
}

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

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function formatLikeCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default {
  data() {
    return {
      currentStars: [],
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
    };
  },
  mounted() {
    this.generateStarLetters();
  },
  methods: {
    generateStarLetters() {
      const sysInfo = uni.getSystemInfoSync();
      const skyW = sysInfo.windowWidth;
      const skyH = sysInfo.windowHeight;
      const headerOffset = 160;

      const count = Math.min(sampleLetters.length, 12);
      const selected = pickWeightedLetters(count);

      const centerX = skyW / 2;
      const centerY = headerOffset + (skyH - headerOffset) / 2;
      const spreadX = Math.min(skyW * 0.38, 160);
      const spreadY = Math.min((skyH - headerOffset) * 0.35, 140);

      const positions = [];
      const stars = [];
      for (let i = 0; i < selected.length; i++) {
        const letter = selected[i];
        let x, y, attempts = 0;
        do {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.85 + 0.15;
          x = centerX + Math.cos(angle) * spreadX * radius + (Math.random() - 0.5) * 40;
          y = centerY + Math.sin(angle) * spreadY * radius + (Math.random() - 0.5) * 40;
          x = Math.max(30, Math.min(skyW - 30, x));
          y = Math.max(headerOffset, Math.min(skyH - 40, y));
          attempts++;
        } while (attempts < 20 && positions.some(p => Math.abs(p.x - x) < 45 && Math.abs(p.y - y) < 45));
        positions.push({ x, y });

        const tier = getSignalTier(letter.likes);
        const sizeClass = letter.star === 'gold' ? 'large' : letter.star === 'cyan' ? 'medium' : 'small';
        const signalClass = tier === 2 ? 'signal-t2' : tier === 1 ? 'signal-t1' : '';

        stars.push({
          x, y,
          sizeClass,
          signalClass,
          tier,
          delay: Math.random() * 3,
          letter,
          showBadge: false,
        });
      }

      this.currentStars = stars;
    },
    refreshStars() {
      this.isRefreshing = true;
      setTimeout(() => {
        this.isRefreshing = false;
        this.generateStarLetters();
      }, 600);
    },
    showLetterModal(letter) {
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
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
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
    },
  },
};
</script>

<style>
/* ===== Wander Page ===== */
.wander-page { height:100vh; position:relative; overflow:hidden; }
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

.wander-sky { position:relative; width:100%; height:100%; min-height:500px; }

/* Individual star letter */
.star-letter {
  position:absolute; cursor:pointer; transition:all .3s;
  animation:starTwinkle 3s ease-in-out infinite;
  display:flex; flex-direction:column; align-items:center;
}
.star-letter-dot {
  width:8px; height:8px; border-radius:50%; background:#fff;
  box-shadow:0 0 10px rgba(255,255,255,.6);
  transition:all .3s;
}
.star-letter.large .star-letter-dot { width:12px; height:12px; box-shadow:0 0 16px rgba(255,213,107,.7); background:var(--gold); }
.star-letter.medium .star-letter-dot { width:10px; height:10px; box-shadow:0 0 12px rgba(0,229,255,.6); background:var(--cyan); }
.star-letter.small .star-letter-dot { width:6px; height:6px; box-shadow:0 0 8px rgba(255,255,255,.4); background:#e0e0ff; }
.star-letter:active .star-letter-dot { transform:scale(1.3); }

@keyframes starTwinkle {
  0%,100% { opacity:.6; }
  50% { opacity:1; }
}

/* Strong Signal Tiers */
.star-letter.signal-t1 .star-letter-dot {
  box-shadow:0 0 20px rgba(255,107,157,.6), 0 0 40px rgba(255,107,157,.3);
  animation:signalPulseT1 2s ease-in-out infinite;
}
@keyframes signalPulseT1 {
  0%,100% { box-shadow:0 0 20px rgba(255,107,157,.6), 0 0 40px rgba(255,107,157,.3); }
  50% { box-shadow:0 0 30px rgba(255,107,157,.8), 0 0 60px rgba(255,107,157,.4); }
}
.star-letter.signal-t2 .star-letter-dot {
  width:16px; height:16px;
  background:radial-gradient(circle,#fff 0%,var(--signal-bright) 40%,var(--pink) 100%);
  box-shadow:0 0 30px rgba(255,59,107,.9), 0 0 60px rgba(255,107,157,.5), 0 0 90px rgba(255,107,157,.2);
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

/* Empty hint */
.wander-hint {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  text-align:center; color:var(--text-3); font-size:13px;
  pointer-events:none; z-index:2;
}
.wander-hint-icon { font-size:32px; margin-bottom:8px; opacity:.5; }

/* Letter Detail Modal */
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
</style>
