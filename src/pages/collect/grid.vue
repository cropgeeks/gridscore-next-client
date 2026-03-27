<template>
  <div v-if="trial" class="data-entry">
    <v-toolbar flat density="compact" class="justify-space-between align-center pa-1">
      <v-btn-group density="compact">
        <TraitDropdown :traits="trial.traits" @trait-cutoff-changed="e => { traitCutoff = e }" />
        <JumpToDropdown />

        <OverflowMenu
          :items="overflowItems"
          :breakpoint="smAndUp"
          :text-breakpoint="lgAndUp"
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
            <v-list-item :title="$t('formLabelPlotHighlightNothing')" :prepend-icon="mdiMarkerCancel" :active="store.storeHighlightConfig.type === undefined" :append-icon="store.storeHighlightConfig.type === undefined ? mdiCheck : undefined" @click="setHighlight(undefined)" />
            <v-list-item :title="$t('formLabelPlotHighlightPrevious')" :prepend-icon="mdiBookArrowLeft" :active="store.storeHighlightConfig.type === 'previous'" :append-icon="store.storeHighlightConfig.type === 'previous' ? mdiCheck : undefined" @click="setHighlight('previous')" />
            <v-list-item v-if="trialControls && trialControls.size > 0" :title="$t('formLabelPlotHighlightControls')" :prepend-icon="mdiCheckboxMarked" :active="store.storeHighlightConfig.type === 'controls'" :append-icon="store.storeHighlightConfig.type === 'controls' ? mdiCheck : undefined" @click="setHighlight('controls')" />
            <v-list-item v-if="trialBookmarks && trialBookmarks.size > 0" :title="$t('formLabelPlotHighlightBookmarks')" :prepend-icon="mdiBookmark" :active="store.storeHighlightConfig.type === 'bookmarks'" :append-icon="store.storeHighlightConfig.type === 'bookmarks' ? mdiCheck : undefined" @click="setHighlight('bookmarks')" />
            <v-list-item v-if="trialTreatments && trialTreatments.length > 0" :prepend-icon="mdiSprinklerFire" :active="store.storeHighlightConfig.type === 'treatments'" :append-icon="store.storeHighlightConfig.type === 'treatments' ? mdiCheck : undefined">
              <v-select
                :label="$t('formLabelPlotHighlightTreatments')"
                multiple
                density="compact"
                hide-details
                clearable
                v-model="selectedTreatments"
                :items="trialTreatments"
              >
                <template #selection="{ internalItem: item, index }">
                  <v-chip density="compact" :text="item.title" :color="highlightColors[index % highlightColors.length]" variant="flat" />
                </template>
              </v-select>
            </v-list-item>
            <v-list-item v-if="trialReps && trialReps.length > 0" :prepend-icon="mdiFormatListNumbered" :active="store.storeHighlightConfig.type === 'reps'" :append-icon="store.storeHighlightConfig.type === 'reps' ? mdiCheck : undefined">
              <v-select
                :label="$t('formLabelPlotHighlightReps')"
                multiple
                density="compact"
                hide-details
                clearable
                v-model="selectedReps"
                :items="trialReps"
              >
                <template #selection="{ internalItem: item, index }">
                  <v-chip density="compact" :text="item.title" :color="highlightColors[index % highlightColors.length]" variant="flat" />
                </template>
              </v-select>
            </v-list-item>
            <v-list-item :prepend-icon="mdiSprout" :active="store.storeHighlightConfig.type === 'germplasm'" :append-icon="store.storeHighlightConfig.type === 'germplasm' ? mdiCheck : undefined">
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

      <TrialTransactionStatusButton />

      <CellAutocomplete
        :trial="trial"
        v-model="searchMatch"
        scan-in-bottom-sheet
        min-width="200px"
        max-width="min(50vw, 250px)"
        density="compact"
        ref="searchField"
      />
    </v-toolbar>

    <DataCanvas :trial="trial" :geolocation="geolocation" :trait-cutoff="traitCutoff" ref="dataCanvas" @click:plot="selectPlot" @context:header="showContextMenu" v-if="showCanvas" />
    <DataGrid :trial="trial" :geolocation="geolocation" :trait-cutoff="traitCutoff" ref="dataGrid" @click:plot="selectPlot" @context:header="showContextMenu" v-else />

    <DataEntryModal :trial="trial" :geolocation="geolocation" ref="dataEntryModal" @data-changed="loadTrial" />

    <v-menu
      v-model="contextMenu.visible"
      :target="contextMenu.target || [contextMenu.x || 0, contextMenu.y || 0]"
      location="bottom"
      v-if="contextMenu"
    >
      <v-list
        slim
        density="compact"
      >
        <v-list-item @click="lockUnlock(false, true)" :prepend-icon="mdiLockAlert" :title="$t(contextMenu.isColumn ? 'buttonDeactivateColumn' : 'buttonDeactivateRow', getI18nParams(trial.dimensionNames))" />
        <v-list-item @click="lockUnlock(false, false)" :prepend-icon="mdiLockOpenVariant" :title="$t(contextMenu.isColumn ? 'buttonReactivateColumn' : 'buttonReactivateRow', getI18nParams(trial.dimensionNames))" />
        <template v-if="(contextMenu.isColumn ? markedColumnCount : markedRowCount) > 1">
          <v-divider />
          <v-list-item @click="lockUnlock(true, true)" :prepend-icon="mdiLockAlert" :title="$t(contextMenu.isColumn ? 'buttonDeactivateColumns' : 'buttonDeactivateRows', getI18nParams(trial.dimensionNames))">
            <template #append>
              <v-chip class="ms-3" size="small" inline :text="contextMenu.isColumn ? markedColumnCount : markedRowCount" />
            </template>
          </v-list-item>
          <v-list-item @click="lockUnlock(true, false)" :prepend-icon="mdiLockOpenVariant" :title="$t(contextMenu.isColumn ? 'buttonReactivateColumns' : 'buttonReactivateRows', getI18nParams(trial.dimensionNames))">
            <template #append>
              <v-chip class="ms-3" size="small" inline :text="contextMenu.isColumn ? markedColumnCount : markedRowCount" />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

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

    <SearchResultModal ref="searchResultModal" :list="searchResults" :i18n-params="i18nParams" v-if="searchResults && searchResults.length > 0" />
    <PlotCommentListModal :trial="trial" ref="plotCommentListModal" />

    <MediaModal :trial="trial" />
    <TrialPersonSelectModal :trial="trial" v-if="trial && hasTrialPeople" />
  </div>
</template>

<script setup lang="ts">
  import type DataGrid from '@/components/data/DataGrid.vue'
  import type DataCanvas from '@/components/data/DataCanvas.vue'
  import CellAutocomplete from '@/components/inputs/CellAutocomplete.vue'
  import DataEntryModal from '@/components/modals/DataEntryModal.vue'
  import MediaModal from '@/components/modals/MediaModal.vue'
  import TrialPersonSelectModal from '@/components/modals/TrialPersonSelectModal.vue'
  import TraitDropdown from '@/components/trial/TraitDropdown.vue'
  import ArrowDirectionGrid from '@/components/util/ArrowDirectionGrid.vue'
  import OverflowMenu, { type MenuItem } from '@/components/util/OverflowMenu.vue'
  import { categoricalColors } from '@/plugins/color'
  import { getTrialControlsCached, getTrialBookmarksCached, getTrialDataCached, getTrialRepsCached, getTrialTreatmentsCached, loadTrialData } from '@/plugins/datastore'
  import { getTrialById, setPlotsLocked } from '@/plugins/idb'
  import { MainDisplayMode, NavigationMode, ShareStatus, type CellPlus, type Geolocation, type TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiAccountMultiple, mdiBookArrowLeft, mdiBookmark, mdiCameraBurst, mdiCancel, mdiCheck, mdiCheckboxMarked, mdiCommentMultiple, mdiCursorMove, mdiFormatListNumbered, mdiHelpCircle, mdiImage, mdiLockAlert, mdiLockOpenVariant, mdiMarker, mdiMarkerCancel, mdiSprinklerFire, mdiSprout, mdiVideo } from '@mdi/js'
  import { watchIgnorable } from '@vueuse/core'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import type { XY } from '@/plugins/location'
  import { getI18nParams } from '@/plugins/formatting'

  export interface ContextMenuConfig {
    target?: Element
    x?: number
    y?: number
    visible: boolean
    isColumn: boolean
    index: number
  }

  const store = coreStore()
  const { lgAndUp, smAndUp } = useDisplay()
  const { t } = useI18n()

  const trial = ref<TrialPlus>()
  const geolocation = ref<Geolocation>()
  const traitCutoff = ref<string>()
  const jumpMenuVisible = ref(false)
  const searchResults = ref<CellPlus[]>([])
  const searchMatch = ref<CellPlus>()
  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])
  const trialControls = ref<Set<string>>(new Set())
  const trialBookmarks = ref<Set<string>>(new Set())

  const contextMenu = ref<ContextMenuConfig | undefined>()

  // Highlighting stuff
  const selectedReps = ref<string[]>([])
  const selectedTreatments = ref<string[]>([])
  const highlightSearch = ref<string>()
  const highlightColors = computed(() => store.storeIsDarkMode ? categoricalColors.HighlightDark : categoricalColors.HighlightPastel)

  // TODO: ADD!
  const dataEntryModal = useTemplateRef('dataEntryModal')
  const searchResultModal = useTemplateRef('searchResultModal')
  const plotCommentListModal = useTemplateRef('plotCommentListModal')

  const dataCanvas = useTemplateRef<typeof DataCanvas>('dataCanvas')
  const dataGrid = useTemplateRef<typeof DataGrid>('dataGrid')

  let textSynth: SpeechSynthesis | undefined = undefined
  let geolocationWatchId: number | undefined = undefined

  const i18nParams = computed(() => getI18nParams(trial.value?.dimensionNames))
  const markedColumns = computed(() => ((dataCanvas.value || dataGrid.value)?.markedColumns || []))
  const markedRows = computed(() => ((dataCanvas.value || dataGrid.value)?.markedRows || []))
  const markedColumnCount = computed(() => markedColumns.value.filter((c: boolean) => c === true).length)
  const markedRowCount = computed(() => markedRows.value.filter((c: boolean) => c === true).length)

  const hasTrialPeople = computed(() => trial.value && trial.value.people && trial.value.people.length > 0)

  const overflowItems: ComputedRef<MenuItem[]> = computed(() => {
    const result: MenuItem[] = [{
      text: t('toolbarPlotComments'),
      id: 'grid-comments',
      prependIcon: mdiCommentMultiple,
      variant: 'tonal',
      size: undefined,
      click: () => plotCommentListModal.value?.show(),
    }, {
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

  function lockUnlock (all: boolean, isLock: boolean) {
    const tr = trial.value
    if (!contextMenu.value || !tr) {
      return
    }
    const ic = contextMenu.value.isColumn
    const indices = all ? (ic ? markedColumns.value : markedRows.value).map((d: boolean, i: number) => d === true ? i : undefined).filter((d: number | undefined) => d !== undefined) : [contextMenu.value.index]

    const max = ic ? tr.layout.rows : tr.layout.columns

    const coords: XY[] = []

    for (let i = 0; i < max; i++) {
      indices.forEach((j: number) => {
        const [row, column] = ic ? [i, j] : [j, i]

        coords.push({ x: column, y: row })
      })
    }

    setPlotsLocked(tr.localId || '', coords, isLock)
      .then(() => {
        // Refresh data
        loadTrialData()
        emitter.emit('plausible-event', { key: 'plot-locked', props: { multiple: indices.length > 1, locked: isLock } })
      })
  }

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t

      updateLocalCaches()

      startGeoTracking()
    })
  }

  function showContextMenu (config: ContextMenuConfig) {
    if (trial.value?.shareStatus === ShareStatus.NOT_SHARED || trial.value?.shareStatus === ShareStatus.OWNER) {
      contextMenu.value = config
      contextMenu.value.visible = true
    } else {
      contextMenu.value = undefined
    }
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
      trialBookmarks.value = getTrialBookmarksCached()

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
    console.log('start geotracking', store.storeGpsEnabled, navigator.geolocation, geolocationWatchId)
    if (navigator.geolocation && store.storeGpsEnabled && !geolocationWatchId) {
      const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 }
      geolocationWatchId = navigator.geolocation.watchPosition(position => {
        console.log(position)
        if (position && position.coords) {
          geolocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            elevation: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
          }
        }
      }, e => {
        console.error(e)
      }, options)
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

  function setHighlight (type: 'controls' | 'reps' | 'germplasm' | 'treatments' | 'bookmarks' | 'previous' | undefined) {
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
