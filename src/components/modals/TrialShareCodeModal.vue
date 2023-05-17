<template>
  <b-modal :title="$t('modalTitleTrialShare')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="lg"
           ref="trialShareCodesModal">
    <div v-if="trial">
      <div v-if="trial.shareCodes">
        <p v-html="$t('modalTextTrialShareCodes')" />

        <b-tabs justified>
          <b-tab v-if="trial.shareCodes.viewerCode">
            <template #title>
              <BIconEye /> {{ $t('trialShareCodeViewerTitle') }}
            </template>

            <StyledQRCode class="mt-3" :text="trial.shareCodes.viewerCode" />
          </b-tab>
          <b-tab v-if="trial.shareCodes.editorCode">
            <template #title>
              <BIconPencilSquare /> {{ $t('trialShareCodeEditorTitle') }}
            </template>

            <StyledQRCode class="mt-3" :text="trial.shareCodes.editorCode" />
          </b-tab>
          <b-tab v-if="trial.shareCodes.ownerCode">
            <template #title>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-incognito" viewBox="0 0 16 16"><path fill-rule="evenodd" d="m4.736 1.968-.892 3.269-.014.058C2.113 5.568 1 6.006 1 6.5 1 7.328 4.134 8 8 8s7-.672 7-1.5c0-.494-1.113-.932-2.83-1.205a1.032 1.032 0 0 0-.014-.058l-.892-3.27c-.146-.533-.698-.849-1.239-.734C9.411 1.363 8.62 1.5 8 1.5c-.62 0-1.411-.136-2.025-.267-.541-.115-1.093.2-1.239.735Zm.015 3.867a.25.25 0 0 1 .274-.224c.9.092 1.91.143 2.975.143a29.58 29.58 0 0 0 2.975-.143.25.25 0 0 1 .05.498c-.918.093-1.944.145-3.025.145s-2.107-.052-3.025-.145a.25.25 0 0 1-.224-.274ZM3.5 10h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5Zm-1.5.5c0-.175.03-.344.085-.5H2a.5.5 0 0 1 0-1h3.5a1.5 1.5 0 0 1 1.488 1.312 3.5 3.5 0 0 1 2.024 0A1.5 1.5 0 0 1 10.5 9H14a.5.5 0 0 1 0 1h-.085c.055.156.085.325.085.5v1a2.5 2.5 0 0 1-5 0v-.14l-.21-.07a2.5 2.5 0 0 0-1.58 0l-.21.07v.14a2.5 2.5 0 0 1-5 0v-1Zm8.5-.5h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5Z"/></svg> {{ $t('trialShareCodeOwnerTitle') }}
            </template>

            <StyledQRCode class="mt-3" :text="trial.shareCodes.ownerCode" />
          </b-tab>
        </b-tabs>
      </div>
      <div v-else>
        <p v-html="$t('modalTextTrialShare')" />

        <b-button @click="getShareCodes" variant="primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonGenerateShareCodes') }}</b-button>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { shareTrial } from '@/plugins/api'

import { BIconEye, BIconPencilSquare } from 'bootstrap-vue'

import StyledQRCode from '@/components/StyledQRCode'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconEye,
    BIconPencilSquare,
    StyledQRCode
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
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
