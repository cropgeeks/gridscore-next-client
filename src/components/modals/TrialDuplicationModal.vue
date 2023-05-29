<template>
  <b-modal :title="$t('modalTitleTrialDuplicate')"
           :ok-title="$t('buttonDuplicateTrial')"
           @ok.prevent="onSubmit"
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="trialDuplicationModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialDuplicate') }}</p>

      <TrialInformation class="border mb-3" :trial="trial" />

      <b-form @submit.prevent="onSubmit">
        <b-form-group :label="$t('formLabelDuplicateTrialName')" :description="$t('formDescriptionDuplicateTrialName')" label-for="name">
          <b-form-input id="name" v-model="newName" trim />
        </b-form-group>

        <b-form-group :label="$t('formLabelDuplicateTrialDescription')" :description="$t('formDescriptionDuplicateTrialDescription')" label-for="description">
          <b-form-textarea id="description" v-model="newDescription" trim />
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
      copyData: false
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
        } else {
          this.newName = null
          this.newDescription = null
          this.copyData = false
        }
      }
    }
  },
  methods: {
    onSubmit: function () {
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

          Object.values(data).forEach(c => {
            const cellCopy = JSON.parse(JSON.stringify(c))
            if (!this.copyData) {
              cellCopy.comments = []
              delete cellCopy.isMarked
              delete cellCopy.brapiId

              cellCopy.measurements = {}
              trialCopy.traits.forEach(t => {
                cellCopy.measurements[t.id] = []
              })
            }

            trialCopy.data[`${cellCopy.row}|${cellCopy.column}`] = cellCopy
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
