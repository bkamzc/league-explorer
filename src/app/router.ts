import { createRouter, createWebHistory } from 'vue-router'
import LeaguesPage from '@/pages/LeaguesPage.vue'

// One page; its state (?q=&sport=&league=) lives in the query string.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'leagues', component: LeaguesPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
