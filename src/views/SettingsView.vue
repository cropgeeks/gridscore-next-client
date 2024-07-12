<template>
  <b-container class="mt-4">
    <div class="d-flex justify-content-between align-items-center"><h1 class="display-4">{{ $t('pageSettingsTitle') }}</h1><b-button @click="$refs.settingsShareModal.show()"><IBiShare /></b-button></div>
    <p>{{ $t('pageSettingsText') }}</p>

    <b-form @submit.prevent class="settings-form">
      <b-row>
        <b-col cols=12 md=6>
          <b-card class="mb-4" :title="$t('pageSettingsCardGeneralTitle')" :subtitle="$t('pageSettingsCardGeneralSubtitle')">
            <b-form-group :label="$t('formLabelSettingsLocale')" :description="$t('formDescriptionSettingsLocale')" label-for="locale">
              <b-form-select id="locale" :options="localeOptions" v-model="locale" />
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsDarkMode')" :description="$t('formDescriptionSettingsDarkMode')" label-for="darkMode">
              <b-form-checkbox id="darkMode" v-model="darkMode" switch>
                {{ darkMode ? $t('genericEnabled') : $t('genericDisabled') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCitation')" :description="$t('formDescriptionSettingsCitation')" label-for="showCitation">
              <b-form-checkbox id="showCitation" v-model="hideCitationMessage" switch>
                {{ hideCitationMessage ? $t('genericYes') : $t('genericNo') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsWidgetOrder')" :description="$t('formDescriptionSettingsWidgetOrder')" label-for="home-widget-list">
              <draggable :list="homeWidgetOrder" class="list-group" item-key="id" tag="b-list-group" handle=".drag-handle" id="home-widget-list">
                <template #item="{ element }">
                  <b-list-group-item class="flex-column align-items-start">
                    <div class="d-flex w-100 justify-content-between">
                      <h5 class="mb-1">{{ homeWidgetOptions[element.value].name }}</h5>
                      <IBiGripVertical class="drag-handle ms-2" />
                    </div>

                    <p class="mb-1 trait-description">{{ homeWidgetOptions[element.value].description }}</p>
                  </b-list-group-item>
                </template>
              </draggable>
            </b-form-group>
          </b-card>
          <b-card class="mb-4" :title="$t('pageSettingsCardDataCollectionTitle')" :subtitle="$t('pageSettingsCardDataCollectionSubtitle')">
            <b-form-group :label="$t('formLabelSettingsUseGps')" :description="$t('formDescriptionSettingsUseGps')" label-for="gpsEnabled">
              <b-form-checkbox id="gpsEnabled" v-model="gpsEnabled" switch>
                {{ gpsEnabled ? $t('genericEnabled') : $t('genericDisabled') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsNavigationMode')" :description="$t('formDescriptionSettingsNavigationMode')" label-for="navigationMode">
              <b-button-group class="w-100">
                <b-button variant="outline-secondary" :pressed="navigationMode === NAVIGATION_MODE_DRAG" @click="navigationMode = NAVIGATION_MODE_DRAG"><IBiHandIndex /> {{ $t('buttonNavModeDrag') }}</b-button>
                <b-button variant="outline-secondary" :pressed="navigationMode === NAVIGATION_MODE_JUMP" @click="navigationMode = NAVIGATION_MODE_JUMP"><IBiArrowsMove /> {{ $t('buttonNavModeJump') }}</b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCategoryCountInline')" :description="$t('formDescriptionSettingsCategoryCountInline')" label-for="categoryCountInline">
              <b-form-input id="categoryCountInline" type="range" class="form-control" :min=2 :max=10 v-model.number="categoryCountInline" />
              <small class="d-block">{{ $t('formPreviewSettingsCategoryCountInline', { value: $n(categoryCountInline) }) }}</small>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsVoiceFeedback')" :description="$t('formDescriptionSettingsVoiceFeedback')" label-for="voiceFeedback">
              <b-form-checkbox id="voiceFeedback" v-model="voiceFeedbackEnabled" switch>
                {{ voiceFeedbackEnabled ? $t('genericEnabled') : $t('genericDisabled') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsRestrictInputToMarked')" :description="$t('formDescriptionSettingsRestrictInputToMarked')" label-for="restrictInput">
              <b-form-checkbox id="restrictInput" v-model="restrictInputToMarked" switch>
                {{ restrictInputToMarked ? $t('genericEnabled') : $t('genericDisabled') }}
              </b-form-checkbox>
            </b-form-group>
          </b-card>
        </b-col>
        <b-col cols=12 md=6>
          <b-card class="mb-4" :title="$t('pageSettingsCardVisualTitle')" :subtitle="$t('pageSettingsCardVisualSubtitle')">
            <b-form-group :description="$t('formDescriptionSettingsTraitColors')" label-for="traitColors" class="settings-colors">
              <template #label>
                <span>{{ $t('formLabelSettingsTraitColors') }}</span> <b-button size="sm" variant="light" v-b-tooltip="$t('tooltipSettingsResetColors')" @click="resetColors"><IBiArrowClockwise /></b-button>
              </template>
              <div>
                <b-input-group v-for="(color, index) in traitColors" :key="`color-${index}`" class="me-2 mb-2">
                  <b-form-input type="color"  v-model="traitColors[index]"  />
                  <template #append>
                    <b-button variant="danger" @click="deleteColor(index)" :disabled="traitColors.length < 2"><IBiX /></b-button>
                  </template>
                </b-input-group>
              </div>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsTraitColorAdd')" label-for="add-color" :description="$t('formDescriptionSettingsTraitColorAdd')" class="settings-colors">
              <div>
                <b-input-group>
                  <b-form-input type="color" id="add-color" v-model="newColor" />
                  <template #append>
                    <b-button variant="success" @click="addColor"><IBiPlus /></b-button>
                  </template>
                </b-input-group>
              </div>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsTraitColorPreset')" label-for="preset-color" :description="$t('formDescriptionSettingsTraitColorPreset')" class="settings-colors">
              <div>
                <b-input-group>
                  <b-dropdown id="preset-color" :text="$t('dropdownSettingsTraitColorPreset')">
                    <b-dropdown-group :header="colorKey" v-for="colorKey in Object.keys(categoricalColors)" :key="`color-preset-${colorKey}`">
                      <b-dropdown-item @click="selectColorPreset(categoricalColors[colorKey])">
                        <div class="d-flex flex-row gradient">
                          <div v-for="color in categoricalColors[colorKey]" :key="`color-preset-${colorKey}-${color}`" :style="{ background: color }" />
                        </div>
                      </b-dropdown-item>
                    </b-dropdown-group>
                  </b-dropdown>
                </b-input-group>
              </div>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsHighlightControls')" :description="$t('formDescriptionSettingsHighlightControls')" label-for="highlightControls">
              <b-form-checkbox id="highlightControls" v-model="highlightControls" switch>
                {{ highlightControls ? $t('genericYes') : $t('genericNo') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsDisplayMarkerIndicators')" :description="$t('formDescriptionSettingsDisplayMarkerIndicators')" label-for="markerIndicators">
              <b-form-checkbox id="markerIndicators" v-model="displayMarkerIndicators" switch>
                {{ displayMarkerIndicators ? $t('genericYes') : $t('genericNo') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsShowFullTraitDescription')" :description="$t('formDescriptionSettingsShowFullTraitDescription')" label-for="fullTraitDescription">
              <b-form-checkbox id="fullTraitDescription" v-model="showFullTraitDescription" switch>
                {{ showFullTraitDescription ? $t('genericYes') : $t('genericNo') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsMinCellWidth')" :description="$t('formDescriptionSettingsMinCellWidth')" label-for="displayMinCellWidth">
              <b-form-input id="displayMinCellWidth" type="range" class="form-control" :min=2 :max=10 v-model.number="displayMinCellWidth" />
              <div>
                <small>{{ $t('formPreviewSettingsMinCellWidth', { value: $n(displayMinCellWidth) }) }}</small>
              </div>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasShape')" :description="$t('formDescriptionSettingsCanvasShape')" label-for="canvasShape">
              <b-button-group class="w-100 canvas-shape">
                <b-button variant="outline-secondary" :pressed="canvasShape === CANVAS_SHAPE_CIRCLE" @click="canvasShape = CANVAS_SHAPE_CIRCLE">
                  <IBiCircleFill /> {{ $t('buttonCanvasShapeCircle') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasShape === CANVAS_SHAPE_SQUARE" @click="canvasShape = CANVAS_SHAPE_SQUARE">
                  <IBiSquareFill /> {{ $t('buttonCanvasShapeSquare') }}</b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasSize')" :description="$t('formDescriptionSettingsCanvasSize')" label-for="canvasSize">
              <b-button-group class="w-100 canvas-size">
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_SMALL" @click="canvasSize = CANVAS_SIZE_SMALL">
                  <IBiSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" height="0.6em" width="0.6em" />
                  <IBiCircleFill v-else height="0.6em" width="0.6em" /> <span class="ms-1">{{ $t('buttonCanvasSizeSmall') }}</span></b-button>
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_MEDIUM" @click="canvasSize = CANVAS_SIZE_MEDIUM">
                  <IBiSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" height="0.8em" width="0.8em" />
                  <IBiCircleFill v-else height="0.8em" width="0.8em" /> <span class="ms-1">{{ $t('buttonCanvasSizeMedium') }}</span></b-button>
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_LARGE" @click="canvasSize = CANVAS_SIZE_LARGE">
                  <IBiSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" height="1.0em" width="1.0em" />
                  <IBiCircleFill v-else height="1.0em" width="1.0em" /> <span class="ms-1">{{ $t('buttonCanvasSizeLarge') }}</span></b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasDensity')" :description="$t('formDescriptionSettingsCanvasDensity')" label-for="canvasDensity">
              <b-button-group class="w-100 canvas-density">
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_LOW" @click="canvasDensity = CANVAS_DENSITY_LOW">
                  <IBiSquare /> {{ $t('buttonCanvasDensityLow') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_MEDIUM" @click="canvasDensity = CANVAS_DENSITY_MEDIUM">
                  <IBiGrid /> {{ $t('buttonCanvasDensityMedium') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_HIGH" @click="canvasDensity = CANVAS_DENSITY_HIGH">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-grid-3x3-gap" viewBox="0 0 16 16">
                    <path d="M4 2v2H2V2zm1 12v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m5 10v-2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V7a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1M9 2v2H7V2zm5 0v2h-2V2zM4 7v2H2V7zm5 0v2H7V7zm5 0h-2v2h2zM4 12v2H2v-2zm5 0v2H7v-2zm5 0v2h-2v-2zM12 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-1 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm1 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z"/>
                  </svg> {{ $t('buttonCanvasDensityHigh') }}</b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsMainDisplayMode')" :description="$t('formDescriptionSettingsMainDisplayMode')" label-for="mainDisplayMode">
              <b-button-group class="w-100 canvas-density">
                <b-button variant="outline-secondary" :pressed="mainDisplayMode === MAIN_DISPLAY_MODE_AUTO" @click="mainDisplayMode = MAIN_DISPLAY_MODE_AUTO">
                  <IBiTable /> {{ $t('buttonMainDisplayModeAuto') }}</b-button>
                <b-button variant="outline-secondary" :pressed="mainDisplayMode === MAIN_DISPLAY_MODE_CANVAS_ONLY" @click="mainDisplayMode = MAIN_DISPLAY_MODE_CANVAS_ONLY">
                  <IBiEasel /> {{ $t('buttonMainDisplayModeCanvasOnly') }}</b-button>
              </b-button-group>
            </b-form-group>
          </b-card>
        </b-col>
      </b-row>
    </b-form>

    <SettingsShareModal ref="settingsShareModal" @data-changed="reset" />
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { locales, loadLanguageAsync } from '@/plugins/i18n'
import { NAVIGATION_MODE_JUMP, NAVIGATION_MODE_DRAG, MAIN_DISPLAY_MODE_AUTO, MAIN_DISPLAY_MODE_CANVAS_ONLY, CANVAS_DENSITY_LOW, CANVAS_DENSITY_MEDIUM, CANVAS_DENSITY_HIGH, CANVAS_SHAPE_CIRCLE, CANVAS_SHAPE_SQUARE, CANVAS_SIZE_SMALL, CANVAS_SIZE_MEDIUM, CANVAS_SIZE_LARGE } from '@/plugins/constants'
import SettingsShareModal from '@/components/modals/SettingsShareModal.vue'
import draggable from 'vuedraggable'
import { categoricalColors } from '@/plugins/color'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    SettingsShareModal,
    draggable
  },
  data: function () {
    return {
      NAVIGATION_MODE_JUMP,
      NAVIGATION_MODE_DRAG,
      CANVAS_DENSITY_LOW,
      CANVAS_DENSITY_MEDIUM,
      CANVAS_DENSITY_HIGH,
      CANVAS_SHAPE_CIRCLE,
      CANVAS_SHAPE_SQUARE,
      CANVAS_SIZE_SMALL,
      CANVAS_SIZE_MEDIUM,
      CANVAS_SIZE_LARGE,
      MAIN_DISPLAY_MODE_AUTO,
      MAIN_DISPLAY_MODE_CANVAS_ONLY, 
      locale: null,
      darkMode: false,
      hideCitationMessage: false,
      highlightControls: true,
      displayMarkerIndicators: true,
      displayMinCellWidth: 4,
      categoryCountInline: 4,
      homeWidgetOrder: [{ id: 0, value: 'banners'}, { id: 1, value: 'trials' }],
      canvasDensity: CANVAS_DENSITY_LOW,
      canvasShape: CANVAS_SHAPE_CIRCLE,
      canvasSize: CANVAS_SIZE_SMALL,
      gpsEnabled: true,
      voiceFeedbackEnabled: false,
      restrictInputToMarked: false,
      navigationMode: null,
      traitColors: [],
      newColor: '#000000',
      mainDisplayMode: MAIN_DISPLAY_MODE_AUTO,
      showFullTraitDescription: true,
      categoricalColors
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale',
      'storeDarkMode',
      'storeHideCitationMessage',
      'storeHighlightControls',
      'storeDisplayMarkerIndicators',
      'storeDisplayMinCellWidth',
      'storeGpsEnabled',
      'storeVoiceFeedbackEnabled',
      'storeRestrictInputToMarked',
      'storeCanvasDensity',
      'storeCanvasShape',
      'storeCanvasSize',
      'storeNavigationMode',
      'storeHomeWidgetOrder',
      'storeTraitColors',
      'storeShowFullTraitDescription',
      'storeCategoryCountInline',
      'storeMainDisplayMode'
    ]),
    localeOptions: function () {
      return locales.map(l => {
        return {
          value: l.locale,
          text: l.name
        }
      })
    },
    homeWidgetOptions: function () {
      return {
        banners: {
          id: 'banners',
          name: this.$t('pageSettingsHomeWidgetOrderBannersName'),
          description: this.$t('pageSettingsHomeWidgetOrderBannersDescription')
        },
        trials: {
          id: 'trials',
          name: this.$t('pageSettingsHomeWidgetOrderTrialsName'),
          description: this.$t('pageSettingsHomeWidgetOrderTrialsDescription')
        }
      }
    }
  },
  watch: {
    locale: function (newValue) {
      this.$store.dispatch('setLocale', newValue)
      loadLanguageAsync(newValue)
      emitter.emit('plausible-event', { key: 'locale-changed', props: { locale: newValue } })
    },
    darkMode: function (newValue) {
      this.$store.dispatch('setDarkMode', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { darkMode: newValue } })
    },
    hideCitationMessage: function (newValue) {
      this.$store.dispatch('setHideCitationMessage', newValue)
      emitter.emit('plausible-event', { key: 'citation-hidden', props: { hidden: newValue } })
    },
    highlightControls: function (newValue) {
      this.$store.dispatch('setHighlightControls', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { highlightControls: newValue } })
    },
    displayMarkerIndicators: function (newValue) {
      this.$store.dispatch('setDisplayMarkerIndicators', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { displayMarkerIndicators: newValue } })
    },
    displayMinCellWidth: function (newValue) {
      this.$store.dispatch('setDisplayMinCellWidth', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { displayMinCellWidth: newValue } })
    },
    categoryCountInline: function (newValue) {
      this.$store.dispatch('setCategoryCountInline', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { categoryCountInline: newValue } })
    },
    gpsEnabled: function (newValue) {
      this.$store.dispatch('setGpsEnabled', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { gpsEnabled: newValue } })
    },
    voiceFeedbackEnabled: function (newValue) {
      this.$store.dispatch('setVoiceFeedbackEnabled', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { voiceFeedbackEnabled: newValue } })
    },
    restrictInputToMarked: function (newValue) {
      this.$store.dispatch('setRestrictInputToMarked', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { restrictInputToMarked: newValue } })
    },
    navigationMode: function (newValue) {
      this.$store.dispatch('setNavigationMode', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { navigationMode: newValue } })
    },
    traitColors: function (newValue) {
      this.$store.dispatch('setTraitColors', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { traitColors: newValue } })
    },
    canvasDensity: function (newValue) {
      this.$store.dispatch('setCanvasDensity', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasDensity: newValue } })
    },
    canvasShape: function (newValue) {
      this.$store.dispatch('setCanvasShape', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasShape: newValue } })
    },
    canvasSize: function (newValue) {
      this.$store.dispatch('setCanvasSize', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { canvasSize: newValue } })
    },
    showFullTraitDescription: function (newValue) {
      this.$store.dispatch('setShowFullTraitDescription', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { showFullTraitDescription: newValue } })
    },
    mainDisplayMode: function (newValue) {
      this.$store.dispatch('setMainDisplayMode', newValue)
      emitter.emit('plausible-event', { key: 'settings-changed', props: { mainDisplayMode: newValue } })
    },
    homeWidgetOrder: {
      deep: true,
      handler: function (newValue) {
        this.$store.dispatch('setHomeWidgetOrder', newValue.map(o => o.value))
        emitter.emit('plausible-event', { key: 'settings-changed', props: { homeWidgetOrder: newValue.map(o => o.value) } })
      }
    }
  },
  methods: {
    selectColorPreset: function (colors) {
      this.traitColors = colors.concat()
    },
    addColor: function () {
      this.traitColors.push(this.newColor)
      this.newColor = '#000000'
    },
    deleteColor: function (index) {
      if (this.traitColors.length > 1) {
        this.traitColors.splice(index, 1)
      }
    },
    resetColors: function () {
      this.traitColors = categoricalColors.GridScoreDefault
    },
    reset: function () {
      this.locale = this.storeLocale
      this.darkMode = this.storeDarkMode
      this.hideCitationMessage = this.storeHideCitationMessage
      this.highlightControls = this.storeHighlightControls
      this.displayMarkerIndicators = this.storeDisplayMarkerIndicators
      this.displayMinCellWidth = this.storeDisplayMinCellWidth
      this.categoryCountInline = this.storeCategoryCountInline
      this.gpsEnabled = this.storeGpsEnabled
      this.voiceFeedbackEnabled = this.storeVoiceFeedbackEnabled
      this.restrictInputToMarked = this.storeRestrictInputToMarked
      this.homeWidgetOrder = this.storeHomeWidgetOrder.map((o, i) => {
        return {
          id: i,
          value: o
        }
      })
      this.navigationMode = this.storeNavigationMode
      this.traitColors = this.storeTraitColors
      this.canvasDensity = this.storeCanvasDensity
      this.canvasShape = this.storeCanvasShape
      this.canvasSize = this.storeCanvasSize
      this.showFullTraitDescription = this.storeShowFullTraitDescription
      this.mainDisplayMode = this.storeMainDisplayMode || MAIN_DISPLAY_MODE_AUTO
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
.settings-form .settings-colors .input-group,
.settings-form .settings-colors input[type=color] {
  display: inline-flex;
  width: revert;
}

.settings-form .display-mode,
.settings-form .canvas-density,
.settings-form .canvas-shape,
.settings-form .canvas-size {
  flex-wrap: wrap;
}

.drag-handle:hover {
  cursor: move;
}
</style>

<style scoped>
.gradient {
  min-width: 250px;
  height: 30px;
}
.gradient > div {
  flex-grow: 1;
}
</style>
