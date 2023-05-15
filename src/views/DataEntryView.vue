<template>
  <b-container fluid class="mt-3 px-0" v-if="trial" ref="dataEntryView">
    <b-button-toolbar>
      <TraitDropdown :traits="trial.traits" />
      <TrialInformationDropdown :trial="trial" />
      <JumpToDropdown />
      <b-button :title="$t('toolbarFullscreen')" @click="toggleFullscreen">
        <BIconFullscreen v-if="!isFullscreen" /><BIconFullscreenExit v-else /> <span class="d-none d-lg-inline-block">{{ $t('toolbarFullscreen') }}</span>
      </b-button>
      <b-input-group class="ml-auto flex-grow-1 flex-sm-grow-0">
        <b-input-group-prepend>
          <b-button @click="$refs.scanQrCodeModal.show()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg>
          </b-button>
        </b-input-group-prepend>
        <b-input v-model="searchTerm" @keyup.enter.exact.prevent="initSearch" type="search" lazy />
        <b-input-group-append>
          <b-button @click="initSearch"><BIconSearch /></b-button>
        </b-input-group-append>
      </b-input-group>
    </b-button-toolbar>

    <DataCanvas />

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />

    <DataViewJumpControl v-if="storeNavigationMode === NAVIGATION_MODE_JUMP" />

    <DataInputModal :trial="trial" ref="dataInputModal" />

    <SearchMatchModal :searchMatches="searchMatches" ref="searchMatchModal" />

    <ScanQRCodeModal ref="scanQrCodeModal" @code-scanned="searchCodeScanned"/>
  </b-container>
</template>

<script>
import DataCanvas from '@/components/canvas/DataCanvas'
import TraitDropdown from '@/components/dropdowns/TraitDropdown'
import TrialInformationDropdown from '@/components/dropdowns/TrialInformationDropdown'
import TrialCommentModal from '@/components/modals/TrialCommentModal'
import DataInputModal from '@/components/modals/DataInputModal'
import SearchMatchModal from '@/components/modals/SearchMatchModal'
import ScanQRCodeModal from '@/components/modals/ScanQRCodeModal'
import DataViewJumpControl from '@/components/DataViewJumpControl'
import JumpToDropdown from '@/components/dropdowns/JumpToDropdown'
import { getTrialById } from '@/plugins/idb'
import { NAVIGATION_MODE_JUMP } from '@/plugins/constants'
import { mapGetters } from 'vuex'
import { BIconFullscreen, BIconFullscreenExit, BIconSearch } from 'bootstrap-vue'
import { getGermplasmMatches, getTrialDataCached } from '@/plugins/datastore'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    DataCanvas,
    TraitDropdown,
    TrialInformationDropdown,
    JumpToDropdown,
    TrialCommentModal,
    SearchMatchModal,
    DataInputModal,
    DataViewJumpControl,
    ScanQRCodeModal,
    BIconSearch,
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
    searchTerm: function () {
      this.$nextTick(() => this.initSearch())
    },
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
      hasFullscreenEventListener: false,
      searchTerm: null,
      searchMatches: []
    }
  },
  methods: {
    searchCodeScanned: function (code) {
      this.searchTerm = code

      this.initSearch()
    },
    initSearch: function () {
      this.searchMatches = []

      const matches = getGermplasmMatches(this.searchTerm)

      if (matches.length === 1) {
        emitter.emit('plot-clicked', matches[0].row, matches[0].column)
      } else if (matches.length < 1) {
        this.$bvModal.msgBoxOk(this.$t('modalTextGermplasmSearchNoMatchFound'), {
          title: this.$t('modalTitleGermplasmSearchNoMatchFound')
        })
      } else {
        this.searchMatches = matches

        this.$nextTick(() => this.$refs.searchMatchModal.show())
      }
    },
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

        this.updateTraitProgress()
      })
    },
    updateTraitProgress: function () {
      const data = getTrialDataCached()

      if (data) {
        this.trial.traits.forEach(t => {
          const total = Object.values(data).length
          let count = 0
          Object.values(data).forEach(c => {
            if (c.measurements && c.measurements[t.id] && c.measurements[t.id].length > 0) {
              count++
            }
          })
          t.progress = 100.0 * count / total
        })
      }
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
    emitter.on('plot-data-changed', this.updateTraitProgress)
    emitter.on('tts', this.tts)
  },
  beforeDestroy: function () {
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('trial-properties-changed', this.trialPropertiesChanged)
    emitter.off('plot-data-changed', this.updateTraitProgress)
    emitter.off('tts', this.tts)
  }
}
</script>

<style scoped>
</style>
