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
        <div v-if="shareCodes">
          <p v-html="$t('modalTextTrialShareCodes')" />

          <b-row>
            <b-col :cols=12 :md=4>
              <b-button :disabled="!shareCodes.ownerCode" :variant="selectedShareCode === shareCodes.ownerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = shareCodes.ownerCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_OWNER" :isLink="false" />
              </b-button>
            </b-col>
            <b-col :cols=12 :md=4>
              <b-button :disabled="!shareCodes.editorCode" :variant="selectedShareCode === shareCodes.editorCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = shareCodes.editorCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_EDITOR" :isLink="false" />
              </b-button>
            </b-col>
            <b-col :cols=12 :md=4>
              <b-button :variant="selectedShareCode === shareCodes.viewerCode ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="selectedShareCode = shareCodes.viewerCode">
                <TrialShareTypeIcon iconTag="h2" :shareStatus="TRIAL_STATE_VIEWER" :isLink="false" />
              </b-button>
            </b-col>
          </b-row>

          <StyledQRCode class="mt-3" :baseUrl="trial.remoteUrl || null" :text="selectedShareCode" v-if="selectedShareCode" />
        </div>
        <div v-else>
          <p v-html="$t('modalTextTrialShare')" />

          <div class="mb-3">
            <b-form-checkbox v-model="shareWithRemote">{{ $t('formCheckboxShareWithRemote') }}</b-form-checkbox>

            <b-card v-if="shareWithRemote">
              <b-form-group :label="$t('formLabelTrialShareRemoteUrl')" label-for="remoteUrl">
                <b-form-input v-model="remoteUrl" id="remoteUrl" />
                <template #description>
                  <span v-html="$t('formDescriptionTrialShareRemoteUrl')" />
                </template>
              </b-form-group>

              <b-form-group :label="$t('formLabelTrialShareRemoteToken')" label-for="remoteToken">
                <b-form-input v-model="remoteToken" id="remoteToken" />
                <template #description>
                  <span v-html="$t('formDescriptionTrialShareRemoteToken')" />
                </template>
              </b-form-group>
            </b-card>
          </div>

          <div v-if="error" class="my-3 text-danger">{{ error }}</div>

          <b-button @click="getShareCodes" :disabled="isOnline === false || buttonDisabled === true" variant="primary"><IBiQrCodeScan /> {{ $t('buttonGenerateShareCodes') }}</b-button>
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
      TRIAL_STATE_VIEWER,
      shareWithRemote: false,
      remoteUrl: null,
      remoteToken: null,
      error: null,
      shareCodes: null
    }
  },
  computed: {
    buttonDisabled: function () {
      const remoteUrlValid = this.remoteUrl !== undefined && this.remoteUrl !== null && this.remoteUrl !== ''

      if (this.shareWithRemote) {
        return !remoteUrlValid
      } else {
        return false
      }
    }
  },
  methods: {
    getShareCodes: function () {
      this.error = null
      emitter.emit('show-loading', true)
      shareTrial({ remoteUrl: this.shareWithRemote ? this.remoteUrl : null, token: this.remoteToken }, this.trial.localId)
        .then(trial => {
          this.shareCodes = trial.shareCodes
          emitter.emit('plausible-event', { key: 'trial-shared' })
        })
        .catch(error => {
          if (error.status === 401) {
            this.error = this.$t('errorMessageRemoteTrialInvalidToken')
          } else {
            this.error = error.message
            console.error(error)
          }
        })
        .finally(() => emitter.emit('show-loading', false))
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.error = null
      this.selectedShareCode = null
      this.shareCodes = this.trial ? this.trial.shareCodes : null
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
