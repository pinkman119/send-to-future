<script>
	import DEFAULT_PLANET_IMG from '@/img/火星.png';
	export default {
		globalData: {
			// ===== 以下为静态演示数据（各状态至少一个），后续接入后端时由接口数据整体替换 =====
			// 我寄出的信：已送达 / 旅行中 / 仅发射 三种状态
			mySentLetters: [
				{
					id: 'DEMO-S1',
					content: '亲爱的未来的我：\n\n今天我终于鼓起勇气递交了辞呈。所有人都不理解，但只有我知道，如果不试一次，我会后悔一辈子。\n\n希望明年今天的你，已经在新领域站稳了脚跟。',
					keyword: '勇敢的转身',
					channel: 'mail',
					isEncrypted: false,
					sentDate: '2026.05.20',
					sentTimestamp: Date.now() - 220 * 86400000,
					deliveryDate: '2027.05.20',
					deliveryTimestamp: Date.now() - 20 * 86400000,
					years: 1,
					likes: 12,
					litUsers: [
						{ avatar: '🌍', planetId: 'EARTH-12345', time: '2026.06.01' },
						{ avatar: '🌟', planetId: 'MARS-44219', time: '2026.06.10' }
					]
				},
				{
					id: 'DEMO-S2',
					content: '给三年后的自己：\n\n此刻的我25岁，在出租屋写下这封信。窗外城市灯火很亮，但不属于我。\n\n希望三年后的你已经有了属于自己的那盏灯。',
					keyword: '25岁的独白',
					channel: 'qqmail',
					isEncrypted: true,
					sentDate: '2026.07.01',
					sentTimestamp: Date.now() - 100 * 86400000,
					deliveryDate: '2029.07.01',
					deliveryTimestamp: Date.now() + 1000 * 86400000,
					years: 3,
					likes: 3,
					litUsers: [ { avatar: '🌙', planetId: 'LUNA-90812', time: '2026.07.15' } ]
				},
				{
					id: 'DEMO-S3',
					content: '致星海：\n\n这封信不寄给任何人，只化作一颗星，永远闪耀。愿看到它的旅人，都能被温柔以待。',
					keyword: '仅发射·不推送',
					channel: 'launch',
					isEncrypted: false,
					sentDate: '2026.07.08',
					sentTimestamp: Date.now() - 2 * 86400000,
					deliveryDate: '',
					deliveryTimestamp: 0,
					years: null,
					likes: 0,
					litUsers: []
				}
			],
			// 寄给我的信：已解密 / 加密中（未到解密时间）两种状态
			receivedLetters: [
				{
					id: 'DEMO-R1',
					planetId: 'EARTH-12138',
					avatar: '🪐',
					keyword: '时光的约定',
					sentTimestamp: Date.now() - 90 * 86400000,
					unlockTimestamp: Date.now() - 3 * 86400000,
					content: '嘿，收到这封信的你：\n\n还记得三个月前的那个约定吗？我说过要成为更好的人。\n\n如果你正在读这封信，说明时间到了。希望此刻的你，正如我期待的那样闪闪发光。'
				},
				{
					id: 'DEMO-R2',
					planetId: 'EARTH-88521',
					avatar: '🌕',
					keyword: '封存的心意',
					sentTimestamp: Date.now() - 10 * 86400000,
					unlockTimestamp: Date.now() + 45 * 86400000,
					content: '给未来的你：\n\n这封信被我封存了很久，只有当星光穿越足够距离才会抵达。\n\n愿那时的你，已经放下了现在的焦虑。'
				}
			],
			// 我点亮过的信（与 litRecords 对应，引用 sampleLetters 的 id）
			likedLetterIds: new Set(['L01', 'L06', 'L03', 'L09']),
			// 联络坐标：phone / email / address / wechat 四种类型
			myCoords: [
				{ id: 'COORD-PHONE', type: 'phone', value: '138****8888' },
				{ id: 'COORD-EMAIL', type: 'email', value: 'starletter@example.com' },
				{ id: 'COORD-ADDR', type: 'address', value: '北京市朝阳区星际路 1 号' },
				{ id: 'COORD-WECHAT', type: 'wechat', value: 'star_traveler_01' }
			],
			// 我收听的人：一条已读 / 一条新信号（未读，点击前显示为乱码）
			mySubscriptions: [
				{
					id: 'SUB-1',
					letterId: 'L02',
					from: '一位环球旅者',
					avatar: '👩‍✈️',
					asteroid: '小行星 #2023-BC34',
					time: '2026.06.20',
					pushedAt: Date.now() - 30 * 86400000,
					viewed: true
				},
				{
					id: 'SUB-2',
					letterId: 'L05',
					from: '一位猫奴',
					avatar: '🐱',
					asteroid: '小行星 #2021-EF90',
					time: '2026.07.05',
					pushedAt: Date.now() - 1 * 86400000,
					viewed: false
				}
			],
			// 信号箱：newListener 未读 / newLit 未读 / newListener 已读 三种状态
			inboxItems: [
				{ id: 'INB-1', letterId: 'L01', type: 'newListener', from: '一位北漂旅人', avatar: '🧑‍🚀', planetId: 'EARTH-12138', time: '2 天前', read: false },
				{ id: 'INB-2', letterId: 'L06', type: 'newLit', from: '一位勇敢的人', avatar: '🧙‍♀️', planetId: 'EARTH-88521', time: '5 天前', read: false },
				{ id: 'INB-3', letterId: 'L03', type: 'newListener', from: '一位创业者', avatar: '🧑‍💼', planetId: 'EARTH-30467', time: '9 天前', read: true }
			],
			// 小行星图鉴
			capturedAsteroids: [
				{ no: 4, name: 'Vesta 灶神星', text: '愿你成为自己的太阳，无需凭借谁的光。', capturedAt: Date.now() - 12 * 86400000 },
				{ no: 1, name: 'Ceres 谷神星', text: '慢慢来，比较快。你要的，时间都会给你。', capturedAt: Date.now() - 5 * 86400000 },
				{ no: 433, name: 'Eros 爱神星', text: '今天也要记得，你已经被很多人悄悄爱着。', capturedAt: Date.now() - 1 * 86400000 }
			],
			// 点亮记录（与 likedLetterIds 对应）
			litRecords: [
				{ id: 'L01', time: Date.now() - 8 * 86400000 },
				{ id: 'L06', time: Date.now() - 3 * 86400000 },
				{ id: 'L03', time: Date.now() - 1 * 86400000 }
			],
			myListenersCount: 3,
			myPlanet: 'mars',
			likedUnlockMap: {},
			satPalette: 0,
			satPalettes: [
				{ name: '星云', colors: ['#00e5ff', '#a855f7', '#4facfe', '#ff6b9d', '#4ade80'] },
				{ name: '极光', colors: ['#22d3ee', '#34d399', '#818cf8', '#2dd4bf', '#a78bfa'] },
				{ name: '暖阳', colors: ['#ffd56b', '#ff9f43', '#ff6b9d', '#ff5e62', '#ffc371'] },
				{ name: '梦幻', colors: ['#ff6b9d', '#c084fc', '#f472b6', '#a855f7', '#fb7185'] },
			],
		saveState() {
			// 本地存储已移除：数据仅保留在内存（静态/默认值），刷新或重进将重置为默认值。
			// 后续接入后端时，将各页面的 saveState() 调用替换为对应的写入/更新接口请求。
		}
		},
		onLaunch: function() {
			console.log('App Launch');
			this.globalData.myPlanetImg = DEFAULT_PLANET_IMG;
			// 已移除本地存储读取：当前数据统一使用 globalData 中的静态默认值（仅存在于内存）。
			// 后续接入后端时，在此处调用接口拉取用户动态数据并赋值给 globalData 即可。
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
