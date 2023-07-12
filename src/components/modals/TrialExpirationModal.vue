<template>
  <b-modal :title="$t('modalTitleTrialExpiration')"
           :ok-title="$t('buttonOk')"
           no-fade
           ref="trialExpirationModal">
    <div>
      <p>{{ $t('modalTextTrialExpiration') }}</p>
    </div>
  </b-modal>
</template>

<script>
// const emitter = require('tiny-emitter/instance')

export default {
  components: {
  },
  data: function () {
    return {
    }
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.trialExpirationModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialExpirationModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
