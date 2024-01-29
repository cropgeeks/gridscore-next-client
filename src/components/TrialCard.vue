<template>
  <b-card class="h-100" no-body :border-variant="trial.localId === storeSelectedTrial ? 'primary' : null" :bg-variant="trial.localId === storeSelectedTrial ? 'light' : null" v-if="trial">
    <a href="#" @click.prevent="$emit('synchronize')" v-if="showSyncButtons && trial.transactionCount > 0 || trial.hasRemoteUpdate">
      <template v-if="trial.transactionCount > 0">
        <div class="card-corner card-corner-local" v-b-tooltip.hover="$t('tooltipTrialHasTransactions')" />
        <BIconCloudUploadFill class="card-corner-icon" />
      </template>
      <template v-else-if="trial.hasRemoteUpdate">
        <div class="card-corner card-corner-remote" v-b-tooltip.hover="$t('tooltipTrialHasRemoteUpdate')" />
        <BIconCloudDownloadFill class="card-corner-icon" />
      </template>
    </a>
    <TrialInformation :trial="trial" />
    <b-button @click="$emit('handleTrialExpiration')" v-if="trial.showExpiryWarning === true" variant="danger" v-b-tooltip.hover="$t('tooltipTrialSelectorTrialExpiryWarning', { date: new Date(trial.expiresOn).toLocaleDateString() })">
      <BIconstack>
        <BIconCalendar stacked />
        <BIconExclamationTriangleFill stacked :scale="0.6" shift-v="-1" />
      </BIconstack> {{ $t('widgetTrialSelectorTrialExpiryWarning') }}
    </b-button>
    <b-card-footer class="d-flex justify-content-between">
      <b-button @click="$emit('loadTrial')" variant="primary"><BIconJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>
      <b-dropdown right v-if="showDropdown">
        <template #button-content>
          <BIconGear />
        </template>
        <b-dropdown-item @click="$emit('showShareCodes')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonShare') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('synchronize')" v-if="trial.editable && trial.transactionCount > 0"><BIconstack :font-scale="1">
          <BIconCloud stacked />
          <BIconArrowDownUp stacked :scale="0.4" />
        </BIconstack> {{ $t('buttonSynchronize') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('duplicateTrial')"><BIconJournals /> {{ $t('buttonDuplicateTrial') }}</b-dropdown-item>
        <b-dropdown-divider v-if="trial.editable" />
        <b-dropdown-item @click="$emit('showTrialEdit')" v-if="trial.editable && (trial.shareStatus === TRIAL_STATE_NOT_SHARED || trial.shareStatus === TRIAL_STATE_OWNER)"><BIconPencilSquare /> {{  $t('buttonEditTrial') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addTrait')" v-if="trial.editable"><BIconTags /> {{ $t('buttonAddTrait') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addGermplasm')" v-if="trial.editable && trial.layout.columns === 1"><BIconNodePlus :rotate="90" /> {{ $t('buttonAddGermplasm') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('importData')" v-if="trial.editable"><BIconFileEarmarkArrowUp /> {{ $t('buttonUploadData') }}</b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item variant="danger" @click="$emit('deleteTrial')"><BIconTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
      </b-dropdown>
    </b-card-footer>
  </b-card>
</template>

<script>
import TrialInformation from '@/components/TrialInformation'
import { mapGetters } from 'vuex'
import { BIconCloudUploadFill, BIconCloudDownloadFill, BIconCalendar, BIconExclamationTriangleFill, BIconJournalArrowUp, BIconGear, BIconstack, BIconCloud, BIconArrowDownUp, BIconJournals, BIconPencilSquare, BIconTags, BIconNodePlus, BIconFileEarmarkArrowUp, BIconTrash } from 'bootstrap-vue'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER } from '@/plugins/constants'

export default {
  components: {
    TrialInformation,
    BIconCloudUploadFill,
    BIconCloudDownloadFill,
    BIconCalendar,
    BIconExclamationTriangleFill,
    BIconJournalArrowUp,
    BIconGear,
    BIconstack,
    BIconCloud,
    BIconArrowDownUp,
    BIconJournals,
    BIconPencilSquare,
    BIconTags,
    BIconNodePlus,
    BIconFileEarmarkArrowUp,
    BIconTrash
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    showDropdown: {
      type: Boolean,
      default: true
    },
    showSyncButtons: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ])
  }
}
</script>

<style scoped>
</style>
