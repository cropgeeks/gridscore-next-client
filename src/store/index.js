import { CANVAS_DENSITY_MEDIUM, CANVAS_SHAPE_CIRCLE, CANVAS_SIZE_MEDIUM, NAVIGATION_MODE_DRAG, TRIAL_LIST_ALL, TRIAL_LIST_GRID } from '@/plugins/constants'
import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { getTrialById } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

let name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    isOffline: false,
    uniqueClientId: null,
    runCount: 0,
    serverUrl: null,
    locale: 'en-GB',
    darkMode: false,
    hideCitationMessage: false,
    displayMarkerIndicators: true,
    displayMinCellWidth: 4,
    gpsEnabled: true,
    voiceFeedbackEnabled: false,
    restrictInputToMarked: false,
    navigationMode: NAVIGATION_MODE_DRAG,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
    homeWidgetOrder: ['banners', 'trials'],
    canvasDensity: CANVAS_DENSITY_MEDIUM,
    canvasShape: CANVAS_SHAPE_CIRCLE,
    canvasSize: CANVAS_SIZE_MEDIUM,
    selectedTrial: null,
    mapLayer: 'theme',
    trialListMode: TRIAL_LIST_ALL,
    trialListArrangement: TRIAL_LIST_GRID,
    hiddenTraits: [],
    plausible: {
      plausibleDomain: null,
      plausibleHashMode: true,
      plausibleApiHost: null
    },
    brapiConfig: {
      url: null,
      token: null
    },
    changelogVersionNumber: null,
    deviceConfig: null
  },
  getters: {
    storeIsOffline: (state) => state.isOffline,
    storeUniqueClientId: (state) => state.uniqueClientId,
    storeRunCount: (state) => state.runCount,
    storeLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeCalendarLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeDarkMode: (state) => state.darkMode,
    storeHideCitationMessage: (state) => state.hideCitationMessage,
    storeDisplayMarkerIndicators: (state) => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state) => state.displayMinCellWidth,
    storeGpsEnabled: (state) => state.gpsEnabled,
    storeVoiceFeedbackEnabled: (state) => state.voiceFeedbackEnabled,
    storeRestrictInputToMarked: (state) => state.restrictInputToMarked,
    storeNavigationMode: (state) => state.navigationMode,
    storeTraitColors: (state) => state.traitColors,
    storeHomeWidgetOrder: (state) => state.homeWidgetOrder,
    storeCanvasDensity: (state) => state.canvasDensity,
    storeCanvasShape: (state) => state.canvasShape,
    storeCanvasSize: (state) => state.canvasSize,
    storeTrialListMode: (state) => state.trialListMode,
    storeTrialListArrangement: (state) => state.trialListArrangement,
    storeMapLayer: (state) => state.mapLayer,
    storeSelectedTrial: (state) => state.selectedTrial,
    storeHiddenTraits: (state) => state.hiddenTraits,
    storePlausible: (state) => state.plausible,
    storeServerUrl: (state) => state.serverUrl,
    storeBrapiConfig: (state) => state.brapiConfig,
    storeChangelogVersionNumber: (state) => state.changelogVersionNumber,
    storeDeviceConfig: (state) => state.deviceConfig
  },
  mutations: {
    ON_IS_OFFLINE_CHANGED: function (state, newIsOffline) {
      state.isOffline = newIsOffline
    },
    ON_UNIQUE_CLIENT_ID_CHANGED: function (state, newUniqueClientId) {
      state.uniqueClientId = newUniqueClientId
    },
    ON_RUN_COUNT_CHANGED_MUTATION: function (state, newRunCount) {
      state.runCount = newRunCount
    },
    ON_HIDDEN_TRAITS_CHANGED: function (state, newHiddenTraits) {
      state.hiddenTraits = newHiddenTraits
    },
    ON_SELECTED_TRIAL_CHANGED: function (state, newSelectedTrial) {
      /* Remember to reset everything here */
      state.selectedTrial = newSelectedTrial
      state.hiddenTraits = []

      if (newSelectedTrial) {
        getTrialById(newSelectedTrial)
          .then(trial => {
            if (trial.brapiConfig) {
              state.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(trial.brapiConfig)))
            } else {
              state.brapiConfig = {
                url: null,
                token: null
              }
            }
          })
      } else {
        state.brapiConfig = {
          url: null,
          token: null
        }
      }

      emitter.emit('trial-selected')
    },
    ON_DARK_MODE_CHANGED: function (state, newDarkMode) {
      state.darkMode = newDarkMode
    },
    ON_MAP_LAYER_CHANGED: function (state, newMapLayer) {
      state.mapLayer = newMapLayer
    },
    ON_LOCALE_CHANGED: function (state, newLocale) {
      state.locale = newLocale
    },
    ON_HIDE_CITATION_MESSAGE_CHANGED: function (state, newHideCitationMessage) {
      state.hideCitationMessage = newHideCitationMessage
    },
    ON_DISPLAY_MARKER_INDICATORS_CHANGED: function (state, newDisplayMarkerIndicators) {
      state.displayMarkerIndicators = newDisplayMarkerIndicators
    },
    ON_DISPLAY_MIN_CELL_WIDTH_CHANGED: function (state, newDisplayMinCellWidth) {
      state.displayMinCellWidth = newDisplayMinCellWidth
    },
    ON_GPS_ENABLED_CHANGED: function (state, newGpsEnabled) {
      state.gpsEnabled = newGpsEnabled
    },
    ON_VOICE_FEEDBACK_ENABLED_CHANGED: function (state, newVoiceFeedbackEnabled) {
      if (Object.prototype.hasOwnProperty.call(state, 'voiceFeedbackEnabled')) {
        state.voiceFeedbackEnabled = newVoiceFeedbackEnabled
      } else {
        Vue.set(state, 'voiceFeedbackEnabled', newVoiceFeedbackEnabled)
      }
    },
    ON_CANVAS_DENSITY_CHANGED: function (state, newCanvasDensity) {
      if (Object.prototype.hasOwnProperty.call(state, 'canvasDensity')) {
        state.canvasDensity = newCanvasDensity
      } else {
        Vue.set(state, 'canvasDensity', newCanvasDensity)
      }
    },
    ON_CANVAS_SHAPE_CHANGED: function (state, newCanvasShape) {
      if (Object.prototype.hasOwnProperty.call(state, 'canvasShape')) {
        state.canvasShape = newCanvasShape
      } else {
        Vue.set(state, 'canvasShape', newCanvasShape)
      }
    },
    ON_CANVAS_SIZE_CHANGED: function (state, newCanvasSize) {
      if (Object.prototype.hasOwnProperty.call(state, 'canvasSize')) {
        state.canvasSize = newCanvasSize
      } else {
        Vue.set(state, 'canvasSize', newCanvasSize)
      }
    },
    ON_TRIAL_LIST_MODE_CHANGED: function (state, newTrialListMode) {
      if (Object.prototype.hasOwnProperty.call(state, 'trialListMode')) {
        state.trialListMode = newTrialListMode
      } else {
        Vue.set(state, 'trialListMode', newTrialListMode)
      }
    },
    ON_TRIAL_LIST_ARRANGEMENT_CHANGED: function (state, newTrialListArrangement) {
      if (Object.prototype.hasOwnProperty.call(state, 'trialListArrangement')) {
        state.trialListArrangement = newTrialListArrangement
      } else {
        Vue.set(state, 'trialListArrangement', newTrialListArrangement)
      }
    },
    ON_RESTRICT_INPUT_TO_MARKED_CHANGED: function (state, newRestrictInputToMarked) {
      state.restrictInputToMarked = newRestrictInputToMarked
    },
    ON_NAVIGATION_MODE_CHANGED: function (state, newNavigationMode) {
      state.navigationMode = newNavigationMode
    },
    ON_TRAIT_COLORS_CHANGED: function (state, newTraitColors) {
      state.traitColors = newTraitColors
    },
    ON_HOME_WIDGET_ORDER_CHANGED: function (state, newHomeWidgetOrder) {
      if (Object.prototype.hasOwnProperty.call(state, 'homeWidgetOrder')) {
        state.homeWidgetOrder = newHomeWidgetOrder
      } else {
        Vue.set(state, 'homeWidgetOrder', newHomeWidgetOrder)
      }
    },
    ON_PLAUSIBLE_CHANGED: function (state, newPlausible) {
      state.plausible = newPlausible
    },
    ON_SERVER_URL_CHANGED: function (state, newServerUrl) {
      state.serverUrl = newServerUrl
    },
    ON_BRAPI_CONFIG_CHANGED: function (state, newBrapiConfig) {
      if (newBrapiConfig) {
        state.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        state.brapiConfig = {
          url: null,
          token: null
        }
      }
    },
    ON_CHANGELOG_VERSION_NUMBER_CHANGED_MUTATION: function (state, newChangelogVersionNumber) {
      if (state.changelogVersionNumber === undefined) {
        Vue.set(state, 'changelogVersionNumber', newChangelogVersionNumber)
      } else {
        state.changelogVersionNumber = newChangelogVersionNumber
      }
    },
    ON_DEVICE_CONFIG_CHANGED_MUTATION: function (state, newDeviceConfig) {
      if (state.deviceConfig === undefined) {
        Vue.set(state, 'deviceConfig', newDeviceConfig)
      } else {
        state.deviceConfig = newDeviceConfig
      }
    }
  },
  actions: {
    setIsOffline: function ({ commit }, isOffline) {
      commit('ON_IS_OFFLINE_CHANGED', isOffline)
    },
    setUniqueClientId: function ({ commit }, uniqueClientId) {
      commit('ON_UNIQUE_CLIENT_ID_CHANGED', uniqueClientId)
    },
    setRunCount: function ({ commit }, runCount) {
      commit('ON_RUN_COUNT_CHANGED_MUTATION', runCount)
    },
    setHiddenTraits: function ({ commit }, hiddenTraits) {
      commit('ON_HIDDEN_TRAITS_CHANGED', hiddenTraits)
    },
    setSelectedTrial: function ({ commit }, selectedTrial) {
      commit('ON_SELECTED_TRIAL_CHANGED', selectedTrial)
    },
    setDarkMode: function ({ commit }, darkMode) {
      commit('ON_DARK_MODE_CHANGED', darkMode)
    },
    setMapLayer: function ({ commit }, mapLayer) {
      commit('ON_MAP_LAYER_CHANGED', mapLayer)
    },
    setLocale: function ({ commit }, locale) {
      commit('ON_LOCALE_CHANGED', locale)
    },
    setHideCitationMessage: function ({ commit }, hideCitationMessage) {
      commit('ON_HIDE_CITATION_MESSAGE_CHANGED', hideCitationMessage)
    },
    setDisplayMarkerIndicators: function ({ commit }, displayMarkerIndicators) {
      commit('ON_DISPLAY_MARKER_INDICATORS_CHANGED', displayMarkerIndicators)
    },
    setDisplayMinCellWidth: function ({ commit }, displayMinCellWidth) {
      commit('ON_DISPLAY_MIN_CELL_WIDTH_CHANGED', displayMinCellWidth)
    },
    setGpsEnabled: function ({ commit }, gpsEnabled) {
      commit('ON_GPS_ENABLED_CHANGED', gpsEnabled)
    },
    setCanvasDensity: function ({ commit }, canvasDensity) {
      commit('ON_CANVAS_DENSITY_CHANGED', canvasDensity)
    },
    setCanvasShape: function ({ commit }, canvasShape) {
      commit('ON_CANVAS_SHAPE_CHANGED', canvasShape)
    },
    setCanvasSize: function ({ commit }, canvasSize) {
      commit('ON_CANVAS_SIZE_CHANGED', canvasSize)
    },
    setTrialListMode: function ({ commit }, trialListMode) {
      commit('ON_TRIAL_LIST_MODE_CHANGED', trialListMode)
    },
    setTrialListArrangement: function ({ commit }, trialListArrangement) {
      commit('ON_TRIAL_LIST_ARRANGEMENT_CHANGED', trialListArrangement)
    },
    setVoiceFeedbackEnabled: function ({ commit }, voiceFeedbackEnabled) {
      commit('ON_VOICE_FEEDBACK_ENABLED_CHANGED', voiceFeedbackEnabled)
    },
    setRestrictInputToMarked: function ({ commit }, restrictInputToMarked) {
      commit('ON_RESTRICT_INPUT_TO_MARKED_CHANGED', restrictInputToMarked)
    },
    setNavigationMode: function ({ commit }, navigationMode) {
      commit('ON_NAVIGATION_MODE_CHANGED', navigationMode)
    },
    setTraitColors: function ({ commit }, traitColors) {
      commit('ON_TRAIT_COLORS_CHANGED', traitColors)
    },
    setHomeWidgetOrder: function ({ commit }, homeWidgetOrder) {
      commit('ON_HOME_WIDGET_ORDER_CHANGED', homeWidgetOrder)
    },
    setPlausible: function ({ commit }, plausible) {
      commit('ON_PLAUSIBLE_CHANGED', plausible)
    },
    setServerUrl: function ({ commit }, serverUrl) {
      commit('ON_SERVER_URL_CHANGED', serverUrl)
    },
    setBrapiConfig: function ({ commit }, brapiConfig) {
      commit('ON_BRAPI_CONFIG_CHANGED', brapiConfig)
    },
    setChangelogVersionNumber: function ({ commit }, changelogVersionNumber) {
      commit('ON_CHANGELOG_VERSION_NUMBER_CHANGED_MUTATION', changelogVersionNumber)
    },
    setDeviceConfig: function ({ commit }, deviceConfig) {
      commit('ON_DEVICE_CONFIG_CHANGED_MUTATION', deviceConfig)
    }
  },
  modules: {
  },
  plugins: [createPersistedState({
    key: name
  })]
})
