<template>
  <b-card-body class="d-flex flex-column justify-content-between align-items-start" v-if="trial">
    <div>
      <b-card-title class="trial-name">{{ trial.name }}</b-card-title>
      <b-card-sub-title class="trial-description mb-3" v-if="trial.description" :title="trial.description">{{ trial.description }}</b-card-sub-title>
    </div>
    <div>
      <b-card-text v-if="trial.shareStatus !== TRIAL_STATE_NOT_SHARED"> <TrialShareTypeIcon iconTag="span" :shareStatus="trial.shareStatus" :isTextCode="false" /></b-card-text>
      <b-card-text><BIconCollection /> {{ trial.group ? trial.group.name : $t('widgetTrialSelectorGroupUnassigned') }}</b-card-text>
      <b-card-text><BIconLayoutThreeColumns rotate="90" /> {{ $tc('widgetTrialSelectorRows', trial.layout.rows) }}</b-card-text>
      <b-card-text><BIconLayoutThreeColumns /> {{ $tc('widgetTrialSelectorColumns', trial.layout.columns) }}</b-card-text>
      <b-card-text><BIconTags /> <span>{{ $tc('widgetTrialSelectorTraits', trial.traits.length) }}</span>
        <span class="d-block" v-if="hasTimeframe">(<BIconCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
      </b-card-text>
      <b-card-text>
        <BIconChatLeftText /> <a href="#" @click.prevent="onShowTrialCommentsClicked" v-if="showComments">{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</a>
        <span v-else>{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</span>
      </b-card-text>
      <b-card-text v-if="trial.updatedOn"><BIconCalendarDate /> {{ new Date(trial.updatedOn).toLocaleString() }}</b-card-text>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-card-body>
</template>

<script>
import TrialShareTypeIcon from '@/components/icons/TrialShareTypeIcon'
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal'
import { BIconLayoutThreeColumns, BIconCalendarRange, BIconCollection, BIconTags, BIconCalendarDate, BIconChatLeftText } from 'bootstrap-vue'
import { TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconLayoutThreeColumns,
    BIconCollection,
    BIconTags,
    BIconCalendarRange,
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
