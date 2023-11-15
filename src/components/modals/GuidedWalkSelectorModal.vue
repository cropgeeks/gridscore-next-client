<template>
  <b-modal :title="$t('modalTitleGuidedWalk')"
           :ok-title="$t('buttonStart')"
           no-fade
           size="lg"
           :ok-disabled="!selectedOrder"
           @shown="guidedWalkVisible = true"
           @ok.prevent="onSubmit"
           @hidden="guidedWalkVisible = false"
           ref="guidedWalkModal">
    <div v-if="cell && trialLayout">
      <p>{{ $t('modalTextGuidedWalk') }}</p>

      <GuideOrderSelector :row="cell.row" :column="cell.column" :trialLayout="trialLayout" :visible="guidedWalkVisible" @order-selected="orderSelected" />
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
      guidedWalkVisible: false,
      selectedOrder: null
    }
  },
  methods: {
    orderSelected: function (value) {
      this.selectedOrder = value
    },
    onSubmit: function () {
      emitter.emit('plausible-event', { key: 'guided-walk-started', props: { order: this.selectedOrder } })
      this.$router.push({ name: 'guided-walk', query: { row: this.cell.row, column: this.cell.column, guidedWalkName: this.selectedOrder } })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.selectedOrder = null
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
