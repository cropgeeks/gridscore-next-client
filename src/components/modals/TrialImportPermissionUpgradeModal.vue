<template>
  <b-modal :title="$t('modalTitleTrialImportPermissionUpgrade')"
           :ok-title="$t('buttonCancel')"
           ok-only
           ok-variant="secondary"
           no-fade
           ref="importPermissionUpgradeModal">
    <p>{{ $t('modalTextTrialImportPermissionUpgrade', { local: localPermission, remote: remotePermission }) }}</p>
    <b-row>
      <b-col :cols=12 :md=6>
        <b-button class="w-100 d-flex flex-column align-items-center" @click="upgrade">
          <h2><BIconChevronDoubleUp /></h2> <span>{{ $t('modalTextTrialImportPermissionUpgradeUpgrade') }}</span>
        </b-button>
      </b-col>
      <b-col :cols=12 :md=6>
        <b-button class="w-100 d-flex flex-column align-items-center" @click="asNew">
          <h2><BIconPlusCircle /></h2> <span>{{ $t('modalTextTrialImportPermissionUpgradeNew') }}</span>
        </b-button>
      </b-col>
    </b-row>
  </b-modal>
</template>

<script>
import { BIconChevronDoubleUp, BIconPlusCircle } from 'bootstrap-vue'
import { TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'

export default {
  components: {
    BIconChevronDoubleUp,
    BIconPlusCircle
  },
  props: {
    localPermissionType: {
      type: String,
      default: null
    },
    remotePermissionType: {
      type: String,
      default: null
    }
  },
  computed: {
    localPermission: function () {
      if (this.localPermissionType) {
        return this.getPermissionText(this.localPermissionType)
      } else {
        return 'NA'
      }
    },
    remotePermission: function () {
      if (this.remotePermissionType) {
        return this.getPermissionText(this.remotePermissionType)
      } else {
        return 'NA'
      }
    }
  },
  methods: {
    upgrade: function () {
      this.$emit('upgrade')
      this.hide()
    },
    asNew: function () {
      this.$emit('new')
      this.hide()
    },
    getPermissionText: function (permission) {
      if (permission === TRIAL_STATE_OWNER) {
        return this.$t('trialShareOwnerTitle')
      } else if (permission === TRIAL_STATE_EDITOR) {
        return this.$t('trialShareEditorTitle')
      } else if (permission === TRIAL_STATE_VIEWER) {
        return this.$t('trialShareViewerTitle')
      } else {
        return 'NA'
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.importPermissionUpgradeModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.importPermissionUpgradeModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
