<template>
  <b-modal :title="$t('toastTitleTrialShareCodeSameOrHigherPermission')"
           :ok-title="$t('modalTextTrialImportPermissionUpgradeNew')"
           :cancel-title="$t('buttonCancel')"
           @ok="asNew"
           ok-variant="secondary"
           no-fade
           ref="trialExistsModal">
    <p>{{ $t('toastTextTrialShareCodeSameOrHigherPermission') }}</p>

    <TrialCard :trial="trial" @loadTrial="loadTrial" :showSyncButtons="false" :showDropdown="false" />
  </b-modal>
</template>

<script>
import { mapStores } from 'pinia'
import { coreStore } from '@/store'

import TrialCard from '@/components/TrialCard.vue'

export default {
  components: {
    TrialCard
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapStores(coreStore)
  },
  methods: {
    loadTrial: function () {
      this.coreStore.setSelectedTrial(this.trial.localId)
      this.hide()
      this.$router.push({ name: 'data-entry' })
    },
    asNew: function () {
      this.$emit('new')
      this.hide()
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.trialExistsModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialExistsModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
