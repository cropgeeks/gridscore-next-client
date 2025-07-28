import { defineStore } from 'pinia'
import { CANVAS_DENSITY_MEDIUM, CANVAS_SHAPE_CIRCLE, CANVAS_SIZE_MEDIUM, MAIN_DISPLAY_MODE_AUTO, NAVIGATION_MODE_DRAG, PLOT_DISPLAY_FIELD_DISPLAY_NAME, TRIAL_LIST_ALL, TRIAL_LIST_GRID } from '@/plugins/constants'
import { getTrialById } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'
import { ensureTraitImagesCached } from '@/plugins/traitcache'
import { BrapiConfig } from '@/plugins/types/gridscore'

export interface PlausibleConfig {
  plausibleDomain: string | null
  plausibleHashMode: boolean
  plausibleApiHost: string | null
}

let name = import.meta.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

export const coreStore = defineStore('core', {
  state: () => ({
    uniqueClientId: null as (string | null),
    runCount: 0,
    serverUrl: null as (string | null),
    locale: 'en-GB',
    darkMode: null as (boolean | null),
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
    selectedTrialPerson: null as (string | null),
    canvasDensity: CANVAS_DENSITY_MEDIUM,
    canvasShape: CANVAS_SHAPE_CIRCLE,
    canvasSize: CANVAS_SIZE_MEDIUM,
    selectedTrial: null as (string | null),
    mapLayer: 'theme',
    trialListMode: TRIAL_LIST_ALL,
    trialListArrangement: TRIAL_LIST_GRID,
    hiddenTraits: [] as string[],
    showFullTraitDescription: true,
    escapeBarcode: null as (string | null),
    enterBarcode: null as (string | null),
    autoSelectSearch: false,
    autoProgressInputs: true,
    categoryCountInline: 4,
    toolbarHiddenAfterInstallShown: false,
    mainDisplayMode: MAIN_DISPLAY_MODE_AUTO,
    plausible: {
      plausibleDomain: null,
      plausibleHashMode: true,
      plausibleApiHost: null
    } as PlausibleConfig,
    brapiConfig: {
      url: null,
      token: null
    },
    changelogVersionNumber: null as (string | null),
    deviceConfig: null as any
  }),
  getters: {
    storeUniqueClientId: (state): string | null => state.uniqueClientId,
    storeRunCount: (state): number => state.runCount,
    storeLocale: (state): string => (state.locale || 'en-GB').replace('_', '-'),
    storeCalendarLocale: (state): string => (state.locale || 'en-GB').replace('_', '-'),
    storeDarkMode: (state): boolean | null => state.darkMode,
    storeTheme: (state): string => state.theme || 'system',
    storeHideCitationMessage: (state): boolean => state.hideCitationMessage,
    storeHighlightControls: (state): boolean => state.highlightControls,
    storeDisplayMarkerIndicators: (state): boolean => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state): number => state.displayMinCellWidth,
    storeGpsEnabled: (state): boolean => state.gpsEnabled,
    storeVoiceFeedbackEnabled: (state): boolean => state.voiceFeedbackEnabled,
    storeRestrictInputToMarked: (state): boolean => state.restrictInputToMarked,
    storeNavigationMode: (state): string => state.navigationMode,
    storeTraitColors: (state): string[] => state.traitColors,
    storeHomeWidgetOrder: (state): string[] => state.homeWidgetOrder,
    storePlotDisplayField: (state): string => state.plotDisplayField,
    storeSelectedTrialPerson: (state): string | null => state.selectedTrialPerson,
    storeEscapeBarcode: (state): string | null => state.escapeBarcode,
    storeEnterBarcode: (state): string | null => state.enterBarcode,
    storeAutoSelectSearch: (state): boolean => state.autoSelectSearch,
    storeAutoProgressInputs: (state): boolean => state.autoProgressInputs,
    storeLargeButtonsForIntTraits: (state): boolean => state.largeButtonsForIntTraits,
    storeCanvasDensity: (state): string => state.canvasDensity,
    storeCanvasShape: (state): string => state.canvasShape,
    storeCanvasSize: (state): string => state.canvasSize,
    storeMainDisplayMode: (state): string => state.mainDisplayMode || MAIN_DISPLAY_MODE_AUTO,
    storeTrialListMode: (state): string => state.trialListMode,
    storeTrialListArrangement: (state): string => state.trialListArrangement,
    storeMapLayer: (state): string => state.mapLayer,
    storeSelectedTrial: (state): string | null => state.selectedTrial,
    storeHiddenTraits: (state): string[] => state.hiddenTraits,
    storePlausible: (state): PlausibleConfig => state.plausible,
    storeServerUrl: (state): string | null => state.serverUrl,
    storeBrapiConfig: (state): BrapiConfig => state.brapiConfig,
    storeChangelogVersionNumber: (state): string | null => state.changelogVersionNumber,
    storeDeviceConfig: (state): any => state.deviceConfig,
    storeShowFullTraitDescription: (state): boolean => state.showFullTraitDescription,
    storeCategoryCountInline: (state): number => state.categoryCountInline,
    storeToolbarHiddenAfterInstallShown: (state): boolean => state.toolbarHiddenAfterInstallShown,
  },
  actions: {
    setUniqueClientId: function (newUniqueClientId: string) {
      this.uniqueClientId = newUniqueClientId
    },
    setRunCount: function (newRunCount: number) {
      this.runCount = newRunCount
    },
    setHiddenTraits: function (newHiddenTraits: string[]) {
      this.hiddenTraits = newHiddenTraits
    },
    setSelectedTrialPerson: function (newSelectedTrialPerson: string | null) {
      this.selectedTrialPerson = newSelectedTrialPerson
    },
    setEscapeBarcode: function (newEscapeBarcode: string | null) {
      this.escapeBarcode = newEscapeBarcode
    },
    setEnterBarcode: function (newEnterBarcode: string | null) {
      this.enterBarcode = newEnterBarcode
    },
    setAutoSelectSearch: function (newAutoSelectSearch: boolean) {
      this.autoSelectSearch = newAutoSelectSearch
    },
    setAutoProgressInputs: function (newAutoProgressInputs: boolean) {
      this.autoProgressInputs = newAutoProgressInputs
    },
    setSelectedTrial: async function (newSelectedTrial: string) {
      /* Remember to reset everything here */
      const currentId = this.selectedTrial
      this.selectedTrial = newSelectedTrial
      this.hiddenTraits = []
      if (currentId !== newSelectedTrial) {
        this.selectedTrialPerson = null
      }

      if (newSelectedTrial) {
        const trial = await getTrialById(newSelectedTrial)
        ensureTraitImagesCached(trial)
        if (trial.brapiConfig) {
          this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(trial.brapiConfig)))
        } else {
          this.brapiConfig = {
            url: null,
            token: null
          }
        }
      } else {
        this.brapiConfig = {
          url: null,
          token: null
        }
      }

      emitter.emit('trial-selected')
    },
    setMainDisplayMode: function (newMainDisplayMode: string) {
      this.mainDisplayMode = newMainDisplayMode
    },
    setDarkMode: function (newDarkMode: boolean) {
      this.darkMode = newDarkMode
    },
    setTheme: function (newTheme: string) {
      this.theme = newTheme

      if (newTheme !== 'system') {
        this.setDarkMode(newTheme === 'dark')
      }
    },
    setMapLayer: function (newMapLayer: string) {
      this.mapLayer = newMapLayer
    },
    setLocale: function (newLocale: string) {
      this.locale = newLocale
    },
    setHideCitationMessage: function (newHideCitationMessage: boolean) {
      this.hideCitationMessage = newHideCitationMessage
    },
    setHighlightControls: function (newHighlightControls: boolean) {
      this.highlightControls = newHighlightControls
    },
    setDisplayMarkerIndicators: function (newDisplayMarkerIndicators: boolean) {
      this.displayMarkerIndicators = newDisplayMarkerIndicators
    },
    setDisplayMinCellWidth: function (newDisplayMinCellWidth: number) {
      this.displayMinCellWidth = newDisplayMinCellWidth
    },
    setGpsEnabled: function (newGpsEnabled: boolean) {
      this.gpsEnabled = newGpsEnabled
    },
    setVoiceFeedbackEnabled: function (newVoiceFeedbackEnabled: boolean) {
      this.voiceFeedbackEnabled = newVoiceFeedbackEnabled
    },
    setCanvasDensity: function (newCanvasDensity: string) {
      this.canvasDensity = newCanvasDensity
    },
    setCanvasShape: function (newCanvasShape: string) {
      this.canvasShape = newCanvasShape
    },
    setCanvasSize: function (newCanvasSize: string) {
      this.canvasSize = newCanvasSize
    },
    setTrialListMode: function (newTrialListMode: string) {
      this.trialListMode = newTrialListMode
    },
    setTrialListArrangement: function (newTrialListArrangement: string) {
      this.trialListArrangement = newTrialListArrangement
    },
    setRestrictInputToMarked: function (newRestrictInputToMarked: boolean) {
      this.restrictInputToMarked = newRestrictInputToMarked
    },
    setNavigationMode: function (newNavigationMode: string) {
      this.navigationMode = newNavigationMode
    },
    setTraitColors: function (newTraitColors: string[]) {
      this.traitColors = newTraitColors
    },
    setHomeWidgetOrder: function (newHomeWidgetOrder: string[]) {
      this.homeWidgetOrder = newHomeWidgetOrder
    },
    setPlotDisplayField: function (newPlotDisplayField: string) {
      this.plotDisplayField = newPlotDisplayField
    },
    setPlausible: function (newPlausible: PlausibleConfig) {
      this.plausible = newPlausible
    },
    setServerUrl: function (newServerUrl: string) {
      this.serverUrl = newServerUrl
    },
    setBrapiConfig: function (newBrapiConfig: BrapiConfig) {
      if (newBrapiConfig) {
        this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        this.brapiConfig = {
          url: null,
          token: null
        }
      }
    },
    setChangelogVersionNumber: function (newChangelogVersionNumber: string) {
      this.changelogVersionNumber = newChangelogVersionNumber
    },
    setDeviceConfig: function (newDeviceConfig: any) {
      this.deviceConfig = newDeviceConfig
    },
    setShowFullTraitDescription: function (newShowFullTraitDescription: boolean) {
      this.showFullTraitDescription = newShowFullTraitDescription
    },
    setLargeButtonsForIntTraits: function (newLargeButtonsForIntTraits: boolean) {
      this.largeButtonsForIntTraits = newLargeButtonsForIntTraits
    },
    setCategoryCountInline: function (newCategoryCountInline: number) {
      this.categoryCountInline = newCategoryCountInline
    },
    setToolbarHiddenAfterInstallShown: function (newToolbarHiddenAfterInstallShown: boolean) {
      this.toolbarHiddenAfterInstallShown = newToolbarHiddenAfterInstallShown
    }
  },
  persist: {
    key: name
  }
})
