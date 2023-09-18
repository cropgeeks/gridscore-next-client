<template>
  <div>
    <DataInputModal :fullscreen="true"
                    :geolocation="geolocation"
                    :trial="trial"
                    @hidden="onHidden"
                    ref="dataInputModal"
                    v-model="show"
                    v-if="validConfig" />
    <b-container>
      <p>{{ $t('pageGuidedWalkInvalidConfig') }}</p>
    </b-container>
  </div>
</template>

<script>
import DataInputModal from '@/components/modals/DataInputModal'
import { mapGetters } from 'vuex'
import { getTrialById } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    DataInputModal
  },
  computed: {
    ...mapGetters([
      'storeGpsEnabled',
      'storeSelectedTrial'
    ]),
    validConfig: function () {
      return this.column !== null && this.row !== null && this.guidedWalkName && this.trial
    }
  },
  data: function () {
    return {
      geolocation: null,
      trial: null,
      guidedWalkName: null,
      row: null,
      column: null
    }
  },
  watch: {
    storeSelectedTrial: function () {
      this.loadTrial()
    },
    trial: function () {
      this.show = true

      this.$nextTick(() => {
        emitter.emit('force-guided-walk', {
          row: this.row,
          column: this.column,
          walkName: this.guidedWalkName
        })
      })
    }
  },
  methods: {
    onHidden: function () {
      this.$router.push({ name: 'data-entry' })
    },
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.startGeoTracking()
      })
    },
    startGeoTracking: function () {
      if (navigator.geolocation && this.storeGpsEnabled) {
        const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
        this.geolocationWatchId = navigator.geolocation.watchPosition(position => {
          if (position && position.coords) {
            this.geolocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              elv: position.coords.altitude,
              heading: position.coords.heading
            }
          }
        }, null, options)
      }
    },
    tts: function (text, interruptPrev = true) {
      if (this.textSynth) {
        if (interruptPrev) {
          this.textSynth.cancel()
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        // utterance.rate = 1.2
        this.textSynth.speak(utterance)
      }
    }
  },
  mounted: function () {
    const q = this.$route.query
    if (q) {
      if (q.guidedWalkName) {
        this.guidedWalkName = q.guidedWalkName
      }
      if (q.row !== undefined && q.row !== null) {
        this.row = q.row
      }
      if (q.column !== undefined && q.row !== null) {
        this.column = +q.column
      }
    }

    if (this.row !== null && this.column !== null && this.guidedWalkName) {
      if (this.storeSelectedTrial) {
        this.loadTrial()
      }

      if (this.storeVoiceFeedbackEnabled && window.speechSynthesis) {
        this.textSynth = window.speechSynthesis
      }

      emitter.on('tts', this.tts)
    }
  },
  beforeDestroy: function () {
    emitter.off('tts', this.tts)

    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
  }
}
</script>

<style>

</style>
