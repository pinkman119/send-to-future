import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'

/**
 * 创建 Vue3 SSR 应用实例
 * @returns {object} 包含 app 实例的对象
 */
export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
// #endif
