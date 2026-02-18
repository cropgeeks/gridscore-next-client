<template>
  <v-container fluid>
    <h1 class="text-h4 mb-3">{{ $t('pageGermplasmPerformanceTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageGermplasmPerformanceText') }}</p>

    <template v-if="trial">
      <v-row class="mt-5">
        <v-col cols="12" md="6">
          <TraitSelect
            v-model="selectedTraits"
            multiple
            :traits="trial.traits"
          />
        </v-col>
        <v-col cols="12" md="6">
          <GermplasmAutocomplete
            v-model="searchMatch"
            :trial="trial"
          />
        </v-col>
      </v-row>

      <template v-if="searchMatch">
        <v-row v-if="numericTraits && numericTraits.length > 0" class="mt-5">
          <v-col
            v-for="trait in numericTraits"
            :key="`numeric-trait-${trait.id}`"
            cols="12"
            sm="6"
            md="4"
          >
            <StatsChart
              :trial="trial"
              :trait="trait"
              :user-selection="{ type: 'germplasm', selectedItems: [searchMatch] }"
              @cell-clicked="(row: number, column: number) => showBottomSheet(row, column, trait)"
            >
              <template #card-text>
                <v-card-text>
                  <!-- @vue-ignore -->
                  <Scale
                    :show-trait-heading="false"
                    :trait="trait"
                    :trait-stats="numericTraitStats[trait.id || '']"
                    :germplasm-stats="germplasmNumericStats[trait.id || '']"
                    v-if="numericTraitStats && numericTraitStats[trait.id || ''] && numericTraitStats[trait.id || ''].count > 0"
                  />
                </v-card-text>
              </template>
            </StatsChart>
          </v-col>

          <v-col
            v-for="trait in nonNumericTraits"
            :key="`numeric-trait-${trait.id}`"
            cols="12"
            sm="6"
            md="4"
          >
            <StatsChart
              :trial="trial"
              :trait="trait"
              :user-selection="{ type: 'germplasm', selectedItems: [searchMatch] }"
            />
          </v-col>
        </v-row>
      </template>
    </template>

    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
      v-if="featuredCell && trial && featuredTrait"
    >
      <v-card :title="featuredCell.displayName || featuredCell.germplasm">
        <PlotDataInformation :trial="trial" :cell="featuredCell" :trait="featuredTrait" />
      </v-card>
    </v-bottom-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import Scale, { type BaseStats, type TraitStats } from '@/components/chart/Scale.vue'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getCell, getTrialById } from '@/plugins/idb'
  import type { TrialPlus, CellPlus, TraitPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'

  const trial = ref<TrialPlus>()
  const searchMatch = ref<string>()
  const potentialGermplasm = ref<string>()
  const hasGps = ref<boolean>(false)
  const selectedTraits = ref<TraitPlus[]>([])
  const numericTraitStats = ref<{ [index: string]: TraitStats }>({})
  const germplasmNumericStats = ref<{ [index: string]: BaseStats }>({})
  const bottomSheetVisible = ref(false)
  const featuredCell = ref<CellPlus>()
  const featuredTrait = ref<TraitPlus>()

  const route = useRoute()
  const store = coreStore()

  let trialData: { [index: string]: CellPlus } | undefined = {}

  const numericTraits = computed(() => {
    if (selectedTraits.value) {
      return selectedTraits.value.filter(t => TraitDataType.isNumeric(t.dataType) || t.dataType === TraitDataType.date)
    } else {
      return []
    }
  })
  const nonNumericTraits = computed(() => {
    if (selectedTraits.value) {
      return selectedTraits.value.filter(t => !TraitDataType.isNumeric(t.dataType) && t.dataType !== TraitDataType.date)
    } else {
      return []
    }
  })

  function updateTrialDataCache () {
    trialData = getTrialDataCached()
  }

  function showBottomSheet (row: number, column: number, trait: TraitPlus) {
    getCell(store.storeSelectedTrial || '', row, column)
      .then(cell => {
        featuredTrait.value = trait
        featuredCell.value = cell

        nextTick(() => {
          bottomSheetVisible.value = true
        })
      })
  }

  function updateNumericStats () {
    if (!trialData) {
      return
    }

    const ntss: { [index: string]: TraitStats } = {}
    numericTraits.value.forEach(t => {
      ntss[t.id || ''] = {
        min: Number.MAX_SAFE_INTEGER,
        max: -Number.MAX_SAFE_INTEGER,
        total: 0,
        avg: 0,
        count: 0,
      }
    })

    const gnss: { [index: string]: BaseStats } = {}
    numericTraits.value.forEach(t => {
      gnss[t.id || ''] = {
        total: 0,
        avg: 0,
        count: 0,
      }
    })

    Object.values(trialData).forEach(cell => {
      const isSelected = cell.germplasm === searchMatch.value

      hasGps.value ||= cell.geography !== undefined && (cell.geography.center !== undefined || cell.geography.corners !== undefined)

      numericTraits.value.forEach(t => {
        const traitData = cell.measurements[t.id || '']

        if (traitData) {
          traitData.forEach(td => {
            td.values.forEach(v => {
              if (v !== undefined) {
                const numeric = t.dataType === 'date' ? (new Date(v).getTime() / (1000 * 60 * 60 * 24)) : +v

                const gns = gnss[t.id || '']
                if (isSelected && gns) {
                  gns.count++
                  gns.total += numeric
                }

                const nts = ntss[t.id || '']

                if (nts) {
                  nts.count++
                  nts.min = Math.min(nts.min || 0, numeric)
                  nts.max = Math.max(nts.max || 0, numeric)
                  nts.total += numeric
                }
              }
            })
          })
        }
      })
    })

    Object.values(gnss).forEach(gs => {
      gs.avg = gs.total / gs.count
    })

    Object.values(ntss).forEach(ts => {
      ts.avg = ts.total / ts.count
    })

    numericTraitStats.value = ntss
    germplasmNumericStats.value = gnss
  }

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t

      if (potentialGermplasm.value !== undefined) {
        searchMatch.value = potentialGermplasm.value
      }
    })
  }

  onMounted(() => {
    const q = route.query
    if (q && q.germplasm) {
      potentialGermplasm.value = q.germplasm as string
    }

    if (store.storeSelectedTrial) {
      loadTrial()
    }

    emitter.on('trial-data-loaded', updateTrialDataCache)

    updateTrialDataCache()
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })

  watch(numericTraits, async () => updateNumericStats())
  watch(searchMatch, async () => {
    updateNumericStats()
    // updateNonNumericStats()
  })
  // watch(nonNumericTraits, async () => updateNonNumericStats())
</script>
