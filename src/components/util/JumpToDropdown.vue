<template>
  <v-menu v-model="menuShown">
    <template #activator="{ props }">
      <ResponsiveButton
        v-bind="props"
        variant="tonal"
        :prepend-icon="mdiArrowExpandAll"
        :text="$t('toolbarJumpTo')"
      />
    </template>

    <v-sheet class="pa-3">
      <ArrowDirectionGrid
        tag="div"
        @direction="scrollTo"
        @center="scrollTo('center')"
        :center-icon="mdiCircle"
      />

      <div class="d-flex flex-column ga-3 mt-5">
        <v-btn @click="scrollTo('gps')" v-if="store.storeGpsEnabled" :text="$t('buttonGPS')" :prepend-icon="mdiMapMarker" />
        <v-btn @click="showMarkedPlots" v-if="hasMarkedPlots" :text="$t('buttonMarkedPlots')" :prepend-icon="mdiPlaylistCheck" />
      </div>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { CellPlus } from '@/plugins/types/client'
  import type { Cell } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { mdiArrowExpandAll, mdiCircle, mdiMapMarker, mdiPlaylistCheck } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const menuShown = ref(false)
  const markedPlots = ref<Set<string>>(new Set())

  const hasMarkedPlots = computed(() => markedPlots.value.size > 0)

  function scrollTo (direction: string) {
    emitter.emit('jump-to-corner', direction)
  }

  function resetCellCache () {
    const data = getTrialDataCached()
    const tempSet = new Set<string>()

    if (data) {
      Object.values(data).forEach(c => {
        if (c.isMarked) {
          tempSet.add(`${c.row}|${c.column}`)
        }
      })
    }

    markedPlots.value = tempSet
  }

  function showMarkedPlots () {
    const data = getTrialDataCached()

    const list: CellPlus[] = []

    if (data) {
      markedPlots.value.forEach(c => {
        const cell = data[c]

        if (cell) {
          list.push({
            row: cell.row || 0,
            column: cell.column || 0,
            displayName: cell.displayName,
            rep: cell.rep,
            germplasm: cell.germplasm,
            displayRow: cell.displayRow,
            displayColumn: cell.displayColumn,
            isMarked: cell.isMarked,
            measurements: {},
            comments: [],
            categories: cell.categories,
          })
        }
      })

      emitter.emit('show-search-results', list)
    }
  }

  function updateCellCache (row: number, column: number, trialId: string, cell: Cell) {
    if (cell.isMarked) {
      markedPlots.value.add(`${row}|${column}`)
    } else {
      markedPlots.value.delete(`${row}|${column}`)
    }
  }

  onMounted(() => {
    emitter.on('plot-cache-changed', updateCellCache)
    emitter.on('trial-data-loaded', resetCellCache)

    resetCellCache()
  })

  onBeforeUnmount(() => {
    emitter.off('plot-cache-changed', updateCellCache)
    emitter.off('trial-data-loaded', resetCellCache)
  })
</script>
