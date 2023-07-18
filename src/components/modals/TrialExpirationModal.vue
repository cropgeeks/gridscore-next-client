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
            {{ $t('formLabelTrialExpirationCaptcha') }} <b-button variant="link" size="sm" @click="getNewCaptcha"><BIconArrowRepeat /></b-button>
          </template>
          <div class="text-center mb-3">
            <b-img fluid :src="captchaUrl" />
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
import { mapGetters } from 'vuex'
import { BIconArrowRepeat } from 'bootstrap-vue'
import { uuidv4 } from '@/plugins/id'
import { extendTrialPeriod } from '@/plugins/api'
import { TRIAL_STATE_VIEWER, TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER } from '@/plugins/constants'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconArrowRepeat
  },
  data: function () {
    return {
      TRIAL_STATE_VIEWER,
      TRIAL_STATE_EDITOR,
      TRIAL_STATE_OWNER,
      captcha: null,
      uuid: null
    }
  },
  computed: {
    ...mapGetters([
      'storeServerUrl'
    ]),
    shareCode: function () {
      if (this.trial && this.trial.shareCodes) {
        return this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode
      } else {
        return null
      }
    },
    captchaUrl: function () {
      return `${this.storeServerUrl}trial/${this.shareCode}/captcha/${this.uuid}`
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
      this.uuid = uuidv4()
    },
    sendCaptcha: function () {
      emitter.emit('show-loading', true)
      extendTrialPeriod(this.shareCode, this.uuid, { captcha: this.captcha })
        .then(() => {
          this.hide()
          emitter.emit('trials-updated')
        })
        .catch(err => {
          console.error(err)
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
