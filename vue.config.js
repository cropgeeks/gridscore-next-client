const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/',
  pwa: {
    name: 'GridScore NEXT',
    themeColor: '#325D88',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    start_url: '/',
    // workboxOptions: {
    //   skipWaiting: true,
    //   clientsClaim: true
    // }
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
