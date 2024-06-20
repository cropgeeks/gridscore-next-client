import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
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
      component: () => import('@/views/DataStatisticsView.vue')
    }, {
      path: '/germplasm-performance',
      name: 'germplasm-performance',
      component: () => import('@/views/GermplasmPerformanceView.vue')
    }
  ]
})

router.afterEach((to, from) => {
  if (from.name !== to.name) {
    // Make sure to remove any overflow restrictions that may have been added and not automatically removed on page navigation
    document.body.style.removeProperty('overflow')
  }
})

export default router
