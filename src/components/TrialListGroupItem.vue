<template>
  <b-list-group-item :class="{ 'horizontal-cards': true, 'bg-dark': trial.localId === storeSelectedTrial && storeDarkMode, 'bg-light': trial.localId === storeSelectedTrial && !storeDarkMode }" v-if="trial">
    <div class="content">
      <div class="d-flex w-100 justify-content-between">
        <h4 class="mb-1 trial-name">{{ trial.name }}</h4>
        <div>
          <small v-if="trial.updatedOn" :class="{ 'me-4': trial.transactionCount > 0 || trial.hasRemoteUpdate }" v-b-tooltip="new Date(trial.updatedOn).toLocaleString()"><IBiCalendarDate /> {{ formatTimeAgo(trial.updatedOn) }}</small>
        </div>
      </div>

      <a href="#" @click.prevent="$emit('synchronize')" v-if="trial.transactionCount > 0 || trial.hasRemoteUpdate">
        <template v-if="trial.transactionCount > 0">
          <div class="card-corner card-corner-local" v-b-tooltip.hover="$t('tooltipTrialHasTransactions')" />
          <IBiCloudUploadFill class="card-corner-icon" />
        </template>
        <template v-else-if="trial.hasRemoteUpdate">
          <div class="card-corner card-corner-remote" v-b-tooltip.hover="$t('tooltipTrialHasRemoteUpdate')" />
          <IBiCloudDownloadFill class="card-corner-icon" />
        </template>
      </a>

      <h6 :title="trial.description" @click="trialDescriptionExpanded = !trialDescriptionExpanded" :class="trialDescriptionExpanded ? '' : 'trial-description'" v-if="trial.description">{{ trial.description }}</h6>

      <div><TrialShareTypeIcon iconClass="me-1" iconTag="span" :shareStatus="trial.shareStatus" :isTextCode="false" @on-share-clicked="$emit('showShareCodes')" /></div>

      <div class="d-flex flex-wrap flex-row my-2">
        <div class="me-3" v-b-tooltip.hover="trial.group ? trial.group.name : $t('widgetTrialSelectorGroupUnassigned')"><IBiCollection /></div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorRows', trial.layout.rows)"><IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> {{ trial.layout.rows }}</div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorColumns', trial.layout.columns)"><IBiLayoutThreeColumns /> {{ trial.layout.columns }}</div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorTraits', trial.traits.length)"><IBiTags /> <span>{{ trial.traits.length }}</span>
          <span class="d-block" v-if="hasTimeframe">(<IBiCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
        </div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorPeople', (trial.people || []).length)"><IBiPerson /> {{ (trial.people || []).length }}</div>

        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0)">
          <IBiChatLeftText /> <a href="#" @click.prevent="onShowTrialCommentsClicked">{{ trial.comments ? trial.comments.length : 0 }}</a>
        </div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0)">
          <IBiFlag /> <a href="#" @click.prevent="onShowTrialEventsClicked">{{ trial.events ? trial.events.length : 0 }}</a>
        </div>
        <div class="me-3" v-b-tooltip.hover="$t('widgetTrialSelectorTrialDuration', trialDuration)"><IBiCalendarRange /> {{ trialDuration }}</div>
      </div>
    </div>

    <div class="card-footer d-flex justify-content-between">
      <b-button @click="$emit('loadTrial')" variant="primary"><IBiJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>

      <b-button-group>
        <b-button v-if="trial.remoteUrl" class="button-disabled" variant="info" v-b-tooltip.hover="trial.remoteUrl">
          <IBiCloudPlusFill /> {{ $t('buttonTrialRemoteUrl') }}
        </b-button>
        <b-button @click="$emit('handleTrialExpiration')" v-if="trial.showExpiryWarning === true" variant="danger" v-b-tooltip.hover="$t('tooltipTrialSelectorTrialExpiryWarning', { date: new Date(trial.expiresOn).toLocaleDateString() })">
          <IBiCalendarXFill /> {{ $t('widgetTrialSelectorTrialExpiryWarning') }}
        </b-button>
      </b-button-group>

      <b-button-group>
        <b-button v-if="selectable" :variant="selectedToEdit ? 'info' : 'secondary'" @click="selectedToEdit = !selectedToEdit">
          <IBiCheckSquare v-if="selectedToEdit" /><IBiSquare v-else /> {{ selectedToEdit ? $t('buttonDeselect') : $t('buttonSelect') }}
        </b-button>
        <b-dropdown v-else right :disabled="selectable">
          <template #button-content>
            <IBiGear />
          </template>
          <b-dropdown-item @click="$emit('showShareCodes')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonShare') }}</b-dropdown-item>
          <b-dropdown-item @click="$emit('synchronize')" v-if="trial.editable && (trial.transactionCount > 0 || trial.hasRemoteUpdate)"><IBiArrowDownUp /> {{ $t('buttonSynchronize') }}</b-dropdown-item>
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
      </b-button-group>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-list-group-item>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER } from '@/plugins/constants'
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal.vue'
import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon.vue'
import { formatTimeAgo, toLocalDateString } from '@/plugins/misc'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    TrialTraitTimeframeModal,
    TrialShareTypeIcon
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    selectable: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER,
      trialDescriptionExpanded: false,
      selectedToEdit: false
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
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial',
      'storeDarkMode'
    ]),
    trialDuration: function () {
      if (this.trial && this.trial.createdOn && this.trial.updatedOn) {
        const start = toLocalDateString(this.trial.createdOn)
        const end = toLocalDateString(this.trial.updatedOn)

        return (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000) + 1
      } else {
        return 1
      }
    },
    hasTimeframe: function () {
      if (this.trial && this.trial.traits) {
        return this.trial.traits.filter(t => t.timeframe).length > 0
      } else {
        return false
      }
    }
  },
  methods: {
    formatTimeAgo,
    onShowTrialCommentsClicked: function () {
      emitter.emit('show-trial-comments', this.trial)
    },
    onShowTrialEventsClicked: function () {
      emitter.emit('show-trial-events', this.trial)
    }
  }
}
</script>

<style scoped>
.trial-name,
.trial-description {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
  word-break: break-word;
}

.trial-name {
  line-clamp: 2;
  -webkit-line-clamp: 2;
}
.trial-description {
  line-clamp: 1;
  -webkit-line-clamp: 1;
}

.horizontal-cards {
  padding: 0;
}
.horizontal-cards .content {
  padding: 0.75rem 1.25rem
}
</style>
