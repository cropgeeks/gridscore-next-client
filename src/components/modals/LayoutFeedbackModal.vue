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

      <b-list-group class="scrollable-list">
        <b-list-group-item v-for="(f, index) in feedback" :key="`feedback-${index}`" :variant="f.type">
          {{ f.message }}
        </b-list-group-item>
      </b-list-group>

      <div class="text-center mt-3">
        <b-button variant="primary" @click="acceptWarnings" v-if="onlyWarnings"><BIconListCheck /> {{ $t('buttonAcceptWarningsContinue') }}</b-button>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { BIconListCheck } from 'bootstrap-vue'

export default {
  components: {
    BIconListCheck
  },
  props: {
    feedback: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    onlyWarnings: function () {
      if (this.feedback) {
        return !this.feedback.some(f => f.type === 'danger')
      } else {
        return false
      }
    }
  },
  methods: {
    acceptWarnings: function () {
      this.$emit('warnings-accepted')
      this.hide()
    },
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
.scrollable-list {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
