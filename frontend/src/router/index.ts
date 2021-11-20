import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/write/:id',
    component: () => import('../views/OpenedNovel.vue'),
    children: [{
        path: 'chapters',
        component: () => import('../views/Chapters.vue'),
      },{
        path: 'characters',
        component: () => import('../views/Characters.vue'),
      },{
        path: 'research',
        component: () => import('../views/Research.vue'),
      },{
        path: 'location',
        component: () => import('../views/Locations.vue'),
      }, {
        path: 'export',
        component: () => import('../views/Export.vue'),
      }, {
        path: 'plot',
        component: () => import('../views/Timeline.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
