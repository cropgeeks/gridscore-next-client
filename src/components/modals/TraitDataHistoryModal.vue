 <template>
  <b-modal :title="$t('modalTitleTraitDataHistory')"
           :ok-title="$t(editable ? 'buttonSave' : 'buttonClose')"
           @ok.prevent="validate"
           @hidden="$emit('hidden')"
           size="lg"
           no-fade
           ref="traitDataHistoryModal">
    <div v-if="trial && localMeasurements && trait && cell">
      <p>{{ $t('modalTextTraitDataHistory') }}</p>

      <b-list-group>
        <b-list-group-item v-for="(measurement, mIndex) in localMeasurements" :key="`measurement-${trait.id}-${mIndex}`" class="flex-column align-items-start" :variant="(mIndex % 2) === 1 ? 'light' : null">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">{{ $t('modalTextTraitDataHistoryHeading') }}</h5>
            <small>{{ new Date(measurement.timestamp).toLocaleString() }}</small>
          </div>
          <b-form-group :label="trait.setSize > 1 ? $t('formLabelMeasurementSet', { position: $n(index) }) : $t('formLabelMeasurementEntry')"
                        v-for="index in (trait.setSize || 1)"
                        :key="`trait-input-group-${trait.id}-${index}`"
                        :label-for="`trait-input-${trait.id}-${mIndex}-${index - 1}`">
            <TraitInput :cell="{ row: cell.row, column: cell.column, displayName: cell.displayName }"
                        :editable="editable && (measurement.delete !== true)"
                        :currentValue="measurement.values[index - 1]"
                        :trait="trait"
                        :id="`trait-input-${trait.id}-${mIndex}-${index - 1}`"
                        :ref="`trait-input-${trait.id}-${mIndex}-${index - 1}`" />
          </b-form-group>
          <b-button class="mt-2" @click="measurement.delete = !measurement.delete" variant="danger" :disabled="!trial.editable" v-if="measurement.delete"><IBiTrashFill /> {{ $t('buttonUndeleteTimepointData') }}</b-button>
          <b-button class="mt-2" @click="measurement.delete = !measurement.delete" variant="outline-secondary" :disabled="!trial.editable" v-else><IBiTrash /> {{ $t('buttonDeleteTimepointData') }}</b-button>
        </b-list-group-item>
      </b-list-group>
    </div>
  </b-modal>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
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
    cell: {
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
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
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
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrialPerson'
    ])
  },
  methods: {
    validate: function () {
      // Run validation again
      let valid = true

      this.localMeasurements.forEach((m, mIndex) => {
        for (let s = 0; s < (this.trait.setSize || 1); s++) {
          valid &&= this.$refs[`trait-input-${this.trait.id}-${mIndex}-${s}`][0].validate()
        }
      })

      if (!valid) {
        return
      }

      // Then check what actually changed
      const changes = []

      this.localMeasurements.forEach((m, mIndex) => {
        let v = m.values

        if (isProxy(v)) {
          v = toRaw(v)
        }

        let changed = false
        for (let s = 0; s < (this.trait.setSize || 1); s++) {
          let newData = this.$refs[`trait-input-${this.trait.id}-${mIndex}-${s}`][0].getValue()

          if (newData === '') {
            newData = null
          }

          if (newData !== this.measurements[mIndex].values[s]) {
            changed = true
          }

          v[s] = newData
        }

        if (m.delete) {
          changes.push({
            traitId: this.trait.id,
            values: v,
            timestamp: m.timestamp,
            delete: true
          })
        } else if (changed) {
          changes.push({
            traitId: this.trait.id,
            personId: this.storeSelectedTrialPerson,
            values: v,
            timestamp: m.timestamp,
            delete: false
          })
        }
      })

      if (changes.length > 0) {
        const payload = {}
        payload[`${this.cell.row}|${this.cell.column}`] = changes
        changeTrialsData(this.trial.localId, payload)
          .then(() => {
            this.$nextTick(() => {
              emitter.emit('plot-data-changed', this.cell.row, this.cell.column, this.trial.localId)
              emitter.emit('plot-clicked', this.cell.row, this.cell.column)
              this.$emit('data-changed')
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
