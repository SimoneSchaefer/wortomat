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
    component: () => import(/* webpackChunkName: "about" */ '../views/OpenedNovel.vue'),
    children: [{
        path: 'chapters',
        component: () => import(/* webpackChunkName: "about" */ '../views/Chapters.vue'),
      },{
        path: 'research',
        component: () => import(/* webpackChunkName: "about" */ '../views/Research.vue'),
      },{
        path: 'tags',
        component: () => import(/* webpackChunkName: "about" */ '../views/Tags.vue'),
      },{
        path: 'export',
        component: () => import(/* webpackChunkName: "about" */ '../views/Export.vue'),
      }]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
