<template>
  <v-container>
    <div class="d-flex flex-wrap justify-space-between">
      <h1 class="text-h4 mb-3">{{ $t('pageSettingsTitle') }}</h1>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" :text="$t('buttonImportExport')" :prepend-icon="mdiShare" />
        </template>

        <v-list>
          <v-list-item :title="$t('tabTitleSettingsShareExport')" :prepend-icon="mdiExport" @click="share('export')" />
          <v-list-item :title="$t('tabTitleSettingsShareImport')" :prepend-icon="mdiImport" @click="share('import')" />
        </v-list>
      </v-menu>
    </div>
    <v-divider class="mb-3" />
    <p>{{ $t('pageSettingsText') }}</p>

    <v-row>
      <v-col>
        <v-card class="mb-5" :title="$t('pageSettingsCardGeneralTitle')">
          <template #subtitle>
            <span class="text-wrap">{{ $t('pageSettingsCardGeneralSubtitle') }}</span>
          </template>

          <template #text>
            <h4 class="mt-3">{{ $t('formLabelSettingsPrimaryColor') }}</h4>
            <p>{{ $t('formDescriptionSettingsPrimaryColor') }}</p>

            <v-row>
              <v-col v-for="color in THEME_COLORS" :key="`theme-color-${color}`">
                <v-sheet v-ripple height="75" rounded class="theme-color d-flex justify-center align-center text-center pa-4" :color="color.hex" :border="store.storeThemeColor === color.hex ? 'lg' : undefined" @click="notifyThemeColor(color.hex)">
                  {{ color.name }}
                </v-sheet>
              </v-col>
            </v-row>

            <v-select
              v-model="locale"
              :items="locales"
              item-value="locale"
              item-title="name"
              class="mt-3"
              :label="$t('formLabelSettingsLocale')"
              :hint="$t('formDescriptionSettingsLocale')"
              persistent-hint
            />

            <h4 class="mt-3">{{ $t('formLabelSettingsTheme') }}</h4>
            <p>{{ $t('formDescriptionSettingsTheme') }}</p>

            <v-btn-toggle mandatory v-model="theme" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :prepend-icon="mdiWhiteBalanceSunny" value="light" :text="$t('menuItemThemeLight')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'light'" /></template></v-btn>
              <v-btn class="flex-grow-1" :prepend-icon="mdiWeatherNight" value="dark" :text="$t('menuItemThemeDark')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'dark'" /></template></v-btn>
              <v-btn class="flex-grow-1" :prepend-icon="mdiBrightnessAuto" value="system" :text="$t('menuItemThemeSystem')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'system'" /></template></v-btn>
            </v-btn-toggle>

            <h4 class="mt-3">{{ $t('formLabelSettingsPerformanceMode') }}</h4>
            <p>{{ $t('formDescriptionSettingsPerformanceMode') }}</p>

            <v-btn-toggle mandatory v-model="performanceMode" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :prepend-icon="mdiLeaf" :value="true" :text="$t('genericEnabled')"><template #append><v-icon :icon="mdiCheck" v-if="store.storePerformanceMode === true" /></template></v-btn>
              <v-btn class="flex-grow-1" :prepend-icon="mdiSpeedometer" :value="false" :text="$t('genericDisabled')"><template #append><v-icon :icon="mdiCheck" v-if="store.storePerformanceMode === false" /></template></v-btn>
            </v-btn-toggle>

            <v-switch
              :label="$t('formLabelSettingsHideHelp')"
              :hint="$t('formDescriptionSettingsHideHelp')"
              persistent-hint
              color="primary"
              v-model="hideHelpInformation"
            />

            <h4 class="mt-3">{{ $t('formLabelSettingsWidgetOrder') }}</h4>
            <p>{{ $t('formDescriptionSettingsWidgetOrder') }}</p>
            <draggable :list="homeWidgetOrder" item-key="id" handle=".drag-handle" id="home-widget-list">
              <template #item="{ element }">
                <v-list-item :title="homeWidgetOptions[element.value].name" :subtitle="homeWidgetOptions[element.value].description">
                  <template #append>
                    <v-icon class="drag-handle" :icon="mdiDrag" />
                  </template>
                </v-list-item>
              </template>
            </draggable>
          </template>
        </v-card>

        <v-card class="mb-5" :title="$t('pageSettingsCardDataCollectionTitle')">
          <template #subtitle>
            <span class="text-wrap">{{ $t('pageSettingsCardDataCollectionSubtitle') }}</span>
          </template>

          <template #text>
            <v-switch
              :label="$t('formLabelSettingsUseGps')"
              :hint="$t('formDescriptionSettingsUseGps')"
              persistent-hint
              v-model="gpsEnabled"
              color="primary"
            />

            <h4 class="mt-3">{{ $t('formLabelSettingsNavigationMode') }}</h4>
            <p>{{ $t('formDescriptionSettingsNavigationMode') }}</p>

            <v-btn-toggle mandatory v-model="navigationMode" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :prepend-icon="mdiGestureTap" :value="NavigationMode.DRAG" :text="$t('buttonNavModeDrag')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeNavigationMode === NavigationMode.DRAG" /></template></v-btn>
              <v-btn class="flex-grow-1" :prepend-icon="mdiCursorMove" :value="NavigationMode.JUMP" :text="$t('buttonNavModeJump')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeNavigationMode === NavigationMode.JUMP" /></template></v-btn>
            </v-btn-toggle>

            <div class="text-subtitle-2 mt-3">{{ $t('formLabelSettingsCategoryCountInline') }}</div>
            <v-slider
              v-model="categoryCountInline"
              :hint="$t('formDescriptionSettingsCategoryCountInline')"
              persistent-hint
              color="primary"
              @wheel="$event.target.blur()"
              thumb-label
              :min="2"
              :max="10"
              :step="1"
              ref="input"
            >
              <template #append>
                <!-- @vue-ignore -->
                <v-number-input
                  v-model="categoryCountInline"
                  density="compact"
                  width="100"
                  :min="2"
                  :max="10"
                  :step="1"
                  autocomplete="off"
                  control-variant="stacked"
                  variant="outlined"
                  hide-details
                />
              </template>
            </v-slider>

            <v-switch
              :label="$t('formLabelSettingsVoiceFeedback')"
              :hint="$t('formDescriptionSettingsVoiceFeedback')"
              persistent-hint
              color="primary"
              v-model="voiceFeedbackEnabled"
            />

            <v-switch
              :label="$t('formLabelSettingsRestrictInputToMarked')"
              :hint="$t('formDescriptionSettingsRestrictInputToMarked')"
              persistent-hint
              color="primary"
              v-model="restrictInputToMarked"
            />

            <v-switch
              :label="$t('formLabelSettingsAutoSelectSearch')"
              :hint="$t('formDescriptionSettingsAutoSelectSearch')"
              persistent-hint
              color="primary"
              v-model="autoSelectSearch"
            />

            <v-switch
              :label="$t('formLabelSettingsAutoSelectFirstInput')"
              :hint="$t('formDescriptionSettingsAutoSelectFirstInput')"
              persistent-hint
              color="primary"
              v-model="autoSelectFirstInput"
            />

            <v-switch
              :label="$t('formLabelSettingsAutoProgressInputs')"
              :hint="$t('formDescriptionSettingsAutoProgressInputs')"
              persistent-hint
              color="primary"
              v-model="autoProgressInputs"
            />

            <div class="mt-3">
              <QRScanInput
                v-model="enterBarcode"
                clearable
                :label="$t('formLabelSettingsEnterBarcode')"
                :hint="$t('formDescriptionSettingsEnterBarcode')"
                :formats="['qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e', 'ean_13']"
                :tooltip="$t('tooltipScanQRCode')"
                scan-in-bottom-sheet
              />

              <QRScanInput
                v-model="escapeBarcode"
                clearable
                :label="$t('formLabelSettingsEscapeBarcode')"
                :hint="$t('formDescriptionSettingsEscapeBarcode')"
                :formats="['qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e', 'ean_13']"
                :tooltip="$t('tooltipScanQRCode')"
                scan-in-bottom-sheet
              />
            </div>
          </template>
        </v-card>
      </v-col>
      <v-col>
        <v-card class="mb-5" :title="$t('pageSettingsCardVisualTitle')">
          <template #subtitle><span class="text-wrap">{{ $t('pageSettingsCardVisualSubtitle') }}</span></template>

          <template #text>
            <h4 class="mt-3">{{ $t('formLabelSettingsTraitColors') }}</h4>
            <p>{{ $t('formDescriptionSettingsTraitColors') }}</p>

            <v-btn :prepend-icon="mdiUndoVariant" :text="$t('tooltipSettingsResetColors')" @click="setTraitColors(categoricalColors.GridScoreDefault)" />

            <v-chip-group class="mt-3" column v-model="currentTraitIndex">
              <v-chip
                label
                :color="color"
                class="me-2 mb-2"
                :text="color"
                type="color"
                v-for="(color, index) in traitColors"
                :key="`trait-color-${index}-${color}`"
                :disabled="traitColors.length < 2"
                @click="changeColor(index)"
              >
                <template #prepend>
                  <v-icon :icon="isSquare ? mdiSquare : mdiCircle" :color="color" />
                </template>
                <template #close><v-icon :icon="mdiCloseCircle" @click.stop="deleteColor(index)" /></template>
              </v-chip>
            </v-chip-group>

            <h4 class="mt-3">{{ $t('formLabelSettingsTraitColorAdd') }}</h4>
            <p>{{ $t('formDescriptionSettingsTraitColorAdd') }}</p>
            <v-color-picker v-model="currentTraitColor" mode="hex" :modes="['hex']" />

            <v-btn :text="$t(currentTraitIndex !== undefined ? 'buttonUpdate' : 'buttonAdd')" :prepend-icon="mdiPlus" class="mt-3" color="primary" @click="addColor" />

            <h4 class="mt-3">{{ $t('formLabelSettingsTraitColorPreset') }}</h4>
            <p>{{ $t('formDescriptionSettingsTraitColorPreset') }}</p>

            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" :text="$t('dropdownSettingsTraitColorPreset')" :prepend-icon="mdiPaletteSwatch" :append-icon="mdiMenuDown" />
              </template>

              <v-list>
                <template v-for="(palette, key) in categoricalColors" :key="`palette-${key}`">
                  <v-list-item :title="key" @click="setTraitColors(palette)">
                    <v-list-item-subtitle opacity="1">
                      <div class="d-flex flex-row gradient">
                        <div v-for="color in palette" :key="`color-preset-${key}-${color}`" :style="{ background: color }" />
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-list>
            </v-menu>

            <v-switch
              :label="$t('formLabelSettingsDisplayMarkerIndicators')"
              :hint="$t('formDescriptionSettingsDisplayMarkerIndicators')"
              persistent-hint
              color="primary"
              v-model="displayMarkerIndicators"
            />

            <v-switch
              :label="$t('formLabelSettingsShowFullTraitDescription')"
              :hint="$t('formDescriptionSettingsShowFullTraitDescription')"
              persistent-hint
              color="primary"
              v-model="showFullTraitDescription"
            />

            <v-switch
              :label="$t('formLabelSettingsLargeButtonsForIntTraits')"
              :hint="$t('formDescriptionSettingsLargeButtonsForIntTraits')"
              persistent-hint
              color="primary"
              v-model="largeButtonsForIntTraits"
            />

            <div class="text-subtitle-2 mt-3">{{ $t('formLabelSettingsMinCellWidth') }}</div>
            <v-slider
              v-model="displayMinCellWidth"
              :hint="$t('formDescriptionSettingsMinCellWidth')"
              persistent-hint
              color="primary"
              @wheel="$event.target.blur()"
              thumb-label
              :min="2"
              :max="10"
              :step="1"
              ref="input"
            >
              <template #append>
                <!-- @vue-ignore -->
                <v-number-input
                  v-model="displayMinCellWidth"
                  density="compact"
                  width="100"
                  :min="2"
                  :max="10"
                  :step="1"
                  autocomplete="off"
                  control-variant="stacked"
                  variant="outlined"
                  hide-details
                />
              </template>
            </v-slider>

            <v-select
              :label="$t('formLabelSettingsPlotDisplayField')"
              :hint="$t('formDescriptionSettingsPlotDisplayField')"
              persistent-hint
              v-model="plotDisplayField"
              class="mt-3"
              :items="plotDisplayFieldOptions"
            />

            <h4 class="mt-3">{{ $t('formLabelSettingsCanvasShape') }}</h4>
            <p>{{ $t('formDescriptionSettingsCanvasShape') }}</p>

            <v-btn-toggle mandatory v-model="canvasShape" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :prepend-icon="mdiCircle" :value="CanvasShape.CIRCLE" :text="$t('buttonCanvasShapeCircle')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasShape === CanvasShape.CIRCLE" /></template></v-btn>
              <v-btn class="flex-grow-1" :prepend-icon="mdiSquare" :value="CanvasShape.SQUARE" :text="$t('buttonCanvasShapeSquare')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasShape === CanvasShape.SQUARE" /></template></v-btn>
            </v-btn-toggle>

            <h4 class="mt-3">{{ $t('formLabelSettingsCanvasSize') }}</h4>
            <p>{{ $t('formDescriptionSettingsCanvasSize') }}</p>

            <v-btn-toggle mandatory v-model="canvasSize" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :value="CanvasSize.SMALL" :text="$t('buttonCanvasSizeSmall')"><template #prepend><v-icon size="x-small" :icon="isSquare ? mdiSquare : mdiCircle" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasSize === CanvasSize.SMALL" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="CanvasSize.MEDIUM" :text="$t('buttonCanvasSizeMedium')"><template #prepend><v-icon :icon="isSquare ? mdiSquare : mdiCircle" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasSize === CanvasSize.MEDIUM" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="CanvasSize.LARGE" :text="$t('buttonCanvasSizeLarge')"><template #prepend><v-icon size="x-large" :icon="isSquare ? mdiSquare : mdiCircle" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasSize === CanvasSize.LARGE" /></template></v-btn>
            </v-btn-toggle>

            <h4 class="mt-3">{{ $t('formLabelSettingsCanvasDensity') }}</h4>
            <p>{{ $t('formDescriptionSettingsCanvasDensity') }}</p>

            <v-btn-toggle mandatory v-model="canvasDensity" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :value="CanvasDensity.LOW" :text="$t('buttonCanvasDensityLow')"><template #prepend><v-icon :icon="mdiViewModule" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasDensity === CanvasDensity.LOW" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="CanvasDensity.MEDIUM" :text="$t('buttonCanvasDensityMedium')"><template #prepend><v-icon :icon="mdiViewComfy" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasDensity === CanvasDensity.MEDIUM" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="CanvasDensity.HIGH" :text="$t('buttonCanvasDensityHigh')"><template #prepend><v-icon :icon="mdiViewGridCompact" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeCanvasDensity === CanvasDensity.HIGH" /></template></v-btn>
            </v-btn-toggle>

            <h4 class="mt-3">{{ $t('formLabelSettingsMainDisplayMode') }}</h4>
            <p>{{ $t('formDescriptionSettingsMainDisplayMode') }}</p>

            <v-btn-toggle mandatory v-model="mainDisplayMode" variant="tonal" color="primary" class="d-flex" :disabled="performanceMode">
              <v-btn class="flex-grow-1" :value="MainDisplayMode.AUTO" :text="$t('buttonMainDisplayModeAuto')"><template #prepend><v-icon :icon="mdiViewModule" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeMainDisplayMode === MainDisplayMode.AUTO" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="MainDisplayMode.CANVAS_ONLY" :text="$t('buttonMainDisplayModeCanvasOnly')"><template #prepend><v-icon :icon="mdiViewComfy" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeMainDisplayMode === MainDisplayMode.CANVAS_ONLY" /></template></v-btn>
            </v-btn-toggle>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-bottom-sheet
      v-model="shareBottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
    >
      <v-card
        :title="$t(shareConfig === 'export' ? 'tabTitleSettingsShareExport' : 'tabTitleSettingsShareImport')"
      >
        <template #subtitle><span class="text-wrap">{{ $t(shareConfig === 'export' ? 'tabTextSettingsShareExport' : 'tabTextSettingsShareImport') }}</span></template>

        <template #text>
          <SettingsShareContent :share-config="shareConfig" v-if="shareConfig" @data-changed="update" />
        </template>
      </v-card>
    </v-bottom-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import { categoricalColors, THEME_COLORS } from '@/plugins/color'
  import { CanvasDensity, CanvasShape, CanvasSize, MainDisplayMode, NavigationMode, PlotDisplayField } from '@/plugins/types/client'
  import { locales } from '@/plugins/vuetify'
  import { coreStore } from '@/stores/app'
  import { mdiBrightnessAuto, mdiCheck, mdiCircle, mdiCloseCircle, mdiCursorMove, mdiDrag, mdiExport, mdiGestureTap, mdiImport, mdiLeaf, mdiMenuDown, mdiPaletteSwatch, mdiPlus, mdiShare, mdiSpeedometer, mdiSquare, mdiUndoVariant, mdiViewComfy, mdiViewGridCompact, mdiViewModule, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()
  const { t } = useI18n()

  const shareBottomSheetVisible = ref(false)
  const shareConfig = ref<'import' | 'export' | undefined>()

  const performanceMode = ref<boolean>(store.storePerformanceMode)
  const locale = ref<string>(store.storeLocale)
  const theme = ref<string>(store.storeTheme)
  const canvasShape = ref<CanvasShape>(store.storeCanvasShape)
  const canvasSize = ref<CanvasSize>(store.storeCanvasSize)
  const canvasDensity = ref<CanvasDensity>(store.storeCanvasDensity)
  const mainDisplayMode = ref<MainDisplayMode>(store.storeMainDisplayMode)
  const traitColors = ref<string[]>(store.storeTraitColors || [])
  const currentTraitColor = ref<string>('#000000')
  const currentTraitIndex = ref<number>()
  const homeWidgetOrder = ref(store.storeHomeWidgetOrder.map((o, i) => {
    return {
      id: i,
      value: o,
    }
  }))
  const gpsEnabled = ref(store.storeGpsEnabled)
  const navigationMode = ref(store.storeNavigationMode)
  const displayMarkerIndicators = ref(store.storeDisplayMarkerIndicators)
  const showFullTraitDescription = ref(store.storeShowFullTraitDescription)
  const largeButtonsForIntTraits = ref(store.storeLargeButtonsForIntTraits)
  const displayMinCellWidth = ref(store.storeDisplayMinCellWidth)
  const plotDisplayField = ref(store.storePlotDisplayField)
  const autoSelectSearch = ref(store.storeAutoSelectSearch)
  const autoSelectFirstInput = ref(store.storeAutoSelectFirstInput)
  const hideHelpInformation = ref(store.storeHideHelpInformation)
  const autoProgressInputs = ref(store.storeAutoProgressInputs)
  const voiceFeedbackEnabled = ref(store.storeVoiceFeedbackEnabled)
  const categoryCountInline = ref(store.storeCategoryCountInline)
  const enterBarcode = ref(store.storeEnterBarcode)
  const escapeBarcode = ref(store.escapeBarcode)
  const restrictInputToMarked = ref(store.storeRestrictInputToMarked)

  const homeWidgetOptions = computed(() => {
    return {
      banners: {
        id: 'banners',
        name: t('pageSettingsHomeWidgetOrderBannersName'),
        description: t('pageSettingsHomeWidgetOrderBannersDescription'),
      },
      trials: {
        id: 'trials',
        name: t('pageSettingsHomeWidgetOrderTrialsName'),
        description: t('pageSettingsHomeWidgetOrderTrialsDescription'),
      },
    }
  })

  const isSquare = computed(() => store.storeCanvasShape === CanvasShape.SQUARE)

  const plotDisplayFieldOptions = computed(() => {
    return [{
      value: PlotDisplayField.DISPLAY_NAME,
      title: t('formSettingsOptionPlotDisplayFieldDisplayName'),
    }, {
      value: PlotDisplayField.GERMPLASM,
      title: t('formSettingsOptionPlotDisplayFieldGermplasm'),
    }, {
      value: PlotDisplayField.REP,
      title: t('formSettingsOptionPlotDisplayFieldRep'),
    }, {
      value: PlotDisplayField.NOTHING,
      title: t('formSettingsOptionPlotDisplayFieldNothing'),
    }]
  })

  function update () {
    performanceMode.value = store.storePerformanceMode
    locale.value = store.storeLocale
    theme.value = store.storeTheme
    canvasShape.value = store.storeCanvasShape
    canvasSize.value = store.storeCanvasSize
    canvasDensity.value = store.storeCanvasDensity
    mainDisplayMode.value = store.storeMainDisplayMode
    traitColors.value = store.storeTraitColors || []
    currentTraitColor.value = '#000000'
    currentTraitIndex.value = undefined
    gpsEnabled.value = store.storeGpsEnabled
    navigationMode.value = store.storeNavigationMode
    displayMarkerIndicators.value = store.storeDisplayMarkerIndicators
    showFullTraitDescription.value = store.storeShowFullTraitDescription
    largeButtonsForIntTraits.value = store.storeLargeButtonsForIntTraits
    displayMinCellWidth.value = store.storeDisplayMinCellWidth
    plotDisplayField.value = store.storePlotDisplayField
    autoSelectSearch.value = store.storeAutoSelectSearch
    autoSelectFirstInput.value = store.storeAutoSelectFirstInput
    hideHelpInformation.value = store.storeHideHelpInformation
    autoProgressInputs.value = store.storeAutoProgressInputs
    voiceFeedbackEnabled.value = store.storeVoiceFeedbackEnabled
    categoryCountInline.value = store.storeCategoryCountInline
    enterBarcode.value = store.storeEnterBarcode
    escapeBarcode.value = store.storeEscapeBarcode
    restrictInputToMarked.value = store.storeRestrictInputToMarked
    homeWidgetOrder.value = store.storeHomeWidgetOrder.map((o, i) => {
      return {
        id: i,
        value: o,
      }
    })

    shareBottomSheetVisible.value = false
  }

  function share (config: 'import' | 'export') {
    shareConfig.value = config
    shareBottomSheetVisible.value = true
  }
  function deleteColor (index: number) {
    traitColors.value.splice(index, 1)
    currentTraitIndex.value = undefined
  }
  function changeColor (index: number) {
    currentTraitColor.value = traitColors.value[index] || '#00acef'
    currentTraitIndex.value = index
  }
  function addColor () {
    if (currentTraitIndex.value !== undefined) {
      traitColors.value[currentTraitIndex.value] = currentTraitColor.value
    } else {
      traitColors.value.push(currentTraitColor.value)
    }

    currentTraitIndex.value = undefined
  }
  function setTraitColors (palette: string[]) {
    traitColors.value = palette.concat()
  }
  function notifyThemeColor (hex: string) {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { themeColor: hex } })
    store.setThemeColor(hex)
  }

  watch(currentTraitIndex, async newValue => {
    if (newValue === undefined) {
      currentTraitColor.value = '#000000'
    }
  })
  watch(traitColors, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { traitColors: newValue } })
    store.setTraitColors(newValue)
  })
  watch(locale, async newValue => {
    emitter.emit('plausible-event', { key: 'locale-changed', props: { locale: newValue } })
    store.setLocale(newValue)
  })
  watch(theme, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { theme: newValue } })
    store.setTheme(newValue)
  })
  watch(canvasShape, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasShape: newValue } })
    store.setCanvasShape(newValue)
  })
  watch(canvasSize, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasSize: newValue } })
    store.setCanvasSize(newValue)
  })
  watch(canvasDensity, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasDensity: newValue } })
    store.setCanvasDensity(newValue)
  })
  watch(gpsEnabled, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { gpsEnabled: newValue } })
    store.setGpsEnabled(newValue)
  })
  watch(navigationMode, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { navigationMode: newValue } })
    store.setNavigationMode(newValue)
  })
  watch(mainDisplayMode, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { mainDisplayMode: newValue } })
    store.setMainDisplayMode(newValue)
  })
  watch(displayMarkerIndicators, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { displayMarkerIndicators: newValue } })
    store.setDisplayMarkerIndicators(newValue)
  })
  watch(showFullTraitDescription, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { showFullTraitDescription: newValue } })
    store.setShowFullTraitDescription(newValue)
  })
  watch(largeButtonsForIntTraits, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { largeButtonsForIntTraits: newValue } })
    store.setLargeButtonsForIntTraits(newValue)
  })
  watch(displayMinCellWidth, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { displayMinCellWidth: newValue } })
    store.setDisplayMinCellWidth(newValue)
  })
  watch(categoryCountInline, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { categoryCountInline: newValue } })
    store.setCategoryCountInline(newValue)
  })
  watch(plotDisplayField, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { plotDisplayField: newValue } })
    store.setPlotDisplayField(newValue)
  })
  watch(autoSelectSearch, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { autoSelectSearch: newValue } })
    store.setAutoSelectSearch(newValue)
  })
  watch(autoSelectFirstInput, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { autoSelectFirst: newValue } })
    store.setAutoSelectFirstInput(newValue)
  })
  watch(autoProgressInputs, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { autoProgressInputs: newValue } })
    store.setAutoProgressInputs(newValue)
  })
  watch(voiceFeedbackEnabled, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { voiceFeedbackEnabled: newValue } })
    store.setVoiceFeedbackEnabled(newValue)
  })
  watch(hideHelpInformation, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { hideHelpInformation: newValue } })
    store.setHideHelpInformation(newValue)
  })
  watch(enterBarcode, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { enterBarcode: newValue } })
    store.setEnterBarcode(newValue)
  })
  watch(escapeBarcode, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { escapeBarcode: newValue } })
    store.setEscapeBarcode(newValue)
  })
  watch(restrictInputToMarked, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { restrictInputToMarked: newValue } })
    store.setRestrictInputToMarked(newValue)
  })
  watch(performanceMode, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { performanceMode: newValue } })
    store.setPerformanceMode(newValue)
    window.location.reload()
  })
  watch(homeWidgetOrder, async newValue => {
    emitter.emit('plausible-event', { key: 'settings-changed', props: { homeWidgetOrder: newValue.map(o => o.value) } })
    store.setHomeWidgetOrder(newValue.map(o => o.value))
  }, { deep: true })
</script>

<style scoped>
.gradient {
  min-width: 250px;
  height: 30px;
}
.gradient > div {
  flex-grow: 1;
}
.theme-color:hover {
  cursor: pointer;
}
.drag-handle:hover {
  cursor: move;
}
</style>
