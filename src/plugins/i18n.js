import Vue from 'vue'
import VueI18n from 'vue-i18n'

import deDE from '@/plugins/i18n/de_DE.json'
import enGB from '@/plugins/i18n/en_GB.json'
import viVN from '@/plugins/i18n/vi_VN.json'
// import arMA from '@/plugins/i18n/ar_MA.json'

const locales = [{
  locale: 'en-GB',
  name: 'British English',
  direction: 'ltr',
  icon: '🇬🇧'
}, {
  locale: 'de-DE',
  name: 'Deutsch - Deutschland',
  direction: 'ltr',
  icon: '🇩🇪'
}, {
  locale: 'vi-VN',
  name: 'Tiếng Việt',
  direction: 'ltr',
  icon: '🇻🇳'
// }, {
//   locale: 'ar-MA',
//   name: 'العربية - المغرب',
//   direction: 'rtl',
//   icon: '🇲🇦'
}]

Vue.use(VueI18n)

const messages = {
  'en-GB': enGB,
  'de-DE': deDE,
  'vi-VN': viVN
  // 'ar-MA': arMA
}

export const i18n = new VueI18n({
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  messages: messages,
  numberFormats: {
    'en-GB': {},
    'de-DE': {},
    'ar-MA': {},
    'vi-VN': {}
  }
})

const loadedLanguages = ['en-GB']

function setI18nLanguage (lang) {
  i18n.locale = lang

  let htmlTag = lang
  const underscoreIndex = lang.indexOf('-')
  if (underscoreIndex !== -1) {
    htmlTag = lang.substring(0, underscoreIndex)
  }
  document.querySelector('html').setAttribute('lang', htmlTag)

  const match = locales.find(l => l.locale === lang)

  if (match) {
    document.querySelector('html').setAttribute('dir', match.direction)
  }

  return lang
}

const loadLanguageAsync = (lang) => {
  // If the same language
  if (i18n.locale === lang) {
    return Promise.resolve(setI18nLanguage(lang))
  }

  // If the language was already loaded
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang))
  }

  // If the language hasn't been loaded yet
  return import(/* webpackChunkName: "lang-[request]" */`@/plugins/i18n/${lang.replace('-', '_')}.json`).then(messages => {
    i18n.setLocaleMessage(lang, messages.default)
    loadedLanguages.push(lang)
    return setI18nLanguage(lang)
  })
}

export {
  loadLanguageAsync,
  locales
}
