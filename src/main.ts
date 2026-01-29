import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vue3GoogleLogin from 'vue3-google-login'

import './assets/main.css'

const app = createApp(App)

app.use(router)

app.use(vue3GoogleLogin, {
    // Google OAuth Client ID (JapanTravelMap)
    clientId: '10304501802-hvc21io7mrlp7mlrt0gij5tsilu8duns.apps.googleusercontent.com'
})

app.mount('#app')