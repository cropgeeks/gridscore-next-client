<template>
  <b-container fluid class="mt-3" v-if="trial" ref="dataEntryView">
    <b-button-toolbar>
      <TraitDropdown :traits="trial.traits" />
      <TrialInformationDropdown :trial="trial" />
      <JumpToDropdown />
      <b-button :title="$t('toolbarFullscreen')" @click="toggleFullscreen">
        <BIconFullscreen v-if="!isFullscreen" /><BIconFullscreenExit v-else /> <span class="d-none d-lg-inline-block">{{ $t('toolbarFullscreen') }}</span>
      </b-button>
    </b-button-toolbar>

    <DataCanvas />

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />

    <DataViewJumpControl v-if="storeNavigationMode === NAVIGATION_MODE_JUMP" />

    <DataInputModal :trial="trial" ref="dataInputModal" />
  </b-container>
</template>

<script>
import DataCanvas from '@/components/canvas/DataCanvas'
import TraitDropdown from '@/components/dropdowns/TraitDropdown'
import TrialInformationDropdown from '@/components/dropdowns/TrialInformationDropdown'
import TrialCommentModal from '@/components/modals/TrialCommentModal'
import DataInputModal from '@/components/modals/DataInputModal'
import DataViewJumpControl from '@/components/DataViewJumpControl'
import JumpToDropdown from '@/components/dropdowns/JumpToDropdown'
import { getTrialById } from '@/plugins/idb'
import { NAVIGATION_MODE_JUMP } from '@/plugins/constants'
import { mapGetters } from 'vuex'
import { BIconFullscreen, BIconFullscreenExit } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    DataCanvas,
    TraitDropdown,
    TrialInformationDropdown,
    JumpToDropdown,
    TrialCommentModal,
    DataInputModal,
    DataViewJumpControl,
    BIconFullscreen,
    BIconFullscreenExit
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeNavigationMode',
      'storeVoiceFeedbackEnabled'
    ])
  },
  watch: {
    storeSelectedTrial: function () {
      this.loadTrial()
    },
    storeVoiceFeedbackEnabled: function (newValue) {
      if (newValue && window.speechSynthesis) {
        this.textSynth = window.speechSynthesis
      } else {
        this.textSynth = null
      }
    },
    isFullscreen: function (newValue) {
      if (newValue) {
        if (!document.fullscreenElement) {
          // Request fullscreen
          this.$refs.dataEntryView.requestFullscreen()

          // We need to listen to fullscreenchange events for example when the user exits fullscreen by other means than using the same button again
          if (!this.hasFullscreenEventListener) {
            this.$refs.dataEntryView.addEventListener('fullscreenchange', event => {
              // Update the fullscreen field
              this.isFullscreen = document.fullscreenElement !== null
            })

            // Remember that we already added this listener
            this.hasFullscreenEventListener = true
          }
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      }
    }
  },
  data: function () {
    return {
      NAVIGATION_MODE_JUMP,
      trial: null,
      selectedTrial: null,
      isFullscreen: false,
      hasFullscreenEventListener: false
    }
  },
  methods: {
    tts: function (text, interruptPrev = true) {
      if (this.textSynth) {
        if (interruptPrev) {
          this.textSynth.cancel()
        }

        const utterance = new SpeechSynthesisUtterance(text)
        // utterance.rate = 1.2
        this.textSynth.speak(utterance)
      }
    },
    toggleFullscreen: function () {
      this.isFullscreen = !this.isFullscreen
    },
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial
      })
    },
    showTrialComments: function (trial) {
      this.selectedTrial = trial

      if (trial) {
        this.$nextTick(() => this.$refs.trialCommentModal.show())
      }
    },
    trialPropertiesChanged: function (trialId) {
      if (this.trial && this.trial.localId === trialId) {
        this.loadTrial()
      }
    }
  },
  mounted: function () {
    if (this.storeSelectedTrial) {
      this.loadTrial()
    }

    if (this.storeVoiceFeedbackEnabled && window.speechSynthesis) {
      this.textSynth = window.speechSynthesis
    }

    emitter.on('show-trial-comments', this.showTrialComments)
    emitter.on('trial-properties-changed', this.trialPropertiesChanged)
    emitter.on('tts', this.tts)
  },
  beforeDestroy: function () {
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('trial-properties-changed', this.trialPropertiesChanged)
    emitter.off('tts', this.tts)
  }
}
</script>

<style scoped>
</style>
