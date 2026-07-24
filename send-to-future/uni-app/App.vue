<script>
	import { silentLogin } from './utils/auth.js';

	export default {
		globalData: {
			mySentLetters: [],
			likedLetterIds: new Set(),
			myCoords: [],
			login: null,
			saveState() {
				try {
					const app = getApp();
					uni.setStorageSync('starletter_sent', JSON.stringify(app.globalData.mySentLetters));
					uni.setStorageSync('starletter_liked', JSON.stringify([...app.globalData.likedLetterIds]));
					uni.setStorageSync('starletter_coords', JSON.stringify(app.globalData.myCoords));
				} catch(e) {}
			}
		},
		onLaunch: function() {
			console.log('App Launch');
			try {
				const saved = uni.getStorageSync('starletter_sent');
				if (saved) this.globalData.mySentLetters = JSON.parse(saved);
				const liked = uni.getStorageSync('starletter_liked');
				if (liked) this.globalData.likedLetterIds = new Set(JSON.parse(liked));
				const coords = uni.getStorageSync('starletter_coords');
				if (coords) this.globalData.myCoords = JSON.parse(coords);
			} catch(e) {}

			// 静默登录：进入小程序第一时间在后台完成，不阻塞首屏渲染
			silentLogin().catch((e) => {
				console.warn('静默登录失败（不影响正常使用）', e);
			});
		},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		}
	}
</script>

<style lang="scss">
	/* ===== CSS Variables ===== */
	page {
		--bg-deep:#050514;
		--bg-mid:#0a0a24;
		--bg-card:rgba(12,12,36,.75);
		--glass:rgba(255,255,255,.04);
		--glass-bd:rgba(255,255,255,.08);
		--text-1:#f0f0ff;
		--text-2:#9a9ac0;
		--text-3:#5a5a7a;
		--cyan:#00e5ff;
		--blue:#4facfe;
		--purple:#a855f7;
		--gold:#ffd56b;
		--pink:#ff6b9d;
		--signal-glow:#ff6b9d;
		--signal-bright:#ff3b6b;
		--radius:20px;

		background:var(--bg-deep);
		color:var(--text-1);
		font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;
		font-size:15px;
		line-height:1.6;
		-webkit-font-smoothing:antialiased;
		height:100%;
		overflow-x:hidden;
	}

	/* ===== Reset ===== */
	*, *::before, *::after {
		margin:0;
		padding:0;
		box-sizing:border-box;
		-webkit-tap-highlight-color:transparent;
	}

	/* 每个页面公共css */
	@keyframes pageIn {
		from { opacity:0; transform:translateY(8px); }
		to { opacity:1; transform:translateY(0); }
	}
</style>
