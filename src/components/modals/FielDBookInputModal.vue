<template>
  <b-modal :title="$t('modalTitleFielDBookInput')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t('buttonLoad')"
           :ok-disabled="!columnsMapped"
           @ok.prevent="loadInput"
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="fieldBookModal">
    <p>{{ $t('modalTextFielDBookInput') }}</p>
    <b-form-group label-for="fieldbook-input"
                  :label="$t('formLabelFielDBookInput')"
                  :state="formValidated"
                  :invalid-feedback="formFeedback">
      <b-form-textarea id="fieldbook-input"
                        @keydown.tab.prevent="tabber($event)"
                        rows=12
                        wrap="off"
                        required
                        :state="formValidated"
                        :placeholder="$t('formPlaceholderFielDBookInput')"
                        v-model="input" />
      <!-- Variety names file loading -->
      <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="inputFile" />
    </b-form-group>

    <b-button variant="primary" @click="readColumns"><IBiLayoutTextSidebar :style="{ transform: 'rotate(270deg)' }" /> {{ $t('buttonReadColumns') }}</b-button>

    <div class="mt-3" v-if="fileColumns && fileColumns.length > 0">
      <p>{{ $t('modalTextFielDBookColumnMapping') }}</p>
      <b-row>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelFielDBookRow')" :description="$t('formDescriptionFielDBookRow')" label-for="row">
            <b-form-select id="row" v-model="columnMapping.row" :options="fileColumns" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelFielDBookColumn')" :description="$t('formDescriptionFielDBookColumn')" label-for="column">
            <b-form-select id="column" v-model="columnMapping.column" :options="fileColumns" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelFielDBookGermplasm')" :description="$t('formDescriptionFielDBookGermplasm')" label-for="germplasm">
            <b-form-select id="germplasm" v-model="columnMapping.germplasm" :options="fileColumns" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelFielDBookRep')" :description="$t('formDescriptionFielDBookRep')" label-for="rep">
            <b-form-select id="rep" v-model="columnMapping.rep" :options="fileColumns" />
          </b-form-group>
        </b-col>
      </b-row>
    </div>
  </b-modal>
</template>

<script>
import { tsvParse, csvParse, autoType } from 'd3-dsv'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'
import { getColumnIndex, getRowIndex } from '@/plugins/misc'

export default {
  props: {
    layout: {
      type: Object,
      default: () => {
        return {
          rows: 1,
          colums: 1,
          rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
          columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
        }
      }
    }
  },
  data: function () {
    return {
      formValidated: null,
      formFeedback: null,
      input: null,
      inputFile: null,
      parsedData: null,
      fileColumns: [],
      columnMapping: {
        row: null,
        column: null,
        germplasm: null,
        rep: null
      }
    }
  },
  watch: {
    input: function () {
      this.reset(false)
    },
    inputFile: function (newValue) {
      if (newValue) {
        this.loadInputFile()
      }
    }
  },
  computed: {
    columnsMapped: function () {
      return this.columnMapping.row !== null && this.columnMapping.column !== null && this.columnMapping.germplasm !== null
    }
  },
  methods: {
    readColumns: function () {
      this.parsedData = null
      this.formValidated = null
      this.formFeedback = null
      this.fileColumns = []
      this.columnMapping = {
        row: null,
        column: null,
        germplasm: null,
        rep: null
      }

      if (!this.input || this.input.length < 1) {
        this.formValidated = false
        this.formFeedback = this.$t('formFeedbackFielDBookMissingData')
        return
      }

      const csv = csvParse(this.input, autoType)
      const tsv = tsvParse(this.input, autoType)

      if (csv.columns.length > 1 && !csv.columns[0].includes('\t')) {
        this.parsedData = csv
      } else {
        this.parsedData = tsv
      }

      const tempColumns = this.parsedData.columns.map(v => {
        return {
          value: v,
          text: v
        }
      })
      tempColumns.unshift({
        value: null,
        text: this.$t('formSelectOptionUnmapped')
      })
      this.fileColumns = tempColumns

      if (this.fileColumns.length > 1) {
        // Naive naming
        if (this.parsedData.columns.includes('Row')) {
          this.columnMapping.row = 'Row'
        }
        if (this.parsedData.columns.includes('Column')) {
          this.columnMapping.column = 'Column'
        }
        if (this.parsedData.columns.includes('Rep')) {
          this.columnMapping.rep = 'Rep'
        }
        if (this.parsedData.columns.includes('Germplasm')) {
          this.columnMapping.germplasm = 'Germplasm'
        }
        // FielDHub specific naming
        if (this.parsedData.columns.includes('ROW')) {
          this.columnMapping.row = 'ROW'
        }
        if (this.parsedData.columns.includes('COLUMN')) {
          this.columnMapping.column = 'COLUMN'
        }
        if (this.parsedData.columns.includes('REP')) {
          this.columnMapping.rep = 'REP'
        }
        if (this.parsedData.columns.includes('TREATMENT')) {
          this.columnMapping.germplasm = 'TREATMENT'
        }
      } else {
        this.formValidated = false
        this.formFeedback = this.$t('formFeedbackFielDBookMissingData')
      }
    },
    tabber: function (event) {
      const text = this.input
      const originalSelectionStart = event.target.selectionStart
      const textStart = text.slice(0, originalSelectionStart)
      const textEnd = text.slice(originalSelectionStart)

      this.input = `${textStart}\t${textEnd}`
      event.target.value = this.input // required to make the cursor stay in place.
      event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + 1
    },
    loadInput: function () {
      const mapping = {}

      for (let i = 0; i < this.parsedData.length; i++) {
        const r = this.parsedData[i]

        const row = r[this.columnMapping.row]
        const column = r[this.columnMapping.column]
        const germplasm = r[this.columnMapping.germplasm]
        const rep = r[this.columnMapping.rep] || null

        if (!germplasm || germplasm === '') {
          this.formValidated = false
          this.formFeedback = this.$t('formFeedbackFielDBookMissingGermplasm', { line: i + 1 })
          return
        }
        if (row === undefined || row === null || row === '' || !(typeof row === 'number')) {
          this.formValidated = false
          this.formFeedback = this.$t('formFeedbackFielDBookMissingInvalidRow', { line: i + 1 })
          return
        }
        if (column === undefined || column === null || column === '' || !(typeof column === 'number')) {
          this.formValidated = false
          this.formFeedback = this.$t('formFeedbackFielDBookMissingInvalidColumn', { line: i + 1 })
          return
        }

        const rowIndex = getRowIndex(this.layout, row)
        const columnIndex = getColumnIndex(this.layout, column)

        if (rowIndex < 0 || rowIndex >= this.rows || columnIndex < 0 || columnIndex >= this.columns) {
          this.formValidated = false
          this.formFeedback = this.$t('formFeedbackFielDBookInvalidDimensions', { line: i + 1, row, column })
          return
        }

        mapping[`${rowIndex}|${columnIndex}`] = {
          germplasm,
          rep
        }
      }

      this.$emit('data-changed', mapping)
      this.reset()

      this.hide()

      emitter.emit('plausible-event', { key: 'load-layout', props: { type: 'FielDBook' } })
    },
    loadInputFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.input = event.target.result.replace(/\r/g, '')
        this.inputFile = null
      }
      reader.readAsText(this.inputFile)
    },
    reset: function (clearInput = true) {
      if (clearInput) {
        this.input = null
      }
      this.inputFile = null
      this.formValidated = null
      this.formFeedback = null
      this.parsedData = null
      this.fileColumns = []
      this.columnMapping = {
        row: null,
        column: null,
        germplasm: null,
        rep: null
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.reset()

      this.$refs.fieldBookModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.fieldBookModal.hide())
    }
  }
}
</script>

<style>

</style>
