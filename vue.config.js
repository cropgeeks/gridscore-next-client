const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  pwa: {
    name: 'GridScore NEXT',
    themeColor: '#325D88',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    start_url: '/index.html',
    workboxOptions: {
      skipWaiting: true
    }
  },
  configureWebpack: {
    resolve: {
      // ... rest of the resolve config
      fallback: {
        'path': require.resolve('path-browserify')
      }
    }
  }
})
