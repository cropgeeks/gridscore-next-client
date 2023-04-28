import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
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
    path: '/trial-setup',
    name: 'trial-setup',
    component: () => import('@/views/TrialSetupView.vue')
  }, {
    path: '/trial-import/:shareCode',
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
  }
]

const router = new VueRouter({
  routes
})

export default router
