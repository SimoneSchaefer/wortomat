import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import OpenedNovel from '../views/OpenedNovel.vue'
import Chapters from '../views/Chapters.vue'
import Characters from '../views/Characters.vue'
import Locations from '../views/Locations.vue'
import Research from '../views/Research.vue'
import Plotline from '../views/Plotline.vue'
import Timeline from '../views/Timeline.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/write/:id',
    component: OpenedNovel,
    children: [{
        path: 'chapters',
        component: Chapters,
      },{
        path: 'characters',
        component: Characters,
      },{
        path: 'research',
        component: Research,
      },{
        path: 'location',
        component: Locations,
      },
      {
        path: 'timeline',
        component: Timeline,
      },
      {
        path: 'plot',
        component: Plotline,
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
