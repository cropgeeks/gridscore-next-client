<template>
  <b-modal :title="$t('modalTitleTabbedInputToGrid')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t('buttonLoad')"
           @ok="loadInput"
           no-fade
           @hidden="$emit('hidden')"
           size="md"
           ref="tabbedInputToGridModal">
    <p>{{ $t('modalTextTabbedInputToGrid') }}</p>
    <b-form-group :label-for="`user-input-${id}`"
                  :label="$t(label)"
                  :state="formValidated"
                  :invalid-feedback="formFeedback">
      <b-form-textarea :id="`user-input-${id}`"
                        @keydown.tab.prevent="tabber($event)"
                        rows=6
                        wrap="off"
                        required
                        :state="formValidated"
                        :placeholder="$t(placeholder)"
                        v-model="input" />
      <!-- Variety names file loading -->
      <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="inputFile" />
    </b-form-group>
  </b-modal>
</template>

<script>
import { getId } from '@/plugins/id'

const emitter = require('tiny-emitter/instance')

export default {
  props: {
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    formFeedbackRowCount: {
      type: String,
      default: ''
    },
    formFeedbackColumnCount: {
      type: String,
      default: ''
    }
  },
  data: function () {
    const id = getId()
    return {
      id: id,
      formValidated: null,
      formFeedback: null,
      input: null,
      inputFile: null
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
      const gridData = this.input.split('\n').filter(n => n !== null && n.length > 0).map(r => r.split('\t').map(v => v.trim()))

      if (gridData.length !== this.rows) {
        this.formValidated = false
        this.formFeedback = this.$t(this.formFeedbackRowCount, { provided: gridData.length, expected: this.rows })
      } else {
        for (let row = 0; row < this.rows; row++) {
          if (gridData[row].length !== this.columns) {
            this.formValidated = false
            this.formFeedback = this.$t(this.formFeedbackColumnCount, { rowIndex: row + 1, provided: gridData[row].length, expected: this.columns })
            return
          }
        }
      }

      this.$emit('change', gridData)
      this.reset()

      emitter.emit('plausible-event', { key: 'load-layout', props: { type: 'tab' } })
    },
    loadInputFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.input = event.target.result.replace(/\r/g, '')
        this.inputFile = null
      }
      reader.readAsText(this.inputFile)
    },
    reset: function () {
      this.input = null
      this.inputFile = null
      this.formValidated = null
      this.formFeedback = null
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.reset()

      this.$refs.tabbedInputToGridModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.tabbedInputToGridModal.hide())
    }
  }
}
</script>

<style>

</style>
