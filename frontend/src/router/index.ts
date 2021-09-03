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
    component: () => import(/* webpackChunkName: "OpenedNovel" */ '../views/OpenedNovel.vue'),
    children: [{
        path: 'chapters',
        component: () => import(/* webpackChunkName: "Chapters" */ '../views/Chapters.vue'),
      },{
        path: 'research',
        component: () => import(/* webpackChunkName: "Research" */ '../views/Research.vue'),
      },{
        path: 'tags',
        component: () => import(/* webpackChunkName: "Tags" */ '../views/Tags.vue'),
      },{
        path: 'export',
        component: () => import(/* webpackChunkName: "Export" */ '../views/Export.vue'),
      }]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
