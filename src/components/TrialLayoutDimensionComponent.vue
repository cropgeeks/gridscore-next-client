<template>
  <div v-if="internal">
    <b-row>
      <b-col :cols=12 :md=6 class="mb-3">
        <b-button :variant="layoutType === 'grid' ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="setLayoutType('grid')">
          <h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-grid-3x3" viewBox="0 0 16 16">
              <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z"/>
            </svg>
          </h1>
          <span>{{ $t('pageTrialLayoutDimensionsGrid') }}</span>
        </b-button>
      </b-col>

      <b-col :cols=12 :md=6 class="mb-3">
        <b-button :variant="layoutType === 'list' ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="setLayoutType('list')">
          <h1>
            <IBiLayoutThreeColumns :style="{ transform: 'rotate(-90deg)' }" />
          </h1>
          <span>{{ $t('pageTrialLayoutDimensionsList') }}</span>
        </b-button>
      </b-col>

      <b-col cols=12>
        <p>{{ $t(layoutType === 'grid' ? 'pageTrialLayoutDimensionsTextGrid' : 'pageTrialLayoutDimensionsTextList') }}</p>
      </b-col>

      <b-col cols=12 md=6>
        <!-- Field layout rows -->
        <b-form-group label-for="rows" :description="$t('formLabelDescriptionRows')" >
          <template v-slot:label>
            <IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> <span>{{ $t('formLabelSetupRows') }}</span>
          </template>
          <b-form-input :disabled="!editValuesAllowed" id="rows" type="number" :min="1" required autofocus lazy v-model.number.lazy="internal.rows" />
        </b-form-group>

        <b-form-group :label="$t('formLabelSettingsRowOrder')" :description="$t('formDescriptionSettingsRowOrder')" label-for="rowOrder">
          <b-button-group class="w-100">
            <b-button variant="outline-secondary" :pressed="internal.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM" @click="toggleRowOrder(DISPLAY_ORDER_TOP_TO_BOTTOM)"><IBiSortNumericDown /> {{ $t('buttonTopToBottom') }}</b-button>
            <b-button variant="outline-secondary" :pressed="internal.rowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP" @click="toggleRowOrder(DISPLAY_ORDER_BOTTOM_TO_TOP)"><IBiSortNumericUpAlt /> {{ $t('buttonBottomToTop') }}</b-button>
          </b-button-group>
        </b-form-group>

        <b-form-checkbox switch v-model="showRowLabels"> {{ $t('buttonShowLabels') }}</b-form-checkbox>

        <b-collapse v-model="showRowLabels">
          <b-form-checkbox switch v-model="editRowLabels" v-if="editLabelsAllowed"> {{ $t('buttonEditLabels') }}</b-form-checkbox>
          <draggable :list="internal.rowLabels" :item-key="e => e" tag="div" handle=".drag-handle" class="d-flex flex-column">
            <template #item="{ element, index }">
              <b-badge class="border" :key="`row-label-${element}`">
                <input v-if="editRowLabels" :style="{ width: (`${internal.rowLabels[index]}`.length + 2) + 'em' }" class="form-control d-inline lh-1 p-1" required trim type="number" v-model.number.lazy.trim="internal.rowLabels[index]" />
                <span v-else>{{ element }}</span>
                <IBiGripVertical class="drag-handle ms-2" />
              </b-badge>
            </template>
          </draggable>
        </b-collapse>
      </b-col>
      <b-col cols=12 md=6>
        <div v-if="layoutType === 'grid'">
          <!-- Field layout cols -->
          <b-form-group label-for="columns" :description="$t('formLabelDescriptionColumns')">
            <template v-slot:label>
              <IBiLayoutThreeColumns /> <span>{{ $t('formLabelSetupColumns') }}</span>
            </template>
            <b-form-input :disabled="!editValuesAllowed" id="columns" type="number" :min="1" required lazy v-model.number.lazy="internal.columns" />
          </b-form-group>

          <b-form-group :label="$t('formLabelSettingsColumnOrder')" :description="$t('formDescriptionSettingsColumnOrder')" label-for="columnOrder">
            <b-button-group class="w-100">
              <b-button variant="outline-secondary" :pressed="internal.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT" @click="toggleColumnOrder(DISPLAY_ORDER_LEFT_TO_RIGHT)"><IBiSortNumericDown :style="{ transform: 'rotate(270deg)' }" /> {{ $t('buttonLeftToRight') }}</b-button>
              <b-button variant="outline-secondary" :pressed="internal.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT" @click="toggleColumnOrder(DISPLAY_ORDER_RIGHT_TO_LEFT)"><IBiSortNumericUpAlt :style="{ transform: 'rotate(270deg)' }" /> {{ $t('buttonRightToLeft') }}</b-button>
            </b-button-group>
          </b-form-group>

          <b-form-checkbox switch v-model="showColumnLabels"> {{ $t('buttonShowLabels') }}</b-form-checkbox>

          <b-collapse v-model="showColumnLabels">
            <b-form-checkbox switch v-model="editColumnLabels" v-if="editLabelsAllowed"> {{ $t('buttonEditLabels') }}</b-form-checkbox>
            <draggable :list="internal.columnLabels" :item-key="e => e" tag="div" handle=".drag-handle" class="d-flex flex-row flex-wrap">
              <template #item="{ element, index }">
                <b-badge class="flex-fill border" :key="`column-label-${element}`">
                  <input v-if="editColumnLabels" :style="{ width: (`${internal.columnLabels[index]}`.length + 2) + 'em' }" class="form-control d-inline lh-1 p-1" required trim type="number" v-model.number.lazy.trim="internal.columnLabels[index]" />
                  <span v-else>{{ element }}</span>
                  <IBiGripVertical class="drag-handle ms-2" />
                </b-badge>
              </template>
            </draggable>
          </b-collapse>
        </div>
      </b-col>
    </b-row>

    <div v-if="layoutType === 'grid'" class="border border-warning text-center my-3 p-2"><IBiExclamationTriangleFill class="text-warning" /> {{ $t('pageTrialLayoutDimensionsFielDHubNotice') }}</div>
  </div>
</template>

<script>
import { DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_TOP_TO_BOTTOM, DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_RIGHT_TO_LEFT } from '@/plugins/constants'
import draggable from 'vuedraggable'

import { getColumnLabel, getRowLabel } from '@/plugins/misc'

export default {
  props: {
    layout: {
      type: Object,
      default: () => null
    },
    editLabelsAllowed: {
      type: Boolean,
      default: true
    },
    editValuesAllowed: {
      type: Boolean,
      default: true
    }
  },
  components: {
    draggable
  },
  watch: {
    layout: function () {
      if (this.internal === null) {
        this.forceUpdate()
      }
    },
    internal: {
      deep: true,
      handler: function (newValue) {
        this.$emit('layout-changed', newValue)
      }
    },
    'internal.rows': function (newValue) {
      if (newValue) {
        this.internal.rowLabels = Array.from(Array(newValue).keys()).map((_, i) => getRowLabel(this.internal, i))
      } else {
        this.internal.rowLabels = []
      }
    },
    'internal.columns': function (newValue) {
      if (newValue) {
        this.internal.columnLabels = Array.from(Array(newValue).keys()).map((_, i) => getColumnLabel(this.internal, i))
      } else {
        this.internal.columnLabels = []
      }
    }
  },
  data: function () {
    return {
      DISPLAY_ORDER_BOTTOM_TO_TOP,
      DISPLAY_ORDER_TOP_TO_BOTTOM,
      DISPLAY_ORDER_LEFT_TO_RIGHT,
      DISPLAY_ORDER_RIGHT_TO_LEFT,
      internal: null,
      showRowLabels: false,
      showColumnLabels: false,
      editRowLabels: false,
      editColumnLabels: false,
      layoutType: 'grid'
    }
  },
  methods: {
    setLayoutType: function (type) {
      this.layoutType = type

      if (type === 'list') {
        this.internal.columns = 1
        this.internal.columnOrder = DISPLAY_ORDER_LEFT_TO_RIGHT
        this.showColumnLabels = false
      }
    },
    toggleRowOrder: function (order) {
      this.internal.rowOrder = order
      this.internal.rowLabels = this.internal.rowLabels.concat().reverse()
    },
    toggleColummOrder: function (order) {
      this.internal.columnOrder = order
      this.internal.columnLabels = this.internal.columnLabels.concat().reverse()
    },
    forceUpdate: function () {
      this.internal = JSON.parse(JSON.stringify(this.layout))

      if (this.internal.rows > 1 && this.internal.columns === 1) {
        this.layoutType = 'list'
      }
    }
  },
  mounted: function () {
    this.forceUpdate()
  }
}
</script>
