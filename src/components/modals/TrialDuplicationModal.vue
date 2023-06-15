<template>
  <b-modal :title="$t('modalTitleTrialDuplicate')"
           :ok-title="$t('buttonDuplicateTrial')"
           @ok.prevent="onSubmit"
           :ok-disabled="!this.nameValid || !this.traitsValid"
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="trialDuplicationModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialDuplicate') }}</p>

      <TrialInformation class="border mb-3" :trial="trial" />

      <b-form @submit.prevent="onSubmit">
        <b-form-group :label="$t('formLabelDuplicateTrialName')" :description="$t('formDescriptionDuplicateTrialName')" label-for="name">
          <b-form-input id="name" v-model="newName" trim :state="nameValid" />
        </b-form-group>

        <b-form-group :label="$t('formLabelDuplicateTrialDescription')" :description="$t('formDescriptionDuplicateTrialDescription')" label-for="description">
          <b-form-textarea id="description" v-model="newDescription" trim />
        </b-form-group>

        <b-form-group :label="$t('formLabelDuplicateTrialTraits')" :description="$t('formDescriptionDuplicateTrialTraits')" label-for="traits">
          <b-form-select id="traits" v-model="selectedTraits" :options="allTraits" multiple :state="traitsValid" />
        </b-form-group>

        <b-form-group :label="$t('formLabelDuplicateTrialCopyData')" :description="$t('formDescriptionDuplicateTrialCopyData')" label-for="copyData">
          <b-form-checkbox switch id="copyData" v-model="copyData">{{ $t(copyData ? 'genericYes' : 'genericNo') }}</b-form-checkbox>
        </b-form-group>
      </b-form>
    </div>
  </b-modal>
</template>

<script>
import TrialInformation from '@/components/TrialInformation'
import { addTrial, getTrialData } from '@/plugins/idb'
import { getId } from '@/plugins/id'
const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TrialInformation
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      newName: null,
      newDescription: null,
      copyData: false,
      selectedTraits: [],
      allTraits: []
    }
  },
  computed: {
    nameValid: function () {
      if (this.newName === null) {
        return null
      } else {
        return this.newName !== ''
      }
    },
    traitsValid: function () {
      if (!this.allTraits || this.allTraits.length < 1) {
        return null
      } else {
        return this.selectedTraits.length > 0
      }
    }
  },
  watch: {
    trial: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.newName = this.$t('modalTextTrialDuplicateOfName', { original: newValue.name })
          this.newDescription = this.$t('modalTextTrialDuplicateOfDate', { date: new Date().toLocaleDateString() })
          this.copyData = false
          this.allTraits = newValue.traits.map(t => {
            return {
              text: t.name,
              value: t
            }
          })
          this.selectedTraits = this.allTraits.concat().map(t => t.value)
        } else {
          this.newName = null
          this.newDescription = null
          this.copyData = false
          this.allTraits = []
          this.selectedTraits = this.allTraits.concat().map(t => t.value)
        }
      }
    }
  },
  methods: {
    onSubmit: function () {
      if (!this.nameValid || !this.traitsValid) {
        return
      }

      emitter.emit('show-loading', true)

      getTrialData(this.trial.localId)
        .then(data => {
          const trialCopy = JSON.parse(JSON.stringify(this.trial))
          trialCopy.localId = null
          trialCopy.name = this.newName
          trialCopy.description = this.newDescription
          trialCopy.comments = []
          trialCopy.createdOn = new Date().toISOString()
          trialCopy.updatedOn = new Date().toISOString()
          trialCopy.shareCodes = null
          trialCopy.data = {}

          trialCopy.traits = this.selectedTraits.concat()

          const newIds = {}

          this.selectedTraits.forEach(t => {
            newIds[t.id] = getId()
          })

          Object.values(data).forEach(c => {
            const cellCopy = JSON.parse(JSON.stringify(c))
            cellCopy.comments = []

            const measurements = {}
            this.selectedTraits.forEach(t => {
              if (this.copyData) {
                measurements[newIds[t.id]] = JSON.parse(JSON.stringify(cellCopy.measurements[t.id]))
              } else {
                measurements[newIds[t.id]] = []
              }
            })

            cellCopy.measurements = measurements

            if (!this.copyData) {
              delete cellCopy.isMarked
              delete cellCopy.brapiId
            }

            trialCopy.data[`${cellCopy.row}|${cellCopy.column}`] = cellCopy
          })

          trialCopy.traits = this.selectedTraits.map(t => {
            t.id = newIds[t.id]
            return t
          })

          return addTrial(trialCopy)
        })
        .then(() => {
          emitter.emit('trials-updated')
          this.hide()
        })
        .finally(() => emitter.emit('show-loading', false))
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$nextTick(() => this.$refs.trialDuplicationModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialDuplicationModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
