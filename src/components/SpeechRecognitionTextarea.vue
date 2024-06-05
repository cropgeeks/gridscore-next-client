<template>
  <b-input-group>
    <b-form-textarea ref="textarea" :rows="rows" v-model="textContent" :id="id" />
    <b-input-group-addon append v-if="supportsSpeechRecognition">
      <b-button @click="toggleRecording" :variant="speechRecognition ? 'danger' : 'secondary'" v-b-tooltip="tooltip"><IBiMic /></b-button>
    </b-input-group-addon>
  </b-input-group>
</template>

<script>
import { mapGetters } from 'vuex'

import emitter from 'tiny-emitter/instance'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default {
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
      textContent: null,
      speechRecognition: null
    }
  },
  watch: {
    textContent: function (newValue) {
      this.$emit('content-changed', newValue)
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
      this.textContent = null
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
            this.textContent = result
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
  beforeUnmount: function () {
    if (this.speechRecognition) {
      this.disableSpeechRecognition()
    }
  }
}
</script>

<style>

</style>
