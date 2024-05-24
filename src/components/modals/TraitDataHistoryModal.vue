 <template>
  <b-modal :title="$t('modalTitleTraitDataHistory')"
           :ok-title="$t('buttonClose')"
           @ok.prevent="validate"
           @hidden="$emit('hidden')"
           no-fade
           ref="traitDataHistoryModal">
    <div v-if="trial && localMeasurements && trait">
      <p>{{ $t('modalTextTraitDataHistory') }}</p>
      <b-input-group class="mb-3">
        <b-input-group-prepend>
          <b-button @click="nudgeDate(false)" :disabled="prevDisabled"><IBiChevronLeft /></b-button>
        </b-input-group-prepend>
        <b-form-input type="date" v-model="currentDate" disabled />
        <b-input-group-append>
          <b-button @click="nudgeDate(true)" :disabled="nextDisabled"><IBiChevronRight /></b-button>
        </b-input-group-append>
      </b-input-group>

      <div :class="{ 'border border-danger table-danger px-2': toDelete[currentDateIndex] }">
        <section v-for="(traitValues, tvIndex) in dataForDate" :key="`trait-values-${currentDate}-${tvIndex}`">
          <b-form-group :label="$t('formLabelMeasurementSet', { position: index })"
                        v-for="index in (trait.setSize || 1)"
                        :key="`${trait.id}-${index}`"
                        :label-for="`history-${tvIndex}-${trait.id}-${index}`">
            <TraitInput :editable="editable"
                        :trait="trait"
                        :currentValue="dataForDate[tvIndex].values[index - 1]"
                        :id="`history-${tvIndex}-${trait.id}-${index}`"
                        :ref="`history-${tvIndex}-${trait.id}-${index}`" />
          </b-form-group>
        </section>
      </div>
      <b-button class="mt-2" @click="toggleDelete" variant="danger" :disabled="!trial.editable" v-if="toDelete[currentDateIndex]"><IBiTrashFill /> {{ $t('buttonUndeleteTimepointData') }}</b-button>
      <b-button class="mt-2" @click="toggleDelete" variant="outline-danger" :disabled="!trial.editable" v-else><IBiTrash /> {{ $t('buttonDeleteTimepointData') }}</b-button>
    </div>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import TraitInput from '@/components/TraitInput.vue'
import { changeTrialsData } from '@/plugins/idb'
import { isProxy, toRaw } from 'vue'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    TraitInput
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    row: {
      type: Number,
      default: 0
    },
    column: {
      type: Number,
      default: 0
    },
    measurements: {
      type: Array,
      default: () => null
    },
    trait: {
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
      currentDate: null,
      localMeasurements: null,
      transactions: [],
      toDelete: []
    }
  },
  watch: {
    measurements: {
      immediate: true,
      handler: function (newValue) {
        this.localMeasurements = JSON.parse(JSON.stringify(newValue))
      }
    },
    allDates: {
      immediate: true,
      handler: function (newValue) {
        if (newValue && newValue.length > 0) {
          this.currentDate = newValue[newValue.length - 1]
        } else {
          this.currentDate = null
        }

        this.toDelete = newValue.map(_ => false)
      }
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrialPerson'
    ]),
    currentDateIndex: function () {
      if (this.allDates && this.allDates.length > 0) {
        return this.allDates.indexOf(this.currentDate)
      } else {
        return 0
      }
    },
    prevDisabled: function () {
      return !this.allDates || this.allDates.length < 1 || this.currentDateIndex === 0
    },
    nextDisabled: function () {
      return !this.allDates || this.allDates.length < 1 || this.currentDateIndex === this.allDates.length - 1
    },
    dataForDate: function () {
      return this.getDataForDate(this.currentDate)
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
      if (this.localMeasurements && this.localMeasurements.length > 0) {
        const dates = new Set()

        this.localMeasurements.forEach(td => {
          dates.add(td.timestamp.split('T')[0])
        })

        return [...dates].sort((a, b) => a.localeCompare(b))
      } else {
        return []
      }
    }
  },
  methods: {
    toggleDelete: function () {
      this.toDelete[this.currentDateIndex] = !this.toDelete[this.currentDateIndex]
    },
    handleDateChange: function (newValue, setCurrentDate = true) {
      const oldData = this.getDataForDate(this.currentDate)

      let valid = true
      for (let s = 0; s < oldData.length; s++) {
        for (let i = 0; i < (this.trait.setSize || 1); i++) {
          valid &&= this.$refs[`history-${s}-${this.trait.id}-${i + 1}`][0].validate()
        }
      }

      if (valid) {
        for (let s = 0; s < oldData.length; s++) {
          for (let i = 0; i < (this.trait.setSize || 1); i++) {
            let newData = this.$refs[`history-${s}-${this.trait.id}-${i + 1}`][0].getValue()

            if (newData === '') {
              newData = null
            }

            oldData[s].values[i] = newData
          }
        }

        if (setCurrentDate) {
          this.currentDate = newValue
        }
      }

      return valid
    },
    getDataForDate: function (date) {
      if (this.localMeasurements && this.localMeasurements.length > 0) {
        return this.localMeasurements.filter(td => td.timestamp.split('T')[0] === date)
      } else {
        return null
      }
    },
    nudgeDate: function (increase) {
      if (increase && this.currentDateIndex < this.allDates.length - 1) {
        this.handleDateChange(this.allDates[this.currentDateIndex + 1])
      } else if (!increase && this.currentDateIndex > 0) {
        this.handleDateChange(this.allDates[this.currentDateIndex - 1])
      }
    },
    validate: function () {
      // Run validation again
      const valid = this.handleDateChange(this.currentDate, false)

      if (!valid) {
        return
      }

      // Then check what actually changed
      const changes = []
      for (let i = 0; i < this.localMeasurements.length; i++) {
        let ms = this.localMeasurements[i].values
        let ts = this.localMeasurements[i].timestamp

        if (isProxy(ms)) {
          ms = toRaw(ms)
        }
        if (isProxy(ts)) {
          ts = toRaw(ts)
        }

        if (this.toDelete[i]) {
          changes.push({
            traitId: this.trait.id,
            values: ms,
            timestamp: ts,
            delete: true
          })
        } else {
          let changed = false
          for (let s = 0; s < (this.trait.setSize || 1); s++) {
            if (ms[s] !== this.measurements[i].values[s]) {
              changed = true
            }
          }

          if (changed) {
            changes.push({
              traitId: this.trait.id,
              personId: this.storeSelectedTrialPerson,
              values: ms,
              timestamp: ts
            })
          }
        }
      }

      if (changes.length > 0) {
        const payload = {}
        payload[`${this.row}|${this.column}`] = changes
        changeTrialsData(this.trial.localId, payload)
          .then(() => {
            this.$nextTick(() => {
              emitter.emit('plot-data-changed', this.row, this.column, this.trial.localId)
              emitter.emit('plot-clicked', this.row, this.column)
            })
            this.hide()
          })
      } else {
        this.hide()
      }
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
