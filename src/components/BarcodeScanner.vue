<template>
  <div>
    <div id="reader" class="w-100" />
    <b-button :disabled="!paused" @click="resume">Resume</b-button>
  </div>
</template>

<script>
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

export default {
  props: {
    autostart: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      paused: false
    }
  },
  methods: {
    close: function () {
      if (this.scanner) {
        this.scanner.clear()
      }
    },
    resume: function () {
      if (this.scanner) {
        this.scanner.resume()
      }
      this.paused = false
    },
    pause: function () {
      if (this.scanner) {
        this.scanner.pause()
      }
      this.paused = true
    },
    start: function () {
      this.paused = false
      this.scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: 'environment'
        }
      }, false)
      this.scanner.render(result => {
        this.pause()
        this.$emit('code-scanned', result)
      })

      this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))
    }
  },
  mounted: function () {
    if (this.autostart) {
      this.start()
    }
  },
  beforeDestroy: function () {
    if (this.scanner) {
      try {
        this.scanner.clear()
      } catch {
        // Nothing to do here.
      }
    }
  }
}
</script>

<style>

</style>
