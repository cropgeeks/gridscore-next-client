/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard'
  ],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    parser: '@babel/eslint-parser',
    ecmaFeatures: {
      module: true
    }
  },
  rules: {
    'vue/multi-word-component-names': 'off'
  }
}
