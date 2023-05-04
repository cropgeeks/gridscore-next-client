<template>
  <b-card-body class="d-flex flex-column justify-content-between align-items-start" v-if="trial">
    <div>
      <b-card-title class="trial-name">{{ `${trial.name}` }}</b-card-title>
      <b-card-sub-title class="trial-description mb-3" v-if="trial.description" :title="trial.description">{{ trial.description }}</b-card-sub-title>
    </div>
    <div>
      <b-card-text><BIconLayoutThreeColumns rotate="90" /> {{ $tc('widgetTrialSelectorRows', trial.layout.rows) }}</b-card-text>
      <b-card-text><BIconLayoutThreeColumns /> {{ $tc('widgetTrialSelectorColumns', trial.layout.columns) }}</b-card-text>
      <b-card-text><BIconTags />&nbsp;
        <span>{{ $tc('widgetTrialSelectorTraits', trial.traits.length) }}</span>
        <span class="ml-2" v-if="hasTimeframe">(<BIconCalendarRange /> <a href="#" @click.prevent="$refs.trialTraitTimeframeModal.show()">{{ $t('widgetTrialSelectorTraitTimeframe') }}</a>)</span>
      </b-card-text>
      <b-card-text>
        <BIconChatLeftText />&nbsp;
        <a href="#" @click.prevent="onShowTrialCommentsClicked" v-if="showComments">{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</a>
        <span v-else>{{ $tc('widgetTrialSelectorComments', trial.comments ? trial.comments.length : 0) }}</span>
      </b-card-text>
      <b-card-text v-if="trial.updatedOn"><BIconCalendarDate /> {{ new Date(trial.updatedOn).toLocaleString() }}</b-card-text>
    </div>

    <TrialTraitTimeframeModal :trial="trial" ref="trialTraitTimeframeModal" v-if="hasTimeframe" />
  </b-card-body>
</template>

<script>
import TrialTraitTimeframeModal from '@/components/modals/TrialTraitTimeframeModal'
import { BIconLayoutThreeColumns, BIconCalendarRange, BIconTags, BIconCalendarDate, BIconChatLeftText } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconLayoutThreeColumns,
    BIconTags,
    BIconCalendarRange,
    BIconCalendarDate,
    BIconChatLeftText,
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
.trial-name {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
  max-width: 100%;
}
.trial-description {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  overflow: hidden;
  max-width: 100%;
}
</style>
