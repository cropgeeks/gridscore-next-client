import '@/plugins/workaround'
import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from '@/App.vue'
import router from '@/router'
import { i18n } from '@/plugins/i18n'

import { registerSW } from 'virtual:pwa-register'

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

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)

app.use(router)
app.use(createBootstrap())
app.use(i18n)
app.use(pinia)
app.mount('#app')
