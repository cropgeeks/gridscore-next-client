<template>
  <b-modal :title="$t('modalTitleTrialExpiration')"
           :ok-title="$t('buttonExtendLifetime')"
           @ok.prevent="sendCaptcha"
           :ok-disabled="!captcha"
           no-fade
           ref="trialExpirationModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialExpiration') }}</p>

      <p class="text-danger">{{ $t('modalTextTrialExpirationDate', { date: new Date(trial.expiresOn).toLocaleDateString() }) }}</p>

      <template v-if="trial.shareStatus === TRIAL_STATE_EDITOR || trial.shareStatus === TRIAL_STATE_OWNER">
        <b-form-group label-for="captcha" :description="$t('formDescriptionTrialExpirationCaptcha')" v-if="captchaUrl">
          <template #label>
            {{ $t('formLabelTrialExpirationCaptcha') }} <b-button variant="link" size="sm" @click="getNewCaptcha"><IBiArrowRepeat /></b-button>
          </template>
          <div class="text-center mb-3">
            <b-img lazy fluid :blank-src="null" :blank-width="200" :blank-height="50" blank-color="#bdc3c7" :src="captchaUrl" />
          </div>
          <b-form-input id="captcha" v-model="captcha" required />
        </b-form-group>
      </template>
      <div v-else>
        <p class="text-warning">{{ $t('modalTextTrialExpirationNotAuthorized') }}</p>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { extendTrialPeriod } from '@/plugins/api'
import { TRIAL_STATE_VIEWER, TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

export default {
  data: function () {
    return {
      TRIAL_STATE_VIEWER,
      TRIAL_STATE_EDITOR,
      TRIAL_STATE_OWNER,
      captcha: null,
      captchaUrl: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeServerUrl',
      'storeDarkMode'
    ]),
    shareCode: function () {
      if (this.trial && this.trial.shareCodes) {
        return this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode
      } else {
        return null
      }
    }
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    getNewCaptcha: function () {
      this.captchaUrl = `${this.storeServerUrl}trial/${this.shareCode}/captcha?ts=${new Date().getTime()}&darkMode=${this.storeDarkMode === true}`
    },
    sendCaptcha: function () {
      emitter.emit('show-loading', true)

      let remoteConfig = null

      if (this.trial && this.trial.remoteUrl) {
        remoteConfig = {
          remoteUrl: this.trial.remoteUrl,
          token: this.trial.remoteToken || null
        }
      }

      extendTrialPeriod(remoteConfig, this.shareCode, { captcha: this.captcha })
        .then(() => {
          this.hide()
          emitter.emit('trials-updated')
        })
        .catch(err => {
          console.error(err)
          console.log(err.status)
        })
        .finally(() => emitter.emit('show-loading', false))
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.captcha = null
      this.getNewCaptcha()
      this.$refs.trialExpirationModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialExpirationModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
