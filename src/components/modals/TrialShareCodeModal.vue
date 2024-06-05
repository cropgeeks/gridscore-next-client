<template>
  <b-modal :title="$t('modalTitleTrialShare')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="lg"
           ref="trialShareCodesModal">
    <UseOnline v-slot="{ isOnline }">
      <div v-if="isOnline === false" class="modal-banner bg-danger text-white text-center mb-3 p-2">
        {{ $t('modalTextNetworkUnavailableWarning') }}
      </div>
      <div v-if="trial">
        <div v-if="trial.shareCodes">
          <p v-html="$t('modalTextTrialShareCodes')" />

          <b-row>
            <b-col :cols=12 :md=4>
              <b-button :disabled="!trial.shareCodes.ownerCode" :variant="selectedShareCode === trial.shareCodes.ownerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.ownerCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_OWNER" :isLink="false" />
              </b-button>
            </b-col>
            <b-col :cols=12 :md=4>
              <b-button :disabled="!trial.shareCodes.editorCode" :variant="selectedShareCode === trial.shareCodes.editorCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.editorCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_EDITOR" :isLink="false" />
              </b-button>
            </b-col>
            <b-col :cols=12 :md=4>
              <b-button :variant="selectedShareCode === trial.shareCodes.viewerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = trial.shareCodes.viewerCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_VIEWER" :isLink="false" />
              </b-button>
            </b-col>
          </b-row>

          <StyledQRCode class="mt-3" :text="selectedShareCode" v-if="selectedShareCode" />
        </div>
        <div v-else>
          <p v-html="$t('modalTextTrialShare')" />

          <b-button @click="getShareCodes" :disabled="isOnline === false" variant="primary"><IBiQrCodeScan /> {{ $t('buttonGenerateShareCodes') }}</b-button>
        </div>
      </div>
    </UseOnline>
  </b-modal>
</template>

<script>
import { TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'
import { shareTrial } from '@/plugins/api'

import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon.vue'
import StyledQRCode from '@/components/StyledQRCode.vue'
import { UseOnline } from '@vueuse/components'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    StyledQRCode,
    TrialShareTypeIcon,
    UseOnline
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
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
