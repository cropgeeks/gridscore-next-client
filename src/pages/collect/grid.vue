<template>
  <div v-if="trial" class="data-entry">
    <v-toolbar flat density="compact" class="mb-3 justify-space-between align-center pa-2">
      <v-btn-group density="compact">
        <TraitDropdown :traits="trial.traits" @trait-cutoff-changed="e => { traitCutoff = e }" />
        <JumpToDropdown />

        <OverflowMenu
          :items="overflowItems"
          :breakpoint="mdAndUp"
        />
        <v-menu activator="#grid-media-mode">
          <v-list slim density="compact" min-width="300" max-width="min(500px, 75vw)" id="media-mode-dropdown">
            <v-list-subheader>
              <div class="d-flex justify-space-between">
                <span>{{ $t('menuItemMediaModeHeading') }}</span>
                <span v-tooltip:top="$t('menuItemHelpMediaModeHeading')"><v-icon :icon="mdiHelpCircle" color="primary" /></span>
              </div>
            </v-list-subheader>
            <v-list-item :title="$t('menuItemMediaModeDisabled')" :prepend-icon="mdiCancel" :append-icon="store.storeMediaMode === undefined ? mdiCheck : undefined" @click="store.setMediaMode(undefined)" />
            <v-list-item :title="$t('menuItemMediaModeImage')" :prepend-icon="mdiImage" :append-icon="store.storeMediaMode === 'image' ? mdiCheck : undefined" @click="store.setMediaMode('image')" />
            <v-list-item :title="$t('menuItemMediaModeVideo')" :prepend-icon="mdiVideo" :append-icon="store.storeMediaMode === 'video' ? mdiCheck : undefined" @click="store.setMediaMode('video')" />
          </v-list>
        </v-menu>
        <v-menu :close-on-content-click="false" activator="#grid-highlight">
          <v-list slim density="compact" min-width="300" max-width="min(500px, 75vw)">
            <v-list-item :title="$t('formLabelPlotHighlightNothing')" :prepend-icon="mdiMarkerCancel" :append-icon="store.storeHighlightConfig.type === undefined ? mdiCheck : undefined" @click="setHighlight(undefined)" />
            <v-list-item v-if="trialControls && trialControls.length > 0" :title="$t('formLabelPlotHighlightControls')" :prepend-icon="mdiCheckboxMarked" :append-icon="store.storeHighlightConfig.type === 'controls' ? mdiCheck : undefined" @click="setHighlight('controls')" />
            <v-list-item v-if="trialTreatments && trialTreatments.length > 0" :prepend-icon="mdiSprinklerFire" :append-icon="store.storeHighlightConfig.type === 'treatments' ? mdiCheck : undefined">
              <v-select
                :label="$t('formLabelPlotHighlightTreatments')"
                multiple
                density="compact"
                hide-details
                clearable
                v-model="selectedTreatments"
                :items="trialTreatments"
              >
                <template #selection="{ item, index }">
                  <v-chip density="compact" :text="item.title" :color="highlightColors[index % highlightColors.length]" variant="flat" />
                </template>
              </v-select>
            </v-list-item>
            <v-list-item v-if="trialReps && trialReps.length > 0" :prepend-icon="mdiFormatListNumbered" :append-icon="store.storeHighlightConfig.type === 'reps' ? mdiCheck : undefined">
              <v-select
                :label="$t('formLabelPlotHighlightReps')"
                multiple
                density="compact"
                hide-details
                clearable
                v-model="selectedReps"
                :items="trialReps"
              >
                <template #selection="{ item, index }">
                  <v-chip density="compact" :text="item.title" :color="highlightColors[index % highlightColors.length]" variant="flat" />
                </template>
              </v-select>
            </v-list-item>
            <v-list-item :prepend-icon="mdiSprout" :append-icon="store.storeHighlightConfig.type === 'germplasm' ? mdiCheck : undefined">
              <v-text-field
                v-model="highlightSearch"
                :label="$t('formLabelPlotHighlightName')"
                density="compact"
                hide-details
                clearable
              />
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn-group>
      <v-btn v-if="trial.transactionCount !== undefined && trial.transactionCount > 0" :prepend-icon="mdiCloudUpload" @click="synchronize" color="info" variant="tonal" :text="$t('toolbarSyncInfo', trial.transactionCount)" />
      <GermplasmAutocomplete
        :trial="trial"
        v-model="searchMatch"
        scan-in-bottom-sheet
        min-width="200px"
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
          :icon="mdiCursorMove"
        />
      </template>
      <v-sheet class="pa-3">
        <ArrowDirectionGrid
          @direction="moveTowards"
          @center="jumpMenuVisible = false"
          :center-icon="mdiCancel"
        />
      </v-sheet>
    </v-menu>

    <SearchResultModal ref="searchResultModal" :list="searchResults" v-if="searchResults && searchResults.length > 0" />

    <MediaModal :trial="trial" />
    <TrialPersonSelectModal :trial="trial" v-if="trial && hasTrialPeople" />
  </div>
</template>

<script setup lang="ts">
  import DataGrid from '@/components/data/DataGrid.vue'
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import DataEntryModal from '@/components/modals/DataEntryModal.vue'
  import MediaModal from '@/components/modals/MediaModal.vue'
  import TrialPersonSelectModal from '@/components/modals/TrialPersonSelectModal.vue'
  import TraitDropdown from '@/components/trial/TraitDropdown.vue'
  import ArrowDirectionGrid from '@/components/util/ArrowDirectionGrid.vue'
  import OverflowMenu, { type MenuItem } from '@/components/util/OverflowMenu.vue'
  import { categoricalColors } from '@/plugins/color'
  import { getTrialControlsCached, getTrialDataCached, getTrialRepsCached, getTrialTreatmentsCached } from '@/plugins/datastore'
  import { getTrialById } from '@/plugins/idb'
  import { MainDisplayMode, type MiniCell, NavigationMode, type CellPlus, type Geolocation, type TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiAccountMultiple, mdiCameraBurst, mdiCancel, mdiCheck, mdiCheckboxMarked, mdiCloudUpload, mdiCursorMove, mdiFormatListNumbered, mdiHelpCircle, mdiImage, mdiMarker, mdiMarkerCancel, mdiSprinklerFire, mdiSprout, mdiVideo } from '@mdi/js'
  import { watchIgnorable } from '@vueuse/core'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'

  const store = coreStore()
  const { mdAndUp } = useDisplay()
  const { t } = useI18n()

  const trial = ref<TrialPlus>()
  const geolocation = ref<Geolocation>()
  const traitCutoff = ref<string>()
  const jumpMenuVisible = ref(false)
  const searchResults = ref<CellPlus[]>([])
  const searchMatch = ref<CellPlus>()
  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])
  const trialControls = ref<MiniCell[]>([])

  // Highlighting stuff
  const selectedReps = ref<string[]>([])
  const selectedTreatments = ref<string[]>([])
  const highlightSearch = ref<string>()
  const highlightColors = computed(() => store.storeIsDarkMode ? categoricalColors.HighlightDark : categoricalColors.HighlightPastel)

  // TODO: ADD!
  // @ts-ignore
  const germplasmSearch = useTemplateRef('germplasmSearch')
  const dataEntryModal = useTemplateRef('dataEntryModal')
  const searchResultModal = useTemplateRef('searchResultModal')

  let textSynth: SpeechSynthesis | undefined = undefined
  let geolocationWatchId: number | undefined = undefined

  const hasTrialPeople = computed(() => trial.value && trial.value.people && trial.value.people.length > 0)

  const overflowItems: ComputedRef<MenuItem[]> = computed(() => {
    const result: MenuItem[] = [{
      text: t('toolbarPlotHighlight'),
      id: 'grid-highlight',
      color: store.storeHighlightConfig && store.storeHighlightConfig.type !== undefined ? 'primary' : undefined,
      prependIcon: mdiMarker,
      variant: 'tonal',
      size: undefined,
      click: () => {},
    }, {
      text: t('toolbarPlotMediaMode'),
      id: 'grid-media-mode',
      prependIcon: mdiCameraBurst,
      color: store.storeMediaMode !== undefined ? 'primary' : undefined,
      variant: 'tonal',
      size: undefined,
      click: () => {},
    }]

    if (trial.value?.editable === true && hasTrialPeople.value === true) {
      result.unshift({
        text: t('toolbarPersonSelector'),
        prependIcon: mdiAccountMultiple,
        variant: 'tonal',
        size: undefined,
        click: () => emitter.emit('show-trial-person-selector'),
      })
    }

    return result
  })

  const showCanvas = computed(() => {
    if (store.storeMainDisplayMode === MainDisplayMode.CANVAS_ONLY) {
      return true
    } else {
      if (trial.value) {
        return (trial.value.layout.rows * trial.value.layout.columns > 1000) || (trial.value.layout.rows * trial.value.layout.columns * trial.value.traits.length > 2000)
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

      Object.values(data).forEach(c => {
        if (c && c.measurements) {
          trial.value?.traits.forEach(t => {
            const id = t.id || ''
            if (c.measurements[id] && c.measurements[id].length > 0) {
              t.progress = t.progress ? (t.progress + 1) : 1
            }
          })
        }
      })

      trialReps.value = getTrialRepsCached()
      trialTreatments.value = getTrialTreatmentsCached()
      trialControls.value = getTrialControlsCached()

      if (store.storeHighlightConfig && store.storeHighlightConfig.type !== undefined) {
        ignoreReps(() => {
          selectedReps.value = store.storeHighlightConfig.reps || []
        })
        ignoreTreatment(() => {
          selectedTreatments.value = store.storeHighlightConfig.treatments || []
        })
        ignoreSearch(() => {
          highlightSearch.value = store.storeHighlightConfig.germplasm
        })
      }

      trial.value.traits.forEach(t => {
        t.progress = t.progress ? (100 * t.progress / total) : 0
      })
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
    if (store.storeMediaMode !== undefined) {
      emitter.emit('tag-media', row, column, store.storeMediaMode)
    } else {
      dataEntryModal.value?.show(row, column)
    }
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

  function setHighlight (type: 'controls' | 'reps' | 'germplasm' | 'treatments' | undefined) {
    ignoreReps(() => {
      selectedReps.value = []
    })
    ignoreTreatment(() => {
      selectedTreatments.value = []
    })
    ignoreSearch(() => {
      highlightSearch.value = undefined
    })
    store.setHighlightConfig({
      type,
    })
  }

  watch(searchMatch, async newValue => {
    if (newValue) {
      selectPlot(newValue.row || 0, newValue.column || 0)
      searchMatch.value = undefined
    }
  })

  const { ignoreUpdates: ignoreReps } = watchIgnorable(selectedReps, newValue => {
    if (newValue && newValue.length > 0) {
      ignoreTreatment(() => {
        // Don't trigger treatment watcher
        selectedTreatments.value = []
      })
      ignoreSearch(() => {
        // Don't trigger germplasm search watcher
        highlightSearch.value = undefined
      })
      store.setHighlightConfig({
        type: 'reps',
        reps: newValue,
      })
    } else {
      store.setHighlightConfig({
        type: undefined,
      })
    }
  })

  const { ignoreUpdates: ignoreTreatment } = watchIgnorable(selectedTreatments, newValue => {
    if (newValue && newValue.length > 0) {
      ignoreReps(() => {
        // Don't trigger rep watcher
        selectedReps.value = []
      })
      ignoreSearch(() => {
        // Don't trigger germplasm search watcher
        highlightSearch.value = undefined
      })
      store.setHighlightConfig({
        type: 'treatments',
        treatments: newValue,
      })
    } else {
      store.setHighlightConfig({
        type: undefined,
      })
    }
  })

  const { ignoreUpdates: ignoreSearch } = watchIgnorable(highlightSearch, newValue => {
    if (newValue && newValue.trim().length > 0) {
      ignoreReps(() => {
        // Don't trigger rep watcher
        selectedReps.value = []
      })
      ignoreTreatment(() => {
        // Don't trigger treatment watcher
        selectedTreatments.value = []
      })

      store.setHighlightConfig({
        type: 'germplasm',
        germplasm: newValue.trim().toLowerCase(),
      })
    } else {
      store.setHighlightConfig({
        type: undefined,
      })
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

#media-mode-dropdown .v-list-subheader__text {
  flex-grow: 1;
}
</style>
