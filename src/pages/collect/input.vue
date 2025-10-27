<template>
  <v-container v-if="trial" class="data-entry">
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          :text="$t('toolbarPlotMediaMode')"
          :active="store.storeMediaMode !== undefined"
          active-color="primary"
          prepend-icon="mdi-camera-burst"
          variant="tonal"
        />
      </template>

      <v-list slim density="compact" min-width="300" max-width="min(500px, 75vw)">
        <v-list-subheader :title="$t('menuItemMediaModeHeading')" />
        <v-list-item :title="$t('menuItemMediaModeDisabled')" prepend-icon="mdi-cancel" :append-icon="store.storeMediaMode === undefined ? 'mdi-check' : undefined" @click="store.setMediaMode(undefined)" />
        <v-list-item :title="$t('menuItemMediaModeImage')" prepend-icon="mdi-image" :append-icon="store.storeMediaMode === 'image' ? 'mdi-check' : undefined" @click="store.setMediaMode('image')" />
        <v-list-item :title="$t('menuItemMediaModeVideo')" prepend-icon="mdi-video" :append-icon="store.storeMediaMode === 'video' ? 'mdi-check' : undefined" @click="store.setMediaMode('video')" />
      </v-list>
    </v-menu>

    <GermplasmAutocomplete
      :trial="trial"
      class="mt-5"
      v-model="searchMatch"
      ref="searchField"
    />

    <DataEntryModal :trial="trial" :geolocation="geolocation" ref="dataEntryModal" @data-changed="loadTrial" @hide="autofocus" />

    <MediaModal :trial="trial" @hide="autofocus" />
  </v-container>
</template>

<script setup lang="ts">
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import DataEntryModal from '@/components/modals/DataEntryModal.vue'
  import MediaModal from '@/components/modals/MediaModal.vue'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getTrialById } from '@/plugins/idb'
  import type { CellPlus, Geolocation, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const geolocation = ref<Geolocation>()
  const searchMatch = ref<CellPlus>()

  const dataEntryModal = useTemplateRef('dataEntryModal')
  const searchField = useTemplateRef('searchField')

  let geolocationWatchId: number | undefined

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t

      startGeoTracking()

      updateLocalCaches()
    })
  }

  function autofocus () {
    nextTick(() => {
      searchField.value?.focus()
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

      trial.value.traits.forEach(t => {
        t.progress = t.progress ? (100 * t.progress / total) : 0
      })
    }
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

  function selectPlot (row: number, column: number) {
    if (store.storeMediaMode !== undefined) {
      emitter.emit('tag-media', row, column, store.storeMediaMode)
    } else {
      dataEntryModal.value?.show(row, column)
    }
  }

  watch(searchMatch, async newValue => {
    if (newValue) {
      selectPlot(newValue.row || 0, newValue.column || 0)
      searchMatch.value = undefined
    }
  })

  onMounted(() => {
    loadTrial()
  })

  onBeforeUnmount(() => {
    if (geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(geolocationWatchId)
    }
  })
</script>
