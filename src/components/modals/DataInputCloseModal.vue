<template>
  <b-modal :title="$t('modalTitleConfirmCloseDataInput')"
           no-fade
           ref="dataInputCloseModal">
    <p v-html="$t('modalTextConfirmCloseDataInput')" />

    <template #footer>
      <b-button class="me-auto" @click="localEmit('cancel')">{{ $t('buttonCancel') }}</b-button>
      <b-button variant="danger" @click="localEmit('close')">{{ $t('buttonClose') }}</b-button>
      <b-button variant="success" @click="localEmit('save')">{{ $t('buttonSave') }}</b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
  methods: {
    localEmit: function (event) {
      this.$emit(event)
      this.$refs.dataInputCloseModal.hide()
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.dataInputCloseModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.dataInputCloseModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
