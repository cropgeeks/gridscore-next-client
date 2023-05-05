<template>
  <b-modal :title="$t('modalTitleGuidedWalk')"
           :ok-title="$t('buttonStart')"
           no-fade
           size="lg"
           @shown="guidedWalkVisible = true"
           @hidden="guidedWalkVisible = false"
           ref="guidedWalkModal">
    <div v-if="cell && trialLayout">
      <p>{{ $t('modalTextGuidedWalk') }}</p>

      <GuideOrderSelector :row="cell.row" :column="cell.column" :trialLayout="trialLayout" :visible="guidedWalkVisible" @order-selected="e => $emit('order-selected', e)"/>
    </div>
  </b-modal>
</template>

<script>
import GuideOrderSelector from '@/components/GuideOrderSelector'

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
