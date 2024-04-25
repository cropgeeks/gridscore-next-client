<template>
  <b-list-group-item :class="{ 'horizontal-cards': true, 'border-primary': trial.localId === storeSelectedTrial }" v-if="trial">
    <div :class="{ 'content': true, 'bg-light': trial.localId === storeSelectedTrial }">
      <div class="d-flex w-100 justify-content-between">
        <h4 class="mb-1 trial-name">{{ trial.name }}</h4>
        <small v-if="trial.updatedOn" :class="{ 'mr-4': trial.transactionCount > 0 || trial.hasRemoteUpdate }" v-b-tooltip="new Date(trial.updatedOn).toLocaleString()"><BIconCalendarDate /> {{ formatTimeAgo(trial.updatedOn) }}</small>
      </div>

      <a href="#" @click.prevent="$emit('synchronize')" v-if="trial.transactionCount > 0 || trial.hasRemoteUpdate">
        <template v-if="trial.transactionCount > 0">
          <div class="card-corner card-corner-local" v-b-tooltip.hover="$t('tooltipTrialHasTransactions')" />
          <BIconCloudUploadFill class="card-corner-icon" />
        </template>
        <template v-else-if="trial.hasRemoteUpdate">
          <div class="card-corner card-corner-remote" v-b-tooltip.hover="$t('tooltipTrialHasRemoteUpdate')" />
          <BIconCloudDownloadFill class="card-corner-icon" />
        </template>
      </a>

      <h6 :title="trial.description" @click="trialDescriptionExpanded = !trialDescriptionExpanded" :class="trialDescriptionExpanded ? '' : 'trial-description'" v-if="trial.description">{{ trial.description }}</h6>

      <div><TrialShareTypeIcon iconTag="span" :shareStatus="trial.shareStatus" :isTextCode="false" @on-share-clicked="$emit('showShareCodes')" /></div>

      <div class="d-flex flex-wrap flex-row my-2">
        <div class="mr-3" v-b-tooltip.hover="trial.group ? trial.group.name : $t('widgetTrialSelectorGroupUnassigned')"><BIconCollection /></div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorRows', trial.layout.rows)"><BIconLayoutThreeColumns rotate="90" /> {{ trial.layout.rows }}</div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorColumns', trial.layout.columns)"><BIconLayoutThreeColumns /> {{ trial.layout.columns }}</div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorTraits', trial.traits.length)"><BIconTags /> <span>{{ trial.traits.length }}</span>
          <span class="d-block" v-if="hasTimeframe">(<BIconCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
        </div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorPeople', (trial.people || []).length)"><BIconPerson /> {{ (trial.people || []).length }}</div>

        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0)">
          <BIconChatLeftText /> <a href="#" @click.prevent="onShowTrialCommentsClicked">{{ trial.comments ? trial.comments.length : 0 }}</a>
        </div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0)">
          <BIconFlag /> <a href="#" @click.prevent="onShowTrialEventsClicked">{{ trial.events ? trial.events.length : 0 }}</a>
        </div>
        <div class="mr-3" v-b-tooltip.hover="$tc('widgetTrialSelectorTrialDuration', trialDuration)"><BIconCalendarRange /> {{ trialDuration }}</div>
      </div>
    </div>

    <div class="card-footer d-flex justify-content-between">
      <b-button @click="$emit('loadTrial')" variant="primary"><BIconJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>

      <b-button @click="$emit('handleTrialExpiration')" v-if="trial.showExpiryWarning === true" variant="danger" v-b-tooltip.hover="$t('tooltipTrialSelectorTrialExpiryWarning', { date: new Date(trial.expiresOn).toLocaleDateString() })">
        <BIconstack>
          <BIconCalendar stacked />
          <BIconExclamationTriangleFill stacked :scale="0.6" shift-v="-1" />
        </BIconstack> {{ $t('widgetTrialSelectorTrialExpiryWarning') }}
      </b-button>

      <b-dropdown right>
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
        <b-dropdown-item @click="$emit('addPerson')" v-if="trial.editable"><BIconPersonPlus /> {{ $t('buttonAddPerson') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('addGermplasm')" v-if="trial.editable && trial.layout.columns === 1"><BIconNodePlus :rotate="90" /> {{ $t('buttonAddGermplasm') }}</b-dropdown-item>
        <b-dropdown-item @click="$emit('importData')" v-if="trial.editable"><BIconFileEarmarkArrowUp /> {{ $t('buttonUploadData') }}</b-dropdown-item>
        <b-dropdown-divider />
        <b-dropdown-item variant="danger" @click="$emit('deleteTrial')"><BIconTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
      </b-dropdown>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-list-group-item>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconCalendarDate, BIconJournalArrowUp, BIconGear, BIconCloud, BIconFlag, BIconPersonPlus, BIconPerson, BIconCalendarRange, BIconExclamationTriangleFill, BIconCloudUploadFill, BIconCloudDownloadFill, BIconArrowDownUp, BIconstack, BIconJournals, BIconPencilSquare, BIconTags, BIconNodePlus, BIconFileEarmarkArrowUp, BIconTrash, BIconCollection, BIconLayoutThreeColumns, BIconChatLeftText } from 'bootstrap-vue'
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_OWNER } from '@/plugins/constants'
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal'
import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon'
import { formatTimeAgo, toLocalDateString } from '@/plugins/misc'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TrialTraitTimeframeModal,
    TrialShareTypeIcon,
    BIconCalendarDate,
    BIconFlag,
    BIconJournalArrowUp,
    BIconPerson,
    BIconGear,
    BIconCloud,
    BIconExclamationTriangleFill,
    BIconPersonPlus,
    BIconArrowDownUp,
    BIconstack,
    BIconJournals,
    BIconPencilSquare,
    BIconCloudUploadFill,
    BIconCloudDownloadFill,
    BIconTags,
    BIconNodePlus,
    BIconFileEarmarkArrowUp,
    BIconTrash,
    BIconCollection,
    BIconLayoutThreeColumns,
    BIconCalendarRange,
    BIconChatLeftText
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_OWNER,
      trialDescriptionExpanded: false
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
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
