import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { CANVAS_DENSITY_MEDIUM, CANVAS_SHAPE_CIRCLE, CANVAS_SIZE_MEDIUM, MAIN_DISPLAY_MODE_AUTO, NAVIGATION_MODE_DRAG, TRIAL_LIST_ALL, TRIAL_LIST_GRID } from '@/plugins/constants'
import { getTrialById } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

let name = import.meta.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

export default createStore({
  state: {
    uniqueClientId: null,
    runCount: 0,
    serverUrl: null,
    locale: 'en-GB',
    darkMode: false,
    hideCitationMessage: false,
    highlightControls: true,
    displayMarkerIndicators: true,
    displayMinCellWidth: 4,
    gpsEnabled: true,
    voiceFeedbackEnabled: false,
    restrictInputToMarked: false,
    largeButtonsForIntTraits: false,
    navigationMode: NAVIGATION_MODE_DRAG,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
    homeWidgetOrder: ['banners', 'trials'],
    selectedTrialPerson: null,
    canvasDensity: CANVAS_DENSITY_MEDIUM,
    canvasShape: CANVAS_SHAPE_CIRCLE,
    canvasSize: CANVAS_SIZE_MEDIUM,
    selectedTrial: null,
    mapLayer: 'theme',
    trialListMode: TRIAL_LIST_ALL,
    trialListArrangement: TRIAL_LIST_GRID,
    hiddenTraits: [],
    showFullTraitDescription: true,
    categoryCountInline: 4,
    mainDisplayMode: MAIN_DISPLAY_MODE_AUTO,
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
    storeUniqueClientId: (state) => state.uniqueClientId,
    storeRunCount: (state) => state.runCount,
    storeLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeCalendarLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeDarkMode: (state) => state.darkMode,
    storeHideCitationMessage: (state) => state.hideCitationMessage,
    storeHighlightControls: (state) => state.highlightControls,
    storeDisplayMarkerIndicators: (state) => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state) => state.displayMinCellWidth,
    storeGpsEnabled: (state) => state.gpsEnabled,
    storeVoiceFeedbackEnabled: (state) => state.voiceFeedbackEnabled,
    storeRestrictInputToMarked: (state) => state.restrictInputToMarked,
    storeNavigationMode: (state) => state.navigationMode,
    storeTraitColors: (state) => state.traitColors,
    storeHomeWidgetOrder: (state) => state.homeWidgetOrder,
    storeSelectedTrialPerson: (state) => state.selectedTrialPerson,
    storeLargeButtonsForIntTraits: (state) => state.largeButtonsForIntTraits,
    storeCanvasDensity: (state) => state.canvasDensity,
    storeCanvasShape: (state) => state.canvasShape,
    storeCanvasSize: (state) => state.canvasSize,
    storeMainDisplayMode: (state) => state.mainDisplayMode || MAIN_DISPLAY_MODE_AUTO,
    storeTrialListMode: (state) => state.trialListMode,
    storeTrialListArrangement: (state) => state.trialListArrangement,
    storeMapLayer: (state) => state.mapLayer,
    storeSelectedTrial: (state) => state.selectedTrial,
    storeHiddenTraits: (state) => state.hiddenTraits,
    storePlausible: (state) => state.plausible,
    storeServerUrl: (state) => state.serverUrl,
    storeBrapiConfig: (state) => state.brapiConfig,
    storeChangelogVersionNumber: (state) => state.changelogVersionNumber,
    storeDeviceConfig: (state) => state.deviceConfig,
    storeShowFullTraitDescription: (state) => state.showFullTraitDescription,
    storeCategoryCountInline: (state) => state.categoryCountInline
  },
  mutations: {
    ON_UNIQUE_CLIENT_ID_CHANGED: function (state, newUniqueClientId) {
      state.uniqueClientId = newUniqueClientId
    },
    ON_RUN_COUNT_CHANGED: function (state, newRunCount) {
      state.runCount = newRunCount
    },
    ON_HIDDEN_TRAITS_CHANGED: function (state, newHiddenTraits) {
      state.hiddenTraits = newHiddenTraits
    },
    ON_SELECTED_TRIAL_PERSON_CHANGED: function (state, newSelectedTrialPerson) {
      state.selectedTrialPerson = newSelectedTrialPerson
    },
    ON_SELECTED_TRIAL_CHANGED: function (state, newSelectedTrial) {
      /* Remember to reset everything here */
      const currentId = state.selectedTrial
      state.selectedTrial = newSelectedTrial
      state.hiddenTraits = []
      if (currentId !== newSelectedTrial) {
        state.selectedTrialPerson = null
      }

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
    ON_MAIN_DISPLAY_MODE_CHANGED: function (state, newMainDisplayMode) {
      state.mainDisplayMode = newMainDisplayMode
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
    ON_HIGHLIGHT_CONTROLS_CHANGED: function (state, newHighlightControls) {
      state.highlightControls = newHighlightControls
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
      state.voiceFeedbackEnabled = newVoiceFeedbackEnabled
    },
    ON_CANVAS_DENSITY_CHANGED: function (state, newCanvasDensity) {
      state.canvasDensity = newCanvasDensity
    },
    ON_CANVAS_SHAPE_CHANGED: function (state, newCanvasShape) {
      state.canvasShape = newCanvasShape
    },
    ON_CANVAS_SIZE_CHANGED: function (state, newCanvasSize) {
      state.canvasSize = newCanvasSize
    },
    ON_TRIAL_LIST_MODE_CHANGED: function (state, newTrialListMode) {
      state.trialListMode = newTrialListMode
    },
    ON_TRIAL_LIST_ARRANGEMENT_CHANGED: function (state, newTrialListArrangement) {
      state.trialListArrangement = newTrialListArrangement
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
      state.homeWidgetOrder = newHomeWidgetOrder
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
    ON_CHANGELOG_VERSION_NUMBER_CHANGED: function (state, newChangelogVersionNumber) {
      state.changelogVersionNumber = newChangelogVersionNumber
    },
    ON_DEVICE_CONFIG_CHANGED: function (state, newDeviceConfig) {
      state.deviceConfig = newDeviceConfig
    },
    ON_SHOW_FULL_TRAIT_DESCRIPTION_CHANGED: function (state, newShowFullTraitDescription) {
      state.showFullTraitDescription = newShowFullTraitDescription
    },
    ON_LARGE_BUTTONS_FOR_INT_TRAITS_CHANGED: function (state, newLargeButtonsForIntTraits) {
      state.largeButtonsForIntTraits = newLargeButtonsForIntTraits
    },
    ON_CATEGORY_COUNT_INLINE_CHANGED: function (state, newCategoryCountInline) {
      state.categoryCountInline = newCategoryCountInline
    }
  },
  actions: {
    setUniqueClientId: function ({ commit }, uniqueClientId) {
      commit('ON_UNIQUE_CLIENT_ID_CHANGED', uniqueClientId)
    },
    setRunCount: function ({ commit }, runCount) {
      commit('ON_RUN_COUNT_CHANGED', runCount)
    },
    setHiddenTraits: function ({ commit }, hiddenTraits) {
      commit('ON_HIDDEN_TRAITS_CHANGED', hiddenTraits)
    },
    setSelectedTrialPerson: function ({ commit }, selectedTrialPerson) {
      commit('ON_SELECTED_TRIAL_PERSON_CHANGED', selectedTrialPerson)
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
    setHighlightControls: function ({ commit }, highlightControls) {
      commit('ON_HIGHLIGHT_CONTROLS_CHANGED', highlightControls)
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
    setMainDisplayMode: function ({ commit }, mainDisplayMode) {
      commit('ON_MAIN_DISPLAY_MODE_CHANGED', mainDisplayMode)
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
      commit('ON_CHANGELOG_VERSION_NUMBER_CHANGED', changelogVersionNumber)
    },
    setDeviceConfig: function ({ commit }, deviceConfig) {
      commit('ON_DEVICE_CONFIG_CHANGED', deviceConfig)
    },
    setShowFullTraitDescription: function ({ commit }, showFullTraitDescription) {
      commit('ON_SHOW_FULL_TRAIT_DESCRIPTION_CHANGED', showFullTraitDescription)
    },
    setLargeButtonsForIntTraits: function ({ commit }, largeButtonsForIntTraits) {
      commit('ON_LARGE_BUTTONS_FOR_INT_TRAITS_CHANGED', largeButtonsForIntTraits)
    },
    setCategoryCountInline: function ({ commit }, categoryCountInline) {
      commit('ON_CATEGORY_COUNT_INLINE_CHANGED', categoryCountInline)
    }
  },
  modules: {
  },
  plugins: [
    createPersistedState({
      key: name
    })
  ]
})
