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
              <IBiQrCodeScan />
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
import ScanQRCodeModal from '@/components/modals/ScanQRCodeModal.vue'
import { addTrialGermplasm, getTrialData } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

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

      getTrialData(this.trialId)
        .then(data => {
          this.uniqueGermplasmNames = new Set()

          Object.values(data).forEach(c => this.uniqueGermplasmNames.add(c.displayName))

          this.$refs.addGermplasmModal.show()
        })
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
