<template>
  <div v-if="trial" class="data-entry">
    <v-toolbar flat density="compact" class="mb-3 justify-space-between align-center pa-2">
      <v-btn-group density="compact">
        <TraitDropdown :traits="trial.traits" @trait-cutoff-changed="e => { traitCutoff = e }" />
        <JumpToDropdown />
      </v-btn-group>
      <v-btn v-if="trial.transactionCount !== undefined && trial.transactionCount > 0" prepend-icon="mdi-cloud-upload" @click="synchronize" color="info" variant="tonal" :text="$t('toolbarSyncInfo', trial.transactionCount)" />
      <GermplasmAutocomplete
        :trial="trial"
        v-model="searchMatch"
        max-width="min(50vw, 250px)"
        density="compact"
        ref="searchField"
      />
    </v-toolbar>

    <DataCanvas :trial="trial" :geolocation="geolocation" :trait-cutoff="traitCutoff" @click:plot="selectPlot" v-if="showCanvas" />
    <DataGrid :trial="trial" :geolocation="geolocation" :trait-cutoff="traitCutoff" @click:plot="selectPlot" v-else />

    <DataEntryModal :trial="trial" :geolocation="geolocation" ref="dataEntryModal" @data-changed="loadTrial" />

    <v-menu v-model="jumpMenuVisible" v-if="store.storeNavigationMode === NavigationMode.JUMP" location="start" :close-on-content-click="false">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="fab-jump-to"
          color="primary"
          size="large"
          icon="mdi-cursor-move"
        />
      </template>
      <v-sheet class="pa-3">
        <ArrowDirectionGrid
          @direction="moveTowards"
          @center="jumpMenuVisible = false"
          center-icon="mdi-cancel"
        />
      </v-sheet>
    </v-menu>

    <SearchResultModal ref="searchResultModal" :list="searchResults" v-if="searchResults && searchResults.length > 0" />
  </div>
</template>

<script setup lang="ts">
  import DataGrid from '@/components/data/DataGrid.vue'
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import DataEntryModal from '@/components/modals/DataEntryModal.vue'
  import TraitDropdown from '@/components/trial/TraitDropdown.vue'
  import ArrowDirectionGrid from '@/components/util/ArrowDirectionGrid.vue'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getTrialById } from '@/plugins/idb'
  import { MainDisplayMode, NavigationMode, type CellPlus, type Geolocation, type TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const geolocation = ref<Geolocation>()
  const traitCutoff = ref<string>()
  const jumpMenuVisible = ref(false)
  const searchResults = ref<CellPlus[]>([])
  const searchMatch = ref<CellPlus>()
  const trialGermplasm = ref<CellPlus[]>([])

  // TODO: ADD!
  // @ts-ignore
  const germplasmSearch = useTemplateRef('germplasmSearch')
  const dataEntryModal = useTemplateRef('dataEntryModal')
  const searchResultModal = useTemplateRef('searchResultModal')

  let textSynth: SpeechSynthesis | undefined = undefined
  let geolocationWatchId: number | undefined = undefined

  const showCanvas = computed(() => {
    if (store.storeMainDisplayMode === MainDisplayMode.CANVAS_ONLY) {
      return true
    } else {
      if (trial.value) {
        return trial.value.layout.rows * trial.value.layout.columns > 1000
      } else {
        return true
      }
    }
  })

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t

      updateLocalCaches()

      startGeoTracking()

      nextTick(() => selectSearch())
    })
  }

  function updateLocalCaches () {
    const data = getTrialDataCached()

    if (data && trial.value) {
      const total = Object.values(data).length

      const allGermplasm: CellPlus[] = []

      Object.values(data).forEach(c => {
        if (c) {
          allGermplasm.push({
            artificialId: `${c.row}|${c.column}`,
            row: c.row || 0,
            column: c.column || 0,
            displayName: c.displayName,
            rep: c.rep,
            barcode: c.barcode,
            germplasm: c.germplasm,
            displayRow: c.displayRow,
            displayColumn: c.displayColumn,
            isMarked: c.isMarked,
            measurements: {},
            comments: [],
            categories: c.categories,
          })

          if (c.measurements) {
            trial.value?.traits.forEach(t => {
              const id = t.id || ''
              if (c.measurements[id] && c.measurements[id].length > 0) {
                t.progress = t.progress ? (t.progress + 1) : 1
              }
            })
          }
        }
      })

      trial.value.traits.forEach(t => {
        t.progress = t.progress ? (100 * t.progress / total) : 0
      })

      trialGermplasm.value = allGermplasm
    }
  }

  function startGeoTracking () {
    if (navigator.geolocation && store.storeGpsEnabled && !geolocationWatchId) {
      const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 }
      geolocationWatchId = navigator.geolocation.watchPosition(position => {
        if (position && position.coords) {
          geolocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            elevation: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
          }
        }
      }, null, options)
    }
  }

  function synchronize () {
    // TODO
  }

  function selectSearch () {
    if (store.storeAutoSelectSearch && germplasmSearch.value) {
      germplasmSearch.value.focus()
    }
  }

  function selectPlot (row: number, column: number) {
    dataEntryModal.value?.show(row, column)
  }

  function trialPropertiesChanged (trialId: string) {
    if (trial.value && trial.value.localId === trialId) {
      loadTrial()
    }
  }

  function moveTowards (corner: string) {
    emitter.emit('move-to-corner', corner)
    emitter.emit('plausible-event', { key: 'data-view-jump', props: { type: corner } })
  }

  function showSearchResults (list: CellPlus[]) {
    searchResults.value = list

    nextTick(() => searchResultModal.value?.show())
  }

  function tts (text: string, interruptPrev = true) {
    if (textSynth) {
      if (interruptPrev) {
        textSynth.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      // utterance.rate = 1.2
      textSynth.speak(utterance)
    }
  }

  watch(searchMatch, async newValue => {
    if (newValue) {
      selectPlot(newValue.row || 0, newValue.column || 0)
      searchMatch.value = undefined
    }
  })

  onMounted(() => {
    if (store.storeSelectedTrial) {
      loadTrial()
    }

    if (store.storeVoiceFeedbackEnabled && window.speechSynthesis) {
      textSynth = window.speechSynthesis
    }

    emitter.on('trial-properties-changed', trialPropertiesChanged)
    emitter.on('plot-cache-changed', updateLocalCaches)
    emitter.on('trial-data-loaded', updateLocalCaches)
    emitter.on('show-search-results', showSearchResults)
    emitter.on('plot-clicked', selectPlot)
    emitter.on('tts', tts)
  })

  onBeforeUnmount(() => {
    emitter.off('trial-properties-changed', trialPropertiesChanged)
    emitter.off('plot-cache-changed', updateLocalCaches)
    emitter.off('trial-data-loaded', updateLocalCaches)
    emitter.off('show-search-results', showSearchResults)
    emitter.off('plot-clicked', selectPlot)
    emitter.off('tts', tts)
  })
</script>

<style scoped>
.fab-jump-to {
  position: fixed;
  right: 1em;
  bottom: 20%;
  opacity: 0.66;
}

.fab-jump-to:active,
.fab-jump-to:hover {
  opacity: 1;
}
</style>

<style>
.data-entry .v-toolbar__content {
  height: auto !important;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
</style>
