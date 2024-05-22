<template>
  <b-modal :title="$t('modalTitleScanCode')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="md"
           ref="scanQrCodeModal">
    <div>
      <p>{{ $t('pageImportCameraText') }}</p>
      <div class="camera-wrapper d-flex justify-content-center" v-if="showCamera">
        <BarcodeScanner @code-scanned="onDecode" ref="scanner" />
      </div>
    </div>
  </b-modal>
</template>

<script>
import BarcodeScanner from '@/components/BarcodeScanner.vue'

export default {
  components: {
    BarcodeScanner
  },
  data: function () {
    return {
      showCamera: false
    }
  },
  computed: {
  },
  methods: {
    onDecode: function (code) {
      this.$emit('code-scanned', code)
      this.hide()
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.showCamera = true
      this.$nextTick(() => this.$refs.scanQrCodeModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.showCamera = false
      this.$nextTick(() => this.$refs.scanQrCodeModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
