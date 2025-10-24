// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Layouts(),
    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        {
          pinia: ['defineStore', 'storeToRefs'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
    VitePWA({
      devOptions: {
        enabled: false,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        navigateFallbackDenylist: [/^\/api\/settings/, /^\/api\/trial/],
        maximumFileSizeToCacheInBytes: 30_000_000,
        runtimeCaching: [{
          handler: 'CacheFirst',
          urlPattern: ({ url }) => url.pathname && url.pathname.includes('/api/trait/') && url.pathname.endsWith('/img'),
          options: {
            cacheName: 'trait-images',
            expiration: {
              maxEntries: 500,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        }],
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
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Trial setup',
            url: '/#/trial-setup',
            description: 'This is the trial setup screen of GridScore where you can create a new trial.',
            icons: [
              {
                src: '/img/shortcuts/trial-setup.png',
                sizes: '192x192',
              },
            ],
          },
        ],
        categories: ['productivity', 'education', 'utilities'],
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})
