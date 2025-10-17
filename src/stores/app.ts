// Utilities
import { defineStore } from 'pinia'
import { getTrialById } from '@/plugins/idb'
import { CanvasDensity, CanvasShape, CanvasSize, MainDisplayMode, NavigationMode, PlotDisplayField, TrialListMode, TrialListType } from '@/plugins/types/client'
import type { BrapiConfig } from '@/plugins/types/gridscore'
import { ensureTraitImagesCached } from '@/plugins/traitcache'
import { loadTrialData } from '@/plugins/datastore'
import { THEME_COLORS } from '@/plugins/color'
import { getVuetify } from '@/plugins/vuetify'

export interface PlausibleConfig {
  plausibleDomain: string | undefined
  plausibleHashMode: boolean
  plausibleApiHost: string | undefined
}

let name = import.meta.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

export const coreStore = defineStore('core', {
  state: () => ({
    rippleEnabled: true,
    transitionsEnabled: 'yes' as 'yes' | 'no',
    themeColor: THEME_COLORS[0] as string,
    uniqueClientId: null as (string | null),
    runCount: 0,
    serverUrl: null as (string | null),
    locale: 'en-GB',
    darkMode: null as (boolean | null),
    systemTheme: 'dark',
    theme: 'system',
    hideCitationMessage: false,
    highlightControls: true,
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
    trialListMode: TrialListMode.ALL as TrialListMode,
    trialListArrangement: TrialListType.GRID as TrialListType,
    hiddenTraits: [] as string[],
    showFullTraitDescription: true,
    escapeBarcode: null as (string | null),
    enterBarcode: null as (string | null),
    autoSelectSearch: false,
    autoProgressInputs: true,
    categoryCountInline: 4,
    toolbarHiddenAfterInstallShown: false,
    mainDisplayMode: MainDisplayMode.AUTO as MainDisplayMode,
    plausible: {
      plausibleDomain: undefined,
      plausibleHashMode: true,
      plausibleApiHost: undefined,
    } as PlausibleConfig,
    brapiConfig: {
      url: null,
      token: null,
    },
    changelogVersionNumber: undefined as (string | undefined),
    deviceConfig: null as any,
  }),
  getters: {
    storePerformanceMode: (state): boolean => state.rippleEnabled === false && state.transitionsEnabled === 'no',
    storeRippleEnabled: (state): boolean => state.rippleEnabled,
    storeTransitionsEnabled: (state): 'yes' | 'no' => state.transitionsEnabled,
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
    storeHighlightControls: (state): boolean => state.highlightControls,
    storeDisplayMarkerIndicators: (state): boolean => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state): number => state.displayMinCellWidth,
    storeGpsEnabled: (state): boolean => state.gpsEnabled,
    storeVoiceFeedbackEnabled: (state): boolean => state.voiceFeedbackEnabled,
    storeRestrictInputToMarked: (state): boolean => state.restrictInputToMarked,
    storeNavigationMode: (state): NavigationMode => state.navigationMode,
    storeTraitColors: (state): string[] => state.traitColors,
    storeHomeWidgetOrder: (state): string[] => state.homeWidgetOrder,
    storePlotDisplayField: (state): PlotDisplayField => state.plotDisplayField,
    storeSelectedTrialPerson: (state): string | undefined => state.selectedTrialPerson,
    storeEscapeBarcode: (state): string | null => state.escapeBarcode,
    storeEnterBarcode: (state): string | null => state.enterBarcode,
    storeAutoSelectSearch: (state): boolean => state.autoSelectSearch,
    storeAutoProgressInputs: (state): boolean => state.autoProgressInputs,
    storeLargeButtonsForIntTraits: (state): boolean => state.largeButtonsForIntTraits,
    storeCanvasDensity: (state): CanvasDensity => state.canvasDensity,
    storeCanvasShape: (state): CanvasShape => state.canvasShape,
    storeCanvasSize: (state): CanvasSize => state.canvasSize,
    storeMainDisplayMode: (state): MainDisplayMode => state.mainDisplayMode || MainDisplayMode.AUTO,
    storeTrialListMode: (state): TrialListMode => state.trialListMode,
    storeTrialListArrangement: (state): TrialListType => state.trialListArrangement,
    storeMapLayer: (state): string => state.mapLayer,
    storeSelectedTrial: (state): string | undefined => state.selectedTrial,
    storeHiddenTraits: (state): string[] => state.hiddenTraits,
    storePlausible: (state): PlausibleConfig => state.plausible,
    storeServerUrl: (state): string | null => state.serverUrl,
    storeBrapiConfig: (state): BrapiConfig => state.brapiConfig,
    storeChangelogVersionNumber: (state): string | undefined => state.changelogVersionNumber,
    storeDeviceConfig: (state): any => state.deviceConfig,
    storeShowFullTraitDescription: (state): boolean => state.showFullTraitDescription,
    storeCategoryCountInline: (state): number => state.categoryCountInline,
    storeToolbarHiddenAfterInstallShown: (state): boolean => state.toolbarHiddenAfterInstallShown,
  },
  actions: {
    setPerformanceMode (newPerformanceMode: boolean) {
      this.rippleEnabled = newPerformanceMode === false
      this.transitionsEnabled = newPerformanceMode === false ? 'yes' : 'no'
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
    setRunCount (newRunCount: number) {
      this.runCount = newRunCount
    },
    setHiddenTraits (newHiddenTraits: string[]) {
      this.hiddenTraits = newHiddenTraits
    },
    setSelectedTrialPerson (newSelectedTrialPerson: string | undefined) {
      this.selectedTrialPerson = newSelectedTrialPerson
    },
    setEscapeBarcode (newEscapeBarcode: string | null) {
      this.escapeBarcode = newEscapeBarcode
    },
    setEnterBarcode (newEnterBarcode: string | null) {
      this.enterBarcode = newEnterBarcode
    },
    setAutoSelectSearch (newAutoSelectSearch: boolean) {
      this.autoSelectSearch = newAutoSelectSearch
    },
    setAutoProgressInputs (newAutoProgressInputs: boolean) {
      this.autoProgressInputs = newAutoProgressInputs
    },
    async setSelectedTrial (newSelectedTrial: string | undefined) {
      /* Remember to reset everything here */
      const currentId = this.selectedTrial
      this.selectedTrial = newSelectedTrial
      this.hiddenTraits = []
      if (currentId !== newSelectedTrial) {
        this.selectedTrialPerson = undefined
      }

      if (newSelectedTrial) {
        const trial = await getTrialById(newSelectedTrial)
        ensureTraitImagesCached(trial)
        if (trial.brapiConfig) {
          this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(trial.brapiConfig)))
        } else {
          this.brapiConfig = {
            url: null,
            token: null,
          }
        }
      } else {
        this.brapiConfig = {
          url: null,
          token: null,
        }
      }

      await loadTrialData()
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
    setHighlightControls (newHighlightControls: boolean) {
      this.highlightControls = newHighlightControls
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
        this.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        this.brapiConfig = {
          url: null,
          token: null,
        }
      }
    },
    setChangelogVersionNumber (newChangelogVersionNumber: string) {
      this.changelogVersionNumber = newChangelogVersionNumber
    },
    setDeviceConfig (newDeviceConfig: any) {
      this.deviceConfig = newDeviceConfig
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
    setToolbarHiddenAfterInstallShown (newToolbarHiddenAfterInstallShown: boolean) {
      this.toolbarHiddenAfterInstallShown = newToolbarHiddenAfterInstallShown
    },
  },
  persist: {
    key: name,
  },
})
