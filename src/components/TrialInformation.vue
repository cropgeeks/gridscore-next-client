<template>
  <b-container fluid class="py-3 h-100 d-flex flex-column justify-content-between align-items-start" v-if="trial">
    <div>
      <b-card-title class="trial-name">{{ trial.name }}</b-card-title>
      <b-card-subtitle @click="trialDescriptionExpanded = !trialDescriptionExpanded" :class="{ 'trial-description': !trialDescriptionExpanded, 'mb-3': true }" v-if="trial.description" :title="trial.description">{{ trial.description }}</b-card-subtitle>
    </div>
    <div class="text-center">
      <b-row>
        <b-col cols=6 class="mb-3">
          <TrialShareTypeIcon iconTag="h5" iconClass="mb-0" :shareStatus="trial.shareStatus" :isTextCode="false" @on-share-clicked="onShowTrialShareClicked" />
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiCollection /></h5>
          <span>{{ trial.group ? trial.group.name : $t('widgetTrialSelectorGroupUnassigned') }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /></h5>
          <span>{{ $t('widgetTrialSelectorRows', trial.layout.rows) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiLayoutThreeColumns /></h5>
          <span>{{ $t('widgetTrialSelectorColumns', trial.layout.columns) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiTags /></h5>
          <span>{{ $t('widgetTrialSelectorTraits', trial.traits.length) }}</span>
          <span class="d-block" v-if="hasTimeframe">(<IBiCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiPerson /></h5>
          <span>{{ $t('widgetTrialSelectorPeople', (trial.people || []).length) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiChatLeftText /></h5>
          <a href="#" @click.prevent="onShowTrialCommentsClicked" v-if="showComments">{{ $t('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</a>
          <span v-else>{{ $t('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3">
          <h5 class="mb-0"><IBiFlag /></h5>
          <a href="#" @click.prevent="onShowTrialEventsClicked" v-if="showEvents">{{ $t('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0) }}</a>
          <span v-else>{{ $t('widgetTrialSelectorEvents', trial.events ? trial.events.length : 0) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3" v-if="trial.updatedOn">
          <h5 class="mb-0"><IBiCalendarRange /></h5>
          <span>{{ $t('widgetTrialSelectorTrialDuration', trialDuration) }}</span>
        </b-col>
        <b-col cols=6 class="mb-3" v-if="trial.updatedOn">
          <h5 class="mb-0"><IBiCalendarDate /></h5>
          <span v-b-tooltip.bottom="new Date(trial.updatedOn).toLocaleString()">{{ formatTimeAgo(trial.updatedOn) }}</span>
        </b-col>
      </b-row>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-container>
</template>

<script>
import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon.vue'
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal.vue'
import { TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'
import { formatTimeAgo, toLocalDateString } from '@/plugins/misc'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
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
      TRIAL_STATE_NOT_SHARED,
      trialDescriptionExpanded: false
    }
  },
  computed: {
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
    },
    onShowTrialShareClicked: function () {
      emitter.emit('show-trial-share', this.trial)
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
