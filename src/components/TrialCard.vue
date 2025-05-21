<template>
  <b-card class="h-100" no-body :border-variant="trial.localId === storeSelectedTrial ? 'primary' : null" :bg-variant="trial.localId === storeSelectedTrial ? (storeDarkMode ? 'dark' : 'light') : null" v-if="trial">
    <a href="#" @click.prevent="$emit('synchronize')" v-if="showSyncButtons && trial.transactionCount > 0 || trial.hasRemoteUpdate">
      <template v-if="trial.transactionCount > 0">
        <div class="card-corner card-corner-local" v-b-tooltip.hover="$t('tooltipTrialHasTransactions')" />
        <IBiCloudUploadFill class="card-corner-icon" />
      </template>
      <template v-else-if="trial.hasRemoteUpdate">
        <div class="card-corner card-corner-remote" v-b-tooltip.hover="$t('tooltipTrialHasRemoteUpdate')" />
        <IBiCloudDownloadFill class="card-corner-icon" />
      </template>
    </a>
    <template v-if="trial.shareStatus !== TRIAL_STATE_NOT_SHARED && showRemoteVsLocal">
      <b-button v-if="trial.remoteUrl" class="button-disabled py-0" variant="info" v-b-tooltip.hover="trial.remoteUrl">
        <IBiCloudPlusFill /> {{ $t('buttonTrialRemoteUrl') }}
      </b-button>
      <b-button v-else class="button-disabled py-0" variant="success">
        <IBiDatabaseFill /> {{ $t('buttonTrialLocalTrial') }}
      </b-button>
    </template>
    <TrialInformation :trial="trial" @on-share-clicked="$emit('showShareCodes')" />
    <b-button @click="$emit('handleTrialExpiration')" v-if="trial.showExpiryWarning === true" variant="danger" v-b-tooltip.hover="$t('tooltipTrialSelectorTrialExpiryWarning', { date: new Date(trial.expiresOn).toLocaleDateString() })">
      <IBiCalendarXFill /> {{ $t('widgetTrialSelectorTrialExpiryWarning') }}
    </b-button>
    <b-card-footer class="d-flex justify-content-between">
      <b-button @click="$emit('loadTrial')" variant="primary"><IBiJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>
      <b-button v-if="selectable" :variant="selectedToEdit ? 'info' : 'secondary'" @click="selectedToEdit = !selectedToEdit">
        <IBiCheckSquare v-if="selectedToEdit" /><IBiSquare v-else /> {{ selectedToEdit ? $t('buttonDeselect') : $t('buttonSelect') }}
      </b-button>
      <b-dropdown right v-else-if="showDropdown" :disabled="selectable">
        <template #button-content>
          <IBiGear />
        </template>
        <b-dropdown-item @click="$emit('showShareCodes')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonShare') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('synchronize')" v-if="trial.editable && trial.transactionCount > 0"><IBiArrowDownUp /> {{ $t('buttonSynchronize') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('duplicateTrial')"><IBiJournals /> {{ $t('buttonDuplicateTrial') }}</b-dropdown-item>
        <b-dropdown-divider v-if="trial.editable" />
        <b-dropdown-item @click="$emit('showTrialEdit')" v-if="trial.editable && (trial.shareStatus === TRIAL_STATE_NOT_SHARED || trial.shareStatus === TRIAL_STATE_OWNER)"><IBiPencilSquare /> {{  $t('buttonEditTrial') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addTrait')" v-if="trial.editable"><IBiTags /> {{ $t('buttonAddTrait') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addPerson')" v-if="trial.editable"><IBiPersonPlus /> {{ $t('buttonAddPerson') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addGermplasm')" v-if="trial.editable && trial.layout.columns === 1"><IBiNodePlus :style="{ transform: 'rotate(90deg)' }" /> {{ $t('buttonAddGermplasm') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('importData')" v-if="trial.editable"><IBiFileEarmarkArrowUp /> {{ $t('buttonUploadData') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('updatePlotMetadata')" v-if="trial.editable"><IBiJournalArrowUp /> {{ $t('buttonUpdateMetadata') }}</b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item variant="danger" @click="$emit('deleteTrial')"><IBiTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
      </b-dropdown>
    </b-card-footer>
  </b-card>
</template>

<script>
import TrialInformation from '@/components/TrialInformation.vue'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER } from '@/plugins/constants'

export default {
  components: {
    TrialInformation
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
    },
    selectable: {
      type: Boolean,
      default: false
    },
    showRemoteVsLocal: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    selectedToEdit: function (newValue) {
      this.$emit('selected', newValue)
    },
    selectable: function () {
      this.selectedToEdit = false
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER,
      selectedToEdit: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial',
      'storeDarkMode'
    ])
  }
}
</script>

<style>
</style>
