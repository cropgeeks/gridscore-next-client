<template>
  <b-modal :title="$t(internalTitle)"
           :ok-title="$t(internalOkTitle)"
           :cancel-title="$t(internalCancelTitle)"
           :ok-variant="internalOkVariant"
           :cancel-variant="internalCancelVariant"
           :ok-only="internalOkOnly"
           scrollable
           no-fade
           @ok="emitOk"
           @cancel="emitCancel"
           :size="internalSize"
           ref="confirmModal">
    <p v-if="internalMessage">{{ $t(internalMessage) }}</p>
  </b-modal>
</template>

<script>
import emitter from 'tiny-emitter/instance'

export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    okTitle: {
      type: String,
      default: 'buttonOk'
    },
    okOnly: {
      type: Boolean,
      default: false
    },
    cancelTitle: {
      type: String,
      default: 'buttonCancel'
    },
    cancelVariant: {
      type: String,
      default: 'secondary'
    },
    okVariant: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  data: function () {
    return {
      internalTitle: '',
      internalMessage: '',
      internalOkTitle: 'buttonOk',
      internalCancelTitle: 'buttonCancel',
      internalCancelVariant: 'secondary',
      internalOkVariant: 'primary',
      internalSize: 'md',
      internalOkOnly : false
    }
  },
  methods: {
    show: function () {
      this.internalTitle = this.title
      this.internalMessage = this.message
      this.internalOkTitle = this.okTitle
      this.internalCancelTitle = this.cancelTitle
      this.internalOkVariant = this.okVariant
      this.internalCancelVariant = this.cancelVariant
      this.internalSize = this.size
      this.internalOkOnly = this.okOnly
      this.callback = null

      this.$nextTick(() => this.$refs.confirmModal.show())
    },
    showInternal: function (params) {
      this.internalTitle = params.title || ''
      this.internalMessage = params.message || ''
      this.internalOkTitle = params.okTitle || 'buttonOk'
      this.internalCancelTitle = params.cancelTitle || 'buttonCancel'
      this.internalOkVariant = params.okVariant || 'primary'
      this.internalCancelVariant = params.cancelVariant || 'secondary'
      this.internalSize = params.size || 'md'
      this.internalOkOnly = params.okOnly || false
      this.callback = params.callback

      this.$nextTick(() => this.$refs.confirmModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.confirmModal.hide())
    },
    emitOk: function () {
      if (this.callback) {
        this.callback(true)
      }
    },
    emitCancel: function () {
      if (this.callback) {
        this.callback(false)
      }
    }
  },
  mounted: function () {
    emitter.on('show-confirm', this.showInternal)
  },
  beforeUnmount: function () {
    emitter.off('show-confirm', this.showInternal)
  }
}
</script>

<style>

</style>
