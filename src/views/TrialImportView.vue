<template>
  <div>
    <UseOnline v-slot="{ isOnline }">
      <div v-if="isOnline === false" class="modal-banner bg-danger text-white text-center mb-3 mt-0 p-2">
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
              <b-form-input v-model.trim="shareCode" autofocus @keyup.enter="checkCode" />
              <template #append>
                <b-button @click="showCamera = !showCamera">
                  <IBiQrCodeScan /> {{ $t('buttonScanQR') }}
                </b-button>
              </template>
            </b-input-group>
          </b-form-group>
          <div v-if="showCamera">
            <p class="mt-3">{{ $t('pageImportCameraText') }}</p>
            <div class="camera-wrapper d-flex justify-content-center" v-if="showCamera">
              <BarcodeScanner @code-scanned="onDecode" :isValidFormat="checkQRCodeFormat" ref="scanner" />
            </div>
          </div>

          <b-card bg-variant="warning" border-variant="warning" class="mb-3" v-if="gridScoreVersion === 'legacy'"><b-card-text>{{ $t('pageImportLegacyWarning') }}</b-card-text></b-card>

          <b-button @click="checkCode" variant="primary" :disabled="buttonDisabled"><IBiSearch /> {{ $t('buttonCheckShareCode') }}</b-button>

          <p class="text-danger mt-3" v-if="serverError"><span v-html="serverError" /></p>
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
          <TrialInformation :showComments="false" :showEvents="false" :trial="trial" class="border" />

          <!-- Trial group -->
          <b-form-group label-for="trial-group" :description="$t('formDescriptionTrialSetupTrialGroup')" class="mt-3">
            <template v-slot:label>
              <IBiCollection /><span> {{ $t('formLabelTrialSetupTrialGroup') }}</span>
            </template>
            <b-form-input list="trial-groups" v-model.trim="trialGroup" id="trial-group" />

            <datalist id="trial-groups">
              <option v-for="group in trialGroups" :key="`trial-group-${group}`">{{ group }}</option>
            </datalist>
          </b-form-group>

          <p class="text-info">{{ $t('pageImportTrialMatchConfirm') }}</p>
        </b-modal>
      </b-container>

      <TrialImportPermissionUpgradeModal :remotePermissionType="remotePermissionType"
                                        :localPermissionType="localPermissionType"
                                        v-if="localTrialMatch && remotePermissionType && localPermissionType"
                                        :trial="localTrialMatch"
                                        @upgrade="upgradePermissions"
                                        @new="importAsNew"
                                        ref="importPermissionUpgradeModal" />
      <TrialExistsModal ref="trialExistsModal" :trial="localTrialMatch" @new="importAsNew" v-if="localTrialMatch" />
    </UseOnline>
  </div>
</template>

<script>
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import TrialInformation from '@/components/TrialInformation.vue'
import TrialImportPermissionUpgradeModal from '@/components/modals/TrialImportPermissionUpgradeModal.vue'
import TrialExistsModal from '@/components/modals/TrialExistsModal.vue'

import { getTrialByCode, getLegacyTrialByCode } from '@/plugins/api'
import { addTrial, getTrialGroups, getTrials, updateTrialShareCodes } from '@/plugins/idb'
import { migrateOldGridScoreTrial } from '@/plugins/misc'
import { TRIAL_STATE_EDITOR, TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'

import { UseOnline } from '@vueuse/components'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    BarcodeScanner,
    TrialInformation,
    TrialImportPermissionUpgradeModal,
    TrialExistsModal,
    UseOnline
  },
  data: function () {
    return {
      showCamera: false,
      shareCode: null,
      serverError: null,
      trialGroup: null,
      trialGroups: [],
      existingTrials: [],
      trial: null,
      gridScoreVersion: 'current',
      localPermissionType: null,
      remotePermissionType: null,
      localTrialMatch: null,
      gridScoreUrl: 'https://ics.hutton.ac.uk/gridscore'
    }
  },
  computed: {
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
    checkQRCodeFormat: function (code) {
      if (code.lastIndexOf('/') === -1) {
        // There are no slashes, this could be a valid code
        return true
      } else {
        const href = code

        const searchFor = '/trial-import'
        const index = href.indexOf(searchFor)

        if (index !== -1) {
          const remainder = href.substring(index + searchFor.length)

          if (remainder.indexOf('/') !== -1 && remainder.length > 1) {
            return true
          }
        }
      }

      this.serverError = this.$t('modalTextTrialImportNoValidQRCode', { code: code })

      this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))

      return false
    },
    onDecode: function (shareCode) {
      if (shareCode.indexOf('/') !== -1) {
        this.shareCode = shareCode.substring(shareCode.lastIndexOf('/') + 1)
      } else {
        this.shareCode = shareCode
      }

      this.showCamera = false

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
    isHigherPermission: function (one, two) {
      return (one === TRIAL_STATE_OWNER && (two === TRIAL_STATE_EDITOR || two === TRIAL_STATE_VIEWER)) || (one === TRIAL_STATE_EDITOR && two === TRIAL_STATE_VIEWER)
    },
    checkCode: function () {
      if (this.buttonDisabled) {
        return
      }

      this.serverError = null
      this.localTrialMatch = null
      this.localPermissionType = null
      this.remotePermissionType = null

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

            const match = this.existingTrials.filter(t => {
              if (t.shareCodes.ownerCode && result.shareCodes.ownerCode && (t.shareCodes.ownerCode === result.shareCodes.ownerCode)) {
                return true
              } else if (t.shareCodes.editorCode && result.shareCodes.editorCode && (t.shareCodes.editorCode === result.shareCodes.editorCode)) {
                return true
              } else if (t.shareCodes.viewerCode && result.shareCodes.viewerCode && (t.shareCodes.viewerCode === result.shareCodes.viewerCode)) {
                return true
              } else {
                return false
              }
            })

            if (match && match.length > 0) {
              this.localTrialMatch = match[0]
              this.localPermissionType = this.localTrialMatch.shareStatus
              if (this.shareCode === result.shareCodes.ownerCode) {
                this.remotePermissionType = TRIAL_STATE_OWNER
              } else if (this.shareCode === result.shareCodes.editorCode) {
                this.remotePermissionType = TRIAL_STATE_EDITOR
              } else if (this.shareCode === result.shareCodes.viewerCode) {
                this.remotePermissionType = TRIAL_STATE_VIEWER
              }

              if (this.localPermissionType === this.remotePermissionType) {
                // Loaded a trial that already exists with the same permissions
                this.$nextTick(() => this.$refs.trialExistsModal.show())
              } else if (this.isHigherPermission(this.remotePermissionType, this.localPermissionType)) {
                // The new code that was used is a higher permission grade than the local one, so ask to update the local one's permission grade
                this.$nextTick(() => this.$refs.importPermissionUpgradeModal.show())
              } else {
                // The new code that was used is a lower permission grade than the local one, don't do anything, as this is pointless. Notify user.
                this.$nextTick(() => this.$refs.trialExistsModal.show())
              }
            } else {
              this.$nextTick(() => this.$refs.confirmationModal.show())
            }
          })
          .catch(error => {
            if (error.status === 404) {
              this.serverError = this.$t('apiErrorTrialNotFound')
            } else {
              this.serverError = this.$t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
            }
            window.scrollTo(0, document.body.scrollHeight)
          })
      }
    },
    upgradePermissions: function () {
      emitter.emit('show-confirm', {
        title: 'toastTitleTrialShareCodeUpgrade',
        message: 'toastTextTrialShareCodeUpgrade',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        cancelVariant: 'primary',
        okVariant: 'primary',
        callback: (value) => {
          if (value === true) {
            updateTrialShareCodes(this.localTrialMatch.localId, this.trial.shareCodes)
              .then(() => {
                this.$store.dispatch('setSelectedTrial', this.localTrialMatch.localId)
                this.$router.push({ name: 'home' })
              })
          }
        }
      })
    },
    importAsNew: function () {
      emitter.emit('show-confirm', {
        title: 'toastTitleTrialShareCodeAsNew',
        message: 'toastTextTrialShareCodeAsNew',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        cancelVariant: 'primary',
        okVariant: 'primary',
        callback: (value) => {
          if (value === true) {
            this.$nextTick(() => this.$refs.confirmationModal.show())
          }
        }
      })
    }
  },
  mounted: function () {
    getTrials().then(trials => {
      this.existingTrials = (trials || []).filter(t => t.shareCodes !== undefined && t.shareStatus !== TRIAL_STATE_NOT_SHARED)
    })
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
