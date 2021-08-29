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
        path: 'tags',
        component: () => import(/* webpackChunkName: "about" */ '../views/Tags.vue'),
      }]
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
