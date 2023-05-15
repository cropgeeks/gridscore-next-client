<template>
  <b-modal :title="$t('modalTitleTraitDataHistory')"
           :ok-title="$t('buttonClose')"
           @ok.prevent="validate"
           ok-only
           @hidden="$emit('hidden')"
           no-fade
           ref="traitDataHistoryModal">
    <div v-if="trial && measurements && trait">
      <p>{{ $t('modalTextTraitDataHistory') }}</p>
      <b-input-group class="mb-3">
        <b-input-group-prepend>
          <b-button @click="nudgeDate(false)"><BIconChevronLeft /></b-button>
        </b-input-group-prepend>
        <b-form-datepicker :date-disabled-fn="isDateDisabled"
                          :date-info-fn="dateStyle"
                          :start-weekday="1"
                          :min="minDate"
                          :max="maxDate"
                          v-model="currentDate" />
        <b-input-group-append>
          <b-button @click="nudgeDate(true)"><BIconChevronRight /></b-button>
        </b-input-group-append>
      </b-input-group>

      <section v-for="(traitValues, tvIndex) in dataForDate" :key="`trait-values-${currentDate}-${tvIndex}`">
        <b-form-group :label="$t('formLabelMeasurementSet', { position: index })"
                      v-for="index in (trait.setSize || 1)"
                      :key="`${trait.id}-${index}`"
                      :label-for="`history-${trait.id}-${index}`">
          <TraitInput :editable="true"
                      :trait="trait"
                      :currentValue="dataForDate[tvIndex].values[index - 1]"
                      :id="`history-${trait.id}-${index}`"
                      :ref="`${trait.id}-${index}`" />
        </b-form-group>
      </section>
    </div>
  </b-modal>
</template>

<script>
import TraitInput from '@/components/TraitInput'
import { BIconChevronLeft, BIconChevronRight } from 'bootstrap-vue'

// const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TraitInput,
    BIconChevronLeft,
    BIconChevronRight
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    measurements: {
      type: Array,
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
    },
    currentDate: function (newValue) {
      // TODO: Check for changes, validate them and store them back in the measurements array
    }
  },
  computed: {
    dataForDate: function () {
      if (this.measurements && this.measurements.length > 0) {
        return this.measurements.filter(td => td.timestamp.split('T')[0] === this.currentDate)
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
      if (this.measurements && this.measurements.length > 0) {
        const dates = new Set()

        this.measurements.forEach(td => {
          dates.add(td.timestamp.split('T')[0])
        })

        return [...dates].sort((a, b) => a.localeCompare(b))
      } else {
        return []
      }
    }
  },
  methods: {
    nudgeDate: function (increase) {
      const index = this.allDates.indexOf(this.currentDate)

      if (increase && index < this.allDates.length - 1) {
        this.currentDate = this.allDates[index + 1]
      } else if (!increase && index > 0) {
        this.currentDate = this.allDates[index - 1]
      }
    },
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
