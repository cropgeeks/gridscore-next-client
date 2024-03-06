<template>
  <div v-if="trials && trials.length > 0">
    <h2 class="d-flex justify-content-between">
      <span>{{ $t('widgetTrialSelectorTitle') }}</span>
      <div>
        <b-button-group class="mr-2">
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorArrangementGrid')" :pressed="trialListArrangement === TRIAL_LIST_GRID" @click="trialListArrangement = TRIAL_LIST_GRID"><BIconGrid /></b-button>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorArrangementList')" :pressed="trialListArrangement === TRIAL_LIST_LIST" @click="trialListArrangement = TRIAL_LIST_LIST"><BIconViewStacked /></b-button>
        </b-button-group>
        <b-button-group>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorTabsNone')" :pressed="trialListMode === TRIAL_LIST_ALL" @click="trialListMode = TRIAL_LIST_ALL"><BIconListTask /></b-button>
          <b-button size="sm" variant="outline-secondary" v-b-tooltip="$t('tooltipTrialSelectorTabsGroups')" :pressed="trialListMode === TRIAL_LIST_TABBED" @click="trialListMode = TRIAL_LIST_TABBED"><BIconSegmentedNav /></b-button>
        </b-button-group>
      </div>
    </h2>
    <p>{{ $t('widgetTrialSelectorText') }}</p>

    <b-row>
      <b-col cols=12 md=6 lg=4>
        <b-form-group :label="$t('formLabelTrialSelectorSearch')" :description="$t('formDescriptionTrialSelectorSearch')" label-for="search-term">
          <b-input v-model="searchTerm" trim id="search-term" type="search" />
        </b-form-group>
      </b-col>
      <b-col cols=12 md=6 lg=4>
        <b-form-group :label="$t('formLabelTrialSelectorOrderBy')" :description="$t('formDescriptionTrialSelectorOrderBy')" label-for="orderBy">
          <b-form-select :options="sortOptions" v-model="sortOrder" id="orderBy" />
        </b-form-group>
      </b-col>
      <b-col cols=12 md=6 lg=4>
        <b-form-group :label="$t('formLabelTrialSelectorSortDescending')" :description="$t('formDescriptionTrialSelectorSortDescending')" label-for="order-asc">
          <b-button-group>
            <b-button variant="outline-secondary" @click="sortDescending = false" :pressed="sortDescending === false"><BIconSortDownAlt /> {{ $t('formCheckboxSortOrderAscending') }}</b-button>
            <b-button variant="outline-secondary" @click="sortDescending = true" :pressed="sortDescending === true"><BIconSortDown /> {{ $t('formCheckboxSortOrderDescending') }}</b-button>
          </b-button-group>
        </b-form-group>
      </b-col>
    </b-row>

    <b-card no-body>
      <b-tabs card v-model="tabIndex">
        <b-tab lazy v-for="(trialGroup, group) in sortedTrials" :key="`tab-${group}`">
          <template #title>
            <span>{{ group === UNCATEGORIZED_TRIALS ? $t(trialListMode === TRIAL_LIST_ALL ? 'tabTitleAllTrials' : 'tabTitleUncategorizedTrials', { count: $n((trialGroup.trials || []).length) }) : `${group} (${$n((trialGroup.trials || []).length)})` }}</span>
            <BIconCloudDownloadFill class="ml-2 text-warning" v-if="trialGroup.hasRemoteUpdate" />
            <BIconstack class="ml-2 text-danger" v-if="trialGroup.hasExpiryWarning">
              <BIconCalendar stacked />
              <BIconExclamationTriangleFill stacked :scale="0.6" shift-v="-1" />
            </BIconstack>
          </template>
          <template v-if="trialGroup.trials && trialGroup.trials.length > 0">
            <b-list-group v-if="storeTrialListArrangement === TRIAL_LIST_LIST">
              <TrialListGroupItem :trial="trial"
                                  v-for="trial in trialGroup.trials" :key="`trial-selector-${trial.localId}`"
                                  @loadTrial="loadTrial(trial)"
                                  @handleTrialExpiration="handleTrialExpiration(trial)"
                                  @showShareCodes="showShareCodes(trial)"
                                  @synchronize="synchronize(trial)"
                                  @duplicateTrial="duplicateTrial(trial)"
                                  @addTrait="addTrait(trial)"
                                  @showTrialEdit="showTrialEdit(trial)"
                                  @addGermplasm="addGermplasm(trial)"
                                  @importData="importData(trial)"
                                  @deleteTrial="deleteTrial(trial)"/>
            </b-list-group>
            <b-row v-else>
              <b-col cols=12 sm=6 md=4 lg=3 v-for="trial in trialGroup.trials" :key="`trial-selector-${trial.localId}`" class="mb-3">
                <TrialCard :trial="trial"
                          @loadTrial="loadTrial(trial)"
                          @handleTrialExpiration="handleTrialExpiration(trial)"
                          @showShareCodes="showShareCodes(trial)"
                          @synchronize="synchronize(trial)"
                          @duplicateTrial="duplicateTrial(trial)"
                          @addTrait="addTrait(trial)"
                          @showTrialEdit="showTrialEdit(trial)"
                          @addGermplasm="addGermplasm(trial)"
                          @importData="importData(trial)"
                          @deleteTrial="deleteTrial(trial)"/>
              </b-col>
            </b-row>
          </template>
          <p class="text-warning" v-else>{{ $t('widgetTrialSelectorNoMatchFound') }}</p>
        </b-tab>
        <!-- Refresh button (Using tabs-end slot) -->
        <template #tabs-end>
          <b-nav-item role="presentation" class="ml-auto" @click.prevent="update" v-b-tooltip="$t('tooltipTrialSelectorRefresh')" href="#"><BIconArrowClockwise /></b-nav-item>
        </template>
      </b-tabs>
    </b-card>

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />
    <TrialShareCodeModal :trial="selectedTrial" ref="trialShareCodeModal" v-if="selectedTrial" />
    <AddTraitsModal :trial="selectedTrial" ref="addTraitsModal" v-if="selectedTrial && selectedTrial.editable" />
    <AddGermplasmModal :trialId="selectedTrial.localId" ref="addGermplasmModal" v-if="selectedTrial && selectedTrial.editable && selectedTrial.layout.columns === 1" />
    <TrialSynchronizationModal :trial="selectedTrial" ref="traitSyncModal" v-if="selectedTrial && (selectedTrial.transactionCount > 0 || selectedTrial.hasRemoteUpdate)" />
    <TrialDataImportModal :trial="selectedTrial" ref="trialDataImportModal" v-if="selectedTrial" />
    <TrialModificationModal :trial="selectedTrial" ref="trialModificationModal" v-if="selectedTrial" />
    <TrialExpirationModal :trial="selectedTrial" ref="trialExpirationModal" v-if="selectedTrial" />
  </div>
</template>

<script>
import TrialCard from '@/components/TrialCard'
import TrialListGroupItem from '@/components/TrialListGroupItem'
import TrialCommentModal from '@/components/modals/TrialCommentModal'
import TrialShareCodeModal from '@/components/modals/TrialShareCodeModal'
import AddTraitsModal from '@/components/modals/AddTraitsModal'
import TrialModificationModal from '@/components/modals/TrialModificationModal'
import TrialExpirationModal from '@/components/modals/TrialExpirationModal'
import TrialDataImportModal from '@/components/modals/TrialDataImportModal'
import AddGermplasmModal from '@/components/modals/AddGermplasmModal'
import TrialSynchronizationModal from '@/components/modals/TrialSynchronizationModal'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER, TRIAL_LIST_ALL, TRIAL_LIST_TABBED, TRIAL_LIST_GRID, TRIAL_LIST_LIST } from '@/plugins/constants'
import { mapGetters } from 'vuex'
import { deleteTrial, getTrialById, getTrialGroups, getTrials } from '@/plugins/idb'
import { BIconListTask, BIconSegmentedNav, BIconGrid, BIconViewStacked, BIconCloudDownloadFill, BIconArrowClockwise, BIconstack, BIconSortDown, BIconSortDownAlt, BIconCalendar, BIconExclamationTriangleFill } from 'bootstrap-vue'
import { postCheckUpdate } from '@/plugins/api'

const UNCATEGORIZED_TRIALS = '__UNCATEGORIZED__'

const emitter = require('tiny-emitter/instance')

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
    BIconSortDown,
    BIconSortDownAlt,
    BIconListTask,
    BIconSegmentedNav,
    BIconArrowClockwise,
    BIconGrid,
    BIconCloudDownloadFill,
    BIconViewStacked,
    BIconstack,
    BIconCalendar,
    BIconExclamationTriangleFill
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
      trials: [],
      tabIndex: 0,
      selectedTrial: null,
      trialUpdates: null,
      searchTerm: null,
      trialListMode: TRIAL_LIST_ALL,
      trialListArrangement: TRIAL_LIST_GRID,
      trialGroups: [UNCATEGORIZED_TRIALS],
      sortOrder: 'latestUpdate',
      sortDescending: true,
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
    trialListMode: function (newValue) {
      this.$store.dispatch('setTrialListMode', newValue)
    },
    trialListArrangement: function (newValue) {
      this.$store.dispatch('setTrialListArrangement', newValue)
    },
    sortedTrials: function () {
      if (this.storeTrialListMode === TRIAL_LIST_TABBED && this.storeSelectedTrial) {
        this.updateTabIndex()
      }
    }
  },
  methods: {
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

      this.$nextTick(() => this.$refs.trialExpirationModal.show())
    },
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
    update: function () {
      this.tabIndex = 0

      getTrialGroups().then(groups => {
        const result = [UNCATEGORIZED_TRIALS]

        this.trialGroups = result.concat(groups)
      })

      emitter.emit('show-loading', true)

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
          if (this.$route.query && this.$route.query.synchronize) {
            const id = this.$route.query.synchronize

            getTrialById(id).then(trial => {
              if (trial) {
                this.synchronize(trial)

                this.$router.replace({ query: null })
              }
            })
          }
          emitter.emit('show-loading', false)
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
  beforeDestroy: function () {
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
