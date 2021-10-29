import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import OpenedNovel from '../views/OpenedNovel.vue'
import Chapters from '../views/Chapters.vue'
import Characters from '../views/Characters.vue'
import Research from '../views/Research.vue'
import Tags from '../views/Tags.vue'
import Export from '../views/Export.vue'
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
        path: 'tags',
        component: Tags,
      },{
        path: 'export',
        component: Export,
      },
      {
        path: 'plot',
        component: Timeline
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
