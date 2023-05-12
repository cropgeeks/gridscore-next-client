<template>
  <b-modal :title="$t('modalTitleGuidedWalk')"
           :ok-title="$t('buttonStart')"
           no-fade
           size="lg"
           @shown="guidedWalkVisible = true"
           @ok.prevent="onSubmit"
           @hidden="guidedWalkVisible = false"
           ref="guidedWalkModal">
    <div v-if="cell && trialLayout">
      <p>{{ $t('modalTextGuidedWalk') }}</p>

      <GuideOrderSelector :row="cell.row" :column="cell.column" :trialLayout="trialLayout" :visible="guidedWalkVisible" ref="guideOrderSelector" />
    </div>
  </b-modal>
</template>

<script>
import GuideOrderSelector from '@/components/GuideOrderSelector'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    GuideOrderSelector
  },
  props: {
    cell: {
      type: Object,
      default: () => null
    },
    trialLayout: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      guidedWalkVisible: false
    }
  },
  methods: {
    onSubmit: function () {
      const order = this.$refs.guideOrderSelector.getOrder()
      this.$emit('change', order)

      emitter.emit('plausible-event', { key: 'guided-walk-started', props: { order: order } })

      this.$nextTick(() => this.hide())
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.guidedWalkModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.guidedWalkModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
