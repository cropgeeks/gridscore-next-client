import '@/plugins/workaround'
import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import { i18n } from '@/plugins/i18n'

import { registerSW } from 'virtual:pwa-register'

// Set base URL based on environment
let baseUrl = './api/'

if (import.meta.env.VITE_BASE_URL) {
  baseUrl = import.meta.env.VITE_BASE_URL
}

store.commit('ON_SERVER_URL_CHANGED', baseUrl)

const updateSW = registerSW({
  onNeedRefresh () {
    console.log('onNeedRefresh')
    document.dispatchEvent(
      new CustomEvent('swUpdated', { detail: updateSW })
    )
  },
  onOfflineReady () {
    console.log('onOfflineReady')
  }
})

const app = createApp(App)

app.use(router)
app.use(store)
app.use(createBootstrap())
app.use(i18n)
app.mount('#app')
