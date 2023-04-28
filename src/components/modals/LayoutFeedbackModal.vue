<template>
  <b-modal :title="$t('modalTitleLayoutFeedback')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="layoutFeedbackModal">
    <div v-if="feedback && feedback.length">
      <p>{{ $t('modalTextLayoutFeedback') }}</p>

      <b-list-group>
        <b-list-group-item v-for="(f, index) in feedback" :key="`feedback-${index}`">
          {{ f }}
        </b-list-group-item>
      </b-list-group>
    </div>
  </b-modal>
</template>

<script>

export default {
  props: {
    feedback: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.layoutFeedbackModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.layoutFeedbackModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
