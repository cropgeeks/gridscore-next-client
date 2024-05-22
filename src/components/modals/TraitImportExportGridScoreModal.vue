<template>
  <b-modal :title="$t(isExport ? 'modalTitleTraitExportJson' : 'modalTitleTraitImportJson')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t(isExport ? 'buttonClose' : 'buttonImport')"
           @ok.prevent="loadInput"
           @hidden="reset"
           @shown="reset"
           :ok-only="isExport"
           no-fade
           size="md"
           ref="jsonImportExportModal">
    <b-form-group :label="$t('formLabelTraitImportExportJson')" :description="$t('formDescriptionTraitImportExportJson')" label-for="import-export-json" :state="jsonValid">
      <b-form-textarea :readonly="isExport" @focus="$event.target.select()" id="import-export-json" wrap="off" :rows="10" v-model="traitJson" :state="jsonValid" />
    </b-form-group>
  </b-modal>
</template>

<script>
export default {
  props: {
    traits: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      traitJson: null,
      jsonValid: null
    }
  },
  computed: {
    isExport: function () {
      return this.traits && this.traits.length > 0
    }
  },
  methods: {
    loadInput: function () {
      this.jsonValid = null
      if (!this.isExport) {
        try {
          const parsed = JSON.parse(this.traitJson)
          if (!Array.isArray(parsed) || parsed.length < 1) {
            this.jsonValid = false
            return
          }
          this.$emit('data-changed', parsed)
          this.hide()
        } catch {
          this.jsonValid = false
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
    reset: function () {
      if (this.traits) {
        this.traitJson = JSON.stringify(this.traits, null, 2)
      } else {
        this.traitJson = null
      }
      this.jsonValid = null
    }
  }
}
</script>

<style>

</style>
