<template>
  <b-modal :title="$t('modalTitlePlotMetadataUpdate')"
           :ok-title="$t('buttonImport')"
           @ok.prevent="onSubmit"
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="plotMetadataUpdateModal">
    <div v-if="trial">
      <p v-html="$t('modalTextPlotMetadataUpdate')" />

      <b-form @submit.prevent="onSubmit">
        <b-form-group :label="$t('formLabelPlotMetadataUpdateContent')" :description="$t('formDescriptionPlotMetadataUpdateContent')" label-for="content" :state="formState">
          <LineNumberTextarea v-model="content" id="content" :state="formState" :placeholder="$t('formPlaceholderPlotMetadataUpdateContent')" />
          <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="inputFile" />
        </b-form-group>
        <p class="text-danger" v-if="errorMessage">{{ errorMessage }}</p>
      </b-form>
    </div>
  </b-modal>
</template>

<script>
import { tsvParse, csvParse } from 'd3-dsv'
import { changeTrialsData, getTrialData, updatePlotMetadata } from '@/plugins/idb'
import { checkDataMatchesTraitType, getColumnIndex, getRowIndex, isValidDateString } from '@/plugins/misc'
import LineNumberTextarea from '@/components/LineNumberTextarea.vue'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    LineNumberTextarea
  },
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
      requiredColumns: ['Germplasm', 'Rep', 'Row', 'Column', 'Friendly name', 'Barcode', 'Pedigree'],
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

      const newData = {}

      const baseDate = new Date()
      baseDate.setHours(0, 0, 0, 0)

      for (let r = 0; r < parsedData.length; r++) {
        const row = parsedData[r]
        let displayName = row.Germplasm

        if (row.Rep) {
          displayName += `-${row.Rep}`
        }

        let cell

        if (row.Row !== undefined && row.Row !== null && row.Row !== '' && row.Column !== undefined && row.Column !== null && row.Column) {
          const rowIndex = getRowIndex(this.trial.layout, +row.Row)
          const columnIndex = getColumnIndex(this.trial.layout, +row.Column)

          cell = data[`${rowIndex}|${columnIndex}`]
        } else {
          cell = uniqueGermplasmNames.get(displayName)
        }
        // Check the germplasm exists in the trial
        if (!cell) {
          this.errorMessage = this.$t('errorMessageDataImportInvalidGermplasmRep', { missing: displayName, row: r + 1 })
          this.formState = false
          return
        }

        const friendlyName = (row['Friendly name'] || '').trim()
        const pedigree = (row.Pedigree || '').trim()
        const barcode = (row.Barcode || '').trim()

        newData[`${cell.row}|${cell.column}`] = {
          friendlyName,
          pedigree,
          barcode
        }
      }

      this.formState = true

      emitter.emit('show-loading', true)

      updatePlotMetadata(this.trial.localId, newData)
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
      this.$nextTick(() => this.$refs.plotMetadataUpdateModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.plotMetadataUpdateModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
