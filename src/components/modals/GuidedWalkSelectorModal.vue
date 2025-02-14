<template>
  <b-modal :title="$t('modalTitleGuidedWalk')"
           :ok-title="$t('buttonStart')"
           no-fade
           size="lg"
           :ok-disabled="!canContinue"
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
import GuideOrderSelector from '@/components/GuideOrderSelector.vue'

import emitter from 'tiny-emitter/instance'

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
  computed: {
    canContinue: function () {
      if (!this.selectedOrder || !this.selectedOrder.order) {
        return false
      }

      if (this.selectedOrder.scoreWidth > 1 && !this.selectedOrder.neighbor) {
        return false
      }

      return true
    }
  },
  methods: {
    orderSelected: function (value) {
      this.selectedOrder = value
    },
    onSubmit: function () {
      let x = this.cell.column
      let y = this.cell.row

      if (this.selectedOrder.neighbor) {
        x = (x + this.selectedOrder.neighbor.value.x) / 2
        y = (y + this.selectedOrder.neighbor.value.y) / 2
      }

      emitter.emit('plausible-event', { key: 'guided-walk-started', props: { order: this.selectedOrder.order, scoreWidth: this.selectedOrder.scoreWidth } })
      this.$router.push({
        name: 'guided-walk',
        query: {
          row: y,
          column: x,
          guidedWalkName: this.selectedOrder.order,
          scoreWidth: this.selectedOrder.scoreWidth
        }
      })
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
