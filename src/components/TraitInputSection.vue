<template>
  <section v-if="trait">
    <hr />

    <h4 class="d-flex justify-content-between align-items-center">
      <span class="d-flex align-items-center flex-wrap">
        <span :style="{ color: trait.color }">
          <BIconCircleFill />
          <span class="mx-1">{{ trait.name }}</span>
        </span>
        <span>
          <b-badge class="mx-1" variant="light">{{ getTraitTypeText(trait, true) }}</b-badge>
          <b-badge class="mx-1" variant="light" v-b-tooltip="$t(trait.allowRepeats ? 'tooltipTraitAllowRepeatsTrue' : 'tooltipTraitAllowRepeatsFalse')">
            <BIconArrowRepeat v-if="trait.allowRepeats" />
            <BIconstack v-else>
              <BIconArrowRepeat stacked />
              <BIconX stacked :scale="0.7" />
            </BIconstack>
          </b-badge>
          <b-badge class="mx-1" variant="light" v-b-tooltip="$t('tooltipTraitSetSize')">
            <BIconSegmentedNav :rotate="90" /> {{ trait.setSize || 1 }}
          </b-badge>
        </span>
      </span>
      <b-button-group>
        <b-button @click="showHistoryModal" v-b-tooltip="$t('tooltipViewTraitDataHistory')" :disabled="!hasHistoricData"><BIconClockHistory /></b-button>
        <b-button @click="$emit('photo-clicked')" :disabled="!trial.editable"><BIconCameraFill /></b-button>
      </b-button-group>
    </h4>
    <div v-if="trait.restrictions || trait.timeframe">
      <b-badge class="mr-2" v-if="trait.restrictions && (trait.restrictions.min !== undefined) && (trait.restrictions.min !== null)">&ge; {{ trait.restrictions.min }}</b-badge>
      <b-badge class="mr-2" v-if="trait.restrictions && (trait.restrictions.max !== undefined) && (trait.restrictions.max !== null)">&le; {{ trait.restrictions.max }}</b-badge>
      <b-badge class="mr-2" v-b-tooltip.bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :variant="trait.editable ? null : 'danger'" v-if="trait.timeframe && trait.timeframe.start">&ge; {{ trait.timeframe.start }}</b-badge>
      <b-badge class="mr-2" v-b-tooltip.bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :variant="trait.editable ? null : 'danger'" v-if="trait.timeframe && trait.timeframe.end">&le; {{ trait.timeframe.end }}</b-badge>
    </div>
    <p class="text-muted trait-description" :title="trait.description" v-if="trait.description">{{ trait.description }}</p>

    <b-form-group :label="$t('formLabelMeasurementSet', { position: index })"
                  v-for="index in (trait.setSize || 1)"
                  :key="`${trait.id}-${index}`"
                  :label-for="`trait-input-${trait.id}-${index}`">
      <template #description>
        <span v-html="description ? description[index - 1] : null" />
      </template>
      <TraitInput :editable="editable" :trait="trait" :id="`trait-input-${trait.id}-${index}`" :ref="`${trait.id}-${index}`" @traverse="handleTraverse(index)" />
    </b-form-group>

    <TraitDataHistoryModal :editable="editable" :row="cell.row" :column="cell.column" :trial="trial" :trait="trait" :measurements="cellTraitMeasurements" ref="traitDataHistoryModal" v-if="hasHistoricData && cellTraitMeasurements" @hidden="cellTraitMeasurements = null" />
  </section>
</template>

<script>
import TraitInput from '@/components/TraitInput'
import TraitDataHistoryModal from '@/components/modals/TraitDataHistoryModal'

import { getTraitTypeText } from '@/plugins/misc'
import { BIconCircleFill, BIconCameraFill, BIconArrowRepeat, BIconClockHistory, BIconSegmentedNav, BIconX, BIconstack } from 'bootstrap-vue'

export default {
  components: {
    BIconstack,
    BIconClockHistory,
    BIconCircleFill,
    BIconCameraFill,
    BIconArrowRepeat,
    BIconX,
    BIconSegmentedNav,
    TraitInput,
    TraitDataHistoryModal
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    trait: {
      type: Object,
      default: () => null
    },
    cell: {
      type: Object,
      default: () => null
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      values: [],
      cellTraitMeasurements: null
    }
  },
  computed: {
    hasHistoricData: function () {
      // Check if there's at least one measurement for the trait id
      return this.cell && this.trait && this.cell.measurements && this.cell.measurements[this.trait.id] && this.cell.measurements[this.trait.id].length > 0
    },
    description: function () {
      if (this.trait && this.cell && this.cell.measurements) {
        const traitMeasures = this.cell.measurements[this.trait.id]

        if (traitMeasures && traitMeasures.length > 0) {
          // Sort them by date
          const sorted = traitMeasures.concat().sort((a, b) => a.timestamp.localeCompare(b.timestamp))

          // Get the newest one
          const last = sorted[sorted.length - 1]
          let values

          // Determine the values for display purposes
          if (this.trait.dataType === 'categorical') {
            values = last.values.map(v => (v !== undefined && v !== null) ? this.trait.restrictions.categories[v] : null)
          } else if (this.trait.dataType === 'date') {
            values = last.values.map(v => (v !== undefined && v !== null) ? new Date(v).toLocaleDateString() : null)
          } else {
            values = last.values
          }

          // Create the description
          if (this.trait.allowRepeats) {
            return values.map(v => this.$t('widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color }))
          } else {
            return values.map(v => this.$t('widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color }))
          }
        } else {
          return null
        }
      } else {
        return null
      }
    }
  },
  methods: {
    getTraitTypeText,
    showHistoryModal: function () {
      // Take a copy of the current values and open the modal
      this.cellTraitMeasurements = JSON.parse(JSON.stringify(this.cell.measurements[this.trait.id]))
      this.$nextTick(() => this.$refs.traitDataHistoryModal.show())
    },
    handleTraverse: function (index) {
      if (index === this.trait.setSize) {
        this.$emit('traverse')
      } else {
        this.$refs[`${this.trait.id}-${index + 1}`][0].focus()
      }
    },
    validate: function () {
      let valid = true
      for (let i = 0; i < (this.trait.setSize || 1); i++) {
        valid &&= this.$refs[`${this.trait.id}-${i + 1}`][0].validate()
      }

      return valid
    },
    reset: function () {
      for (let i = 0; i < (this.trait.setSize || 1); i++) {
        this.$refs[`${this.trait.id}-${i + 1}`][0].reset()
      }
    },
    getValues: function () {
      const values = []

      for (let i = 0; i < (this.trait.setSize || 1); i++) {
        values.push(this.$refs[`${this.trait.id}-${i + 1}`][0].getValue())
      }

      return values
    }
  }
}
</script>

<style scoped>
.trait-description {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  overflow: hidden;
  max-width: 100%;
}
</style>
