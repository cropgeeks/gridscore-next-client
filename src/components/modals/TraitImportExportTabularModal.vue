<template>
  <b-modal :title="$t(isExport ? 'modalTitleTraitExportTabular' : 'modalTitleTraitImportTabular')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t(isExport ? 'buttonClose' : 'buttonImport')"
           @ok.prevent="loadInput"
           @hidden="reset"
           @shown="reset"
           :ok-only="isExport"
           no-fade
           size="md"
           ref="tabularImportModal">
    <b-form-group :label="$t('formLabelTraitImportExportTabular')" :description="$t('formDescriptionTraitImportExportTabular')" label-for="import-export-tabular" :state="dataValid">
      <b-form-textarea :readonly="isExport" @focus="$event.target.select()" id="import-export-tabular" wrap="off" :rows="10" v-model="traitTabular" :state="dataValid" />
    </b-form-group>

    <p class="text-danger" v-if="errorMessage">{{ errorMessage }}</p>
  </b-modal>
</template>

<script>
import { tsvParse, autoType } from 'd3-dsv'

export default {
  props: {
    traits: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      traitTabular: null,
      dataValid: null,
      errorMessage: null,
      expectedColumns: ['Name', 'Description', 'Data Type', 'Allow repeats', 'Set size', 'Group name', 'Categories', 'Minimum', 'Maximum', 'Timeframe type', 'Timeframe start', 'Timeframe end', 'BrAPI ID']
    }
  },
  computed: {
    isExport: function () {
      return this.traits && this.traits.length > 0
    }
  },
  methods: {
    areArraysEqualSets: function (a1, a2) {
      const superSet = {}
      for (const i of a1) {
        const e = i + typeof i
        superSet[e] = 1
      }

      for (const i of a2) {
        const e = i + typeof i
        if (!superSet[e]) {
          return false
        }
        superSet[e] = 2
      }

      for (const e in superSet) {
        if (superSet[e] === 1) {
          return false
        }
      }

      return true
    },
    loadInput: function () {
      this.dataValid = null
      this.errorMessage = null
      if (!this.isExport) {
        try {
          const parsed = tsvParse(this.traitTabular, d => {
            const start = d['Timeframe start']
            const end = d['Timeframe end']
            // Use autoType for all fields
            const result = autoType(d)
            // But revert the dates back to just their strings
            result['Timeframe start'] = start
            result['Timeframe end'] = end

            return result
          })

          if (!parsed || !parsed.columns || !this.areArraysEqualSets(this.expectedColumns, parsed.columns)) {
            this.dataValid = false
            this.errorMessage = this.$t('formFeedbackTraitImportInvalidColumnHeaders', { headers: this.expectedColumns.map(c => `'${c}'`).join(', ') })
            return
          }

          const mapped = parsed.map(p => {
            const trait = {
              name: p.Name,
              description: p.Description,
              dataType: p['Data Type'],
              allowRepeats: p['Allow repeats'] === '1' || p['Allow repeats'] === 1,
              setSize: p['Set size'] || 1,
              brapiId: p['BrAPI ID'],
              group: p['Group name']
            }

            if (trait.dataType === 'categorical' && p.Categories && p.Categories.length > 0) {
              if (!trait.restrictions) {
                trait.restrictions = {}
              }
              trait.restrictions.categories = p.Categories.split(',').map(c => c.trim())
            }

            if ((trait.dataType === 'int' || trait.dataType === 'float' || trait.dataType === 'range')) {
              if (p.Minimum !== undefined && p.Minimum !== null && p.Minimum !== '') {
                if (!trait.restrictions) {
                  trait.restrictions = {}
                }
                trait.restrictions.min = p.Minimum
              }
              if (p.Maximum !== undefined && p.Maximum !== null && p.Maximum !== '') {
                if (!trait.restrictions) {
                  trait.restrictions = {}
                }
                trait.restrictions.max = p.Maximum
              }
            }

            if (p['Timeframe type']) {
              trait.timeframe = {
                type: p['Timeframe type']
              }

              const regex = /^\d{4}-\d{2}-\d{2}$/

              if (p['Timeframe start'] && p['Timeframe start'] !== '') {
                const start = p['Timeframe start']

                if (!start.match(regex)) {
                  this.dataValid = false
                  this.errorMessage = this.$t('formFeedbackTraitImportInvalidDateFormat')
                } else {
                  trait.timeframe.start = start
                }
              }

              if (p['Timeframe end'] && p['Timeframe end'] !== '') {
                const end = p['Timeframe end']

                if (!end.match(regex)) {
                  this.dataValid = false
                  this.errorMessage = this.$t('formFeedbackTraitImportInvalidDateFormat')
                } else {
                  trait.timeframe.end = end
                }
              }
            }

            return trait
          })

          if (this.dataValid === false) {
            return
          }

          this.$emit('data-changed', mapped)
          this.hide()
        } catch (e) {
          this.dataValid = false
          this.errorMessage = e
        }
      } else {
        this.hide()
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.tabularImportModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.tabularImportModal.hide())
    },
    reset: function () {
      if (this.traits) {
        let text = this.expectedColumns.join('\t')

        this.traits.forEach(t => {
          text += `\n${t.name}\t${t.description || ''}\t${t.dataType}\t${t.allowRepeats ? 1 : 0}\t${t.setSize}\t${t.group || ''}`

          // Restrictions
          text += `\t${(t.restrictions && t.restrictions.categories) ? t.restrictions.categories.join(',') : ''}\t${(t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''}\t${(t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''}`

          // Timeframe
          if (t.timeframe) {
            text += `\t${t.timeframe.type}\t${t.timeframe.start || ''}\t${t.timeframe.end || ''}`
          } else {
            text += '\t\t\t'
          }
        })

        this.traitTabular = text
      } else {
        this.traitTabular = null
      }
      this.dataValid = null
      this.errorMessage = null
    }
  }
}
</script>

<style>

</style>
