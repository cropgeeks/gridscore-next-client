<template>
  <b-container fluid class="mt-3 px-0" v-if="trial" ref="dataEntryView">
    <b-button-toolbar>
      <TraitDropdown :traits="trial.traits" ref="traitDropdown" />
      <TrialInformationDropdown :trial="trial" ref="trialInfoDropdown" />
      <JumpToDropdown :trial="trial" />
      <b-button :title="$t('toolbarHelp')" @click="startTour"><BIconQuestionCircle /> <span class="d-none d-lg-inline-block">{{ $t('toolbarHelp') }}</span></b-button>
      <!-- <b-button :title="$t('toolbarFullscreen')" @click="toggleFullscreen">
        <BIconFullscreen v-if="!isFullscreen" /><BIconFullscreenExit v-else /> <span class="d-none d-lg-inline-block">{{ $t('toolbarFullscreen') }}</span>
      </b-button> -->
      <b-input-group class="ml-auto flex-grow-1 flex-sm-grow-0">
        <b-input-group-prepend>
          <b-button @click="$refs.scanQrCodeModal.show()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg>
          </b-button>
        </b-input-group-prepend>
        <b-input v-model="searchTerm" @keyup.enter.exact.prevent="initSearch" type="search" lazy id="germplasm-search" />
        <b-input-group-append>
          <b-button @click="initSearch"><BIconSearch /></b-button>
        </b-input-group-append>
      </b-input-group>
    </b-button-toolbar>

    <DataCanvas :geolocation="geolocation" id="data-canvas" />

    <DataViewJumpControl v-if="storeNavigationMode === NAVIGATION_MODE_JUMP" />

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />
    <DataInputModal :geolocation="geolocation" :trial="trial" ref="dataInputModal" />
    <SearchMatchModal :searchMatches="searchMatches" ref="searchMatchModal" />
    <ScanQRCodeModal ref="scanQrCodeModal" @code-scanned="searchCodeScanned"/>
    <Tour :steps="tourSteps" :resetOnRouterNav="true" :hideBackButton="false" ref="dataTour" />
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
import Tour from '@/components/Tour'
import { getTrialById } from '@/plugins/idb'
import { NAVIGATION_MODE_JUMP } from '@/plugins/constants'
import { mapGetters } from 'vuex'
// import { BIconFullscreen, BIconFullscreenExit, BIconSearch } from 'bootstrap-vue'
import { BIconSearch, BIconQuestionCircle } from 'bootstrap-vue'
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
    Tour,
    BIconSearch,
    BIconQuestionCircle
    // BIconFullscreen,
    // BIconFullscreenExit
  },
  computed: {
    ...mapGetters([
      'storeGpsEnabled',
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeNavigationMode',
      'storeVoiceFeedbackEnabled'
    ]),
    tourSteps: function () {
      return [{
        title: () => this.$t('tourTitleDataEntryStart'),
        text: () => this.$t('tourTextDataEntryStart'),
        target: () => '.navbar',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryCanvas'),
        text: () => this.$t('tourTextDataEntryCanvas'),
        target: () => '#data-canvas',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryTraits'),
        text: () => this.$t('tourTextDataEntryTraits'),
        target: () => '#trait-dropdown .dropdown-menu',
        beforeShow: () => {
          return new Promise(resolve => {
            this.$refs.traitDropdown.show()

            this.$nextTick(() => setTimeout(() => resolve(), 100))
          })
        },
        afterShow: () => {
          return new Promise(resolve => {
            this.$refs.traitDropdown.hide()

            this.$nextTick(() => resolve())
          })
        }
      }, {
        title: () => this.$t('tourTitleDataEntryTrialInformation'),
        text: () => this.$t('tourTextDataEntryTrialInformation'),
        target: () => '#trial-information-dropdown .dropdown-menu',
        beforeShow: () => {
          return new Promise(resolve => {
            this.$refs.trialInfoDropdown.show()

            this.$nextTick(() => setTimeout(() => resolve(), 100))
          })
        },
        afterShow: () => {
          return new Promise(resolve => {
            this.$refs.trialInfoDropdown.hide()

            this.$nextTick(() => resolve())
          })
        }
      }, {
        title: () => this.$t('tourTitleDataEntryGermplasmSearch'),
        text: () => this.$t('tourTextDataEntryGermplasmSearch'),
        target: () => '#germplasm-search',
        position: 'bottom'
      }]
    }
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
      searchMatches: [],
      geolocation: null
    }
  },
  methods: {
    startTour: function () {
      this.$refs.dataTour.start()
    },
    searchCodeScanned: function (code) {
      this.searchTerm = code

      this.initSearch()
    },
    initSearch: function () {
      this.searchMatches = []

      const matches = getGermplasmMatches(this.trial, this.searchTerm)

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
        utterance.rate = 1.0
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

        this.startGeoTracking()
      })
    },
    updateTraitProgress: function () {
      const data = getTrialDataCached()

      if (data && this.trial) {
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
    emitter.on('plot-cache-changed', this.updateTraitProgress)
    emitter.on('trial-data-loaded', this.updateTraitProgress)
    emitter.on('tts', this.tts)
  },
  beforeDestroy: function () {
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('trial-properties-changed', this.trialPropertiesChanged)
    emitter.off('plot-cache-changed', this.updateTraitProgress)
    emitter.off('trial-data-loaded', this.updateTraitProgress)
    emitter.off('tts', this.tts)

    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
  }
}
</script>

<style scoped>
</style>
