<template>
  <b-container class="mt-4">
    <div class="d-flex justify-content-between align-items-center"><h1 class="display-4">{{ $t('pageSettingsTitle') }}</h1><b-button @click="$refs.settingsShareModal.show()"><BIconShare /></b-button></div>
    <p>{{ $t('pageSettingsText') }}</p>

    <b-form @submit.prevent class="settings-form">
      <b-row>
        <b-col cols=12 md=6>
          <b-card class="mb-4" :title="$t('pageSettingsCardGeneralTitle')" :sub-title="$t('pageSettingsCardGeneralSubtitle')">
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
              <draggable v-model="homeWidgetOrder" tag="b-list-group" handle=".drag-handle" id="home-widget-list">
                <b-list-group-item class="flex-column align-items-start" v-for="homeWidget in homeWidgetOrder" :key="`home-widget-list-${homeWidget}`">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">{{ homeWidgetOptions[homeWidget].name }}</h5>
                    <BIconGripVertical class="drag-handle ml-2" />
                  </div>

                  <p class="mb-1 trait-description">{{ homeWidgetOptions[homeWidget].description }}</p>
                </b-list-group-item>
              </draggable>
            </b-form-group>
          </b-card>
          <b-card class="mb-4" :title="$t('pageSettingsCardDataCollectionTitle')" :sub-title="$t('pageSettingsCardDataCollectionSubtitle')">
            <b-form-group :label="$t('formLabelSettingsUseGps')" :description="$t('formDescriptionSettingsUseGps')" label-for="gpsEnabled">
              <b-form-checkbox id="gpsEnabled" v-model="gpsEnabled" switch>
                {{ gpsEnabled ? $t('genericEnabled') : $t('genericDisabled') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsNavigationMode')" :description="$t('formDescriptionSettingsNavigationMode')" label-for="navigationMode">
              <b-button-group class="w-100">
                <b-button variant="outline-secondary" :pressed="navigationMode === NAVIGATION_MODE_DRAG" @click="navigationMode = NAVIGATION_MODE_DRAG"><BIconHandIndex /> {{ $t('buttonNavModeDrag') }}</b-button>
                <b-button variant="outline-secondary" :pressed="navigationMode === NAVIGATION_MODE_JUMP" @click="navigationMode = NAVIGATION_MODE_JUMP"><BIconArrowsMove /> {{ $t('buttonNavModeJump') }}</b-button>
              </b-button-group>
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
          <b-card class="mb-4" :title="$t('pageSettingsCardVisualTitle')" :sub-title="$t('pageSettingsCardVisualSubtitle')">
            <b-form-group :description="$t('formDescriptionSettingsTraitColors')" label-for="traitColors" class="settings-colors">
              <template #label>
                <span>{{ $t('formLabelSettingsTraitColors') }}</span> <b-button size="sm" variant="light" v-b-tooltip="$t('tooltipSettingsResetColors')" @click="resetColors"><BIconArrowClockwise /></b-button>
              </template>
              <b-input-group v-for="(color, index) in traitColors" :key="`color-${index}`" class="mr-2 mb-2">
                <b-form-input type="color"  v-model="traitColors[index]"  />
                <b-input-group-append>
                  <b-button variant="danger" @click="deleteColor(index)" :disabled="traitColors.length < 2"><BIconX /></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsTraitColorAdd')" label-for="add-color" :description="$t('formDescriptionSettingsTraitColorAdd')" class="settings-colors">
              <b-input-group>
                <b-form-input type="color" id="add-color" v-model="newColor" />
                <b-input-group-append>
                  <b-button variant="success" @click="addColor"><BIconPlus /></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsDisplayMarkerIndicators')" :description="$t('formDescriptionSettingsDisplayMarkerIndicators')" label-for="markerIndicators">
              <b-form-checkbox id="markerIndicators" v-model="displayMarkerIndicators" switch>
                {{ displayMarkerIndicators ? $t('genericYes') : $t('genericNo') }}
              </b-form-checkbox>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsMinCellWidth')" :description="$t('formDescriptionSettingsMinCellWidth')" label-for="displayMinCellWidth">
              <b-form-input id="displayMinCellWidth" type="range" :min=2 :max=10 v-model.number="displayMinCellWidth" />
              <small>{{ $t('formPreviewSettingsMinCellWidth', { value: $n(displayMinCellWidth) }) }}</small>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasShape')" :description="$t('formDescriptionSettingsCanvasShape')" label-for="canvasShape">
              <b-button-group class="w-100 canvas-shape">
                <b-button variant="outline-secondary" :pressed="canvasShape === CANVAS_SHAPE_CIRCLE" @click="canvasShape = CANVAS_SHAPE_CIRCLE">
                  <BIconCircleFill /> {{ $t('buttonCanvasShapeCircle') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasShape === CANVAS_SHAPE_SQUARE" @click="canvasShape = CANVAS_SHAPE_SQUARE">
                  <BIconSquareFill /> {{ $t('buttonCanvasShapeSquare') }}</b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasSize')" :description="$t('formDescriptionSettingsCanvasSize')" label-for="canvasSize">
              <b-button-group class="w-100 canvas-size">
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_SMALL" @click="canvasSize = CANVAS_SIZE_SMALL">
                  <BIconSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" :font-scale="0.6" />
                  <BIconCircleFill v-else :font-scale="0.6" /> <span class="ml-1">{{ $t('buttonCanvasSizeSmall') }}</span></b-button>
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_MEDIUM" @click="canvasSize = CANVAS_SIZE_MEDIUM">
                  <BIconSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" :font-scale="0.8" />
                  <BIconCircleFill v-else :font-scale="0.8" /> <span class="ml-1">{{ $t('buttonCanvasSizeMedium') }}</span></b-button>
                <b-button class="d-flex justify-content-center align-items-center" variant="outline-secondary" :pressed="canvasSize === CANVAS_SIZE_LARGE" @click="canvasSize = CANVAS_SIZE_LARGE">
                  <BIconSquareFill v-if="canvasShape === CANVAS_SHAPE_SQUARE" :font-scale="1.0" />
                  <BIconCircleFill v-else :font-scale="1.0" /> <span class="ml-1">{{ $t('buttonCanvasSizeLarge') }}</span></b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsCanvasDensity')" :description="$t('formDescriptionSettingsCanvasDensity')" label-for="canvasDensity">
              <b-button-group class="w-100 canvas-density">
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_LOW" @click="canvasDensity = CANVAS_DENSITY_LOW">
                  <BIconstack>
                    <BIconDashLg :rotate="90" stacked :shift-h="-5" />
                    <BIconDashLg :rotate="90" stacked :shift-h="0" />
                    <BIconDashLg :rotate="90" stacked :shift-h="5" />
                  </BIconstack> {{ $t('buttonCanvasDensityLow') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_MEDIUM" @click="canvasDensity = CANVAS_DENSITY_MEDIUM">
                  <BIconstack>
                    <BIconDashLg :rotate="90" stacked :shift-h="-4" />
                    <BIconDashLg :rotate="90" stacked :shift-h="0" />
                    <BIconDashLg :rotate="90" stacked :shift-h="4" />
                  </BIconstack> {{ $t('buttonCanvasDensityMedium') }}</b-button>
                <b-button variant="outline-secondary" :pressed="canvasDensity === CANVAS_DENSITY_HIGH" @click="canvasDensity = CANVAS_DENSITY_HIGH">
                  <BIconstack>
                    <BIconDashLg :rotate="90" stacked :shift-h="-3" />
                    <BIconDashLg :rotate="90" stacked :shift-h="0" />
                    <BIconDashLg :rotate="90" stacked :shift-h="3" />
                  </BIconstack> {{ $t('buttonCanvasDensityHigh') }}</b-button>
              </b-button-group>
            </b-form-group>
          </b-card>
        </b-col>
      </b-row>
    </b-form>

    <SettingsShareModal ref="settingsShareModal" @change="reset" />
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { locales, loadLanguageAsync } from '@/plugins/i18n'
import { BIconHandIndex, BIconX, BIconShare, BIconArrowsMove, BIconPlus, BIconArrowClockwise, BIconstack, BIconDashLg, BIconCircleFill, BIconSquareFill, BIconGripVertical } from 'bootstrap-vue'
import { NAVIGATION_MODE_JUMP, NAVIGATION_MODE_DRAG, CANVAS_DENSITY_LOW, CANVAS_DENSITY_MEDIUM, CANVAS_DENSITY_HIGH, CANVAS_SHAPE_CIRCLE, CANVAS_SHAPE_SQUARE, CANVAS_SIZE_SMALL, CANVAS_SIZE_MEDIUM, CANVAS_SIZE_LARGE } from '@/plugins/constants'
import SettingsShareModal from '@/components/modals/SettingsShareModal'
import draggable from 'vuedraggable'

export default {
  components: {
    BIconShare,
    BIconHandIndex,
    BIconArrowsMove,
    BIconX,
    BIconPlus,
    BIconGripVertical,
    BIconstack,
    BIconDashLg,
    BIconArrowClockwise,
    BIconCircleFill,
    BIconSquareFill,
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
      locale: null,
      darkMode: false,
      hideCitationMessage: false,
      displayMarkerIndicators: true,
      displayMinCellWidth: 4,
      homeWidgetOrder: ['banners', 'trials'],
      canvasDensity: CANVAS_DENSITY_LOW,
      canvasShape: CANVAS_SHAPE_CIRCLE,
      canvasSize: CANVAS_SIZE_SMALL,
      gpsEnabled: true,
      voiceFeedbackEnabled: false,
      restrictInputToMarked: false,
      navigationMode: null,
      traitColors: [],
      newColor: '#000000'
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale',
      'storeDarkMode',
      'storeHideCitationMessage',
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
      'storeTraitColors'
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
    },
    darkMode: function (newValue) {
      this.$store.dispatch('setDarkMode', newValue)
    },
    hideCitationMessage: function (newValue) {
      this.$store.dispatch('setHideCitationMessage', newValue)
    },
    displayMarkerIndicators: function (newValue) {
      this.$store.dispatch('setDisplayMarkerIndicators', newValue)
    },
    displayMinCellWidth: function (newValue) {
      this.$store.dispatch('setDisplayMinCellWidth', newValue)
    },
    gpsEnabled: function (newValue) {
      this.$store.dispatch('setGpsEnabled', newValue)
    },
    voiceFeedbackEnabled: function (newValue) {
      this.$store.dispatch('setVoiceFeedbackEnabled', newValue)
    },
    restrictInputToMarked: function (newValue) {
      this.$store.dispatch('setRestrictInputToMarked', newValue)
    },
    navigationMode: function (newValue) {
      this.$store.dispatch('setNavigationMode', newValue)
    },
    traitColors: function (newValue) {
      this.$store.dispatch('setTraitColors', newValue)
    },
    canvasDensity: function (newValue) {
      this.$store.dispatch('setCanvasDensity', newValue)
    },
    canvasShape: function (newValue) {
      this.$store.dispatch('setCanvasShape', newValue)
    },
    canvasSize: function (newValue) {
      this.$store.dispatch('setCanvasSize', newValue)
    },
    homeWidgetOrder: {
      deep: true,
      handler: function (newValue) {
        this.$store.dispatch('setHomeWidgetOrder', newValue)
      }
    }
  },
  methods: {
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
      this.traitColors = ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600']
    },
    reset: function () {
      this.locale = this.storeLocale
      this.darkMode = this.storeDarkMode
      this.hideCitationMessage = this.storeHideCitationMessage
      this.displayMarkerIndicators = this.storeDisplayMarkerIndicators
      this.displayMinCellWidth = this.storeDisplayMinCellWidth
      this.gpsEnabled = this.storeGpsEnabled
      this.voiceFeedbackEnabled = this.storeVoiceFeedbackEnabled
      this.restrictInputToMarked = this.storeRestrictInputToMarked
      this.homeWidgetOrder = this.storeHomeWidgetOrder
      this.navigationMode = this.storeNavigationMode
      this.traitColors = this.storeTraitColors
      this.canvasDensity = this.storeCanvasDensity
      this.canvasShape = this.storeCanvasShape
      this.canvasSize = this.storeCanvasSize
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

.settings-form .canvas-density,
.settings-form .canvas-shape,
.settings-form .canvas-size {
  flex-wrap: wrap;
}

.drag-handle:hover {
  cursor: move;
}
</style>
