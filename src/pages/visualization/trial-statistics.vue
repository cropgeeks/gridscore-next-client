<template>
  <v-container>
    <h1 class="text-h4 mb-3">{{ $t('pageDataStatisticsTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageDataStatisticsText') }}</p>

    <template v-if="trial && trialStats">
      <v-row dense>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiLandFields" :title="$t('widgetTrialDataStatsPlots')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.plots, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiTagMultiple" :title="$t('widgetTrialDataStatsTraits')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.traits, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiCommentMultiple" :title="$t('widgetTrialDataStatsComments')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.comments, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiFlag" :title="$t('widgetTrialDataStatsEvents')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.events, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiPencilRuler" :title="$t('widgetTrialDataStatsMeasurements')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.measurements, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiTextureBox" :title="$t('widgetTrialDataStatsArea')">
            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-badge inline v-bind="props" :content="`${totalArea.toLocaleString()} ${mapAreaTypeMap[areaType]?.unit}`" />
                </template>

                <v-list slim density="compact">
                  <v-list-item v-for="(mapAreaType, key) in mapAreaTypeMap" :key="`area-type-${key}`" :title="`${$t(mapAreaType.text)} [${mapAreaType.unit}]`" :append-icon="key === areaType ? mdiCheck : undefined" @click="areaType = (key as string)" />
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiCalendarCollapseHorizontal" :title="$t('widgetTrialDataStatsDayRange')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.dayRange, 1)" /></template></v-list-item>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          <v-list-item class="pa-4" variant="tonal" color="primary" active :prepend-icon="mdiCalendarMultiselect" :title="$t('widgetTrialDataStatsActiveDays')"><template #append><v-badge inline :content="getNumberWithSuffix(trialStats.activeDays, 1)" /></template></v-list-item>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" xl="6">
          <BarChart
            :trial="trial"
            x-title="widgetChartPersonBarCount"
            title="widgetDataPersonChartBarTitle"
            :id="`person-bar-chart-${getId()}`"
            :chart-data="trialStats.peopleTraitData"
          />
        </v-col>
        <v-col cols="12" xl="6">
          <LineChart
            :trial="trial"
            x-title="widgetChartPersonLineTime"
            y-title="widgetChartPersonLineCumulative"
            title="widgetDataPersonChartBarTitle"
            :id="`person-bar-chart-${getId()}`"
            :chart-data="trialStats.peopleTimeData"
          />
        </v-col>
        <v-col cols="12" xl="6" v-for="year in Object.keys(trialStats.calendarData)" :key="`year-heatmap-${year}`">
          <CalendarHeatmap :trial="trial" :year="+year" :chart-data="trialStats.calendarData[+year]" />
        </v-col>
        <v-col cols="12" xl="6">
          <v-card :title="$t('widgetTrialDataMapTitle')">
            <TrialPersonDataMap :trial="trial" :area-type="areaType" :overall="trialStats.peopleLocationData.overall" :person-data="trialStats.peopleLocationData.people" />
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { BarChartData } from '@/components/chart/BarChart.vue'
  import BarChart from '@/components/chart/BarChart.vue'
  import CalendarHeatmap from '@/components/chart/CalendarHeatmap.vue'
  import LineChart, { type LineChartData } from '@/components/chart/LineChart.vue'
  import TrialPersonDataMap from '@/components/trial/TrialPersonDataMap.vue'
  import { mapAreaTypeMap } from '@/plugins/constants'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import { getId } from '@/plugins/id'
  import { getTrialById } from '@/plugins/idb'
  import { convexHull, geodesicArea } from '@/plugins/location'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import type { Person, LatLng } from '@/plugins/types/gridscore'
  import { toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiCalendarCollapseHorizontal, mdiCalendarMultiselect, mdiCheck, mdiCommentMultiple, mdiFlag, mdiLandFields, mdiPencilRuler, mdiTagMultiple, mdiTextureBox } from '@mdi/js'

  export type CalendarData = { [index: number]: { [index: string]: number } }

  export interface PersonLocationData {
    bounds: LatLng[]
    area: number
  }

  interface TrialLocationData {
    overall: PersonLocationData
    people: { [index: string]: PersonLocationData }
  }

  interface TrialStats {
    plots: number
    traits: number
    measurements: number
    comments: number
    events: number
    activeDays: number
    dayRange: number
    area: number
    calendarData: CalendarData
    peopleTraitData: BarChartData
    peopleTimeData: LineChartData
    peopleLocationData: TrialLocationData
  }

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const trialData = shallowRef<{ [index: string]: CellPlus } | undefined>({})
  const areaType = ref('meter')

  const totalArea = computed(() => {
    if (trialStats.value && trialStats.value.peopleLocationData && trialStats.value.peopleLocationData.overall) {
      return mapAreaTypeMap[areaType.value]?.convert(trialStats.value.peopleLocationData.overall.area || 0) || 0
    } else {
      return 0
    }
  })

  const trialStats: ComputedRef<TrialStats | undefined> = computed(() => {
    const tr: TrialPlus | undefined = trial.value
    if (tr && trialData.value) {
      const activeDays = new Set<string>()

      const stats: TrialStats = {
        plots: Object.values(trialData.value).filter(c => c !== undefined && c !== null).length,
        traits: tr.traits.length,
        measurements: 0,
        comments: (tr.comments || []).length,
        events: (tr.events || []).length,
        activeDays: 0,
        dayRange: 0,
        area: 0,
        calendarData: {},
        peopleTraitData: {},
        peopleTimeData: {},
        peopleLocationData: {
          overall: {
            area: 0,
            bounds: [],
          },
          people: {},
        },
      }

      const personDateMap: { [index: string]: { [index: string]: number } } = {};

      (tr.people || []).forEach((p: Person) => {
        stats.peopleTraitData[p.id || ''] = {
          y: tr.traits.map(t => t.name),
          x: tr.traits.map(() => 0),
          name: p.name,
          orientation: 'h',
        }
        stats.peopleTimeData[p.id || ''] = {
          name: p.name,
          x: [],
          y: [],
        }
        personDateMap[p.id || ''] = {}
      })

      const traitMapping: { [index: string]: number } = {}
      tr.traits.forEach((t, i) => {
        traitMapping[t.id || ''] = i
      })

      Object.values(trialData.value).forEach(cell => {
        if (cell) {
          stats.comments += (cell.comments || []).length

          const peopleIds = new Set<string>()

          Object.keys(cell.measurements).forEach(t => {
            const m = cell.measurements[t]

            if (m) {
              m.forEach(mm => {
                const measurementCount = mm.values.filter(mmm => mmm !== undefined && mmm !== null && mmm !== '').length
                stats.measurements += measurementCount

                const date = toLocalDateString(mm.timestamp)
                activeDays.add(date)

                if (mm && mm.personId) {
                  const personId = mm.personId || ''

                  peopleIds.add(personId)

                  // @ts-ignore
                  stats.peopleTraitData[personId].x[traitMapping[t]]++

                  if (!personDateMap[personId]) {
                    personDateMap[personId] = {}
                  }

                  if (!personDateMap[personId][date]) {
                    personDateMap[personId][date] = 0
                  }

                  personDateMap[personId][date]++
                }

                const year = new Date(date).getFullYear()
                if (!stats.calendarData[year]) {
                  stats.calendarData[year] = {}
                }

                if (!stats.calendarData[year][date]) {
                  stats.calendarData[year][date] = measurementCount
                } else {
                  stats.calendarData[year][date] += measurementCount
                }
              })
            }
          })

          const geo = cell.geography
          if (geo) {
            if (geo.center) {
              stats.peopleLocationData.overall.bounds.push(geo.center)
            }
            if (geo.corners) {
              if (geo.corners.topLeft) {
                stats.peopleLocationData.overall.bounds.push(geo.corners.topLeft)
              }
              if (geo.corners.topRight) {
                stats.peopleLocationData.overall.bounds.push(geo.corners.topRight)
              }
              if (geo.corners.bottomRight) {
                stats.peopleLocationData.overall.bounds.push(geo.corners.bottomRight)
              }
              if (geo.corners.bottomLeft) {
                stats.peopleLocationData.overall.bounds.push(geo.corners.bottomLeft)
              }
            }

            const peopleArray = [...peopleIds]

            peopleArray.forEach(p => {
              if (!stats.peopleLocationData.people[p]) {
                stats.peopleLocationData.people[p] = {
                  area: 0,
                  bounds: [],
                }
              }

              if (geo.center) {
                stats.peopleLocationData.people[p].bounds.push(geo.center)
              }
              if (geo.corners) {
                if (geo.corners.topLeft) {
                  stats.peopleLocationData.people[p].bounds.push(geo.corners.topLeft)
                }
                if (geo.corners.topRight) {
                  stats.peopleLocationData.people[p].bounds.push(geo.corners.topRight)
                }
                if (geo.corners.bottomRight) {
                  stats.peopleLocationData.people[p].bounds.push(geo.corners.bottomRight)
                }
                if (geo.corners.bottomLeft) {
                  stats.peopleLocationData.people[p].bounds.push(geo.corners.bottomLeft)
                }
              }
            })
          }
        }
      })

      Object.keys(stats.peopleLocationData.people).forEach(p => {
        if (stats.peopleLocationData.people[p]) {
          stats.peopleLocationData.people[p].bounds = convexHull(stats.peopleLocationData.people[p].bounds.map(ll => {
            return { x: ll.lng || 0, y: ll.lat || 0 }
          })).map(xy => {
            return {
              lat: xy?.y,
              lng: xy?.x,
            }
          })

          stats.peopleLocationData.people[p].area = geodesicArea(stats.peopleLocationData.people[p].bounds)
        }
      })

      if (stats.peopleLocationData.overall) {
        stats.peopleLocationData.overall.bounds = convexHull(stats.peopleLocationData.overall.bounds.map(ll => {
          return { x: ll.lng || 0, y: ll.lat || 0 }
        })).map(xy => {
          return {
            lat: xy?.y,
            lng: xy?.x,
          }
        })

        stats.peopleLocationData.overall.area = geodesicArea(stats.peopleLocationData.overall.bounds)
      }

      stats.activeDays = activeDays.size
      const days = [...activeDays].sort((a, b) => a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }))

      if (days.length > 0 && days[0] !== undefined && days[days.length - 1] !== undefined) {
        // @ts-ignore
        stats.dayRange = (new Date(days[days.length - 1]).getTime() - new Date(days[0]).getTime()) / (24 * 60 * 60 * 1000) + 1
      }

      Object.keys(personDateMap).forEach(personId => {
        const personData = personDateMap[personId]

        if (personData) {
          const dates = Object.keys(personData)
          dates.sort((a, b) => a.localeCompare(b))

          const values = dates.map(d => personData[d] || 0)

          for (let i = 1; i < values.length; i++) {
            // @ts-ignore
            values[i] += values[i - 1]
          }

          const pd = stats.peopleTimeData[personId]

          if (pd) {
            pd.x = dates
            pd.y = values
          }
        }
      })

      return stats
    } else {
      return undefined
    }
  })

  onMounted(() => {
    getTrialById(store.storeSelectedTrial || '')
      .then(t => {
        trial.value = t

        trialData.value = getTrialDataCached()
      })
  })
</script>
