import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { getAccessToken } from '../utils/commonAPI'

// TypeScript에서 meta 필드 인식을 위해 타입 확장
declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
    }
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { requiresAuth: true } // 로그인 필수
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            beforeEnter: (_to, _from, next) => {
              if (getAccessToken()) next('/');
              else next();
            }
        }
    ]
})

// 네비게이션 가드 수정
router.beforeEach((to, _from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const token = getAccessToken() // 우리 백엔드 토큰 가져오기

    if (requiresAuth && !token) {
        // 로그인이 필요한데 토큰이 없다면? -> 로그인 페이지로
        next('/login')
    } else {
        // 그 외엔 통과
        next()
    }
})

export default router
