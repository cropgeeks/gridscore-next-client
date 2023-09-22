<template>
  <b-modal :title="$t('modalTitleSettingsShare')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="md"
           ref="settingsShareModal">
    <div>
      <p>{{ $t('modalTextSettingsShare') }}</p>

      <b-tabs justified>
        <b-tab>
          <template #title>
            <BIconBoxArrowInUpRight /> {{ $t('tabTitleSettingsShareExport') }}
          </template>

          <p>{{ $t('tabTextSettingsShareExport') }}</p>
          <StyledQRCode :showCode="false" :isTrialCode="false" class="mt-3" :text="localSettings" />
        </b-tab>
        <b-tab lazy>
          <template #title>
            <BIconBoxArrowDownRight /> {{ $t('tabTitleSettingsShareImport') }}
          </template>

          <p>{{ $t('tabTextSettingsShareImport') }}</p>
          <BarcodeScanner @code-scanned="onDecode" ref="scanner" />

          <p class="text-danger" v-if="errorMessage">{{ $t(errorMessage) }}</p>
        </b-tab>
      </b-tabs>
    </div>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'

import { loadLanguageAsync } from '@/plugins/i18n'
import { BIconBoxArrowInUpRight, BIconBoxArrowDownRight } from 'bootstrap-vue'
import { CANVAS_DENSITY_MEDIUM, CANVAS_DENSITY_HIGH, CANVAS_DENSITY_LOW, NAVIGATION_MODE_DRAG, NAVIGATION_MODE_JUMP, CANVAS_SHAPE_CIRCLE, CANVAS_SHAPE_SQUARE, CANVAS_SIZE_SMALL, CANVAS_SIZE_MEDIUM, CANVAS_SIZE_LARGE } from '@/plugins/constants'

import StyledQRCode from '@/components/StyledQRCode'
import BarcodeScanner from '@/components/BarcodeScanner'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BarcodeScanner,
    StyledQRCode,
    BIconBoxArrowDownRight,
    BIconBoxArrowInUpRight
  },
  data: function () {
    return {
      errorMessage: null,
      localSettings: null
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale',
      'storeDarkMode',
      'storeHideCitationMessage',
      'storeDisplayMarkerIndicators',
      'storeCanvasDensity',
      'storeCanvasShape',
      'storeCanvasSize',
      'storeDisplayMinCellWidth',
      'storeHomeWidgetOrder',
      'storeGpsEnabled',
      'storeVoiceFeedbackEnabled',
      'storeRestrictInputToMarked',
      'storeNavigationMode',
      'storeTraitColors'
    ])
  },
  methods: {
    onDecode: function (code) {
      try {
        const parsed = JSON.parse(code)

        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          this.errorMessage = 'errorMessageInvalidSettingsQR'
          return
        }

        if (parsed.lc) {
          this.$store.commit('ON_LOCALE_CHANGED', parsed.lc)
          loadLanguageAsync(parsed.lc)
        }
        if (parsed.hw) {
          this.$store.commit('ON_HOME_WIDGET_ORDER_CHANGED', parsed.hw)
        }
        if (parsed.dm === 1) {
          this.$store.commit('ON_DARK_MODE_CHANGED', true)
        } else if (parsed.dm === 0) {
          this.$store.commit('ON_DARK_MODE_CHANGED', false)
        }
        if (parsed.mi === 1) {
          this.$store.commit('ON_DISPLAY_MARKER_INDICATORS_CHANGED', true)
        } else if (parsed.mi === 0) {
          this.$store.commit('ON_DISPLAY_MARKER_INDICATORS_CHANGED', false)
        }
        if (parsed.cw !== undefined && parsed.cw !== null) {
          this.$store.commit('ON_DISPLAY_MIN_CELL_WIDTH_CHANGED', parsed.cw.split(','))
        }
        if (parsed.ge === 1) {
          this.$store.commit('ON_GPS_ENABLED_CHANGED', true)
        } else if (parsed.ge === 0) {
          this.$store.commit('ON_GPS_ENABLED_CHANGED', false)
        }
        if (parsed.vf === 1) {
          this.$store.commit('ON_VOICE_FEEDBACK_ENABLED_CHANGED', true)
        } else if (parsed.vf === 0) {
          this.$store.commit('ON_VOICE_FEEDBACK_ENABLED_CHANGED', false)
        }
        if (parsed.hc === 1) {
          this.$store.commit('ON_HIDE_CITATION_MESSAGE_CHANGED', true)
        } else if (parsed.hc === 0) {
          this.$store.commit('ON_HIDE_CITATION_MESSAGE_CHANGED', false)
        }
        if (parsed.rm === 1) {
          this.$store.commit('ON_RESTRICT_INPUT_TO_MARKED_CHANGED', true)
        } else if (parsed.rm === 0) {
          this.$store.commit('ON_RESTRICT_INPUT_TO_MARKED_CHANGED', false)
        }
        if (parsed.nm === 1) {
          this.$store.commit('ON_NAVIGATION_MODE_CHANGED', NAVIGATION_MODE_DRAG)
        } else if (parsed.nm === 0) {
          this.$store.commit('ON_NAVIGATION_MODE_CHANGED', NAVIGATION_MODE_JUMP)
        }
        if (parsed.cd === 0) {
          this.$store.commit('ON_CANVAS_DENSITY_CHANGED', CANVAS_DENSITY_HIGH)
        } else if (parsed.cd === 1) {
          this.$store.commit('ON_CANVAS_DENSITY_CHANGED', CANVAS_DENSITY_MEDIUM)
        } else if (parsed.cd === 2) {
          this.$store.commit('ON_CANVAS_DENSITY_CHANGED', CANVAS_DENSITY_LOW)
        }
        if (parsed.cs === 0) {
          this.$store.commit('ON_CANVAS_SHAPE_CHANGED', CANVAS_SHAPE_CIRCLE)
        } else if (parsed.cs === 1) {
          this.$store.commit('ON_CANVAS_SHAPE_CHANGED', CANVAS_SHAPE_SQUARE)
        }
        if (parsed.sz === 0) {
          this.$store.commit('ON_CANVAS_SIZE_CHANGED', CANVAS_SIZE_SMALL)
        } else if (parsed.sz === 1) {
          this.$store.commit('ON_CANVAS_SIZE_CHANGED', CANVAS_SIZE_MEDIUM)
        } else if (parsed.sz === 2) {
          this.$store.commit('ON_CANVAS_SIZE_CHANGED', CANVAS_SIZE_LARGE)
        }
        if (parsed.tc) {
          const traitColors = parsed.tc.split(',').map(c => `#${c}`)
          this.$store.commit('ON_TRAIT_COLORS_CHANGED', traitColors)
        }

        this.$emit('change')

        this.hide()

        emitter.emit('plausible-event', { key: 'settings-shared', props: { type: 'load' } })
      } catch {
        this.errorMessage = 'errorMessageInvalidSettingsQR'
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.settingsShareModal.show()

      this.localSettings = JSON.stringify({
        cd: this.storeCanvasDensity === CANVAS_DENSITY_HIGH ? 0 : (this.storeCanvasDensity === CANVAS_DENSITY_MEDIUM ? 1 : 2),
        sz: this.storeCanvasSize === CANVAS_SIZE_LARGE ? 2 : (this.storeCanvasSize === CANVAS_SIZE_MEDIUM ? 1 : 0),
        cs: this.storeCanvasShape === CANVAS_SHAPE_SQUARE ? 1 : 0,
        lc: this.storeLocale,
        hc: this.storeHideCitationMessage ? 1 : 0,
        dm: this.storeDarkMode ? 1 : 0,
        mi: this.storeDisplayMarkerIndicators ? 1 : 0,
        hw: this.storeHomeWidgetOrder.join(','),
        cw: this.storeDisplayMinCellWidth,
        ge: this.storeGpsEnabled ? 1 : 0,
        vf: this.storeVoiceFeedbackEnabled ? 1 : 0,
        rm: this.storeRestrictInputToMarked ? 1 : 0,
        nm: this.storeNavigationMode === NAVIGATION_MODE_DRAG ? 1 : 0,
        tc: this.storeTraitColors.map(c => c.replace('#', '')).join(',')
      })

      emitter.emit('plausible-event', { key: 'settings-shared', props: { type: 'share' } })
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.settingsShareModal.hide())

      this.localSettings = null
    }
  }
}
</script>

<style scoped>
</style>
