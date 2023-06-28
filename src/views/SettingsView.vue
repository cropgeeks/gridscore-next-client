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
          </b-card>
        </b-col>
        <b-col cols=12 md=6>
          <b-card class="mb-4" :title="$t('pageSettingsCardVisualTitle')" :sub-title="$t('pageSettingsCardVisualSubtitle')">
            <b-form-group :label="$t('formLabelSettingsRowOrder')" :description="$t('formDescriptionSettingsRowOrder')" label-for="rowOrder">
              <b-button-group class="w-100">
                <b-button variant="outline-secondary" :pressed="displayRowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM" @click="displayRowOrder = DISPLAY_ORDER_TOP_TO_BOTTOM"><BIconSortNumericDown /> {{ $t('buttonTopToBottom') }}</b-button>
                <b-button variant="outline-secondary" :pressed="displayRowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP" @click="displayRowOrder = DISPLAY_ORDER_BOTTOM_TO_TOP"><BIconSortNumericUpAlt /> {{ $t('buttonBottomToTop') }}</b-button>
              </b-button-group>
            </b-form-group>

            <b-form-group :label="$t('formLabelSettingsColumnOrder')" :description="$t('formDescriptionSettingsColumnOrder')" label-for="columnOrder">
              <b-button-group class="w-100">
                <b-button variant="outline-secondary" :pressed="displayColumnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT" @click="displayColumnOrder = DISPLAY_ORDER_LEFT_TO_RIGHT"><BIconSortNumericDown rotate=270 /> {{ $t('buttonLeftToRight') }}</b-button>
                <b-button variant="outline-secondary" :pressed="displayColumnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT" @click="displayColumnOrder = DISPLAY_ORDER_RIGHT_TO_LEFT"><BIconSortNumericUpAlt rotate=270 /> {{ $t('buttonRightToLeft') }}</b-button>
              </b-button-group>
            </b-form-group>

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
              <small>{{ $t('formPreviewSettingsMinCellWidth', { value: displayMinCellWidth }) }}</small>
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
import { BIconSortNumericDown, BIconSortNumericUpAlt, BIconHandIndex, BIconX, BIconShare, BIconArrowsMove, BIconPlus, BIconArrowClockwise } from 'bootstrap-vue'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM, DISPLAY_ORDER_RIGHT_TO_LEFT, DISPLAY_ORDER_BOTTOM_TO_TOP, NAVIGATION_MODE_JUMP, NAVIGATION_MODE_DRAG } from '@/plugins/constants'
import SettingsShareModal from '@/components/modals/SettingsShareModal'

export default {
  components: {
    BIconShare,
    BIconSortNumericDown,
    BIconSortNumericUpAlt,
    BIconHandIndex,
    BIconArrowsMove,
    BIconX,
    BIconPlus,
    BIconArrowClockwise,
    SettingsShareModal
  },
  data: function () {
    return {
      DISPLAY_ORDER_LEFT_TO_RIGHT,
      DISPLAY_ORDER_TOP_TO_BOTTOM,
      DISPLAY_ORDER_RIGHT_TO_LEFT,
      DISPLAY_ORDER_BOTTOM_TO_TOP,
      NAVIGATION_MODE_JUMP,
      NAVIGATION_MODE_DRAG,
      locale: null,
      darkMode: false,
      hideCitationMessage: false,
      displayRowOrder: null,
      displayColumnOrder: null,
      displayMarkerIndicators: true,
      displayMinCellWidth: 4,
      gpsEnabled: true,
      voiceFeedbackEnabled: false,
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
      'storeDisplayRowOrder',
      'storeDisplayColumnOrder',
      'storeDisplayMarkerIndicators',
      'storeDisplayMinCellWidth',
      'storeGpsEnabled',
      'storeVoiceFeedbackEnabled',
      'storeNavigationMode',
      'storeTraitColors'
    ]),
    localeOptions: function () {
      return locales.map(l => {
        return {
          value: l.locale,
          text: l.name
        }
      })
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
    displayRowOrder: function (newValue) {
      this.$store.dispatch('setDisplayRowOrder', newValue)
    },
    displayColumnOrder: function (newValue) {
      this.$store.dispatch('setDisplayColumnOrder', newValue)
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
    navigationMode: function (newValue) {
      this.$store.dispatch('setNavigationMode', newValue)
    },
    traitColors: function (newValue) {
      this.$store.dispatch('setTraitColors', newValue)
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
      this.displayRowOrder = this.storeDisplayRowOrder
      this.displayColumnOrder = this.storeDisplayColumnOrder
      this.displayMarkerIndicators = this.storeDisplayMarkerIndicators
      this.displayMinCellWidth = this.storeDisplayMinCellWidth
      this.gpsEnabled = this.storeGpsEnabled
      this.voiceFeedbackEnabled = this.storeVoiceFeedbackEnabled
      this.navigationMode = this.storeNavigationMode
      this.traitColors = this.storeTraitColors
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
</style>
