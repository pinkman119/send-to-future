import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/styles/main.css'

// 应用入口：装配 Pinia 状态管理与 Vue Router，挂载根组件。
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
