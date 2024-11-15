import { defineStore } from 'pinia'
import { CANVAS_DENSITY_MEDIUM, CANVAS_SHAPE_CIRCLE, CANVAS_SIZE_MEDIUM, MAIN_DISPLAY_MODE_AUTO, NAVIGATION_MODE_DRAG, PLOT_DISPLAY_FIELD_DISPLAY_NAME, TRIAL_LIST_ALL, TRIAL_LIST_GRID } from '@/plugins/constants'
import { getTrialById } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'
import { ensureTraitImagesCached } from '@/plugins/traitcache'

let name = import.meta.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

export const coreStore = defineStore('core', {
  state: () => ({
    uniqueClientId: null,
    runCount: 0,
    serverUrl: null,
    locale: 'en-GB',
    darkMode: null,
    theme: 'system',
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
    plotDisplayField: PLOT_DISPLAY_FIELD_DISPLAY_NAME,
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
  }),
  getters: {
    storeUniqueClientId: (state) => state.uniqueClientId,
    storeRunCount: (state) => state.runCount,
    storeLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeCalendarLocale: (state) => (state.locale || 'en-GB').replace('_', '-'),
    storeDarkMode: (state) => state.darkMode,
    storeTheme: (state) => state.theme || 'system',
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
    storePlotDisplayField: (state) => state.plotDisplayField,
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
  actions: {
    setUniqueClientId: function (newUniqueClientId) {
      this.uniqueClientId = newUniqueClientId
    },
    setRunCount: function (newRunCount) {
      this.runCount = newRunCount
    },
    setHiddenTraits: function (newHiddenTraits) {
      this.hiddenTraits = newHiddenTraits
    },
    setSelectedTrialPerson: function (newSelectedTrialPerson) {
      this.selectedTrialPerson = newSelectedTrialPerson
    },
    setSelectedTrial: function (newSelectedTrial) {
      /* Remember to reset everything here */
      const currentId = this.selectedTrial
      this.selectedTrial = newSelectedTrial
      this.hiddenTraits = []
      if (currentId !== newSelectedTrial) {
        this.selectedTrialPerson = null
      }

      if (newSelectedTrial) {
        getTrialById(newSelectedTrial)
          .then(trial => {
            ensureTraitImagesCached(trial)

            if (trial.brapiConfig) {
              this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(trial.brapiConfig)))
            } else {
              this.brapiConfig = {
                url: null,
                token: null
              }
            }
          })
      } else {
        this.brapiConfig = {
          url: null,
          token: null
        }
      }

      emitter.emit('trial-selected')
    },
    setMainDisplayMode: function (newMainDisplayMode) {
      this.mainDisplayMode = newMainDisplayMode
    },
    setDarkMode: function (newDarkMode) {
      this.darkMode = newDarkMode
    },
    setTheme: function (newTheme) {
      this.theme = newTheme

      if (newTheme !== 'system') {
        this.setDarkMode(newTheme === 'dark')
      }
    },
    setMapLayer: function (newMapLayer) {
      this.mapLayer = newMapLayer
    },
    setLocale: function (newLocale) {
      this.locale = newLocale
    },
    setHideCitationMessage: function (newHideCitationMessage) {
      this.hideCitationMessage = newHideCitationMessage
    },
    setHighlightControls: function (newHighlightControls) {
      this.highlightControls = newHighlightControls
    },
    setDisplayMarkerIndicators: function (newDisplayMarkerIndicators) {
      this.displayMarkerIndicators = newDisplayMarkerIndicators
    },
    setDisplayMinCellWidth: function (newDisplayMinCellWidth) {
      this.displayMinCellWidth = newDisplayMinCellWidth
    },
    setGpsEnabled: function (newGpsEnabled) {
      this.gpsEnabled = newGpsEnabled
    },
    setVoiceFeedbackEnabled: function (newVoiceFeedbackEnabled) {
      this.voiceFeedbackEnabled = newVoiceFeedbackEnabled
    },
    setCanvasDensity: function (newCanvasDensity) {
      this.canvasDensity = newCanvasDensity
    },
    setCanvasShape: function (newCanvasShape) {
      this.canvasShape = newCanvasShape
    },
    setCanvasSize: function (newCanvasSize) {
      this.canvasSize = newCanvasSize
    },
    setTrialListMode: function (newTrialListMode) {
      this.trialListMode = newTrialListMode
    },
    setTrialListArrangement: function (newTrialListArrangement) {
      this.trialListArrangement = newTrialListArrangement
    },
    setRestrictInputToMarked: function (newRestrictInputToMarked) {
      this.restrictInputToMarked = newRestrictInputToMarked
    },
    setNavigationMode: function (newNavigationMode) {
      this.navigationMode = newNavigationMode
    },
    setTraitColors: function (newTraitColors) {
      this.traitColors = newTraitColors
    },
    setHomeWidgetOrder: function (newHomeWidgetOrder) {
      this.homeWidgetOrder = newHomeWidgetOrder
    },
    setPlotDisplayField: function (newPlotDisplayField) {
      this.plotDisplayField = newPlotDisplayField
    },
    setPlausible: function (newPlausible) {
      this.plausible = newPlausible
    },
    setServerUrl: function (newServerUrl) {
      this.serverUrl = newServerUrl
    },
    setBrapiConfig: function (newBrapiConfig) {
      if (newBrapiConfig) {
        this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        this.brapiConfig = {
          url: null,
          token: null
        }
      }
    },
    setChangelogVersionNumber: function (newChangelogVersionNumber) {
      this.changelogVersionNumber = newChangelogVersionNumber
    },
    setDeviceConfig: function (newDeviceConfig) {
      this.deviceConfig = newDeviceConfig
    },
    setShowFullTraitDescription: function (newShowFullTraitDescription) {
      this.showFullTraitDescription = newShowFullTraitDescription
    },
    setLargeButtonsForIntTraits: function (newLargeButtonsForIntTraits) {
      this.largeButtonsForIntTraits = newLargeButtonsForIntTraits
    },
    setCategoryCountInline: function (newCategoryCountInline) {
      this.categoryCountInline = newCategoryCountInline
    }
  },
  persist: {
    key: name
  }
})
