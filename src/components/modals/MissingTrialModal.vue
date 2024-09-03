<template>
  <b-modal :title="$t('modalTitleMissingTrial')"
           :ok-title="$t('buttonOk')"
           no-fade
           ok-only
           ref="missingTrialModal">
    <div v-if="trial">
      <div v-if="archiveExists === null">
        <b-progress :value="100" variant="info" :animated="true" class="mt-3" :label="$t('progressLabelCheckingForArchive')" />
      </div>
      <div v-else-if="archiveExists === true">
        <b-card>
          <b-card-title><IBiFileEarmarkZip /> {{ $t('pageArchiveTitle') }}</b-card-title>
          <b-card-subtitle class="mb-3">{{ $t('pageArchiveSubtitle') }}</b-card-subtitle>
          <b-card-text class="mb-2"><IBiFileEarmarkArrowDown /> {{ $t('pageArchiveTextSize', { size: fileSize }) }}</b-card-text>
          <b-card-text class="mb-2"><IBiDownload /> {{ $t('pageArchiveTextExportedOn', { date: new Date(archiveInformation.trialExportedOn).toLocaleDateString() }) }}</b-card-text>
          <b-card-text class="mb-2"><IBiArrowRepeat /> {{ $t('pageArchiveTextUpdatedOn', { date: new Date(archiveInformation.trialUpdatedOn).toLocaleDateString() }) }}</b-card-text>

          <b-button variant="primary" :href="archiveUrl" v-if="archiveUrl"><IBiDownload /> {{ $t('buttonDownload') }}</b-button>
        </b-card>
      </div>
      <p v-else-if="archiveExists === false">{{ $t('pageArchiveNoArchiveFound') }}</p>
    </div>
  </b-modal>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { checkTrialArchiveExists } from '@/plugins/api'
import { getNumberWithSuffix } from '@/plugins/misc'

import emitter from 'tiny-emitter/instance'

export default {
  data: function () {
    return {
      trial: null,
      archiveExists: null,
      archiveInformation: null,
      archiveUrl: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeServerUrl'
    ]),
    fileSize: function () {
      if (this.trial && this.archiveInformation) {
        return getNumberWithSuffix(this.archiveInformation.fileSize, 2, 1024)
      } else {
        return null
      }
    },
    shareCode: function () {
      if (this.trial && this.trial.shareCodes) {
        return this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode
      } else {
        return null
      }
    }
  },
  methods: {
    checkArchiveExists: function () {
      let remoteConfig = null

      if (this.trial && this.trial.remoteUrl) {
        remoteConfig = {
          url: this.trial.remoteUrl,
          token: this.trial.remoteToken || null
        }
      }

      checkTrialArchiveExists(remoteConfig, this.shareCode)
        .then(result => {
          this.archiveExists = true
          this.archiveInformation = result
          this.archiveUrl = `${this.storeServerUrl}trial/${this.shareCode}/export/archive`
        })
        .catch(err => {
          if (err && err.status === 404) {
            this.archiveExists = false
            this.archiveUrl = null
            this.archiveInformation = null
          }
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function (trial) {
      this.trial = trial
      this.checkArchiveExists()
      this.$nextTick(() => this.$refs.missingTrialModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.trial = null
      this.archiveExists = null
      this.archiveUrl = null
      this.archiveInformation = null
      this.$nextTick(() => this.$refs.missingTrialModal.hide())
    }
  },
  mounted: function () {
    emitter.on('show-missing-trial', this.show)
  },
  beforeUnmount: function () {
    emitter.off('show-missing-trial', this.show)
  }
}
</script>

<style scoped>
</style>
