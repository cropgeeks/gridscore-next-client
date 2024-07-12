<template>
  <b-modal :title="$t('modalTitleTrialEvent')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           @hidden="$emit('hidden')"
           size="lg"
           ref="trialEventModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialEvent') }}</p>

      <div v-if="totalCount > 0">
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
        <b-list-group>
          <b-list-group-item class="flex-column align-items-start" v-for="event in visibleEvents" :key="`trial-event-${event.timestamp}`">
            <div class="d-flex w-100 mb-3 justify-content-between align-items-center">
              <h5><IBiCalendarDate /> {{ new Date(event.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" @click="deleteEvent(event)" v-if="trial.editable"><IBiTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <b-row>
              <b-col cols=12 md=6 class="mb-3">
                <h6>{{ $t('formLabelEventImpact') }}</h6>
                <div>
                  <IBiCircleFill class="me-1" v-for="filled of event.impact" :key="`filled-${filled}`" />
                  <IBiDot class="me-1" v-for="empty of (5 - event.impact)" :key="`empty-${empty}`" />
                </div>
              </b-col>
              <b-col cols=12 md=6 class="mb-3">
                <h6>{{ $t('formLabelEventType') }}</h6>
                <div v-if="event.type === TRIAL_EVENT_TYPE_WEATHER"><IBiCloudSun /> {{ $t('formSelectOptionEventTypeWeather') }}</div>
                <div v-else-if="event.type === TRIAL_EVENT_TYPE_MANAGEMENT"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="1em" height="1em"><path
      d="M 3,2 V 9.26 C 1.2,9.9 0,11.6 0,13.5 0,16 2,18 4.5,18 6.79,18 8.71,16.28 8.97,14 h 4.2 C 13.06,14.32 13,14.66 13,15 a 3,3 0 0 0 3,3 3,3 0 0 0 3,-3 c 0,-0.34 -0.06,-0.68 -0.18,-1 H 20 V 11 C 20,9.89 19.11,9 18,9 H 13.04 L 11.65,2 H 3 m 2,2 h 5 l 1,5 v 3 H 8.74 C 8.16,10.38 6.71,9.23 5,9.03 V 4 M 4.5,11.25 A 2.25,2.25 0 0 1 6.75,13.5 2.25,2.25 0 0 1 4.5,15.75 2.25,2.25 0 0 1 2.25,13.5 2.25,2.25 0 0 1 4.5,11.25 M 16,13.5 A 1.5,1.5 0 0 1 17.5,15 1.5,1.5 0 0 1 16,16.5 1.5,1.5 0 0 1 14.5,15 1.5,1.5 0 0 1 16,13.5 Z" /></svg> {{ $t('formSelectOptionEventTypeManagement') }}</div>
                <div v-else-if="event.type === TRIAL_EVENT_TYPE_OTHER"><IBiThreeDots /> {{ $t('formSelectOptionEventTypeOther') }}</div>
              </b-col>
            </b-row>

            <div>
              <h6>{{ $t('formLabelEventContent') }}</h6>
              <p class="mb-1">{{ event.content }}</p>
            </div>
          </b-list-group-item>
        </b-list-group>
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <p v-else class="text-warning">{{ $t('modalTextTrialEventNoData') }}</p>

      <b-button class="mt-2" @click="eventFormVisible = !eventFormVisible" v-if="trial.editable"><IBiChatRightQuoteFill /> {{ $t('buttonCreateEvent') }}</b-button>

      <b-collapse v-model="eventFormVisible" class="mt-2" @shown="$refs.input.focus()">
        <b-form-group :label="$t('formLabelEventType')" :description="$t('formDescriptionEventType')">
          <b-button-group class="d-flex flex-row flex-wrap">
            <b-button :pressed="newEventType === TRIAL_EVENT_TYPE_WEATHER" @click="newEventType = TRIAL_EVENT_TYPE_WEATHER"><IBiCloudSun /> {{ $t('formSelectOptionEventTypeWeather') }}</b-button>
            <b-button :pressed="newEventType === TRIAL_EVENT_TYPE_MANAGEMENT" @click="newEventType = TRIAL_EVENT_TYPE_MANAGEMENT"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="1em" height="1em"><path
      d="M 3,2 V 9.26 C 1.2,9.9 0,11.6 0,13.5 0,16 2,18 4.5,18 6.79,18 8.71,16.28 8.97,14 h 4.2 C 13.06,14.32 13,14.66 13,15 a 3,3 0 0 0 3,3 3,3 0 0 0 3,-3 c 0,-0.34 -0.06,-0.68 -0.18,-1 H 20 V 11 C 20,9.89 19.11,9 18,9 H 13.04 L 11.65,2 H 3 m 2,2 h 5 l 1,5 v 3 H 8.74 C 8.16,10.38 6.71,9.23 5,9.03 V 4 M 4.5,11.25 A 2.25,2.25 0 0 1 6.75,13.5 2.25,2.25 0 0 1 4.5,15.75 2.25,2.25 0 0 1 2.25,13.5 2.25,2.25 0 0 1 4.5,11.25 M 16,13.5 A 1.5,1.5 0 0 1 17.5,15 1.5,1.5 0 0 1 16,16.5 1.5,1.5 0 0 1 14.5,15 1.5,1.5 0 0 1 16,13.5 Z" /></svg> {{ $t('formSelectOptionEventTypeManagement') }}</b-button>
            <b-button :pressed="newEventType === TRIAL_EVENT_TYPE_OTHER" @click="newEventType = TRIAL_EVENT_TYPE_OTHER"><IBiThreeDots /> {{ $t('formSelectOptionEventTypeOther') }}</b-button>
          </b-button-group>
        </b-form-group>

        <b-row>
          <b-col cols=6>
            <b-form-group :label="$t('formLabelEventImpact')" :description="$t('formDescriptionEventImpact')" label-for="event-impact">
              <b-input-group :append="newEventImpact">
                <b-form-input type="range" class="form-control" :min="1" :max="5" v-model.number="newEventImpact" id="event-impact" />
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col cols=6>
            <b-form-group :label="$t('formLabelEventDate')" :description="$t('formDescriptionEventDate')" label-for="event-date">
              <b-form-input type="date" id="event-date" v-model="newEventDate" />
            </b-form-group>
          </b-col>
        </b-row>

        <b-form-group :label="$t('formLabelEventContent')" :description="$t('formDescriptionEventContent')" label-for="event-content">
          <SpeechRecognitionTextarea id="event-content" :rows="5" :tooltip="$t('tooltipDataEntryCommentMicrophone')" ref="input" @content-changed="updateEvent" />
        </b-form-group>

        <b-button :disabled="!newEventContent || (newEventContent === '')" variant="primary" @click="createEvent"><IBiPlusSquare /> {{ $t('buttonAdd') }}</b-button>
      </b-collapse>
    </div>
  </b-modal>
</template>

<script>
import SpeechRecognitionTextarea from '@/components/SpeechRecognitionTextarea.vue'
import { getTrialById, deleteTrialEvent, addTrialEvent } from '@/plugins/idb'
import { TRIAL_EVENT_TYPE_MANAGEMENT, TRIAL_EVENT_TYPE_WEATHER, TRIAL_EVENT_TYPE_OTHER } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'
import { toLocalDateString } from '@/plugins/misc'

export default {
  components: {
    SpeechRecognitionTextarea
  },
  props: {
    trialId: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      page: 1,
      perPage: 5,
      trial: null,
      newEventContent: null,
      newEventType: TRIAL_EVENT_TYPE_OTHER,
      newEventImpact: 3,
      newEventDate: toLocalDateString(new Date()),
      eventFormVisible: false,
      TRIAL_EVENT_TYPE_MANAGEMENT,
      TRIAL_EVENT_TYPE_WEATHER,
      TRIAL_EVENT_TYPE_OTHER
    }
  },
  computed: {
    totalCount: function () {
      if (this.trial && this.trial.events) {
        return this.trial.events.length
      } else {
        return 0
      }
    },
    visibleEvents: function () {
      if (this.trial && this.trial.events) {
        return this.trial.events.slice((this.page - 1) * this.perPage, this.page * this.perPage)
      } else {
        return []
      }
    }
  },
  methods: {
    updateEvent: function (newValue) {
      this.newEventContent = newValue
    },
    update: function () {
      return getTrialById(this.trialId)
        .then(trial => {
          this.trial = trial
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.eventFormVisible = false
      this.update().then(() => this.$refs.trialEventModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.eventFormVisible = false
      this.$nextTick(() => this.$refs.trialEventModal.hide())
    },
    deleteEvent: function (event) {
      deleteTrialEvent(this.trial.localId, event)
        .then(() => {
          emitter.emit('trial-properties-changed', this.trial.localId)
          emitter.emit('plausible-event', { key: 'trial-event', props: { type: 'deleted' } })
          this.update()
        })
    },
    createEvent: function () {
      addTrialEvent(this.trial.localId, this.newEventContent, this.newEventType, this.newEventImpact, new Date(this.newEventDate))
        .then(() => {
          this.$refs.input.reset()
          this.newEventContent = null
          this.newEventType = TRIAL_EVENT_TYPE_OTHER
          this.newEventImpact = 3
          this.newEventDate = toLocalDateString(new Date())
          this.eventFormVisible = false
          emitter.emit('trial-properties-changed', this.trial.localId)
          emitter.emit('plausible-event', { key: 'trial-event', props: { type: 'added' } })
          this.update()
        })
    }
  }
}
</script>

<style scoped>
.rating-reset-height {
  height: unset;
}
</style>
