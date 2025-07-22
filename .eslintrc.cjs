/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript',
    '@vue/standard'
  ],
  rules: {
    'vue/multi-word-component-names': 'off'
  }
}
