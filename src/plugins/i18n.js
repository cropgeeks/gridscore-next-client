import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

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

const messages = {
  'en-GB': enGB,
  'de-DE': deDE,
  'vi-VN': viVN
  // 'ar-MA': arMA
}

const i18n = createI18n({
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  messages,
  legacy: false,
  globalInjection: true,
  warnHtmlMessage: false,
  numberFormats: {
    'en-GB': {},
    'de-DE': {},
    'ar-MA': {},
    'vi-VN': {}
  }
})

function setI18nLanguage (locale) {
  i18n.global.locale.value = locale

  let htmlTag = locale
  const underscoreIndex = locale.indexOf('-')
  if (underscoreIndex !== -1) {
    htmlTag = locale.substring(0, underscoreIndex)
  }
  document.querySelector('html').setAttribute('lang', htmlTag)

  const match = locales.find(l => l.locale === locale)

  if (match) {
    document.querySelector('html').setAttribute('dir', match.direction)
  }
}

const loadLanguageAsync = async (locale) => {
  // If different language
  if (i18n.global.locale.value !== locale) {
    // load locale messages with dynamic import
    const messages = await import(
      /* webpackChunkName: "locale-[request]" */ `@/plugins/i18n/${locale.replace('-', '_')}.json`
    )

    setI18nLanguage(locale)

    // set locale and locale message
    i18n.global.setLocaleMessage(locale, messages.default)
  }

  return nextTick()
}

export {
  loadLanguageAsync,
  locales,
  i18n
}
