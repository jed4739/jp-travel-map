import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { auth } from '../firebase' // firebase.ts에서 auth 가져오기

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
            component: LoginView
        }
    ]
})

// 네비게이션 가드 (로그인 안 한 사람 튕겨내기)
router.beforeEach((to, _from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    // Firebase Auth 초기화 대기
    // (새로고침 시 로그인 상태를 확인하기 전까지 잠깐 대기하는 로직이 필요할 수 있음)
    auth.onAuthStateChanged((user) => {
        if (requiresAuth && !user) {
            next('/login') // 로그인 안했으면 로그인 페이지로
        } else {
            next() // 통과
        }
    })
})

export default router