<template>
  <view class="star-sky">
    <view class="star-layer layer-1" :style="layer1"></view>
    <view class="star-layer layer-2" :style="layer2"></view>
    <view class="star-layer layer-3" :style="layer3"></view>
    <view
      v-for="m in meteors"
      :key="m.id"
      class="meteor"
      :style="m.style"
    >
      <view class="meteor-tail" :style="m.tail"></view>
    </view>
  </view>
</template>

<script>
function buildStars(count, w, h, colorFn, blur) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * w);
    const y = Math.round(Math.random() * h);
    parts.push(x + 'px ' + y + 'px ' + blur + 'px 0 ' + colorFn());
  }
  return 'box-shadow:' + parts.join(',') + ';';
}

const brightPalette = ['255,255,255', '0,229,255', '255,213,107', '168,85,247', '255,255,255', '255,255,255'];

export default {
  data() {
    return {
      layer1: '',
      layer2: '',
      layer3: '',
      meteors: [],
      meteorId: 0,
      timer: null,
      screenW: 0,
      screenH: 0,
    };
  },
  mounted() {
    try {
      const sys = uni.getSystemInfoSync();
      this.screenW = sys.windowWidth || 375;
      this.screenH = sys.windowHeight || 667;
    } catch (e) {
      this.screenW = 375;
      this.screenH = 667;
    }
    const w = this.screenW;
    const h = this.screenH;
    this.layer1 = buildStars(70, w, h, function () {
      return 'rgba(255,255,255,' + (0.3 + Math.random() * 0.4).toFixed(2) + ')';
    }, 0);
    this.layer2 = buildStars(50, w, h, function () {
      return 'rgba(220,228,255,' + (0.5 + Math.random() * 0.4).toFixed(2) + ')';
    }, 0);
    this.layer3 = buildStars(26, w, h, function () {
      const c = brightPalette[Math.floor(Math.random() * brightPalette.length)];
      return 'rgba(' + c + ',' + (0.75 + Math.random() * 0.25).toFixed(2) + ')';
    }, 1);
    this.startLoop();
  },
  beforeDestroy() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  },
  methods: {
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
      const dur = (0.95 + Math.random() * 0.7).toFixed(2);
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

.meteor {
  position: absolute;
  width: 3px; height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px 1px rgba(255,255,255,0.85), 0 0 14px 2px rgba(0,229,255,0.35);
  animation-name: meteorFly;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
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
</style>
