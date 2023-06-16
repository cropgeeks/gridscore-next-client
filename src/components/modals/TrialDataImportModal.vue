<template>
  <b-modal :title="$t('modalTitleTrialDataUpload')"
           :ok-title="$t('buttonImport')"
           @ok.prevent="onSubmit"
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="trialDataUploadModal">
    <div v-if="trial">
      <p v-html="$t('modalTextTrialDataUpload')" />

      <b-form @submit.prevent="onSubmit">
        <b-form-group :label="$t('formLabelTrialDataUploadContent')" :description="$t('formDescriptionTrialDataUploadContent')" label-for="content" :state="formState">
          <b-form-textarea v-model="content" :placeholder="$t('formPlaceholderTrialDataUploadContent')" wrap="off" :state="formState" :rows="15" id="content" />
          <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="inputFile" />
        </b-form-group>
        <p class="text-danger" v-if="errorMessage">{{ errorMessage }}</p>
      </b-form>
    </div>
  </b-modal>
</template>

<script>
import { tsvParse, csvParse } from 'd3-dsv'
import { changeTrialsData, getTrialData } from '@/plugins/idb'
import { checkDataMatchesTraitType, isValidDateString } from '@/plugins/misc'

const emitter = require('tiny-emitter/instance')

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      content: null,
      formState: null,
      inputFile: null,
      requiredColumns: ['Germplasm', 'Rep', 'Trait name', 'Date', 'Value'],
      errorMessage: null
    }
  },
  watch: {
    inputFile: function (newValue) {
      if (newValue) {
        this.loadInputFile()
      }
    }
  },
  methods: {
    loadInputFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.content = event.target.result.replace(/\r/g, '')
        this.inputFile = null
      }
      reader.readAsText(this.inputFile)
    },
    onSubmit: async function () {
      this.formState = null
      this.errorMessage = null

      const csv = csvParse(this.content)
      const tsv = tsvParse(this.content)

      let parsedData = null
      if (csv.columns.length > 1 && !csv.columns[0].includes('\t')) {
        parsedData = csv
      } else {
        parsedData = tsv
      }

      // Check input data columns
      const allColumns = parsedData.columns.every(c => this.requiredColumns.includes(c))
      if (!allColumns) {
        this.errorMessage = this.$t('errorMessageDataImportInvalidColumns')
        this.formState = false
        return
      }

      // Get the trial data and extract the germplasm names
      const data = await getTrialData(this.trial.localId)
      const uniqueGermplasmNames = new Map()
      Object.values(data).forEach(c => uniqueGermplasmNames.set(c.displayName, c))
      const trialTraits = this.trial.traits.map(t => t.name)

      const newData = {}

      const baseDate = new Date()
      baseDate.setHours(0, 0, 0, 0)

      for (let r = 0; r < parsedData.length; r++) {
        const row = parsedData[r]
        let displayName = row.Germplasm

        if (row.Rep) {
          displayName += `-${row.Rep}`
        }

        const cell = uniqueGermplasmNames.get(displayName)
        // Check the germplasm exists in the trial
        if (!cell) {
          this.errorMessage = this.$t('errorMessageDataImportInvalidGermplasmRep', { missing: displayName, row: r + 1 })
          this.formState = false
          return
        }

        // Check the trait exists in the trial
        if (!trialTraits.includes(row['Trait name'])) {
          this.errorMessage = this.$t('errorMessageDataImportInvalidTrait', { missing: row['Trait name'], row: r + 1 })
          this.formState = false
          return
        }

        // Check the date
        if (row.Date !== undefined && row.Date !== null && row.Date !== '') {
          if (!isValidDateString(row.Date)) {
            this.errorMessage = this.$t('errorMessageDataImportInvalidDate', { date: row.Date, row: r + 1 })
            this.formState = false
            return
          }
        }

        const trait = this.trial.traits.find(t => t.name === row['Trait name'])
        // Check the specified value is correct
        if (row.Value !== undefined && row.Value !== null && row.Value !== '') {
          if (trait.setSize === 1) {
            if (!checkDataMatchesTraitType(trait, row.Value)) {
              this.errorMessage = this.$t('errorMessageDataImportInvalidValue', { value: row.Value, row: r + 1 })
              this.formState = false
              return
            }
          } else {
            const parts = row.Value.split(',').map(v => v.trim())

            if (parts.length > trait.setSize) {
              this.errorMessage = this.$t('errorMessageDataImportInvalidSetSize', { value: row.Value, setSize: trait.setSize, provided: parts.length, row: r + 1 })
              this.formState = false
              return
            }

            for (const part of parts) {
              if (!checkDataMatchesTraitType(trait, part)) {
                this.errorMessage = this.$t('errorMessageDataImportInvalidValue', { value: part, row: r + 1 })
                this.formState = false
                return
              }
            }
          }
        }

        // Everything is fine, remember to add this new data
        if (!newData[`${cell.row}|${cell.column}`]) {
          newData[`${cell.row}|${cell.column}`] = []
        }

        let timestamp
        if (row.Date !== undefined && row.Date !== null && row.Date !== '') {
          timestamp = new Date(row.Date)
        } else {
          // Use this trick to avoid adding multiple data points with the same timestamp. They would overwrite each other
          baseDate.setSeconds(baseDate.getSeconds() + 1)
          timestamp = baseDate
        }
        timestamp = timestamp.toISOString()

        const values = []
        const parts = trait.setSize === 1 ? [row.Value] : row.Value.split(',').map(v => v.trim())

        for (const part of parts) {
          if (part !== undefined && part !== null && part !== '') {
            if (trait.dataType === 'categorical') {
              const index = trait.restrictions.categories.indexOf(part)
              values.push(index)
            } else {
              values.push(part)
            }
          }
        }

        while (values.length < trait.setSize) {
          values.push(null)
        }

        newData[`${cell.row}|${cell.column}`].push({
          traitId: trait.id,
          timestamp: timestamp,
          values: values
        })
      }

      this.formState = true

      emitter.emit('show-loading', true)

      changeTrialsData(this.trial.localId, newData)
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
      this.content = null
      this.formState = null
      this.inputFile = null
      this.errorMessage = null
      this.$nextTick(() => this.$refs.trialDataUploadModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialDataUploadModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
