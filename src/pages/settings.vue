<template>
  <v-container>
    <h1 class="text-h4 mb-3">{{ $t('pageSettingsTitle') }}</h1>
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
                <v-sheet v-ripple height="75" rounded class="theme-color d-flex justify-center align-center pa-4" :color="color" :border="store.storeThemeColor === color ? 'lg' : undefined" @click="store.setThemeColor(color)">
                  {{ color }}
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
              <v-btn class="flex-grow-1" :prepend-icon="mdiDesktopTowerMonitor" value="system" :text="$t('menuItemThemeSystem')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'system'" /></template></v-btn>
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

            <v-switch
              :label="$t('formLabelSettingsVoiceFeedback')"
              :hint="$t('formDescriptionSettingsVoiceFeedback')"
              persistent-hint
              color="primary"
              v-model="voiceFeedbackEnabled"
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
                  <v-icon :icon="mdiCircle" :color="color" />
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

            <v-btn-toggle mandatory v-model="mainDisplayMode" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :value="MainDisplayMode.AUTO" :text="$t('buttonMainDisplayModeAuto')"><template #prepend><v-icon :icon="mdiViewModule" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeMainDisplayMode === MainDisplayMode.AUTO" /></template></v-btn>
              <v-btn class="flex-grow-1" :value="MainDisplayMode.CANVAS_ONLY" :text="$t('buttonMainDisplayModeCanvasOnly')"><template #prepend><v-icon :icon="mdiViewComfy" /></template><template #append><v-icon :icon="mdiCheck" v-if="store.storeMainDisplayMode === MainDisplayMode.CANVAS_ONLY" /></template></v-btn>
            </v-btn-toggle>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { categoricalColors, THEME_COLORS } from '@/plugins/color'
  import { CanvasDensity, CanvasShape, CanvasSize, MainDisplayMode, NavigationMode, PlotDisplayField } from '@/plugins/types/client'
  import { locales } from '@/plugins/vuetify'
  import { coreStore } from '@/stores/app'
  import { mdiCheck, mdiCircle, mdiCloseCircle, mdiCursorMove, mdiDesktopTowerMonitor, mdiGestureTap, mdiLeaf, mdiMenuDown, mdiPaletteSwatch, mdiPlus, mdiSpeedometer, mdiSquare, mdiUndoVariant, mdiViewComfy, mdiViewGridCompact, mdiViewModule, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
  import { useI18n } from 'vue-i18n'

  const store = coreStore()
  const { t } = useI18n()

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

  watch(currentTraitIndex, async newValue => {
    if (newValue === undefined) {
      currentTraitColor.value = '#000000'
    }
  })
  watch(traitColors, async newValue => store.setTraitColors(newValue))
  watch(locale, async newValue => store.setLocale(newValue))
  watch(theme, async newValue => store.setTheme(newValue))
  watch(canvasShape, async newValue => store.setCanvasShape(newValue))
  watch(canvasSize, async newValue => store.setCanvasSize(newValue))
  watch(canvasDensity, async newValue => store.setCanvasDensity(newValue))
  watch(gpsEnabled, async newValue => store.setGpsEnabled(newValue))
  watch(navigationMode, async newValue => store.setNavigationMode(newValue))
  watch(mainDisplayMode, async newValue => store.setMainDisplayMode(newValue))
  watch(displayMarkerIndicators, async newValue => store.setDisplayMarkerIndicators(newValue))
  watch(showFullTraitDescription, async newValue => store.setShowFullTraitDescription(newValue))
  watch(largeButtonsForIntTraits, async newValue => store.setLargeButtonsForIntTraits(newValue))
  watch(displayMinCellWidth, async newValue => store.setDisplayMinCellWidth(newValue))
  watch(plotDisplayField, async newValue => store.setPlotDisplayField(newValue))
  watch(autoSelectSearch, async newValue => store.setAutoSelectSearch(newValue))
  watch(autoSelectFirstInput, async newValue => store.setAutoSelectFirstInput(newValue))
  watch(autoProgressInputs, async newValue => store.setAutoProgressInputs(newValue))
  watch(voiceFeedbackEnabled, async newValue => store.setVoiceFeedbackEnabled(newValue))
  watch(hideHelpInformation, async newValue => store.setHideHelpInformation(newValue))
  watch(performanceMode, async newValue => {
    store.setPerformanceMode(newValue)
    window.location.reload()
  })
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
</style>
