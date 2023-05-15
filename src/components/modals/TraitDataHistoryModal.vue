<template>
  <b-modal :title="$t('modalTitleTraitDataHistory')"
           :ok-title="$t('buttonClose')"
           @ok.prevent="validate"
           ok-only
           @hidden="$emit('hidden')"
           no-fade
           ref="traitDataHistoryModal">
    <div v-if="trial && cell && trait">
      <p>{{ $t('modalTextTraitDataHistory') }}</p>
      <b-form-datepicker :date-disabled-fn="isDateDisabled"
                          :date-info-fn="dateStyle"
                          :start-weekday="1"
                          :min="minDate"
                          :max="maxDate"
                          v-model="currentDate" />

      <section v-for="(traitValues, tvIndex) in dataForDate" :key="`trait-values-${currentDate}-${tvIndex}`">
        <b-form-group :label="$t('formLabelMeasurementSet', { position: index })"
                      v-for="index in (trait.setSize || 1)"
                      :key="`${trait.id}-${index}`"
                      :label-for="`${trait.id}-${index}`">
          <TraitInput :editable="true"
                      :trait="trait"
                      :currentValue="dataForDate[tvIndex].values[index - 1]"
                      :id="`${trait.id}-${index}`"
                      :ref="`${trait.id}-${index}`" />
        </b-form-group>
      </section>
    </div>
  </b-modal>
</template>

<script>
import TraitInput from '@/components/TraitInput'
// const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TraitInput
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    cell: {
      type: Object,
      default: () => null
    },
    trait: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      currentDate: null
    }
  },
  watch: {
    allDates: {
      immediate: true,
      handler: function (newValue) {
        if (newValue && newValue.length > 0) {
          this.currentDate = newValue[newValue.length - 1]
        } else {
          this.currentDate = null
        }
      }
    }
  },
  computed: {
    dataForDate: function () {
      if (this.cell && this.cell.measurements && this.trait && this.cell.measurements[this.trait.id] && this.cell.measurements[this.trait.id].length > 0) {
        return this.cell.measurements[this.trait.id].filter(td => td.timestamp.split('T')[0] === this.currentDate)
      } else {
        return null
      }
    },
    minDate: function () {
      if (this.allDates && this.allDates.length > 0) {
        return this.allDates[0]
      } else {
        return null
      }
    },
    maxDate: function () {
      if (this.allDates && this.allDates.length > 0) {
        return this.allDates[this.allDates.length - 1]
      } else {
        return null
      }
    },
    allDates: function () {
      if (this.cell && this.cell.measurements && this.trait && this.cell.measurements[this.trait.id] && this.cell.measurements[this.trait.id].length > 0) {
        const dates = new Set()

        this.cell.measurements[this.trait.id].forEach(td => {
          dates.add(td.timestamp.split('T')[0])
        })

        return [...dates].sort((a, b) => a.localeCompare(b))
      } else {
        return []
      }
    }
  },
  methods: {
    dateStyle: function (ymd, date) {
      if (this.isDateDisabled(ymd)) {
        return null
      } else {
        return 'table-primary'
      }
    },
    isDateDisabled: function (ymd, date) {
      if (this.allDates) {
        return !this.allDates.includes(ymd)
      } else {
        return true
      }
    },
    validate: function () {
      // TODO

      this.hide()
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.traitDataHistoryModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.traitDataHistoryModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
