import Vue from 'vue'
import VueRouter from 'vue-router'

const emitter = require('tiny-emitter/instance')

Vue.use(VueRouter)

const originalReplace = VueRouter.prototype.replace
const originalPush = VueRouter.prototype.push
VueRouter.prototype.replace = function replace (location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalReplace.call(this, location, onResolve, onReject)
  }
  return originalReplace.call(this, location).catch(err => {
    if (err && err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
      throw err
    }
  })
}
VueRouter.prototype.push = function push (location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch(err => {
    if (err && err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
      throw err
    }
  })
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  }, {
    path: '/index.html',
    name: 'home-too',
    component: () => import('@/views/HomeView.vue')
  }, {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue')
  }, {
    path: '/load-example',
    name: 'load-example',
    component: () => import('@/views/LoadExampleView.vue')
  }, {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue')
  }, {
    path: '/data-entry',
    name: 'data-entry',
    component: () => import('@/views/DataEntryView.vue')
  }, {
    path: '/data-grid',
    name: 'data-grid',
    component: () => import('@/views/DataGridView.vue')
  }, {
    path: '/guided-walk',
    name: 'guided-walk',
    component: () => import('@/views/GuidedWalkView.vue')
  }, {
    path: '/trial-setup',
    name: 'trial-setup',
    component: () => import('@/views/TrialSetupView.vue')
  }, {
    path: '/trial-duplication/:trialId',
    name: 'trial-duplication',
    component: () => import('@/views/TrialSetupView.vue')
  }, {
    path: '/trial-import/:shareCode',
    name: 'trial-import-code',
    component: () => import('@/views/TrialImportView.vue')
  }, {
    path: '/trial-import',
    name: 'trial-import',
    component: () => import('@/views/TrialImportView.vue')
  }, {
    path: '/trial-export',
    name: 'trial-export',
    component: () => import('@/views/TrialExportView.vue')
  }, {
    path: '/visualization/heatmap',
    name: 'visualization-heatmap',
    component: () => import('@/views/VizHeatmapView.vue')
  }, {
    path: '/visualization/timeline',
    name: 'visualization-timeline',
    component: () => import('@/views/VizTimelineView.vue')
  }, {
    path: '/visualization/statistics',
    name: 'visualization-statistics',
    component: () => import('@/views/VizStatisticsView.vue')
  }, {
    path: '/visualization/map',
    name: 'visualization-map',
    component: () => import('@/views/VizMapView.vue')
  }, {
    path: '/data-statistics',
    name: 'data-statistics',
    component: () => import('@/views/DataStatistics.vue')
  }
]

const router = new VueRouter({
  mode: 'hash',
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  },
  routes
})

router.beforeEach((to, from, next) => {
  emitter.emit('page-navigation', to)

  next()
})

export default router
