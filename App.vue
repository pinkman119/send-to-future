<script>
	export default {
		globalData: {
			mySentLetters: [],
			likedLetterIds: new Set(),
			myCoords: [],
			mySubscriptions: [],
			inboxItems: [],
			myListenersCount: 0,
			myPlanet: 'euaf',
			satPalette: 0,
			saveState() {
				try {
					const app = getApp();
					uni.setStorageSync('starletter_sent', JSON.stringify(app.globalData.mySentLetters));
					uni.setStorageSync('starletter_liked', JSON.stringify([...app.globalData.likedLetterIds]));
					uni.setStorageSync('starletter_coords', JSON.stringify(app.globalData.myCoords));
					uni.setStorageSync('starletter_subs', JSON.stringify(app.globalData.mySubscriptions));
					uni.setStorageSync('starletter_inbox', JSON.stringify(app.globalData.inboxItems));
					uni.setStorageSync('starletter_listeners', JSON.stringify(app.globalData.myListenersCount));
				uni.setStorageSync('starletter_planet', app.globalData.myPlanet);
				uni.setStorageSync('starletter_satpal', JSON.stringify(app.globalData.satPalette));
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
				const subs = uni.getStorageSync('starletter_subs');
				if (subs) this.globalData.mySubscriptions = JSON.parse(subs);
				const inbox = uni.getStorageSync('starletter_inbox');
				if (inbox) this.globalData.inboxItems = JSON.parse(inbox);
				const listeners = uni.getStorageSync('starletter_listeners');
				if (listeners) this.globalData.myListenersCount = JSON.parse(listeners);
				const planet = uni.getStorageSync('starletter_planet');
				if (planet) this.globalData.myPlanet = planet;
				const pal = uni.getStorageSync('starletter_satpal');
				if (typeof pal === 'string' && pal !== '') this.globalData.satPalette = JSON.parse(pal);
			} catch(e) {}
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
