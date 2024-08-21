import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolve from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver(), IconsResolve()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
      iconCustomizer (collection, icon, props) {
        if (collection === 'bi') {
          props.width = '1em'
          props.height = '1em'
        }
      }
    }),
    VitePWA({
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 30000000
      },
      filename: 'service-worker.js',
      manifest: {
        name: 'GridScore NEXT',
        short_name: 'GridScore NEXT',
        description: 'GridScore is a field trial phenotyping app for trait data. It lets you keep track of what\'s happening in the field on a plot-level basis. This could be anything from plant emergence, flowering date, plant height, flower colour, etc. You can define the layout of your field trial and the traits you want to score. GridScore then presents your data in a table format representing your field layout. Data is recorded by clicking on a specific plot in a field and then entering your data.',
        theme_color: '#325D88',
        display: 'standalone',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'Trial setup',
            url: '/#/trial-setup',
            description: 'This is the trial setup screen of GridScore where you can create a new trial.',
            icons: [
              {
                src: '/img/shortcuts/trial-setup.png',
                sizes: '192x192'
              }
            ]
          }
        ],
        categories: ['productivity', 'education', 'utilities']
      }
    })
  ],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~bootstrap': fileURLToPath(new URL('node_modules/bootstrap', import.meta.url)),
      '~bootswatch': fileURLToPath(new URL('node_modules/bootswatch', import.meta.url)),
      '~bootstrap-vue-next': fileURLToPath(new URL('node_modules/bootstrap-vue-next', import.meta.url))
    }
  }
})
