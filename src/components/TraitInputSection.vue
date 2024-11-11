<template>
  <section v-if="trait && cell" class="trait-section">
    <hr />

    <h4 class="d-flex justify-content-between align-items-center">
      <span class="d-flex align-items-center flex-wrap">
        <TraitHeading :trait="trait" :showDescription="false" />
        <b-badge class="mx-1 trait-allow-repeats" variant="light" v-b-tooltip="$t(trait.allowRepeats ? 'tooltipTraitAllowRepeatsTrue' : 'tooltipTraitAllowRepeatsFalse')">
          <IBiRepeat v-if="trait.allowRepeats" />
          <IBiRepeat1 v-else />
        </b-badge>
        <b-badge class="mx-1 trait-set-size" variant="light" v-b-tooltip="$t('tooltipTraitSetSize')">
          <IBiSegmentedNav :style="{ transform: 'rotate(90deg)' }" /> {{ $n(trait.setSize || 1) }}
        </b-badge>
      </span>
      <b-button-group>
        <b-button @click="showHistoryModal" v-b-tooltip="$t('tooltipViewTraitDataHistory')" :disabled="!hasHistoricData" class="trait-history"><IBiClockHistory /></b-button>
        <b-button @click="$emit('photo-clicked')" :disabled="!trial.editable" class="trait-camera"><IBiCameraFill /></b-button>
      </b-button-group>
    </h4>
    <div v-if="trait.restrictions || trait.timeframe">
      <b-badge class="me-2" v-if="trait.restrictions && (trait.restrictions.min !== undefined) && (trait.restrictions.min !== null)">&ge; {{ trait.restrictions.min }}</b-badge>
      <b-badge class="me-2" v-if="trait.restrictions && (trait.restrictions.max !== undefined) && (trait.restrictions.max !== null)">&le; {{ trait.restrictions.max }}</b-badge>
      <b-badge class="me-2" v-b-tooltip.bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :variant="trait.editable ? 'secondary' : 'danger'" v-if="trait.timeframe && trait.timeframe.start">&ge; {{ trait.timeframe.start }}</b-badge>
      <b-badge class="me-2" v-b-tooltip.bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :variant="trait.editable ? 'secondary' : 'danger'" v-if="trait.timeframe && trait.timeframe.end">&le; {{ trait.timeframe.end }}</b-badge>
    </div>
    <p @click="toggleExpanded" :class="{ 'text-muted': true, 'trait-description': !trialDescriptionExpanded }" :title="trait.description" v-if="trait.description">{{ trait.description }}</p>

    <b-form-group :label="trait.setSize > 1 ? $t('formLabelMeasurementSet', { position: $n(index) }) : $t('formLabelMeasurementEntry')"
                  v-for="index in (trait.setSize || 1)"
                  :key="`${trait.id}-${index}`"
                  :label-for="`trait-input-${trait.id}-${index}`">
      <template #description>
        <span v-html="description ? description[index - 1] : null" />
      </template>
      <TraitInput :cell="{ row: cell.row, column: cell.column, displayName: cell.displayName }" :editable="editable" :trait="trait" :id="`trait-input-${trait.id}-${index}`" :ref="`${trait.id}-${index}`" @traverse="handleTraverse(index)" />
    </b-form-group>

    <TraitDataHistoryModal @data-changed="$emit('data-changed')" :editable="editable" :cell="{ row: cell.row, column: cell.column, displayName: cell.displayName }" :trial="trial" :trait="trait" :measurements="cellTraitMeasurements" ref="traitDataHistoryModal" v-if="hasHistoricData && cellTraitMeasurements" @hidden="cellTraitMeasurements = null" />
  </section>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import TraitIcon from '@/components/icons/TraitIcon.vue'
import TraitInput from '@/components/TraitInput.vue'
import TraitHeading from '@/components/TraitHeading.vue'
import TraitDataHistoryModal from '@/components/modals/TraitDataHistoryModal.vue'

import { getTraitTypeText } from '@/plugins/misc'
import { CANVAS_SHAPE_SQUARE, TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'

export default {
  components: {
    TraitIcon,
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
      CANVAS_SHAPE_SQUARE,
      values: [],
      cellTraitMeasurements: null,
      trialDescriptionExpanded: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeCanvasShape',
      'storeShowFullTraitDescription',
      'storeServerUrl'
    ]),
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
            return values.map(v => {
              if (this.trial.people && last.personId) {
                const person = this.trial.people.find(p => p.id === last.personId)

                if (person) {
                  return this.$t('widgetTraitInputPreviousMeasuresTakenBy', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color, by: person.name })
                } else {
                  return this.$t('widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color })
                }
              } else {
                return this.$t('widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color })
              }
            })
          } else {
            return values.map(v => {
              if (this.trial.people && last.personId) {
                const person = this.trial.people.find(p => p.id === last.personId)

                if (person) {
                  return this.$t('widgetTraitInputCurrentMeasuresTakenBy', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color, by: person.name })
                } else {
                  return this.$t('widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color })
                }
              } else {
                return this.$t('widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color })
              }
            })
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
    toggleExpanded: function () {
      if (!this.storeShowFullTraitDescription) {
        this.trialDescriptionExpanded = !this.trialDescriptionExpanded
      }
    },
    showHistoryModal: function () {
      // Take a copy of the current values and open the modal
      this.cellTraitMeasurements = JSON.parse(JSON.stringify(this.cell.measurements[this.trait.id]))
      this.$nextTick(() => this.$refs.traitDataHistoryModal.show())
    },
    focus: function () {
      this.$refs[`${this.trait.id}-${1}`][0].focus()
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
  },
  mounted: function () {
    this.trialDescriptionExpanded = this.storeShowFullTraitDescription || false
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
.fullscreen-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
</style>

<style>
.trait-image {
  max-width: 100vw;
  max-height: 100vh;
  height: auto;
}

@media (min-width: 992px) {
  .trait-image {
    max-width: 50vw;
    max-height: 50vh;
    height: auto;
  }
}
</style>
