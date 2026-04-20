// Utilities
import { defineStore } from 'pinia'
import { getTrialById } from '@/plugins/idb'
import { CanvasDensity, CanvasShape, CanvasSize, MainDisplayMode, NavigationMode, PlotDisplayField, TraitGroupMode, TrialListMode, TrialListType } from '@/plugins/types/client'
import type { BrapiConfig } from '@/plugins/types/gridscore'
import { ensureTraitImagesCached } from '@/plugins/traitcache'
import { loadTrialData } from '@/plugins/datastore'
import { THEME_COLORS } from '@/plugins/color'
import { getVuetify } from '@/plugins/vuetify'
// import { useTrial } from '@/plugins/composition/useTrial'

export interface PlausibleConfig {
  plausibleDomain: string | undefined
  plausibleHashMode: boolean
  plausibleApiHost: string | undefined
}

export interface HighlightConfig {
  type: 'controls' | 'reps' | 'germplasm' | 'treatments' | 'bookmarks' | 'previous' | undefined
  germplasm?: string
  treatments?: string[]
  reps?: string[]
}

export interface RowColumn {
  row: number
  column: number
}

// const { reloadTrial } = useTrial()

let name = import.meta.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

export const coreStore = defineStore('core', {
  state: () => ({
    rippleEnabled: undefined as boolean | undefined,
    transitionsEnabled: undefined as boolean | undefined,
    mediaMode: undefined as 'image' | 'video' | undefined,
    themeColor: ((THEME_COLORS && THEME_COLORS[0]) ? THEME_COLORS[0].hex : '#00a0f1') as string,
    uniqueClientId: null as (string | null),
    runCount: 0,
    serverUrl: null as (string | null),
    locale: 'en-GB',
    darkMode: null as (boolean | null),
    systemTheme: 'dark',
    theme: 'light',
    hideCitationMessage: false,
    hideHelpInformation: false,
    highlightControls: true,
    highlightConfig: {
      type: undefined,
    } as HighlightConfig,
    displayMarkerIndicators: true,
    displayMinCellWidth: 4,
    gpsEnabled: true,
    voiceFeedbackEnabled: false,
    restrictInputToMarked: false,
    largeButtonsForIntTraits: false,
    navigationMode: NavigationMode.DRAG as NavigationMode,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
    homeWidgetOrder: ['banners', 'trials'],
    plotDisplayField: PlotDisplayField.DISPLAY_NAME as PlotDisplayField,
    selectedTrialPerson: undefined as (string | undefined),
    canvasDensity: CanvasDensity.MEDIUM as CanvasDensity,
    canvasShape: CanvasShape.CIRCLE as CanvasShape,
    canvasSize: CanvasSize.MEDIUM as CanvasSize,
    selectedTrial: undefined as (string | undefined),
    mapLayer: 'theme',
    traitGroupMode: TraitGroupMode.SECTIONS as TraitGroupMode,
    trialListMode: TrialListMode.ALL as TrialListMode,
    trialListArrangement: TrialListType.GRID as TrialListType,
    trialShowDetails: true,
    hideTraitCircles: true,
    hiddenTraits: [] as string[],
    previouslyScoredPlot: undefined as (RowColumn | undefined),
    showFullTraitDescription: true,
    escapeBarcode: undefined as (string | undefined),
    enterBarcode: undefined as (string | undefined),
    autoSelectSearch: false,
    serverMessagesCheckedOn: undefined as (string | undefined),
    autoSelectFirstInput: true,
    autoProgressInputs: true,
    categoryCountInline: 4,
    mainDisplayMode: MainDisplayMode.AUTO as MainDisplayMode,
    plausible: {
      plausibleDomain: undefined,
      plausibleHashMode: true,
      plausibleApiHost: undefined,
    } as PlausibleConfig,
    brapiConfig: {
      url: undefined,
      token: undefined,
    },
    changelogVersionNumber: undefined as (string | undefined),
    deviceConfig: undefined as any | undefined,
  }),
  getters: {
    storePerformanceMode: (state): boolean => state.rippleEnabled === false && state.transitionsEnabled === false,
    storeRippleEnabled: (state): boolean | undefined => state.rippleEnabled,
    storeTransitionsEnabled: (state): boolean | undefined => state.transitionsEnabled,
    storeMediaMode: (state): 'image' | 'video' | undefined => state.mediaMode,
    storeThemeColor: (state): string => state.themeColor,
    storeUniqueClientId: (state): string | null => state.uniqueClientId,
    storeRunCount: (state): number => state.runCount,
    storeLocale: (state): string => (state.locale || 'en-GB').replace('_', '-'),
    storeCalendarLocale: (state): string => (state.locale || 'en-GB').replace('_', '-'),
    storeDarkMode: (state): boolean | null => state.darkMode,
    storeTheme: (state): string => state.theme,
    storeIsDarkMode: (state): boolean => (state.theme === 'system' ? state.systemTheme : state.theme) === 'dark',
    storeSystemTheme: (state): string => state.systemTheme || 'dark',
    storeHideCitationMessage: (state): boolean => state.hideCitationMessage,
    storeHideHelpInformation: (state): boolean => state.hideHelpInformation || false,
    storeHighlightControls: (state): boolean => state.highlightControls,
    storeHighlightConfig: (state): HighlightConfig => state.highlightConfig,
    storeDisplayMarkerIndicators: (state): boolean => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state): number => state.displayMinCellWidth,
    storeGpsEnabled: (state): boolean => state.gpsEnabled,
    storeTraitGroupMode: (state): TraitGroupMode => state.traitGroupMode,
    storeVoiceFeedbackEnabled: (state): boolean => state.voiceFeedbackEnabled,
    storeRestrictInputToMarked: (state): boolean => state.restrictInputToMarked,
    storeNavigationMode: (state): NavigationMode => state.navigationMode,
    storeTraitColors: (state): string[] => state.traitColors,
    storeHomeWidgetOrder: (state): string[] => state.homeWidgetOrder,
    storePlotDisplayField: (state): PlotDisplayField => state.plotDisplayField,
    storeServerMessagesCheckedOn: (state): string | undefined => state.serverMessagesCheckedOn,
    storeSelectedTrialPerson: (state): string | undefined => state.selectedTrialPerson,
    storeEscapeBarcode: (state): string | undefined => state.escapeBarcode,
    storeEnterBarcode: (state): string | undefined => state.enterBarcode,
    storeAutoSelectSearch: (state): boolean => state.autoSelectSearch,
    storeAutoSelectFirstInput: (state): boolean => state.autoSelectFirstInput,
    storeAutoProgressInputs: (state): boolean => state.autoProgressInputs,
    storeLargeButtonsForIntTraits: (state): boolean => state.largeButtonsForIntTraits,
    storeCanvasDensity: (state): CanvasDensity => state.canvasDensity,
    storeCanvasShape: (state): CanvasShape => state.canvasShape,
    storeCanvasSize: (state): CanvasSize => state.canvasSize,
    storeMainDisplayMode: (state): MainDisplayMode => state.mainDisplayMode || MainDisplayMode.AUTO,
    storeTrialShowDetails: (state): boolean => state.trialShowDetails,
    storeTrialListMode: (state): TrialListMode => state.trialListMode,
    storeTrialListArrangement: (state): TrialListType => state.trialListArrangement,
    storeMapLayer: (state): string => state.mapLayer,
    storeSelectedTrial: (state): string | undefined => state.selectedTrial,
    storeHideTraitCircles: (state): boolean => state.hideTraitCircles || false,
    storeHiddenTraits: (state): string[] => state.hiddenTraits,
    storePreviouslyScoredPlot: (state): RowColumn | undefined => state.previouslyScoredPlot,
    storePlausible: (state): PlausibleConfig => state.plausible,
    storeServerUrl: (state): string | null => state.serverUrl,
    storeBrapiConfig: (state): BrapiConfig => state.brapiConfig,
    storeChangelogVersionNumber: (state): string | undefined => state.changelogVersionNumber,
    storeDeviceConfig: (state): any | undefined => state.deviceConfig,
    storeShowFullTraitDescription: (state): boolean => state.showFullTraitDescription,
    storeCategoryCountInline: (state): number => state.categoryCountInline,
  },
  actions: {
    setPerformanceMode (newPerformanceMode: boolean) {
      this.rippleEnabled = newPerformanceMode === false
      this.transitionsEnabled = newPerformanceMode === false
      this.mainDisplayMode = newPerformanceMode === false ? MainDisplayMode.AUTO : MainDisplayMode.CANVAS_ONLY
    },
    setSystemTheme (newSystemTheme: string) {
      this.systemTheme = newSystemTheme
    },
    setThemeColor (newThemeColor: string) {
      this.themeColor = newThemeColor

      const vuetify = getVuetify()

      if (vuetify.theme.themes.value.light) {
        vuetify.theme.themes.value.light.colors.primary = newThemeColor
      }
      if (vuetify.theme.themes.value.dark) {
        vuetify.theme.themes.value.dark.colors.primary = newThemeColor
      }
    },
    setUniqueClientId (newUniqueClientId: string) {
      this.uniqueClientId = newUniqueClientId
    },
    setMediaMode (newMediaMode: 'image' | 'video' | undefined) {
      this.mediaMode = newMediaMode
    },
    setRunCount (newRunCount: number) {
      this.runCount = newRunCount
    },
    setHideTraitCircles (newHideTraitCircles: boolean) {
      this.hideTraitCircles = newHideTraitCircles
    },
    setPreviouslyScoredPlot (newPreviouslyScoredPlot: RowColumn | undefined) {
      this.previouslyScoredPlot = newPreviouslyScoredPlot
    },
    setTraitGroupMode (newTraitGroupMode: TraitGroupMode) {
      this.traitGroupMode = newTraitGroupMode
    },
    setHiddenTraits (newHiddenTraits: string[]) {
      this.hiddenTraits = newHiddenTraits
    },
    setSelectedTrialPerson (newSelectedTrialPerson: string | undefined) {
      this.selectedTrialPerson = newSelectedTrialPerson
    },
    setEscapeBarcode (newEscapeBarcode: string | undefined) {
      this.escapeBarcode = newEscapeBarcode
    },
    setServerMessagesCheckedOn (newStoreServerMessagesCheckedOn: string | undefined) {
      this.serverMessagesCheckedOn = newStoreServerMessagesCheckedOn
    },
    setEnterBarcode (newEnterBarcode: string | undefined) {
      this.enterBarcode = newEnterBarcode
    },
    setAutoSelectSearch (newAutoSelectSearch: boolean) {
      this.autoSelectSearch = newAutoSelectSearch
    },
    setAutoSelectFirstInput (newAutoSelectFirstInput: boolean) {
      this.autoSelectFirstInput = newAutoSelectFirstInput
    },
    setAutoProgressInputs (newAutoProgressInputs: boolean) {
      this.autoProgressInputs = newAutoProgressInputs
    },
    async setSelectedTrial (newSelectedTrial: string | undefined) {
      /* Remember to reset everything here */
      const currentId = this.selectedTrial
      this.mediaMode = undefined
      this.selectedTrial = newSelectedTrial

      if (currentId !== newSelectedTrial) {
        this.hiddenTraits = []
        this.hideTraitCircles = false
        this.selectedTrialPerson = undefined
        this.previouslyScoredPlot = undefined
        this.highlightConfig = {
          type: undefined,
          germplasm: undefined,
          reps: undefined,
          treatments: undefined,
        }
      }

      if (newSelectedTrial) {
        const trial = await getTrialById(newSelectedTrial)
        ensureTraitImagesCached(trial)
        if (trial.brapiConfig) {
          this.brapiConfig = Object.assign({ url: undefined, token: undefined }, JSON.parse(JSON.stringify(trial.brapiConfig)))
        } else {
          this.brapiConfig = {
            url: undefined,
            token: undefined,
          }
        }
      } else {
        this.brapiConfig = {
          url: undefined,
          token: undefined,
        }
      }

      await loadTrialData()
      // await reloadTrial()
      // emitter.emit('trial-selected')
    },
    setMainDisplayMode (newMainDisplayMode: MainDisplayMode) {
      this.mainDisplayMode = newMainDisplayMode
    },
    setDarkMode (newDarkMode: boolean) {
      this.darkMode = newDarkMode
    },
    setTheme (newTheme: string) {
      this.theme = newTheme

      if (newTheme !== 'system') {
        this.setDarkMode(newTheme === 'dark')
      }
    },
    setMapLayer (newMapLayer: string) {
      this.mapLayer = newMapLayer
    },
    setLocale (newLocale: string) {
      this.locale = newLocale
    },
    setHideCitationMessage (newHideCitationMessage: boolean) {
      this.hideCitationMessage = newHideCitationMessage
    },
    setHideHelpInformation (newHideHelpInformation: boolean) {
      this.hideHelpInformation = newHideHelpInformation
    },
    setHighlightControls (newHighlightControls: boolean) {
      this.highlightControls = newHighlightControls
    },
    setHighlightConfig (newHighlightConfig: HighlightConfig) {
      this.highlightConfig = Object.assign({
        type: undefined,
        reps: undefined,
        treatments: undefined,
        germplasm: undefined,
      }, newHighlightConfig)
    },
    setDisplayMarkerIndicators (newDisplayMarkerIndicators: boolean) {
      this.displayMarkerIndicators = newDisplayMarkerIndicators
    },
    setDisplayMinCellWidth (newDisplayMinCellWidth: number) {
      this.displayMinCellWidth = newDisplayMinCellWidth
    },
    setGpsEnabled (newGpsEnabled: boolean) {
      this.gpsEnabled = newGpsEnabled
    },
    setVoiceFeedbackEnabled (newVoiceFeedbackEnabled: boolean) {
      this.voiceFeedbackEnabled = newVoiceFeedbackEnabled
    },
    setCanvasDensity (newCanvasDensity: CanvasDensity) {
      this.canvasDensity = newCanvasDensity
    },
    setCanvasShape (newCanvasShape: CanvasShape) {
      this.canvasShape = newCanvasShape
    },
    setCanvasSize (newCanvasSize: CanvasSize) {
      this.canvasSize = newCanvasSize
    },
    setTrialShowDetails (newTrialShowDetails: boolean) {
      this.trialShowDetails = newTrialShowDetails
    },
    setTrialListMode (newTrialListMode: TrialListMode) {
      this.trialListMode = newTrialListMode
    },
    setTrialListArrangement (newTrialListArrangement: TrialListType) {
      this.trialListArrangement = newTrialListArrangement
    },
    setRestrictInputToMarked (newRestrictInputToMarked: boolean) {
      this.restrictInputToMarked = newRestrictInputToMarked
    },
    setNavigationMode (newNavigationMode: NavigationMode) {
      this.navigationMode = newNavigationMode
    },
    setTraitColors (newTraitColors: string[]) {
      this.traitColors = newTraitColors
    },
    setHomeWidgetOrder (newHomeWidgetOrder: string[]) {
      this.homeWidgetOrder = newHomeWidgetOrder
    },
    setPlotDisplayField (newPlotDisplayField: PlotDisplayField) {
      this.plotDisplayField = newPlotDisplayField
    },
    setPlausible (newPlausible: PlausibleConfig) {
      this.plausible = newPlausible
    },
    setServerUrl (newServerUrl: string) {
      this.serverUrl = newServerUrl
    },
    setBrapiConfig (newBrapiConfig: BrapiConfig) {
      if (newBrapiConfig) {
        this.brapiConfig = Object.assign({ url: undefined, token: undefined }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        this.brapiConfig = {
          url: undefined,
          token: undefined,
        }
      }
    },
    setChangelogVersionNumber (newChangelogVersionNumber: string) {
      this.changelogVersionNumber = newChangelogVersionNumber
    },
    setDeviceConfig (newDeviceConfig: any | undefined) {
      this.deviceConfig = newDeviceConfig

      if (newDeviceConfig && (this.storeRippleEnabled === undefined || this.storeTransitionsEnabled === undefined)) {
        this.setPerformanceMode(newDeviceConfig.device.type === 'mobile' || newDeviceConfig.device.type === 'tablet')
      }
    },
    setShowFullTraitDescription (newShowFullTraitDescription: boolean) {
      this.showFullTraitDescription = newShowFullTraitDescription
    },
    setLargeButtonsForIntTraits (newLargeButtonsForIntTraits: boolean) {
      this.largeButtonsForIntTraits = newLargeButtonsForIntTraits
    },
    setCategoryCountInline (newCategoryCountInline: number) {
      this.categoryCountInline = newCategoryCountInline
    },
  },
  persist: {
    key: name,
  },
})
