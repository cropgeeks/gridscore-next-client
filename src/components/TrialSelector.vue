<template>
  <div v-if="trials && trials.length > 0">
    <h2>{{ $t('widgetTrialSelectorTitle') }}</h2>
    <p>{{ $t('widgetTrialSelectorText') }}</p>

    <b-form-group :label="$t('formLabelTrialSelectorSearch')" :description="$t('formDescriptionTrialSelectorSearch')" label-for="search-term">
      <b-input v-model="searchTerm" trim id="search-term" type="search" />
    </b-form-group>

    <b-row v-if="sortedTrials && sortedTrials.length > 0">
      <b-col cols=12 sm=6 md=4 lg=3 v-for="trial in sortedTrials" :key="`trial-selector-${trial.localId}`"  class="mb-3">
        <b-card class="h-100" no-body :border-variant="trial.localId === storeSelectedTrial ? 'primary' : null" :bg-variant="trial.localId === storeSelectedTrial ? 'light' : null">
          <a href="#" @click.prevent="synchronize(trial)" v-if="trial.transactionCount > 0 || trial.hasRemoteUpdate">
            <template v-if="trial.transactionCount > 0">
              <div class="card-corner card-corner-local" v-b-tooltip="$t('tooltipTrialHasTransactions')" />
              <BIconCloudUploadFill class="card-corner-icon" />
            </template>
            <template v-else-if="trial.hasRemoteUpdate">
              <div class="card-corner card-corner-remote" v-b-tooltip="$t('tooltipTrialHasRemoteUpdate')" />
              <BIconCloudDownloadFill class="card-corner-icon" />
            </template>
          </a>
          <TrialInformation :trial="trial" />
          <div v-if="trial.showExpiryWarning === true" class="px-3 py-2 bg-danger text-white" v-b-tooltip="$t('tooltipTrialSelectorTrialExpiryWarning', { date: new Date(trial.expiresOn).toLocaleDateString() })">
            <BIconstack>
              <BIconCalendar stacked />
              <BIconExclamationTriangleFill stacked :scale="0.6" shift-v="-1" />
            </BIconstack> {{ $t('widgetTrialSelectorTrialExpiryWarning') }}
          </div>
          <b-card-footer class="d-flex justify-content-between">
            <b-button @click="loadTrial(trial)" variant="primary"><BIconJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>
            <b-dropdown right>
              <template #button-content>
                <BIconGear />
              </template>
              <b-dropdown-item @click="showShareCodes(trial)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonShare') }}</b-dropdown-item>
              <b-dropdown-item @click="synchronize(trial)" v-if="trial.editable && trial.transactionCount > 0"><BIconstack :font-scale="1">
                <BIconCloud stacked />
                <BIconArrowDownUp stacked :scale="0.4" />
              </BIconstack> {{ $t('buttonSynchronize') }}</b-dropdown-item>
              <b-dropdown-item @click="duplicateTrial(trial)"><BIconJournals /> {{ $t('buttonDuplicateTrial') }}</b-dropdown-item>
              <b-dropdown-divider v-if="trial.editable" />
              <b-dropdown-item @click="showTrialEdit(trial)" v-if="trial.editable && (trial.shareStatus === TRIAL_STATE_NOT_SHARED || trial.shareStatus === TRIAL_STATE_OWNER)"><BIconPencilSquare /> {{  $t('buttonEditTrial') }}</b-dropdown-item>
              <b-dropdown-item @click="addTrait(trial)" v-if="trial.editable"><BIconTags /> {{ $t('buttonAddTrait') }}</b-dropdown-item>
              <b-dropdown-item @click="addGermplasm(trial)" v-if="trial.editable && trial.layout.columns === 1"><BIconNodePlus :rotate="90" /> {{ $t('buttonAddGermplasm') }}</b-dropdown-item>
              <b-dropdown-item @click="importData(trial)" v-if="trial.editable"><BIconFileEarmarkArrowUp /> {{ $t('buttonUploadData') }}</b-dropdown-item>
              <b-dropdown-divider />
              <b-dropdown-item variant="danger" @click="deleteTrial(trial)"><BIconTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
            </b-dropdown>
          </b-card-footer>
        </b-card>
      </b-col>
    </b-row>
    <p class="text-warning" v-else>{{ $t('widgetTrialSelectorNoMatchFound') }}</p>

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />
    <TrialShareCodeModal :trial="selectedTrial" ref="trialShareCodeModal" v-if="selectedTrial" />
    <AddTraitsModal :trial="selectedTrial" ref="addTraitsModal" v-if="selectedTrial && selectedTrial.editable" />
    <AddGermplasmModal :trialId="selectedTrial.localId" ref="addGermplasmModal" v-if="selectedTrial && selectedTrial.editable && selectedTrial.layout.columns === 1" />
    <TrialSynchronizationModal :trial="selectedTrial" ref="traitSyncModal" v-if="selectedTrial && (selectedTrial.transactionCount > 0 || selectedTrial.hasRemoteUpdate)" />
    <TrialDataImportModal :trial="selectedTrial" ref="trialDataImportModal" v-if="selectedTrial" />
    <TrialModificationModal :trial="selectedTrial" ref="trialModificationModal" v-if="selectedTrial" />
  </div>
</template>

<script>
import TrialInformation from '@/components/TrialInformation'
import TrialCommentModal from '@/components/modals/TrialCommentModal'
import TrialShareCodeModal from '@/components/modals/TrialShareCodeModal'
import AddTraitsModal from '@/components/modals/AddTraitsModal'
import TrialModificationModal from '@/components/modals/TrialModificationModal'
import TrialDataImportModal from '@/components/modals/TrialDataImportModal'
import AddGermplasmModal from '@/components/modals/AddGermplasmModal'
import TrialSynchronizationModal from '@/components/modals/TrialSynchronizationModal'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER } from '@/plugins/constants'
import { mapGetters } from 'vuex'
import { deleteTrial, getTrials } from '@/plugins/idb'
import { BIconCalendar, BIconExclamationTriangleFill, BIconJournalArrowUp, BIconGear, BIconTrash, BIconTags, BIconCloudUploadFill, BIconCloudDownloadFill, BIconFileEarmarkArrowUp, BIconPencilSquare, BIconCloud, BIconArrowDownUp, BIconJournals, BIconstack, BIconNodePlus } from 'bootstrap-vue'
import { postCheckUpdate } from '@/plugins/api'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    AddTraitsModal,
    TrialInformation,
    TrialCommentModal,
    TrialShareCodeModal,
    TrialSynchronizationModal,
    TrialDataImportModal,
    AddGermplasmModal,
    TrialModificationModal,
    BIconCalendar,
    BIconExclamationTriangleFill,
    BIconJournalArrowUp,
    BIconFileEarmarkArrowUp,
    BIconPencilSquare,
    BIconGear,
    BIconJournals,
    BIconTrash,
    BIconTags,
    BIconCloudUploadFill,
    BIconCloudDownloadFill,
    BIconCloud,
    BIconArrowDownUp,
    BIconstack,
    BIconNodePlus
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ]),
    sortedTrials: function () {
      if (this.trials) {
        return JSON.parse(JSON.stringify(this.trials))
          .filter(t => {
            if (this.searchTerm && (this.searchTerm !== '')) {
              const lower = this.searchTerm.toLowerCase()
              // Check if the name matches
              if (t.name.toLowerCase().includes(lower)) {
                return true
              }
              // Check if the description matches
              if (t.description && t.description.toLowerCase().includes(lower)) {
                return true
              }
              // Check if any of the trait names matches
              if (t.traits.map(t => t.name).join('|').toLowerCase().includes(lower)) {
                return true
              }

              return false
            } else {
              return true
            }
          })
          .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
          .map(t => {
            if (t.shareCodes && this.trialUpdates) {
              const shareCode = t.shareCodes.ownerCode || t.shareCodes.editorCode || t.shareCodes.viewerCode
              const timestamp = this.trialUpdates[shareCode]

              if (timestamp !== undefined && timestamp !== null && timestamp.updatedOn !== undefined && timestamp.updatedOn !== null) {
                t.hasRemoteUpdate = timestamp.updatedOn > t.updatedOn
              } else {
                t.hasRemoteUpdate = false
              }

              if (timestamp !== undefined && timestamp !== null && timestamp.showExpiryWarning !== undefined && timestamp.showExpiryWarning !== null) {
                t.showExpiryWarning = timestamp.showExpiryWarning
                t.expiresOn = timestamp.expiresOn
              } else {
                t.showExpiryWarning = false
              }
            }

            return t
          })
      } else {
        return []
      }
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER,
      trials: [],
      selectedTrial: null,
      trialUpdates: null,
      searchTerm: null
    }
  },
  methods: {
    importData: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.trialDataImportModal.show())
    },
    showTrialEdit: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.trialModificationModal.show())
    },
    duplicateTrial: function (trial) {
      this.$router.push({ name: 'trial-duplication', params: { trialId: trial.localId } })
    },
    synchronize: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.traitSyncModal.show())
    },
    showShareCodes: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.trialShareCodeModal.show())
    },
    loadTrial: function (trial) {
      this.$store.commit('ON_SELECTED_TRIAL_CHANGED', trial.localId)
      this.$router.push({ name: 'data-entry' })
    },
    addTrait: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.addTraitsModal.show())
    },
    addGermplasm: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.addGermplasmModal.show())
    },
    deleteTrial: function (trial) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteTrial'), {
        title: this.$t('modalTitleDeleteTrial'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.$store.commit('ON_SELECTED_TRIAL_CHANGED', null)
            deleteTrial(trial.localId).then(() => {
              this.update()
            })

            emitter.emit('plausible-event', { key: 'trial-deleted' })
          }
        })
    },
    showTrialComments: function (trial) {
      this.selectedTrial = trial

      if (trial) {
        this.$nextTick(() => this.$refs.trialCommentModal.show())
      }
    },
    update: function () {
      getTrials().then(trials => {
        this.trials = trials
        if (this.selectedTrial) {
          this.selectedTrial = this.trials.find(t => t.localId === this.selectedTrial.localId)
        }
      })
    }
  },
  mounted: function () {
    this.update()

    emitter.on('show-trial-comments', this.showTrialComments)
    emitter.on('trial-properties-changed', this.update)
    emitter.on('trials-updated', this.update)

    postCheckUpdate()
      .then(result => {
        this.trialUpdates = result
      })
  },
  beforeDestroy: function () {
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('trial-properties-changed', this.update)
    emitter.off('trials-updated', this.update)
  }
}
</script>

<style scoped>
.card-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  border-top: 50px solid #888;
  border-left: 50px solid transparent;
}
.card-corner-remote {
  border-top-color: var(--warning);
}
.card-corner-local {
  border-top-color: var(--info);
}
.card-corner-icon {
  position: absolute;
  top: 7px;
  right: 7px;
  color: white;
  pointer-events: none;
}
</style>
