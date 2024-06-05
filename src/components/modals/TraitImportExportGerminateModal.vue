<template>
  <b-modal :title="$t(isExport ? 'modalTitleTraitExportGerminate' : 'modalTitleTraitImportGerminate')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t(isExport ? 'buttonClose' : 'buttonImport')"
           @ok.prevent="loadInput"
           @hidden="reset"
           @shown="reset"
           :ok-only="isExport"
           no-fade
           size="md"
           ref="jsonImportExportModal">
    <b-form-group :label="$t('formLabelTraitImportExportGerminate')" :description="$t('formDescriptionTraitImportExportGerminate')" label-for="import-export-germinate" :state="dataValid">
      <b-form-textarea :readonly="isExport" @focus="$event.target.select()" id="import-export-germinate" wrap="off" :rows="10" v-model="traitGerminate" :state="dataValid" />
    </b-form-group>
  </b-modal>
</template>

<script>
import { tsvParse } from 'd3-dsv'

export default {
  props: {
    traits: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      traitGerminate: null,
      dataValid: null,
      expectedColumns: ['Name', 'Short Name', 'Description', 'Data Type', 'Unit Name', 'Unit Abbreviation', 'Unit Descriptions', 'Trait categories (comma separated)', 'Min (only for numeric traits)', 'Max (only for numeric traits)']
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
      if (!this.isExport) {
        try {
          const parsed = tsvParse(this.traitGerminate)

          if (!parsed || !parsed.columns || !this.areArraysEqualSets(this.expectedColumns, parsed.columns)) {
            this.dataValid = false
            return
          }

          const mapped = parsed.map(p => {
            const trait = {
              name: p.Name,
              description: p.Description,
              dataType: this.toGridScoreDataType(p['Data Type'])
            }

            if (p['Trait categories (comma separated)']) {
              trait.restrictions = {
                // eslint-disable-next-line
                categories: p['Trait categories (comma separated)'].replace(/[\[\]]/g, '').split(',').map(c => c.trim())
              }
            }

            if (p['Min (only for numeric traits)']) {
              if (!trait.restrictions) {
                trait.restrictions = {}
              }
              trait.restrictions.min = +p['Min (only for numeric traits)']
            }

            if (p['Max (only for numeric traits)']) {
              if (!trait.restrictions) {
                trait.restrictions = {}
              }
              trait.restrictions.max = +p['Max (only for numeric traits)']
            }

            return trait
          })

          this.$emit('data-changed', mapped)
          this.hide()
        } catch {
          this.dataValid = false
        }
      } else {
        this.hide()
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.jsonImportExportModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.jsonImportExportModal.hide())
    },
    toGridScoreDataType: function (type) {
      switch (type) {
        case 'numeric':
          return 'float'
        default:
          return type
      }
    },
    toGerminateDataType: function (type) {
      switch (type) {
        case 'int':
        case 'float':
        case 'range':
          return 'numeric'
        default:
          return type
      }
    },
    reset: function () {
      if (this.traits) {
        let text = this.expectedColumns.join('\t')

        this.traits.forEach(t => {
          text += `\n${t.name}\t\t${t.description || ''}\t${this.toGerminateDataType(t.dataType)}\t\t\t\t${(t.restrictions && t.restrictions.categories) ? ('[[' + t.restrictions.categories.join(',') + ']]') : ''}\t${(t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''}\t${(t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''}`
        })

        this.traitGerminate = text
      } else {
        this.traitGerminate = null
      }
      this.dataValid = null
    }
  }
}
</script>

<style>

</style>
