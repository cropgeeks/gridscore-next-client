<template>
  <b-container fluid class="mt-3 px-0" v-if="trial" ref="dataEntryView">
    <b-button-toolbar>
      <TraitDropdown :traits="trial.traits" ref="traitDropdown" @trait-cutoff-changed="e => { traitCutoff = e }" />
      <JumpToDropdown :trial="trial" />
      <b-button :title="$t('toolbarPlotComments')" @click="$refs.plotCommentModal.show()"><IBiChatRightTextFill /> <span class="d-none d-lg-inline-block">{{ $t('toolbarPlotComments') }}</span></b-button>
      <b-button :title="$t('toolbarPersonSelector')" @click="setForcePersonSelector(true)" v-if="trial.people && trial.people.length > 1"><IBiPersonLinesFill /> <span class="d-none d-lg-inline-block">{{ $t('toolbarPersonSelector') }}</span></b-button>
      <b-button :title="$t('toolbarHelp')" @click="startTour"><IBiQuestionCircle /> <span class="d-none d-lg-inline-block">{{ $t('toolbarHelp') }}</span></b-button>
      <b-button v-if="trial.transactionCount > 0" @click="synchronize" variant="info"><IBiCloudUploadFill /> {{ $t('toolbarSyncInfo', trial.transactionCount) }}</b-button>
      <b-input-group class="ms-auto flex-grow-1 flex-sm-grow-0">
        <template #prepend>
          <b-button @click="$refs.scanQrCodeModal.show()"><IBiQrCodeScan /></b-button>
        </template>
        <b-form-input lazy v-model.lazy="searchTerm" @keyup.enter.exact.prevent="initSearch" type="search" id="germplasm-search" ref="germplasmSearch" />
        <template #append>
          <b-button @click="initSearch"><IBiSearch /></b-button>
        </template>
      </b-input-group>
    </b-button-toolbar>

    <DataCanvas :geolocation="geolocation" :traitCutoff="traitCutoff" v-if="showCanvas" />
    <DataGridComponent :geolocation="geolocation" :traitCutoff="traitCutoff" v-else />

    <DataViewJumpControl v-if="storeNavigationMode === NAVIGATION_MODE_JUMP" />

    <PlotCommentListModal :trial="trial" ref="plotCommentModal" />
    <DataInputModal :geolocation="geolocation" :trial="trial" ref="dataInputModal" @data-changed="loadTrial" @hidden="selectSearch" />
    <SearchMatchModal :searchMatches="searchMatches" ref="searchMatchModal" v-if="searchMatches" />
    <ScanQRCodeModal ref="scanQrCodeModal" @code-scanned="searchCodeScanned" />
    <TrialPersonSelectModal :trial="trial" :shouldShow="showTrialPersonSelector || forcePersonSelector" @personSelected="setForcePersonSelector(false)" @addPersonClicked="addPerson" v-if="trial && (showTrialPersonSelector || forcePersonSelector)" />
    <Tour :steps="tourSteps" :resetOnRouterNav="true" :hideBackButton="false" ref="dataTour" />
  </b-container>
</template>

<script>
import DataCanvas from '@/components/canvas/DataCanvas.vue'
import DataGridComponent from '@/components/canvas/DataGridComponent.vue'
import TraitDropdown from '@/components/dropdowns/TraitDropdown.vue'
import DataInputModal from '@/components/modals/DataInputModal.vue'
import SearchMatchModal from '@/components/modals/SearchMatchModal.vue'
import ScanQRCodeModal from '@/components/modals/ScanQRCodeModal.vue'
import TrialPersonSelectModal from '@/components/modals/TrialPersonSelectModal.vue'
import DataViewJumpControl from '@/components/DataViewJumpControl.vue'
import JumpToDropdown from '@/components/dropdowns/JumpToDropdown.vue'
import Tour from '@/components/Tour.vue'
import { getTrialById } from '@/plugins/idb'
import { MAIN_DISPLAY_MODE_CANVAS_ONLY, NAVIGATION_MODE_JUMP } from '@/plugins/constants'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getGermplasmMatches, getTrialDataCached } from '@/plugins/datastore'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    DataCanvas,
    DataGridComponent,
    TraitDropdown,
    JumpToDropdown,
    SearchMatchModal,
    DataInputModal,
    TrialPersonSelectModal,
    DataViewJumpControl,
    ScanQRCodeModal,
    Tour
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeGpsEnabled',
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeNavigationMode',
      'storeVoiceFeedbackEnabled',
      'storeSelectedTrialPerson',
      'storeMainDisplayMode',
      'storeAutoSelectSearch'
    ]),
    showCanvas: function () {
      if (this.storeMainDisplayMode === MAIN_DISPLAY_MODE_CANVAS_ONLY) {
        return true
      } else {
        if (this.trial) {
          return this.trial.layout.rows * this.trial.layout.columns > 1000
        } else {
          return true
        }
      }
    },
    showTrialPersonSelector: function () {
      if (this.trial && this.trial.people && this.trial.people.length > 0) {
        return !this.storeSelectedTrialPerson || !this.trial.people.some(p => p.id === this.storeSelectedTrialPerson)
      } else {
        return false
      }
    },
    tourSteps: function () {
      return [{
        title: () => this.$t('tourTitleDataEntryStart'),
        text: () => this.$t('tourTextDataEntryStart'),
        target: () => '.navbar',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryCanvas'),
        text: () => this.$t('tourTextDataEntryCanvas'),
        target: () => '#data-canvas-header',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataEntryTraits'),
        text: () => this.$t('tourTextDataEntryTraits'),
        target: () => '.trait-dropdown-list',
        position: 'right',
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
        title: () => this.$t('tourTitleDataEntryGermplasmSearch'),
        text: () => this.$t('tourTextDataEntryGermplasmSearch'),
        target: () => '#germplasm-search',
        position: 'bottom'
      }]
    }
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
            this.$refs.dataEntryView.addEventListener('fullscreenchange', () => {
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
      geolocation: null,
      forcePersonSelector: false,
      traitCutoff: null
    }
  },
  methods: {
    setForcePersonSelector: function (value) {
      this.forcePersonSelector = value
    },
    startTour: function () {
      this.$refs.dataTour.start()
    },
    searchCodeScanned: function (code) {
      this.searchTerm = code

      this.initSearch()
    },
    initSearch: function () {
      this.searchMatches = []

      const trimmed = this.searchTerm.trim()
      
      if (trimmed.length < 1) {
        return
      }

      this.searchTerm = ''

      const matches = getGermplasmMatches(this.trial, trimmed)

      if (matches.length === 1) {
        emitter.emit('plot-clicked', matches[0].row, matches[0].column)
      } else if (matches.length < 1) {
        emitter.emit('show-confirm', {
          title: 'modalTitleGermplasmSearchNoMatchFound',
          message: 'modalTextGermplasmSearchNoMatchFound',
          okTitle: 'buttonOk',
          okOnly: true,
          okVariant: 'primary'
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

        this.updateLocalCaches()

        this.startGeoTracking()

        this.$nextTick(() => this.selectSearch())
      })
    },
    updateLocalCaches: function () {
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
    trialPropertiesChanged: function (trialId) {
      if (this.trial && this.trial.localId === trialId) {
        this.loadTrial()
      }
    },
    fakeGpsMovement: function () {
      const points = [
        {
          lat: 56.484180501316246,
          lng: -3.1377527117729187,
          steps: 600,
          heading: 270
        }, {
          lat: 56.484147918689615,
          lng: -3.1387156248092656,
          steps: 60,
          heading: 360
        }, {
          lat: 56.48420864083489,
          lng: -3.1387209892272954,
          steps: 600,
          heading: 90
        }, {
          lat: 56.48424418546024,
          lng: -3.1377661228179936,
          steps: 60,
          heading: 180
        }
      ]

      let counter = 0
      let steps = points[0].steps
      let heading = points[0].heading
      let pointIndex = 0
      setTimeout(() => {
        const id = setInterval(() => {
          counter++
          if (counter === steps) {
            counter = 0
            pointIndex = (pointIndex + 1) % points.length
            steps = points[pointIndex].steps
            heading = points[pointIndex].heading
            if (pointIndex === 0) {
              clearInterval(id)
            }
          } else {
            const start = points[pointIndex]
            const end = points[(pointIndex + 1) % points.length]
            const dLat = start.lat + ((end.lat - start.lat) / steps) * counter
            const dLng = start.lng + ((end.lng - start.lng) / steps) * counter

            this.geolocation = {
              lat: dLat,
              lng: dLng,
              elv: 100,
              heading
            }
          }
        }, 100)
      }, 10000)
    },
    addPerson: function () {
      this.$router.push({ name: 'home', query: { addPerson: this.trial.localId } })
    },
    synchronize: function () {
      this.$router.push({ name: 'home', query: { synchronize: this.trial.localId } })
    },
    startGeoTracking: function () {
      if (navigator.geolocation && this.storeGpsEnabled && !this.geolocationWatchId) {
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
    selectSearch: function () {
      if (this.storeAutoSelectSearch && this.$refs.germplasmSearch) {
        this.$refs.germplasmSearch.focus()
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

    emitter.on('trial-properties-changed', this.trialPropertiesChanged)
    emitter.on('plot-cache-changed', this.updateLocalCaches)
    emitter.on('trial-data-loaded', this.updateLocalCaches)
    emitter.on('tts', this.tts)
    emitter.on('select-search', this.selectSearch)

    // this.fakeGpsMovement()

    this.selectSearch()
  },
  beforeUnmount: function () {
    emitter.off('trial-properties-changed', this.trialPropertiesChanged)
    emitter.off('plot-cache-changed', this.updateLocalCaches)
    emitter.off('trial-data-loaded', this.updateLocalCaches)
    emitter.off('tts', this.tts)
    emitter.off('select-search', this.selectSearch)

    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
  }
}
</script>

<style scoped>
</style>
