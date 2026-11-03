import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import App from './App.vue'
import router from './router'
import './assets/style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
