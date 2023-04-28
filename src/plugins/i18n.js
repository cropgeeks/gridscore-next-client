import Vue from 'vue'
import VueI18n from 'vue-i18n'

import deDE from '@/plugins/i18n/de_DE.json'
import enGB from '@/plugins/i18n/en_GB.json'

const locales = [{
  locale: 'en_GB',
  name: 'British English',
  icon: '🇬🇧'
}, {
  locale: 'de_DE',
  name: 'Deutsch - Deutschland',
  icon: '🇩🇪'
}]

Vue.use(VueI18n)

const messages = {
  en_GB: enGB,
  de_DE: deDE
}

export const i18n = new VueI18n({
  locale: 'en_GB',
  fallbackLocale: 'en_GB',
  messages: messages
})

const loadedLanguages = ['en_GB']

function setI18nLanguage (lang) {
  i18n.locale = lang

  let htmlTag = lang
  const underscoreIndex = lang.indexOf('_')
  if (underscoreIndex !== -1) {
    htmlTag = lang.substring(0, underscoreIndex)
  }
  document.querySelector('html').setAttribute('lang', htmlTag)
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
  return import(/* webpackChunkName: "lang-[request]" */`@/plugins/i18n/${lang}.json`).then(messages => {
    i18n.setLocaleMessage(lang, messages.default)
    loadedLanguages.push(lang)
    return setI18nLanguage(lang)
  })
}

export {
  loadLanguageAsync,
  locales
}
