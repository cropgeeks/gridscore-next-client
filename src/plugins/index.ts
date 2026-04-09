/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import pinia from '@/stores'
import { initVuetify, i18n } from '@/plugins/vuetify'
import router from '@/router'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(pinia)
    .use(initVuetify())
    .use(router)
    .use(i18n)
}
