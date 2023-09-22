<template>
  <b-input-group>
    <b-form-textarea ref="textarea" :rows="rows" v-model="value" :id="id" />
    <b-input-group-addon append v-if="supportsSpeechRecognition">
      <b-button @click="toggleRecording" :variant="speechRecognition ? 'danger' : null" v-b-tooltip="tooltip"><BIconMic /></b-button>
    </b-input-group-addon>
  </b-input-group>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconMic } from 'bootstrap-vue'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconMic
  },
  props: {
    id: {
      type: String,
      default: 'id'
    },
    rows: {
      type: Number,
      default: 3
    },
    tooltip: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      value: null,
      speechRecognition: null
    }
  },
  watch: {
    value: function (newValue) {
      this.$emit('change', newValue)
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale'
    ]),
    supportsSpeechRecognition: function () {
      return SpeechRecognition !== undefined && SpeechRecognition !== null
    }
  },
  methods: {
    reset: function () {
      this.value = null
    },
    focus: function () {
      this.$refs.textarea.focus()
    },
    toggleRecording: function () {
      if (this.supportsSpeechRecognition) {
        if (this.speechRecognition) {
          this.disableSpeechRecognition()
        } else {
          // eslint-disable-next-line new-cap
          this.speechRecognition = new SpeechRecognition()
          this.speechRecognition.continuous = true
          this.speechRecognition.interimResults = true
          this.speechRecognition.lang = this.storeLocale ? this.storeLocale.replace('_', '-') : 'en-GB'

          this.speechRecognition.onresult = event => {
            let result = ''

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              result += event.results[i][0].transcript
            }
            this.value = result
          }
          this.speechRecognition.onspeechend = () => {
            if (this.speechRecognition) {
              this.speechRecognition.stop()
              this.speechRecognition = null
            }
          }
          this.speechRecognition.onerror = e => {
            console.error(e)
          }
          this.speechRecognition.start()
        }
      }

      emitter.emit('plausible-event', { key: 'data-input', props: { type: 'speech-recognition' } })
    },
    disableSpeechRecognition: function () {
      if (this.speechRecognition) {
        this.speechRecognition.stop()
        this.speechRecognition = null
      }
    }
  },
  beforeDestroy: function () {
    if (this.speechRecognition) {
      this.disableSpeechRecognition()
    }
  }
}
</script>

<style>

</style>
