import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    chrome?: boolean
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/entrar',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, chrome: false, title: 'Entrar' },
    },
    {
      path: '/',
      name: 'panel',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Panel' },
    },
    {
      path: '/calendario',
      name: 'calendario',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true, title: 'Calendario' },
    },
    {
      path: '/suscripcion/:id',
      name: 'detalle',
      component: () => import('@/views/SubscriptionDetailView.vue'),
      meta: { requiresAuth: true, title: 'Suscripción' },
    },
    {
      path: '/ajustes',
      name: 'ajustes',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Ajustes' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'no-encontrado',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'No encontrado' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'panel' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Suscrito` : 'Suscrito'
})

export default router
