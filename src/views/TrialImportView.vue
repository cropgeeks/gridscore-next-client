<template>
  <div>
    <div v-if="storeIsOffline" class="modal-banner bg-danger text-white text-center mb-3 mt-0 p-2">
      {{ $t('modalTextNetworkUnavailableWarning') }}
    </div>
    <b-container class="mt-4">
      <h1 class="display-4">{{ $t('pageImportTitle') }}</h1>
      <p>{{ $t('pageImportText') }}</p>
      <p>{{ $t('pageImportSelectAppVersion') }}</p>

      <b-row>
        <b-col :cols=12 :md=4 class="mb-3">
          <b-button :variant="gridScoreVersion === 'current' ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="gridScoreVersion = 'current'">
            <h2>
              <b-img class="logo mt-2" fluid src="img/gridscore-next-text.svg"/>
            </h2>
            <span>{{ $t('appTitle') }}</span>
          </b-button>
        </b-col>
        <b-col :cols=12 :md=4 class="mb-3">
          <b-button :variant="gridScoreVersion === 'legacy' ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="gridScoreVersion = 'legacy'">
            <h2>
              <b-img class="logo mt-2" fluid src="img/gridscore2.svg"/>
            </h2>
            <span>{{ $t('appTitleLegacy') }}</span>
          </b-button>
        </b-col>
      </b-row>

      <b-form @submit.prevent="checkCode" v-if="gridScoreVersion">
        <b-form-group :label="$t('formLabelTrialImportUrl')" :description="$t('formDescriptionTrialImportUrl')" label-for="url" v-if="gridScoreVersion === 'legacy'">
          <b-form-input id="url" type="url" v-model="gridScoreUrl" required />
        </b-form-group>
        <b-form-group :label="$t('formLabelTrialImportCode')" :description="$t('formDescriptionTrialImportCode')" label-for="code">
          <b-input-group>
            <b-input trim v-model="shareCode" autofocus />
            <b-input-group-addon>
              <b-button @click="showCamera = !showCamera">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16">
                  <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/>
                  <path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/>
                  <path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/>
                  <path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/>
                  <path d="M12 9h2V8h-2v1Z"/>
                </svg>
              </b-button>
            </b-input-group-addon>
          </b-input-group>
        </b-form-group>
        <b-collapse v-model="showCamera">
          <p class="mt-3">{{ $t('pageImportCameraText') }}</p>
          <div class="camera-wrapper d-flex justify-content-center" v-if="showCamera">
            <BarcodeScanner @code-scanned="onDecode" ref="scanner" />
          </div>
        </b-collapse>

        <b-card bg-variant="warning" border-variant="warning" class="mb-3" v-if="gridScoreVersion === 'legacy'"><b-card-text>{{ $t('pageImportLegacyWarning') }}</b-card-text></b-card>

        <b-button @click="checkCode" variant="primary" :disabled="buttonDisabled"><BIconSearch /> {{ $t('buttonCheckShareCode') }}</b-button>

        <p class="text-danger mt-3" v-if="serverError">{{ serverError }}</p>
      </b-form>

      <b-modal :cancel-title="$t('buttonNo')"
              :ok-title="$t('buttonYes')"
              :title="$t('pageImportTrialMatchTitle')"
              ok-variant="primary"
              no-close-on-backdrop
              no-close-on-esc
              @ok.prevent="loadTrial"
              no-fade
              size="md"
              ref="confirmationModal">
        <p class="text-info">{{ $t('pageImportTrialMatchInfo') }}</p>
        <TrialInformation :showComments="false" :trial="trial" class="border" />

        <!-- Trial group -->
        <b-form-group label-for="trial-group" :description="$t('formDescriptionTrialSetupTrialGroup')" class="mt-3">
          <template v-slot:label>
            <BIconCollection /><span> {{ $t('formLabelTrialSetupTrialGroup') }}</span>
          </template>
          <b-form-input list="trial-groups" trim v-model="trialGroup" id="trial-group" />

          <datalist id="trial-groups">
            <option v-for="group in trialGroups" :key="`trial-group-${group}`">{{ group }}</option>
          </datalist>
        </b-form-group>

        <p class="text-info">{{ $t('pageImportTrialMatchConfirm') }}</p>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import BarcodeScanner from '@/components/BarcodeScanner'
import TrialInformation from '@/components/TrialInformation'

import { BIconSearch, BIconCollection } from 'bootstrap-vue'

import { getTrialByCode, getLegacyTrialByCode } from '@/plugins/api'
import { addTrial, getTrialGroups } from '@/plugins/idb'
import { migrateOldGridScoreTrial } from '@/plugins/misc'

export default {
  components: {
    BIconSearch,
    BIconCollection,
    BarcodeScanner,
    TrialInformation
  },
  data: function () {
    return {
      showCamera: false,
      shareCode: null,
      serverError: null,
      trialGroup: null,
      trialGroups: [],
      trial: null,
      gridScoreVersion: null,
      gridScoreUrl: 'https://ics.hutton.ac.uk/gridscore'
    }
  },
  computed: {
    ...mapGetters([
      'storeIsOffline'
    ]),
    buttonDisabled: function () {
      const shareCodeValid = this.shareCode !== undefined && this.shareCode !== null && this.shareCode !== ''
      const urlValid = this.gridScoreUrl !== undefined && this.gridScoreUrl !== null && this.gridScoreUrl !== ''

      if (this.gridScoreVersion === 'legacy') {
        return !shareCodeValid || !urlValid
      } else {
        return !shareCodeValid
      }
    }
  },
  methods: {
    onDecode: function (shareCode) {
      if (shareCode.indexOf('/') !== -1) {
        this.shareCode = shareCode.substring(shareCode.lastIndexOf('/') + 1)
      } else {
        this.shareCode = shareCode
      }

      this.checkCode()
    },
    loadTrial: function () {
      if (this.trialGroup) {
        this.trial.group = {
          name: this.trialGroup
        }
      }

      addTrial(this.trial)
        .then(trialId => {
          this.$store.dispatch('setSelectedTrial', trialId)
          this.$router.push({ name: 'home' })
        })
    },
    checkCode: function () {
      if (this.buttonDisabled) {
        return
      }

      this.serverError = null

      if (this.gridScoreVersion === 'legacy') {
        getLegacyTrialByCode(this.gridScoreUrl, this.shareCode)
          .then(result => {
            return migrateOldGridScoreTrial(result)
          })
          .then(result => {
            this.trial = result

            this.$nextTick(() => this.$refs.confirmationModal.show())
          })
          .catch(error => {
            if (error.status === 404) {
              this.serverError = this.$t('apiErrorTrialNotFound')
            } else {
              this.serverError = this.$t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
            }
          })
      } else {
        getTrialByCode(this.shareCode)
          .then(result => {
            this.trial = result

            this.$nextTick(() => this.$refs.confirmationModal.show())
          })
          .catch(error => {
            if (error.status === 404) {
              this.serverError = this.$t('apiErrorTrialNotFound')
            } else {
              this.serverError = this.$t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
            }
          })
      }
    }
  },
  mounted: function () {
    getTrialGroups().then(groups => {
      this.trialGroups = groups || []
    })

    if (this.$route.params && this.$route.params.shareCode) {
      this.shareCode = this.$route.params.shareCode
      this.gridScoreVersion = 'current'
    }
  }
}
</script>

<style scoped>
.logo {
  max-height: 100px;
}
</style>
