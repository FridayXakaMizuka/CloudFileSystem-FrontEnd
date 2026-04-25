import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileEditView from '../views/ProfileEditView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView
        },
        {
            path: '/',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true }
        },
        {
            path: '/profile',
            name: 'profile',
            component: ProfileEditView,
            meta: { requiresAuth: true }
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/login'
        }
    ]
})

/**
 * 全局前置守卫：验证用户登录状态
 * @param {Object} to - 即将要进入的目标路由
 * @param {Object} from - 当前导航正要离开的路由
 * @returns {string|undefined} 返回重定向路径或 undefined（允许导航）
 */
router.beforeEach((to, from) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

    // 如果访问需要认证的页面但未登录，重定向到登录页
    if (to.meta.requiresAuth && !isLoggedIn) {
        return '/login'
    }

    // 如果已登录用户访问登录页或注册页，重定向到首页
    if (isLoggedIn && (to.path === '/login' || to.path === '/register')) {
        return '/'
    }

    // 其他情况允许正常导航
    return true
})

export default router