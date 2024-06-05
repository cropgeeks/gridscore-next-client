<template>
  <div>
    <b-tabs content-class="mt-3" v-model="tabIndex">
      <b-tab active>
        <template #title>
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-grid-3x2-gap" viewBox="0 0 16 16">
            <path d="M4 4v2H2V4zm1 7V9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m5 5V9a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1M9 4v2H7V4zm5 0h-2v2h2zM4 9v2H2V9zm5 0v2H7V9zm5 0v2h-2V9zm-3-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm1 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"/>
          </svg> <span> {{ $t('pageTrialLayoutDimensionsTitle') }} </span>
          <IBiCheck class="text-success" v-if="tabCorrect.rowColumn === true" />
          <IBiX class="text-danger" v-else-if="tabCorrect.rowColumn === false" />
        </template>
        <b-container>
          <p>{{ $t('pageTrialLayoutDimensionsText') }}</p>
          <b-row>
            <b-col cols=12 md=6>
              <!-- Field layout rows -->
              <b-form-group label-for="rows" :description="$t('formLabelDescriptionRows')" >
                <template v-slot:label>
                  <IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> <span>{{ $t('formLabelSetupRows') }}</span>
                </template>
                <b-form-input id="rows" type="number" :min="1" required autofocus lazy v-model.number.lazy="layout.rows" />
              </b-form-group>
            </b-col>
            <b-col cols=12 md=6>
              <!-- Field layout cols -->
              <b-form-group label-for="columns" :description="$t('formLabelDescriptionColumns')">
                <template v-slot:label>
                  <IBiLayoutThreeColumns /> <span>{{ $t('formLabelSetupColumns') }}</span>
                </template>
                <b-form-input id="columns" type="number" :min="1" required lazy v-model.number.lazy="layout.columns" />
              </b-form-group>
            </b-col>
            <b-col cols=12 md=6>
              <b-form-group :label="$t('formLabelSettingsRowOrder')" :description="$t('formDescriptionSettingsRowOrder')" label-for="rowOrder">
                <b-button-group class="w-100">
                  <b-button variant="outline-secondary" :pressed="layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM" @click="layout.rowOrder = DISPLAY_ORDER_TOP_TO_BOTTOM"><IBiSortNumericDown /> {{ $t('buttonTopToBottom') }}</b-button>
                  <b-button variant="outline-secondary" :pressed="layout.rowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP" @click="layout.rowOrder = DISPLAY_ORDER_BOTTOM_TO_TOP"><IBiSortNumericUpAlt /> {{ $t('buttonBottomToTop') }}</b-button>
                </b-button-group>
              </b-form-group>
            </b-col>
            <b-col cols=12 md=6>
              <b-form-group :label="$t('formLabelSettingsColumnOrder')" :description="$t('formDescriptionSettingsColumnOrder')" label-for="columnOrder">
                <b-button-group class="w-100">
                  <b-button variant="outline-secondary" :pressed="layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT" @click="layout.columnOrder = DISPLAY_ORDER_LEFT_TO_RIGHT"><IBiSortNumericDown :style="{ transform: 'rotate(270deg)' }" /> {{ $t('buttonLeftToRight') }}</b-button>
                  <b-button variant="outline-secondary" :pressed="layout.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT" @click="layout.columnOrder = DISPLAY_ORDER_RIGHT_TO_LEFT"><IBiSortNumericUpAlt :style="{ transform: 'rotate(270deg)' }" /> {{ $t('buttonRightToLeft') }}</b-button>
                </b-button-group>
              </b-form-group>
            </b-col>
          </b-row>

          <div class="border border-warning text-center mb-3 p-2"><IBiExclamationTriangleFill class="text-warning" /> {{ $t('pageTrialLayoutDimensionsFielDHubNotice') }}</div>
        </b-container>
      </b-tab>
      <b-tab :disabled="!hasDimensions">
        <template #title>
          <IBiFlower1 /> <span> {{ $t('pageTrialLayoutGermplasmTitle') }} </span>
          <IBiCheck class="text-success" v-if="tabCorrect.germplasm === true" />
          <IBiX class="text-danger" v-else-if="tabCorrect.germplasm === false" />
        </template>
        <p>{{ $t('pageTrialLayoutGermplasmText') }}</p>
        <TrialLayoutGermplasmGrid :initialGermplasm="initialGermplasm" ref="germplasmTable" :layout="layout" @data-changed="setGermplasmMap" />
      </b-tab>
      <b-tab :disabled="!hasDimensions">
        <template #title>
          <IBiArrowsFullscreen /> <span> {{ $t('pageTrialLayoutCornersTitle') }} </span>
          <IBiCheck class="text-success" v-if="tabCorrect.corners === true" />
          <IBiX class="text-danger" v-else-if="tabCorrect.corners === false" />
        </template>
        <b-container>
          <p>{{ $t('pageTrialLayoutCornersText') }}</p>
          <TrialLayoutCorners ref="trialLayoutCorners" :layout="layout" @data-changed="(corners) => { layout.corners = corners }" />
        </b-container>
      </b-tab>
      <b-tab :disabled="!hasDimensions">
        <template #title>
          <IBiBoundingBoxCircles /> <span> {{ $t('pageTrialLayoutMarkersTitle') }} </span>
          <IBiCheck class="text-success" v-if="tabCorrect.markers === true" />
          <IBiX class="text-danger" v-else-if="tabCorrect.markers === false" />
        </template>
        <b-container>
          <p>{{ $t('pageTrialLayoutMarkersText') }}</p>
          <MarkerSetup ref="markerSetup" :layout="layout" @data-changed="(markers) => { layout.markers = markers }" />
        </b-container>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import TrialLayoutGermplasmGrid from '@/components/TrialLayoutGermplasmGrid.vue'
import MarkerSetup from '@/components/MarkerSetup.vue'
import TrialLayoutCorners from '@/components/TrialLayoutCorners.vue'
import { isGeographyValid, isGeographyAllNull } from '@/plugins/location'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM, DISPLAY_ORDER_RIGHT_TO_LEFT, DISPLAY_ORDER_BOTTOM_TO_TOP } from '@/plugins/constants'

export default {
  components: {
    TrialLayoutGermplasmGrid,
    TrialLayoutCorners,
    MarkerSetup
  },
  data: function () {
    return {
      DISPLAY_ORDER_LEFT_TO_RIGHT,
      DISPLAY_ORDER_TOP_TO_BOTTOM,
      DISPLAY_ORDER_RIGHT_TO_LEFT,
      DISPLAY_ORDER_BOTTOM_TO_TOP,
      tabIndex: 0,
      layout: {
        rows: null,
        columns: null,
        corners: null,
        markers: null,
        rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
        columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
      },
      germplasmMap: {},
      tabCorrect: {
        rowColumn: null,
        germplasm: null,
        corners: null,
        markers: null
      }
    }
  },
  props: {
    initialLayout: {
      type: Object,
      default: () => null
    },
    initialGermplasm: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    hasDimensions: function () {
      return this.layout.rows !== null && this.layout.rows !== '' && this.layout.columns !== null && this.layout.columns !== ''
    },
    hasGermplasm: function () {
      return this.germplasmMap !== null && Object.keys(this.germplasmMap).length > 0
    }
  },
  watch: {
    initialLayout: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.layout = JSON.parse(JSON.stringify(newValue))
        } else {
          this.layout = {
            rows: null,
            columns: null,
            corners: null,
            markers: null,
            rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
            columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
          }
        }
      }
    },
    initialGermplasm: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.germplasmMap = JSON.parse(JSON.stringify(newValue))
        } else {
          this.germplasmMap = {}
        }
      }
    },
    tabIndex: function (newValue, oldValue) {
      if (oldValue === 1) {
        this.$refs.germplasmTable.toggleTable(false)
      }
      if (newValue === 1) {
        this.$refs.germplasmTable.toggleTable(true)
      } else if (newValue === 2) {
        this.$nextTick(() => this.$refs.trialLayoutCorners.invalidateSize())
      } else if (newValue === 3) {
        this.$nextTick(() => this.$refs.markerSetup.update())
      }
    }
  },
  methods: {
    setGermplasmMap: function (germplasmMap) {
      this.germplasmMap = germplasmMap
    },
    toggleTable: function (visible) {
      if (this.tabIndex === 1) {
        this.$refs.germplasmTable.toggleTable(visible)
      }
    },
    checkData: function () {
      if (this.tabIndex === 1) {
        // Get a fresh copy of the germplasm table. The user may have changed things
        this.germplasmMap = this.$refs.germplasmTable.getGermplasmMap()
      }
      this.tabCorrect.rowColumn = this.hasDimensions

      const feedback = []

      if (!this.tabCorrect.rowColumn) {
        feedback.push({
          type: 'danger',
          message: this.$t('formFeedbackSetupInvalidRowColumn', { row: this.layout.row, column: this.layout.column })
        })
      }

      let germplasmCorrect = true
      const germplasmSet = new Set()
      const repSet = new Set()
      Object.keys(this.germplasmMap).forEach(k => {
        const cell = this.germplasmMap[k]

        const [row, column] = k.split('|').map(c => +c)

        if (!cell.germplasm || cell.germplasm === '') {
          feedback.push({
            type: 'danger',
            message: this.$t('formFeedbackSetupMissingGermplasm', { rowIndex: row + 1, columnIndex: column + 1 })
          })
          germplasmCorrect = false
          return
        }

        if (row < 0 || row >= this.layout.rows) {
          feedback.push({
            type: 'danger',
            message: this.$t('formFeedbackSetupInvalidRow', { rowIndex: row + 1, germplasm: cell.germplasm, rep: cell.rep })
          })
          germplasmCorrect = false
          return
        }
        if (column < 0 || column >= this.layout.columns) {
          feedback.push({
            type: 'danger',
            message: this.$t('formFeedbackSetupInvalidColumn', { columnIndex: column + 1, germplasm: cell.germplasm, rep: cell.rep })
          })
          germplasmCorrect = false
          return
        }

        const displayName = `${cell.germplasm}|${cell.rep}`
        if (cell.rep) {
          repSet.add(cell.rep)
        }

        if (germplasmSet.has(displayName)) {
          feedback.push({
            type: 'warning',
            message: this.$t('formFeedbackSetupDuplicateGermplasmRep', { columnIndex: column + 1, rowIndex: row + 1, germplasm: cell.germplasm, rep: cell.rep || 'N/A' })
          })
          germplasmCorrect = false
          // eslint-disable-next-line
          return
        } else {
          germplasmSet.add(displayName)
        }
      })

      if (repSet.size > germplasmSet.size / 2) {
        feedback.push({
          type: 'warning',
          message: this.$t('formFeedbackSetupHighNumberOfReps', { germplasmCount: germplasmSet.size, repCount: repSet.size })
        })
        germplasmCorrect = false
      }

      if (germplasmSet.size < 1) {
        feedback.push({
          type: 'danger',
          message: this.$t('formFeedbackSetupNoGermplasm')
        })
        germplasmCorrect = false
      }

      this.tabCorrect.germplasm = germplasmCorrect

      if (this.layout.corners) {
        this.tabCorrect.corners = isGeographyValid(this.layout.corners) || isGeographyAllNull(this.layout.corners)

        if (!this.tabCorrect.corners) {
          feedback.push({
            type: 'danger',
            message: this.$t('formFeedbackSetupInvalidCorners')
          })
        }
      } else {
        this.tabCorrect.corners = true
      }

      if (this.layout.markers) {
        this.tabCorrect.markers = this.layout.markers === null || (this.layout.markers.anchor && this.layout.markers.everyRow > 0 && this.layout.markers.everyRow <= this.layout.rows && this.layout.markers.everyColumn > 0 && this.layout.markers.everyColumn <= this.layout.columns)

        if (!this.tabCorrect.markers) {
          feedback.push({
            type: 'danger',
            message: this.$t('formFeedbackSetupInvalidMarkers')
          })
        }
      } else {
        this.tabCorrect.markers = true
      }

      this.$emit('data-changed', {
        layoutValid: Object.values(this.tabCorrect).every(t => t === true || t === null),
        layout: this.layout,
        germplasmMap: this.germplasmMap,
        feedback: feedback
      })
    }
  }
}
</script>

<style>

</style>
