<template>
  <b-container fluid class="py-3 h-100 d-flex flex-column justify-content-between align-items-start" v-if="trial">
    <div>
      <b-card-title class="trial-name">{{ trial.name }}</b-card-title>
      <b-card-sub-title class="trial-description mb-3" v-if="trial.description" :title="trial.description">{{ trial.description }}</b-card-sub-title>
    </div>
    <div class="text-center">
      <b-row>
        <b-col cols=6 class="mb-3">
          <TrialShareTypeIcon iconTag="h5" iconClass="mb-0" :shareStatus="trial.shareStatus" :isTextCode="false" />
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconCollection /></h5>
          <span>{{ trial.group ? trial.group.name : $t('widgetTrialSelectorGroupUnassigned') }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconChatLeftText /></h5>
          <a href="#" @click.prevent="onShowTrialCommentsClicked" v-if="showComments">{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</a>
          <span v-else>{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconFlag /></h5>
          <a href="#" @click.prevent="onShowTrialEventsClicked" v-if="showEvents">{{ $tc('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0) }}</a>
          <span v-else>{{ $tc('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconLayoutThreeColumns rotate="90" /></h5>
          <span>{{ $tc('widgetTrialSelectorRows', trial.layout.rows) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconLayoutThreeColumns /></h5>
          <span>{{ $tc('widgetTrialSelectorColumns', trial.layout.columns) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><BIconTags /></h5>
          <span>{{ $tc('widgetTrialSelectorTraits', trial.traits.length) }}</span>
          <span class="d-block" v-if="hasTimeframe">(<BIconCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
        </b-col>
        <b-col cols=6 class="mb-3" v-if="trial.updatedOn">
          <h5 class="mb-0"><BIconCalendarDate /></h5>
          <span>{{ new Date(trial.updatedOn).toLocaleString() }}</span>
        </b-col>
      </b-row>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-container>
</template>

<script>
import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon'
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal'
import { BIconLayoutThreeColumns, BIconCalendarRange, BIconCollection, BIconTags, BIconFlag, BIconCalendarDate, BIconChatLeftText } from 'bootstrap-vue'
import { TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconLayoutThreeColumns,
    BIconCollection,
    BIconTags,
    BIconCalendarRange,
    BIconFlag,
    BIconCalendarDate,
    BIconChatLeftText,
    TrialShareTypeIcon,
    TrialTraitTimeframeModal
  },
  props: {
    trial: {
      type: Object,
      default: null
    },
    showComments: {
      type: Boolean,
      default: true
    },
    showEvents: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED
    }
  },
  computed: {
    hasTimeframe: function () {
      if (this.trial && this.trial.traits) {
        return this.trial.traits.filter(t => t.timeframe).length > 0
      } else {
        return false
      }
    }
  },
  methods: {
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
</style>
