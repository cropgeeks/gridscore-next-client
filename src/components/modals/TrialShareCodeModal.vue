<template>
  <b-modal :title="$t('modalTitleTrialShare')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="lg"
           ref="trialShareCodesModal">
    <div v-if="storeIsOffline" class="modal-banner bg-danger text-white text-center mb-3 p-2">
      {{ $t('modalTextNetworkUnavailableWarning') }}
    </div>
    <div v-if="trial">
      <div v-if="trial.shareCodes">
        <p v-html="$t('modalTextTrialShareCodes')" />

        <b-row>
          <b-col :cols=12 :md=4>
            <b-button :disabled="!trial.shareCodes.ownerCode" :variant="selectedShareCode === trial.shareCodes.ownerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.ownerCode">
              <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_OWNER" />
            </b-button>
          </b-col>
          <b-col :cols=12 :md=4>
            <b-button :disabled="!trial.shareCodes.editorCode" :variant="selectedShareCode === trial.shareCodes.editorCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.editorCode">
              <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_EDITOR" />
            </b-button>
          </b-col>
          <b-col :cols=12 :md=4>
            <b-button :variant="selectedShareCode === trial.shareCodes.viewerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.viewerCode">
              <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_VIEWER" />
            </b-button>
          </b-col>
        </b-row>

        <StyledQRCode class="mt-3" :text="selectedShareCode" v-if="selectedShareCode" />
      </div>
      <div v-else>
        <p v-html="$t('modalTextTrialShare')" />

        <b-button @click="getShareCodes" :disabled="storeIsOffline" variant="primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonGenerateShareCodes') }}</b-button>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'
import { shareTrial } from '@/plugins/api'
import { mapGetters } from 'vuex'

import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon'
import StyledQRCode from '@/components/StyledQRCode'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    StyledQRCode,
    TrialShareTypeIcon
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapGetters([
      'storeIsOffline'
    ])
  },
  data: function () {
    return {
      selectedShareCode: null,
      TRIAL_STATE_EDITOR,
      TRIAL_STATE_OWNER,
      TRIAL_STATE_VIEWER
    }
  },
  methods: {
    getShareCodes: function () {
      emitter.emit('show-loading', true)
      shareTrial(this.trial.localId)
        .then(() => emitter.emit('plausible-event', { key: 'trial-shared' }))
        .catch(error => {
          console.error(error)
        })
        .finally(() => emitter.emit('show-loading', false))
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.selectedShareCode = null
      this.$refs.trialShareCodesModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialShareCodesModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
