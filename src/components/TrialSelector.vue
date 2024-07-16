<template>
  <div v-if="trials && trials.length > 0">
    <h2 class="d-flex justify-content-between">
      <span>{{ $t('widgetTrialSelectorTitle') }}</span>
      <div>
        <b-button-group class="me-2">
          <b-dropdown size="sm" variant="secondary" v-b-tooltip="$t('tooltipTrialSelectorMultiSelect')" v-if="multiSelectEnabled && selectedTrialsToEdit && selectedTrialsToEdit.length > 0">
            <template #button-content>
              <IBiCheck2Square /> {{ selectedTrialsToEdit.length }}
            </template>
            <b-dropdown-item @click="multiSelectEnabled = false"><IBiBan /> {{ $t('buttonCancelSelection') }}</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item @click="addTraits"><IBiTags /> {{ $t('buttonAddTrait') }}</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item variant="danger" @click="deleteTrials"><IBiTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
          </b-dropdown>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorMultiSelect')" :pressed="multiSelectEnabled" @click="multiSelectEnabled = !multiSelectEnabled" v-else><IBiCheck2Square /></b-button>
          
        </b-button-group>
        <b-button-group class="me-2">
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorArrangementGrid')" :pressed="trialListArrangement === TRIAL_LIST_GRID" @click="trialListArrangement = TRIAL_LIST_GRID"><IBiGrid /></b-button>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorArrangementList')" :pressed="trialListArrangement === TRIAL_LIST_LIST" @click="trialListArrangement = TRIAL_LIST_LIST"><IBiViewStacked /></b-button>
        </b-button-group>
        <b-button-group>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorTabsNone')" :pressed="trialListMode === TRIAL_LIST_ALL" @click="trialListMode = TRIAL_LIST_ALL"><IBiListTask /></b-button>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorTabsGroups')" :pressed="trialListMode === TRIAL_LIST_TABBED" @click="trialListMode = TRIAL_LIST_TABBED"><IBiSegmentedNav /></b-button>
        </b-button-group>
      </div>
    </h2>
    <p>{{ $t('widgetTrialSelectorText') }}</p>

    <b-form @submit.prevent>
      <b-row>
        <b-col cols=12 md=6 lg=4>
          <b-form-group :label="$t('formLabelTrialSelectorSearch')" :description="$t('formDescriptionTrialSelectorSearch')" label-for="search-term">
            <b-form-input v-model.trim="searchTerm" id="search-term" type="search" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6 lg=4>
          <b-form-group :label="$t('formLabelTrialSelectorOrderBy')" :description="$t('formDescriptionTrialSelectorOrderBy')" label-for="orderBy">
            <b-form-select :options="sortOptions" v-model="sortOrder" id="orderBy" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6 lg=4>
          <b-form-group :label="$t('formLabelTrialSelectorSortDescending')" :description="$t('formDescriptionTrialSelectorSortDescending')" label-for="order-asc">
            <div>
              <b-button-group>
                <b-button variant="outline-secondary" @click="sortDescending = false" :pressed="sortDescending === false"><IBiSortDownAlt /> {{ $t('formCheckboxSortOrderAscending') }}</b-button>
                <b-button variant="outline-secondary" @click="sortDescending = true" :pressed="sortDescending === true"><IBiSortDown /> {{ $t('formCheckboxSortOrderDescending') }}</b-button>
              </b-button-group>
            </div>
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>

    <b-card no-body>
      <b-tabs card v-model="tabIndex">
        <b-tab lazy no-body v-for="(trialGroup, group) in sortedTrials" :key="`tab-${group}`">
          <template #title>
            <span>{{ group === UNCATEGORIZED_TRIALS ? $t(trialListMode === TRIAL_LIST_ALL ? 'tabTitleAllTrials' : 'tabTitleUncategorizedTrials', { count: $n((trialGroup.trials || []).length) }) : `${group} (${$n((trialGroup.trials || []).length)})` }}</span>
            <IBiCloudDownloadFill class="ms-2 text-warning" v-if="trialGroup.hasRemoteUpdate" />
            <IBiCalendarXFill class="ms-2 text-danger" v-if="trialGroup.hasExpiryWarning" />
          </template>
          <b-progress variant="primary" striped animated :value="100" v-if="isLoading" height="4px" />
          <b-card-body :class="isLoading ? '' : 'mt-1'">
            <template v-if="trialGroup.trials && trialGroup.trials.length > 0">
              <b-list-group v-if="storeTrialListArrangement === TRIAL_LIST_LIST">
                <TrialListGroupItem :trial="trial"
                                    v-for="trial in trialGroup.trials" :key="`trial-selector-${trial.localId}`"
                                    :selectable="multiSelectEnabled"
                                    @selected="(v) => onSelectTrialToEdit(trial, v)"
                                    @loadTrial="loadTrial(trial)"
                                    @handleTrialExpiration="handleTrialExpiration(trial)"
                                    @showShareCodes="showShareCodes(trial)"
                                    @synchronize="synchronize(trial)"
                                    @duplicateTrial="duplicateTrial(trial)"
                                    @addTrait="addTrait(trial)"
                                    @addPerson="addPerson(trial)"
                                    @showTrialEdit="showTrialEdit(trial)"
                                    @addGermplasm="addGermplasm(trial)"
                                    @importData="importData(trial)"
                                    @deleteTrial="deleteTrial(trial)"/>
              </b-list-group>
              <b-row v-else>
                <b-col cols=12 sm=6 md=4 lg=3 v-for="trial in trialGroup.trials" :key="`trial-selector-${trial.localId}`" class="mb-3">
                  <TrialCard :trial="trial"
                            :selectable="multiSelectEnabled"
                            @selected="(v) => onSelectTrialToEdit(trial, v)"
                            @loadTrial="loadTrial(trial)"
                            @handleTrialExpiration="handleTrialExpiration(trial)"
                            @showShareCodes="showShareCodes(trial)"
                            @synchronize="synchronize(trial)"
                            @duplicateTrial="duplicateTrial(trial)"
                            @addTrait="addTrait(trial)"
                            @addPerson="addPerson(trial)"
                            @showTrialEdit="showTrialEdit(trial)"
                            @addGermplasm="addGermplasm(trial)"
                            @importData="importData(trial)"
                            @deleteTrial="deleteTrial(trial)"/>
                </b-col>
              </b-row>
            </template>
            <p class="text-warning" v-else>{{ $t('widgetTrialSelectorNoMatchFound') }}</p>
          </b-card-body>
        </b-tab>
        <!-- Refresh button (Using tabs-end slot) -->
        <template #tabs-end>
          <b-nav-item role="presentation" class="ms-auto" :disabled="isLoading" @click.prevent="update" v-b-tooltip="$t('tooltipTrialSelectorRefresh')" href="#"><IBiArrowClockwise /></b-nav-item>
        </template>
      </b-tabs>
    </b-card>

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial && modalToShow === 'comments'" />
    <TrialShareCodeModal :trial="selectedTrial" ref="trialShareCodeModal" v-if="selectedTrial && modalToShow === 'share'" />
    <AddTraitsModal :trials="multiSelectEnabled ? selectedTrialsToEditEditable : [selectedTrial]" ref="addTraitsModal" v-if="((selectedTrial && selectedTrial.editable) || (selectedTrialsToEditEditable && selectedTrialsToEditEditable.length > 0)) && modalToShow === 'add-traits'" />
    <EditPeopleModal :trialId="selectedTrial.localId" ref="addPersonModal" @person-added="update" v-if="selectedTrial && selectedTrial.editable && modalToShow === 'add-person'" />
    <AddGermplasmModal :trialId="selectedTrial.localId" ref="addGermplasmModal" v-if="selectedTrial && selectedTrial.editable && selectedTrial.layout.columns === 1 && modalToShow === 'add-germplasm'" />
    <TrialSynchronizationModal :trial="selectedTrial" ref="traitSyncModal" v-if="selectedTrial && (selectedTrial.transactionCount > 0 || selectedTrial.hasRemoteUpdate) && modalToShow === 'sync'" />
    <TrialDataImportModal :trial="selectedTrial" ref="trialDataImportModal" v-if="selectedTrial && modalToShow === 'import-data'" />
    <TrialModificationModal :trial="selectedTrial" ref="trialModificationModal" v-if="selectedTrial && modalToShow === 'edit-trial'" />
    <TrialExpirationModal :trial="selectedTrial" ref="trialExpirationModal" v-if="selectedTrial && modalToShow === 'trial-expiration'" />
  </div>
</template>

<script>
import TrialCard from '@/components/TrialCard.vue'
import TrialListGroupItem from '@/components/TrialListGroupItem.vue'
import TrialCommentModal from '@/components/modals/TrialCommentModal.vue'
import TrialShareCodeModal from '@/components/modals/TrialShareCodeModal.vue'
import AddTraitsModal from '@/components/modals/AddTraitsModal.vue'
import EditPeopleModal from '@/components/modals/EditPeopleModal.vue'
import TrialModificationModal from '@/components/modals/TrialModificationModal.vue'
import TrialExpirationModal from '@/components/modals/TrialExpirationModal.vue'
import TrialDataImportModal from '@/components/modals/TrialDataImportModal.vue'
import AddGermplasmModal from '@/components/modals/AddGermplasmModal.vue'
import TrialSynchronizationModal from '@/components/modals/TrialSynchronizationModal.vue'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER, TRIAL_LIST_ALL, TRIAL_LIST_TABBED, TRIAL_LIST_GRID, TRIAL_LIST_LIST } from '@/plugins/constants'
import { mapGetters } from 'vuex'
import { deleteTrial, getTrialById, getTrialGroups, getTrials } from '@/plugins/idb'
import { postCheckUpdate } from '@/plugins/api'

const UNCATEGORIZED_TRIALS = '__UNCATEGORIZED__'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    AddTraitsModal,
    TrialCard,
    TrialListGroupItem,
    TrialCommentModal,
    TrialShareCodeModal,
    TrialSynchronizationModal,
    TrialDataImportModal,
    AddGermplasmModal,
    TrialModificationModal,
    TrialExpirationModal,
    EditPeopleModal,
  },
  data: function () {
    return {
      UNCATEGORIZED_TRIALS,
      TRIAL_LIST_ALL,
      TRIAL_LIST_TABBED,
      TRIAL_LIST_GRID,
      TRIAL_LIST_LIST,
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER,
      multiSelectEnabled: false,
      trials: [],
      tabIndex: 0,
      selectedTrial: null,
      selectedTrialsToEdit: [],
      trialUpdates: null,
      searchTerm: null,
      trialListMode: TRIAL_LIST_ALL,
      trialListArrangement: TRIAL_LIST_GRID,
      trialGroups: [UNCATEGORIZED_TRIALS],
      sortOrder: 'latestUpdate',
      sortDescending: true,
      isLoading: false,
      modalToShow: null,
      sorting: {
        latestUpdate: (a, b) => this.sortDescending ? (new Date(b.updatedOn) - new Date(a.updatedOn)) : (new Date(a.updatedOn) - new Date(b.updatedOn)),
        name: (a, b) => this.sortDescending ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      }
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeTrialListMode',
      'storeTrialListArrangement'
    ]),
    selectedTrialsToEditEditable: function () {
      if (this.selectedTrialsToEdit) {
        return this.selectedTrialsToEdit.filter(t => t.editable)
      } else {
        return []
      }
    },
    sortOptions: function () {
      return [{
        text: this.$t('formSelectOptionTrialSortLastUpdate'),
        value: 'latestUpdate'
      }, {
        text: this.$t('formSelectOptionTrialSortName'),
        value: 'name'
      }]
    },
    sortedTrials: function () {
      if (this.trials) {
        const sortedAndFiltered = JSON.parse(JSON.stringify(this.trials))
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
              // Check if it matches any of the share codes
              if (t.shareCodes) {
                if (t.shareCodes.viewerCode === this.searchTerm) {
                  return true
                }
                if (t.shareCodes.editorCode === this.searchTerm) {
                  return true
                }
                if (t.shareCodes.ownerCode === this.searchTerm) {
                  return true
                }
              }

              return false
            } else {
              return true
            }
          })
          .sort(this.sorting[this.sortOrder])
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

        const result = {}
        result[UNCATEGORIZED_TRIALS] = {
          trials: []
        }

        if (this.storeTrialListMode === TRIAL_LIST_TABBED) {
          this.trialGroups.forEach(tg => {
            result[tg] = {
              trials: []
            }
          })
        }

        sortedAndFiltered.forEach(t => {
          let group
          if (this.storeTrialListMode === TRIAL_LIST_TABBED && t.group && t.group.name) {
            group = t.group.name
          } else {
            group = UNCATEGORIZED_TRIALS
          }

          if (!result[group]) {
            result[group] = {
              trials: []
            }
          }

          result[group].trials.push(t)
          result[group].hasRemoteUpdate ||= t.hasRemoteUpdate
          result[group].hasExpiryWarning ||= t.showExpiryWarning
        })

        Object.keys(result).forEach(k => {
          if (result[k].trials.length < 1) {
            delete result[k]
          }
        })

        return result
      } else {
        const result = {}
        result[UNCATEGORIZED_TRIALS] = {
          trials: [],
          hasRemoteUpdate: false,
          hasExpiryWarning: false
        }
        return result
      }
    }
  },
  watch: {
    multiSelectEnabled: function (newValue) {
      this.selectedTrialsToEdit = []
    },
    trialListMode: function (newValue) {
      this.selectedTrialsToEdit = []
      this.$store.dispatch('setTrialListMode', newValue)
    },
    trialListArrangement: function (newValue) {
      this.selectedTrialsToEdit = []
      this.$store.dispatch('setTrialListArrangement', newValue)
    },
    sortedTrials: function () {
      if (this.storeTrialListMode === TRIAL_LIST_TABBED && this.storeSelectedTrial) {
        this.updateTabIndex()
      }
    }
  },
  methods: {
    onSelectTrialToEdit: function (trial, selected) {
      if (selected) {
        const alreadyIn = this.selectedTrialsToEdit.some(t => t.localId === trial.localId)

        if (!alreadyIn) {
          this.selectedTrialsToEdit.push(trial)
        }
      } else {
        this.selectedTrialsToEdit = this.selectedTrialsToEdit.filter(t => t.localId !== trial.localId)
      }
    },
    updateTabIndex: function () {
      let index = 0
      Object.keys(this.sortedTrials).forEach((g, i) => {
        if (this.sortedTrials[g].trials.find(t => t.localId === this.storeSelectedTrial)) {
          index = i
        }
      })

      this.$nextTick(() => { this.tabIndex = index })
    },
    handleTrialExpiration: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'trial-expiration'

      this.$nextTick(() => this.$refs.trialExpirationModal.show())
    },
    importData: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'import-data'

      this.$nextTick(() => this.$refs.trialDataImportModal.show())
    },
    showTrialEdit: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'edit-trial'

      this.$nextTick(() => this.$refs.trialModificationModal.show())
    },
    duplicateTrial: function (trial) {
      this.$router.push({ name: 'trial-duplication', params: { trialId: trial.localId } })
    },
    synchronize: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'sync'

      this.$nextTick(() => this.$refs.traitSyncModal.show())
    },
    showShareCodes: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'share'

      this.$nextTick(() => this.$refs.trialShareCodeModal.show())
    },
    loadTrial: function (trial) {
      this.$store.commit('ON_SELECTED_TRIAL_CHANGED', trial.localId)
      this.$router.push({ name: 'data-entry' })
    },
    addPerson: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'add-person'

      this.$nextTick(() => this.$refs.addPersonModal.show())
    },
    addTraits: function () {
      this.selectedTrial = null
      this.modalToShow = 'add-traits'

      this.$nextTick(() => this.$refs.addTraitsModal.show())
    },
    addTrait: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'add-traits'

      this.$nextTick(() => this.$refs.addTraitsModal.show())
    },
    addGermplasm: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'add-germplasm'

      this.$nextTick(() => this.$refs.addGermplasmModal.show())
    },
    deleteTrialConfirmed: function () {
      this.$store.commit('ON_SELECTED_TRIAL_CHANGED', null)
      deleteTrial(this.selectedTrial.localId).then(() => {
        this.update()
      })

      emitter.emit('plausible-event', { key: 'trial-deleted' })
    },
    deleteTrialsConfirmed: function () {
      this.$store.commit('ON_SELECTED_TRIAL_CHANGED', null)

      Promise.all(this.selectedTrialsToEdit.map(t => deleteTrial(t.localId)))
        .then(() => this.update())
    },
    deleteTrials: function () {
      if (this.selectedTrialsToEdit && this.selectedTrialsToEdit.length > 0) {
        this.modalToShow = 'delete-trials'

        emitter.emit('show-confirm', {
          title: 'modalTitleDeleteTrials',
          message: 'modalTextDeleteTrials',
          okTitle: 'buttonYes',
          cancelTitle: 'buttonNo',
          okVariant: 'danger',
          callback: (result) => {
            if (result) {
              this.deleteTrialsConfirmed()
            }
          }
        })
      }
    },
    deleteTrial: function (trial) {
      this.selectedTrial = trial
      this.modalToShow = 'delete-trial'

      emitter.emit('show-confirm', {
        title: 'modalTitleDeleteTrial',
        message: 'modalTextDeleteTrial',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.deleteTrialConfirmed()
          }
        }
      })
    },
    update: function () {
      this.isLoading = true
      this.tabIndex = 0
      this.selectedTrialsToEdit = []
      this.multiSelectEnabled = false

      getTrialGroups().then(groups => {
        const result = [UNCATEGORIZED_TRIALS]

        this.trialGroups = result.concat(groups)
      })

      getTrials()
        .then(trials => {
          this.trials = trials
          if (this.selectedTrial) {
            this.selectedTrial = this.trials.find(t => t.localId === this.selectedTrial.localId)
          }

          return postCheckUpdate()
        })
        .then(result => {
          this.trialUpdates = result
        })
        .finally(() => {
          this.isLoading = false

          if (this.$route.query) {
            if (this.$route.query.synchronize) {
              const id = this.$route.query.synchronize

              getTrialById(id).then(trial => {
                if (trial) {
                  this.synchronize(trial)

                  this.$router.replace({ query: null })
                }
              })
            } else if (this.$route.query.addPerson) {
              const id = this.$route.query.addPerson

              getTrialById(id).then(trial => {
                if (trial) {
                  this.addPerson(trial)

                  this.$router.replace({ query: null })
                }
              })
            }
          }
        })
    }
  },
  mounted: function () {
    this.trialListMode = this.storeTrialListMode
    this.trialListArrangement = this.storeTrialListArrangement

    this.update()

    emitter.on('trial-properties-changed', this.update)
    emitter.on('trials-updated', this.update)
  },
  beforeUnmount: function () {
    emitter.off('trial-properties-changed', this.update)
    emitter.off('trials-updated', this.update)
  }
}
</script>

<style>
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
