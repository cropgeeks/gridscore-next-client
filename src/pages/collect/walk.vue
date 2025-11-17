<template>
  <div v-if="trial">
    <DataEntryModal
      :trial="trial"
      :geolocation="geolocation"
      ref="dataEntryModal"
      @hide="reset"
      v-if="isValidConfig"
    />
    <v-container v-else>
      <h1 class="text-h4 mb-3">{{ $t('modalTitleGuidedWalk') }}</h1>

      <v-divider class="mb-3" />

      <p>{{ $t('modalTextGuidedWalk') }}</p>

      <GermplasmAutocomplete
        :trial="trial"
        class="mt-5"
        :label="$t('formLabelSelectStartingPlot')"
        v-model="searchMatch"
        ref="searchField"
      />

      <template v-if="searchMatch">
        <GuideOrderSelector
          class="mt-5"
          v-model:walk-name="guidedWalkName"
          v-model:score-width="scoreWidth"
          :row="searchMatch.row || 0"
          :column="searchMatch.column || 0"
          :layout="trial.layout"
          @order-changed="orderSelected"
        />
      </template>
    </v-container>

    <MediaModal :trial="trial" />
    <TrialPersonSelectModal :trial="trial" v-if="trial && trial.people && trial.people.length > 0" />
  </div>
</template>

<script setup lang="ts">
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import MediaModal from '@/components/modals/MediaModal.vue'
  import TrialPersonSelectModal from '@/components/modals/TrialPersonSelectModal.vue'
  import type { GuideOrderConfig } from '@/components/trial/GuideOrderSelector.vue'
  import GuideOrderSelector from '@/components/trial/GuideOrderSelector.vue'
  import { getCell, getTrialById } from '@/plugins/idb'
  import type { CellPlus, Geolocation, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'

  const route = useRoute('/collect/walk')
  const store = coreStore()

  const trial = ref<TrialPlus>()
  const geolocation = ref<Geolocation>()

  const guidedWalkName = ref<string>()
  const row = ref<number>()
  const column = ref<number>()
  const scoreWidth = ref<1 | 2>(1)
  const isValidConfig = ref(false)

  // Stuff for selection of guided walk
  const searchMatch = ref<CellPlus>()

  let textSynth: SpeechSynthesis | undefined
  let geolocationWatchId: number | undefined

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t

      if (row.value !== undefined && column.value !== undefined) {
        getCell(t.localId, row.value, column.value)
          .then(cell => {
            searchMatch.value = cell
          })
      }

      startGeoTracking()

      if (isValidConfig.value) {
        startGuidedWalk()
      }
    })
  }

  function startGeoTracking () {
    if (navigator.geolocation && store.storeGpsEnabled) {
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

  function orderSelected (order: GuideOrderConfig) {
    let x = searchMatch.value?.column || 0
    let y = searchMatch.value?.row || 0

    if (order.neighbor) {
      x = (x + (order.neighbor.column || 0)) / 2
      y = (y + (order.neighbor.row || 0)) / 2
    }

    row.value = y
    column.value = x
    guidedWalkName.value = order.order
    scoreWidth.value = order.scoreWidth

    isValidConfig.value = true

    startGuidedWalk()
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

  function startGuidedWalk () {
    nextTick(() => {
      emitter.emit('force-guided-walk', {
        row: row.value,
        column: column.value,
        walkName: guidedWalkName.value,
        scoreWidth: scoreWidth.value,
      })
    })
  }

  function reset () {
    guidedWalkName.value = undefined
    row.value = undefined
    column.value = undefined
    scoreWidth.value = 1
    searchMatch.value = undefined

    const q = route.query
    if (q) {
      if (q.guidedWalkName) {
        guidedWalkName.value = `${route.query.guidedWalkName}`
      }
      if (q.row !== undefined && q.row !== null && q.row !== '') {
        row.value = +q.row
      }
      if (q.column !== undefined && q.column !== null && q.column !== '') {
        column.value = +q.column
      }
      if (q.scoreWidth !== undefined && q.scoreWidth !== null && q.scoreWidth !== '') {
        scoreWidth.value = Math.max(2, Math.min(1, Math.round(+q.scoreWidth))) as (1 | 2)
      }

      isValidConfig.value = row.value !== undefined && column.value !== undefined && scoreWidth.value !== undefined && guidedWalkName.value !== undefined && guidedWalkName.value.trim().length > 0
    }

    if (store.storeSelectedTrial) {
      loadTrial()
    }
  }

  onMounted(() => {
    reset()

    if (store.storeVoiceFeedbackEnabled && window.speechSynthesis) {
      textSynth = window.speechSynthesis
    }

    emitter.on('tts', tts)
  })

  onBeforeUnmount(() => {
    emitter.off('tts', tts)

    if (geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(geolocationWatchId)
    }
  })
</script>
