<template>
  <b-modal :title="$t('modalTitleAddGermplasm')"
           :ok-title="$t('buttonAdd')"
           :cancel-title="$t('buttonCancel')"
           no-fade
           @ok.prevent="onSubmit"
           @shown="$refs.germplasmName.focus()"
           ref="addGermplasmModal">
    <p>{{ $t('modalTextAddGermplasm') }}</p>
    <b-form @submit.prevent="onSubmit">
      <!-- Germplasm name -->
      <b-form-group :label="$t('formLabelAddGermplasmName')" label-for="germplasm-name" :description="$t('formDescriptionAddGermplasm')">
        <b-input-group>
          <b-input-group-prepend>
            <b-button @click="$refs.scanQrCodeModal.show()" v-b-tooltip="$t('tooltipScanQRCodeAddGermplasm')">
              <!-- TODO: Replace with bootstrap-vue icon once new version is released -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16">
                <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/>
                <path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/>
                <path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/>
                <path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/>
                <path d="M12 9h2V8h-2v1Z"/>
              </svg>
            </b-button>
          </b-input-group-prepend>
          <b-form-textarea id="germplasm-name" v-model="germplasm" required :state="state.germplasm" ref="germplasmName" />
          <b-form-invalid-feedback :state="state.varieties">
            {{ $t('formFeedbackSetupSurveyAddVariety') }}
          </b-form-invalid-feedback>
        </b-input-group>
      </b-form-group>
    </b-form>
    <ScanQRCodeModal ref="scanQrCodeModal" @code-scanned="addCode"/>
  </b-modal>
</template>

<script>
import ScanQRCodeModal from '@/components/modals/ScanQRCodeModal'
import { getTrialDataCached } from '@/plugins/datastore'
import { addTrialGermplasm } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    ScanQRCodeModal
  },
  props: {
    trialId: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      germplasm: null,
      state: {
        germplasm: null
      },
      uniqueGermplasmNames: []
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.germplasm = null
      this.state = {
        germplasm: null
      }

      const cachedData = getTrialDataCached()

      this.uniqueGermplasmNames = new Set()

      Object.values(cachedData).forEach(c => this.uniqueGermplasmNames.add(c.displayName))

      this.$refs.addGermplasmModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.addGermplasmModal.hide())
    },
    addCode: function (code) {
      if (!this.germplasm || this.germplasm === '') {
        this.germplasm = code
      } else {
        this.germplasm += `\n${code}`
      }
    },
    onSubmit: function () {
      if (!this.germplasm) {
        this.state.germplasm = false
        return
      }

      const individualGermplasm = this.germplasm.split('\n').map(g => g.trim()).filter(g => g !== '')

      this.state.germplasm = !individualGermplasm.some(g => this.uniqueGermplasmNames.has(g))

      if (this.state.germplasm === false) {
        return
      }

      addTrialGermplasm(this.trialId, individualGermplasm)
        .then(() => {
          emitter.emit('trials-updated')
          this.hide()
        })
        .catch(e => {
          console.error('nay!', e)
        })
    }
  }
}
</script>

<style>

</style>
