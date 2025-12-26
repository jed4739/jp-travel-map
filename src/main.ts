import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 라우터 설정 파일 가져오기

import './assets/main.css' // 스타일 (파일 없으면 이 줄은 지우셔도 됩니다)

const app = createApp(App)

// app.mount('#app') 하기 전에 반드시 router를 use 해야 합니다!
app.use(router)

app.mount('#app')