/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
// import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import axios from 'axios'

import { aliases as defaultAliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createVuetify, type IconAliases } from 'vuetify'

import enGB from '@/plugins/i18n/en_GB.json'
import deDE from '@/plugins/i18n/de_DE.json'

import { createI18n, useI18n } from 'vue-i18n'
import { en, de } from 'vuetify/locale'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'

import { VDateInput } from 'vuetify/labs/VDateInput'
import { VStepperVertical, VStepperVerticalItem } from 'vuetify/labs/VStepperVertical'
import { coreStore } from '@/stores/app'

const aliases: IconAliases = {
  ...defaultAliases,
  bluesky: ['M 6.3352642,4.3805537 C 8.6282167,6.1019578 11.094547,9.5922478 12.000058,11.465341 12.905639,9.5923853 15.371832,6.1019228 17.664853,4.3805537 19.319326,3.1384578 22,2.1773945 22,5.2355487 c 0,0.610755 -0.35017,5.1306603 -0.555548,5.8644483 -0.713893,2.551158 -3.315291,3.201843 -5.629278,2.808018 4.044804,0.68841 5.073763,2.968673 2.851604,5.248935 -4.22032,4.330665 -6.065826,-1.08658 -6.538927,-2.474675 C 12.041162,16.427804 12.000597,16.30876 12,16.409987 c -6e-4,-0.101231 -0.04116,0.01782 -0.127851,0.272288 C 11.399255,18.07037 9.5537833,23.487752 5.3332217,19.15695 3.1110283,16.876688 4.1399533,14.596287 8.1848258,13.908015 5.87077,14.30184 3.2693375,13.651151 2.5555483,11.099997 2.3501633,10.36614 2,5.8462353 2,5.2355487 2,2.1773945 4.6807425,3.1384578 6.3351467,4.3805537 Z'],
  brapi: ['M 5.7597657,0 A 5.75992,5.75992 0 0 0 0,5.7597657 5.75992,5.75992 0 0 0 5.7597657,11.519531 H 11.519531 V 5.7597657 A 5.75992,5.75992 0 0 0 5.7597657,0 Z M 18.240234,0 a 5.75992,5.75992 0 0 0 -5.759765,5.7597657 v 5.7597653 h 5.759765 A 5.75992,5.75992 0 0 0 24,5.7597657 5.75992,5.75992 0 0 0 18.240234,0 Z M 5.7597657,12.480469 A 5.75992,5.75992 0 0 0 0,18.240234 5.75992,5.75992 0 0 0 5.7597657,24 5.75992,5.75992 0 0 0 11.519531,18.240234 v -5.759765 z m 6.7207033,0 v 5.759765 A 5.75992,5.75992 0 0 0 18.240234,24 5.75992,5.75992 0 0 0 24,18.240234 5.75992,5.75992 0 0 0 18.240234,12.480469 Z'],
  gridscore: ['M 14.357934,2.9560501e-4 A 5.7862781,5.7862781 0 0 0 9.8075234,2.2906186 5.7862781,5.7862781 0 0 0 2.5926279,3.2846037 5.7862781,5.7862781 0 0 0 2.0635104,10.544852 5.7862781,5.7862781 0 0 0 0.7785107,17.710615 5.7862781,5.7862781 0 0 0 7.5247592,20.458247 5.7862781,5.7862781 0 0 0 13.942199,23.897511 5.7862781,5.7862781 0 0 0 18.640006,18.330438 5.7862781,5.7862781 0 0 0 23.893388,13.284925 5.7862781,5.7862781 0 0 0 20.049727,7.1018087 5.7862781,5.7862781 0 0 0 16.875021,0.54831017 5.7862781,5.7862781 0 0 0 14.357934,2.9560501e-4 Z M 11.425111,10.733823 a 5.7862781,5.7862781 0 0 0 0.529117,0.291014 5.7862781,5.7862781 0 0 0 0.566912,0.226765 5.7862781,5.7862781 0 0 0 -0.113382,0.593367 5.7862781,5.7862781 0 0 0 -0.03779,0.604706 5.7862781,5.7862781 0 0 0 -0.604706,0.07559 5.7862781,5.7862781 0 0 0 -0.582029,0.151177 5.7862781,5.7862781 0 0 0 -0.264559,-0.548015 5.7862781,5.7862781 0 0 0 -0.325029,-0.51022 5.7862781,5.7862781 0 0 0 0.442191,-0.415735 5.7862781,5.7862781 0 0 0 0.389279,-0.464868 z'],
  germinate: ['M 11.999836,0 C 5.384778,0 -3.9999998e-7,5.38515 0,12.00026 -3.9999998e-7,18.61531 5.384778,24.00011 11.999836,24.00011 18.614894,24.00011 24,18.61531 24,12.00026 24,5.38515 18.614894,0 11.999836,0 Z m 0,2.09227 c 5.484271,0 9.907984,4.42367 9.907984,9.90799 0,5.48425 -4.423713,9.90754 -9.907984,9.90754 -5.4842703,0 -9.9076558,-4.42329 -9.9076558,-9.90754 0,-5.48432 4.4233855,-9.90799 9.9076558,-9.90799 z M 9.5003025,5.50579 c -2.4997191,0 -2.4997043,0 -3.7494633,2.16472 L 4.500991,9.83539 c -1.2498943,2.16476 -1.2498943,2.16487 0,4.32945 l 1.2498482,2.16476 c 1.261759,2.16476 1.2617442,2.16476 3.7494633,2.16476 2.4996545,0 2.4997185,0 3.7495455,-2.16476 h -8.1e-5 c 1.249812,-2.16476 1.249787,-2.16469 0,-4.32934 v -1.1e-4 H 10.750152 8.2505363 l 1.2497662,2.16469 H 12 L 10.750152,16.3296 H 8.2505363 L 7.0006881,14.16484 5.7508392,12.00015 7.0006881,9.83539 8.2505363,7.67051 h 2.4996157 2.499696 L 12,5.50579 Z m 4.9993125,0 1.249849,2.16472 1.249848,2.16488 h -2.499697 l -1.249767,2.16476 h 2.499616 l 1.249848,2.16469 -1.249848,2.16476 -1.249849,2.16476 h 2.499697 l 1.249849,-2.16476 1.249766,-2.16476 c 1.249826,-2.16476 1.249826,-2.16469 0,-4.32945 L 18.249161,7.67051 16.999312,5.50579 Z'],
}

// @ts-ignore
enGB.$vuetify = en
// @ts-ignore
deDE.$vuetify = de

const locales = [{
  locale: 'en-GB',
  name: 'British English',
  direction: 'ltr',
  icon: '🇬🇧',
}, {
  locale: 'de-DE',
  name: 'Deutsch - Deutschland',
  direction: 'ltr',
  icon: '🇩🇪',
}, {
  locale: 'vi-VN',
  name: 'Tiếng Việt',
  direction: 'ltr',
  icon: '🇻🇳',
// }, {
//   locale: 'ar-MA',
//   name: 'العربية - المغرب',
//   direction: 'rtl',
//   icon: '🇲🇦'
}]

type MessageType = typeof enGB | typeof deDE

const messages: { [key: string]: MessageType } = {
  en: enGB,
  de: deDE,
}

const i18n = createI18n({
  locale: undefined,
  fallbackLocale: 'en',
  messages,
  legacy: false,
  globalInjection: true,
  warnHtmlMessage: false,
})

type VuetifyType = ReturnType<typeof createVuetify>

let vuetify: VuetifyType

function getVuetify () {
  return vuetify
}

function initVuetify () {
  const store = coreStore()
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
  vuetify = createVuetify({
    defaults: {
      global: {
        ripple: store.rippleEnabled,
        transition: store.transitionsEnabled,
      },
    },
    components: {
      VStepperVertical,
      VStepperVerticalItem,
      VDateInput,
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'system',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#2d98da',
            muted: '#868e96',
            info: '#2980b9',
            success: '#27ae60',
            error: '#c0392b',
            warning: '#f39c12',
          },
        },
        dark: {
          dark: true,
          colors: {
            primary: '#41a2cf',
            muted: '#868e96',
            info: '#3498db',
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f1c40f',
          },
        },
      },
    },
    locale: {
      adapter: createVueI18nAdapter({ i18n, useI18n }),
    },
  })

  return vuetify
}

function setI18nLanguage (lang: string) {
  if (vuetify) {
    vuetify.locale.current.value = lang
  }
  axios.defaults.headers.common['Accept-Language'] = lang

  let htmlTag = lang
  const underscoreIndex = lang.indexOf('-')
  if (underscoreIndex !== -1) {
    htmlTag = lang.slice(0, underscoreIndex)
  }
  document.querySelector('html')?.setAttribute('lang', htmlTag)

  const match = locales.find(l => l.locale === lang)

  if (match) {
    document.querySelector('html')?.setAttribute('dir', match.direction)
  }

  return lang
}

async function loadLanguageAsync (locale: string) {
  // If different language
  if (i18n.global.locale.value !== locale) {
    // load locale messages with dynamic import
    const messages = await import(
      /* webpackChunkName: "locale-[request]" */ `@/plugins/i18n/${locale.replace('-', '_')}.json`,
    )

    setI18nLanguage(locale)

    // set locale and locale message
    i18n.global.setLocaleMessage(locale, messages.default)
  }

  return nextTick()
}

export {
  initVuetify,
  i18n,
  loadLanguageAsync,
  locales,
  getVuetify,
}
