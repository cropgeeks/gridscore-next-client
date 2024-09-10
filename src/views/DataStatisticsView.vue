<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageDataStatisticsTitle') }}</h1>
      <p>{{ $t('pageDataStatisticsText') }}</p>

      <b-row>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelTrialSelectorSearch')" :description="$t('formDescriptionTrialSelectorSearch')" label-for="search-term">
            <b-form-input lazy trim v-model.trim.lazy="searchTerm" id="search-term" type="search" />
          </b-form-group>
          <b-form-group :label="$t('formLabelDataStatsTrial')" label-for="trials">
            <b-form-select id="trials" multiple v-model="selectedTrials" :options="filteredTrials" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelDataStatsAreaUnit')" label-for="areaunit">
            <b-form-select id="areaunit" v-model="areaUnit" :options="areaUnitOptions" />
          </b-form-group>
        </b-col>
      </b-row>

      <template v-if="selectedTrials && selectedTrials.length > 0">
        <div v-for="trial in selectedTrials" :key="`trial-${trial.localId}`">
          <hr />

          <h2>{{ trial.name }}</h2>

          <b-row class="my-3 text-center" v-if="stats[trial.localId]">
            <b-col cols=6 md=4 lg=3 xl=2 offset-xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[0 % storeTraitColors.length] }"><IBiUiChecksGrid /></h3>
                <span>{{ $t('widgetTrialDataStatsPlots', { count: (stats[trial.localId].plots || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[1 % storeTraitColors.length] }"><IBiTags /></h3>
                <span>{{ $t('widgetTrialDataStatsTraits', { count: (stats[trial.localId].traits || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[2 % storeTraitColors.length] }"><IBiChatLeftText /></h3>
                <span>{{ $t('widgetTrialDataStatsComments', { count: (stats[trial.localId].comments || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[3 % storeTraitColors.length] }"><IBiFlag /></h3>
                <span>{{ $t('widgetTrialDataStatsEvents', { count: (stats[trial.localId].events || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 offset-xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[4 % storeTraitColors.length] }"><IBi123 /></h3>
                <span>{{ $t('widgetTrialDataStatsMeasurements', { count: (stats[trial.localId].measurements || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[5 % storeTraitColors.length] }"><IBiBoundingBoxCircles /></h3>
                <span v-if="stats[trial.localId].area">{{ $t('widgetTrialDataStatsArea', { area: (areaUnits[areaUnit].convert(stats[trial.localId].area) || 0).toLocaleString(), unit: areaUnits[areaUnit].unit }) }}</span>
                <span v-else>{{ $t('widgetTrialDataStatsAreaUnknown') }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[7 % storeTraitColors.length] }"><IBiCalendarRangeFill /></h3>
                <span>{{ $t('widgetTrialDataStatsDayRange', { count: (stats[trial.localId].dayRange || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[8 % storeTraitColors.length] }"><IBiCalendarDateFill /></h3>
                <span>{{ $t('widgetTrialDataStatsActiveDays', { count: (stats[trial.localId].activeDays || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
          </b-row>
          <b-row v-if="stats[trial.localId] && stats[trial.localId].measurements">
            <b-col cols=12 md=6 v-if="personBarData && personBarData[trial.localId] && Object.keys(personBarData[trial.localId]).length > 0">
              <DataPersonBarChart :chartData="personBarData[trial.localId]" />
            </b-col>
            <b-col cols=12 md=6 v-if="personLineData && personLineData[trial.localId] && Object.keys(personLineData[trial.localId]).length > 0">
              <DataPersonLineChart :chartData="personLineData[trial.localId]" />
            </b-col>
            <b-col cols=12 md=6 v-if="chartData && chartData[trial.localId] && Object.keys(chartData[trial.localId]).length > 0">
              <h3>{{ $t('widgetTrialDataCalendarTitle') }}</h3>
              <div v-for="year in Object.keys(chartData[trial.localId])" :key="`trial-${trial.localId}-year-${year}`">
                <h4>{{ year }}</h4>
                <DataCalendarHeatmapChart :chartData="chartData[trial.localId][year]" />
              </div>
            </b-col>
            <b-col cols=12 md=6>
              <h3>{{ $t('widgetTrialDataMapTitle') }}</h3>
              <div :ref="`map-${trial.localId}`" class="data-map" />
            </b-col>
          </b-row>
        </div>
      </template>
    </b-container>
  </div>
</template>

<script>
import DataCalendarHeatmapChart from '@/components/charts/DataCalendarHeatmapChart.vue'

import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialData, getTrials } from '@/plugins/idb'
import { toLocalDateString } from '@/plugins/misc'
import { convexHull, geodesicArea } from '@/plugins/location'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { categoricalColors } from '@/plugins/color'

// Set the leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
})

let plotInfo = {}

export default {
  components: {
    DataCalendarHeatmapChart
  },
  data: function () {
    return {
      trials: [],
      selectedTrials: [],
      searchTerm: null,
      personBarData: null,
      personLineData: null,
      chartData: null,
      stats: {},
      polygons: {},
      areaUnit: 'meter'
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeMapLayer',
      'storeTraitColors',
      'storeSelectedTrial'
    ]),
    filteredTrials: function () {
      let result = []
      if (this.searchTerm && this.trials && this.trials.length > 0 && this.searchTerm !== '') {
        result = this.trials.filter(t => {
          const lower = this.searchTerm.toLowerCase()
          // Check if the name matches
          if (t.name.toLowerCase().includes(lower)) {
            return true
          }
          // Check if the description matches
          if (t.description && t.description.toLowerCase().includes(lower)) {
            return true
          }
          // Check if any of the trait names matches
          if (t.traits.map(t => t.name).join('|').toLowerCase().includes(lower)) {
            return true
          }
          // Check if it matches any of the share codes
          if (t.shareCodes) {
            if (t.shareCodes.viewerCode === this.searchTerm) {
              return true
            }
            if (t.shareCodes.editorCode === this.searchTerm) {
              return true
            }
            if (t.shareCodes.ownerCode === this.searchTerm) {
              return true
            }
          }

          return false
        })
      } else {
        result = this.trials
      }

      return result.map(t => {
        return {
          text: t.name,
          value: t
        }
      })
    },
    areaUnitOptions: function () {
      if (this.areaUnits) {
        const result = []

        Object.keys(this.areaUnits).forEach(au => {
          result.push({
            text: this.areaUnits[au].text,
            value: au
          })
        })

        result.sort((a, b) => a.text.localeCompare(b.text))

        return result
      } else {
        return []
      }
    },
    areaUnits: function () {
      return {
        meter: {
          text: this.$t('areaUnitMeter'),
          convert: (v) => v,
          unit: 'm²'
        },
        kilometer: {
          text: this.$t('areaUnitKilometer'),
          convert: (v) => v / 1_000_000.0,
          unit: 'km²'
        },
        hectare: {
          text: this.$t('areaUnitHectare'),
          convert: (v) => v / 10_000.0,
          unit: 'hectare'
        },
        acre: {
          text: this.$t('areaUnitAcre'),
          convert: (v) => v * 0.000247,
          unit: 'acres'
        },
        miles: {
          text: this.$t('areaUnitMiles'),
          convert: (v) => v * 3.861e-7,
          unit: 'sq mi'
        },
        foot: {
          text: this.$t('areaUnitFoot'),
          convert: (v) => v * 10.76391,
          unit: 'sq ft'
        },
        yard: {
          text: this.$t('areaUnitYard'),
          convert: (v) => v * 1.19599,
          unit: 'sq yd'
        }
      }
    }
  },
  watch: {
    storeDarkMode: function () {
      this.updateThemeLayers()
    },
    selectedTrials: async function (newValue) {
      const calendarData = {}
      const tempStats = {}
      const personBarData = {}
      const personLineData = {}
      plotInfo = {}

      for (const trial of newValue) {
        const d = await getTrialData(trial.localId)

        tempStats[trial.localId] = {
          plots: new Set(),
          traits: new Set(),
          measurements: 0,
          comments: (trial.comments || []).length,
          events: (trial.events || []).length,
          activeDays: new Set(),
          area: 0,
          areaUnit: 'meter'
        }
        calendarData[trial.localId] = {}
        plotInfo[trial.localId] = {
          overall: []
        }
        personBarData[trial.localId] = {}
        personLineData[trial.localId] = {}

        if (trial.people && trial.people.length > 0) {
          trial.people.forEach(p => {
            plotInfo[trial.localId][p.id] = []

            personBarData[trial.localId][p.id] = {
              name: p.name,
              y: trial.traits.map(t => t.name),
              x: trial.traits.map(() => 0),
              type: 'bar',
              orientation: 'h'
            }
            personLineData[trial.localId][p.id] = {
              name: p.name,
              mode: 'lines+markers',
              type: 'scatter',
              marker: {
                size: 3
              },
              x: [],
              y: [],
              dateMap: {}
            }
          })
        }

        const traitMapping = {}

        trial.traits.forEach((t, i) => {
          traitMapping[t.id] = i
        })

        Object.values(d).forEach(plot => {
          const people = new Set()

          Object.keys(plot.measurements).forEach(t => {
            const m = plot.measurements[t]

            if (m.length > 0) {
              tempStats[trial.localId].traits.add(t)
              tempStats[trial.localId].plots.add(`${t.localId}|${plot.row}|${plot.column}`)
            }

            m.forEach(mm => {
              if (trial.people && trial.people.length > 0 && mm.personId) {
                personBarData[trial.localId][mm.personId].x[traitMapping[t]]++

                const date = toLocalDateString(mm.timestamp)

                if (!personLineData[trial.localId][mm.personId].dateMap[date]) {
                  personLineData[trial.localId][mm.personId].dateMap[date] = 0
                }

                personLineData[trial.localId][mm.personId].dateMap[date]++

                people.add(mm.personId)
              }

              const date = toLocalDateString(mm.timestamp)
              tempStats[trial.localId].activeDays.add(date)
              const d = new Date(date)
              const year = d.getFullYear()

              tempStats[trial.localId].measurements += mm.values.length

              if (!calendarData[trial.localId][year]) {
                calendarData[trial.localId][year] = new Map()
              }

              if (!calendarData[trial.localId][year].get(date)) {
                calendarData[trial.localId][year].set(date, 1)
              } else {
                calendarData[trial.localId][year].set(date, calendarData[trial.localId][year].get(date) + 1)
              }
            })
          })

          if (plot.geography && (plot.geography.corners || plot.geography.center)) {
            plotInfo[trial.localId].overall.push({
              corners: plot.geography.corners,
              center: plot.geography.center
            })

            const peopleArray = [...people]

            peopleArray.forEach(person => plotInfo[trial.localId][person].push({
              corners: plot.geography.corners,
              center: plot.geography.center
            }))
          }

          if (plot.comments) {
            tempStats[trial.localId].comments += plot.comments.length
          }
        })

        // Create the geojson and the layer, then add to the map
        if (plotInfo[trial.localId]) {
          Object.keys(plotInfo[trial.localId]).forEach(person => {
            const points = []

            plotInfo[trial.localId][person].forEach(p => {
              if (p.center) {
                points.push(p.center)
              } else if (p.corners) {
                if (p.corners.topLeft) {
                  points.push(p.corners.topLeft)
                }
                if (p.corners.topRight) {
                  points.push(p.corners.topRight)
                }
                if (p.corners.bottomRight) {
                  points.push(p.corners.bottomRight)
                }
                if (p.corners.bottomLeft) {
                  points.push(p.corners.bottomLeft)
                }
              }
            })

            plotInfo[trial.localId][person] = {
              // plots: plotInfoToGeoJson(plotInfo[trial.localId], false),
              plots: null,
              points
            }
          })
        }

        const days = [...tempStats[trial.localId].activeDays].sort((a, b) => a.localeCompare(b))

        let daySpan = 0

        if (days.length > 0) {
          daySpan = (new Date(days[days.length - 1]).getTime() - new Date(days[0]).getTime()) / (24 * 60 * 60 * 1000) + 1
        }

        tempStats[trial.localId] = {
          plots: tempStats[trial.localId].plots.size,
          traits: tempStats[trial.localId].traits.size,
          measurements: tempStats[trial.localId].measurements,
          comments: tempStats[trial.localId].comments,
          events: tempStats[trial.localId].events,
          activeDays: tempStats[trial.localId].activeDays.size,
          dayRange: daySpan,
          area: 0,
          areaUnit: null
        }

        Object.values(personLineData[trial.localId]).forEach(pd => {
          const dates = Object.keys(pd.dateMap)
          dates.sort((a, b) => a.localeCompare(b))

          const values = dates.map(d => pd.dateMap[d])

          for (let i = 1; i < values.length; i++) {
            values[i] += values[i - 1]
          }

          pd.x = dates
          pd.y = values
          delete pd.dateMap
        })
      }

      this.chartData = calendarData
      this.personBarData = personBarData
      this.personLineData = personLineData
      this.stats = tempStats
      this.polygons = {}

      this.$nextTick(() => this.updateMaps())
    }
  },
  methods: {
    updateThemeLayers: function () {
      if (this.themeLayers) {
        this.themeLayers.forEach(tl => tl.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${this.storeDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`))
      }
    },
    updateMaps: function () {
      this.themeLayers = []

      Object.keys(plotInfo).forEach(trialId => {
        const pi = plotInfo[trialId]

        if (!this.$refs[`map-${trialId}`] || this.$refs[`map-${trialId}`].length < 1) {
          return
        }

        const div = this.$refs[`map-${trialId}`][0]

        const map = L.map(div)

        map.setView([22.5937, 2.1094], 3)

        // Add OSM as the default
        const openstreetmap = L.tileLayer('//tile.openstreetmap.org/{z}/{x}/{y}.png', {
          id: 'OpenStreetMap',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 21,
          maxNativeZoom: 19
        })
        const themeLayer = L.tileLayer(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${this.storeDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`, {
          id: this.storeDarkMode ? 'Esri Dark Gray Base' : 'Esri Light Gray Base',
          attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community',
          maxZoom: 21,
          maxNativeZoom: 15
        })
        // Add an additional satellite layer
        const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          id: 'Esri WorldImagery',
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 21,
          maxNativeZoom: 19
        })

        switch (this.storeMapLayer) {
          case 'theme':
            map.addLayer(themeLayer)
            break
          case 'satellite':
            map.addLayer(satellite)
            break
          case 'osm':
          default:
            map.addLayer(openstreetmap)
            break
        }

        const baseMaps = {
          'Theme-based': themeLayer,
          OpenStreetMap: openstreetmap,
          'Esri WorldImagery': satellite
        }

        this.themeLayers.push(themeLayer)

        L.control.layers(baseMaps).addTo(map)

        // Listen for layer changes and store the user selection in the store
        map.on('baselayerchange', e => {
          switch (e.name) {
            case 'Theme-based':
              this.coreStore.setMapLayer('theme')
              break
            case 'OpenStreetMap':
              this.coreStore.setMapLayer('osm')
              break
            case 'Esri WorldImagery':
              this.coreStore.setMapLayer('satellite')
              break
          }
        })

        // Disable zoom until focus gained, disable when blur
        map.scrollWheelZoom.disable()
        map.on('focus', () => map.scrollWheelZoom.enable())
        map.on('blur', () => map.scrollWheelZoom.disable())

        const bounds = L.latLngBounds()

        if (pi.overall.plots) {
          const geoJsonLayer = L.geoJSON(pi.plots, {
            style: () => {
              return {
                fillColor: '#00a0f1',
                color: '#00a0f1',
                weight: 1
              }
            }
          })

          map.addLayer(geoJsonLayer)

          // Get the bounds and fit the map to them
          const gjb = geoJsonLayer.getBounds()

          if (gjb & gjb.isValid()) {
            bounds.extend(gjb)
          }
        }

        const people = this.trials.find(t => t.localId === trialId).people

        let personIndex = 0
        Object.keys(pi).forEach(person => {
          const personData = pi[person]

          if (personData.points && personData.points.length > 0) {
            const convexHullPoints = convexHull(personData.points.map(p => {
              return {
                x: p.lng,
                y: p.lat
              }
            }))

            this.stats[trialId].areaUnit = 'meter'
            this.stats[trialId].area = geodesicArea(convexHullPoints.map(p => { return { lng: p.x, lat: p.y } }))

            const pts = []

            convexHullPoints.forEach(e => {
              bounds.extend([e.y, e.x])
              pts.push([e.y, e.x])
            })

            const personObject = people.find(p => p.id === person)

            const polygon = L.polygon(pts, personObject ? { color: categoricalColors.D3schemeCategory10[(personIndex++) % categoricalColors.D3schemeCategory10.length] } : null)

            const displayValue = `${personObject ? personObject.name : 'Overall'}: ${(this.areaUnits[this.areaUnit].convert(this.stats[trialId].area) || 0).toLocaleString()}`
            polygon.bindTooltip(`${displayValue} ${this.areaUnits[this.areaUnit].unit}`, {
              permanent: !personObject,
              direction: !personObject ? 'center' : 'top',
              sticky: !!personObject
            })

            polygon.addTo(map)
          }
        })

        if (bounds && bounds.isValid()) {
          const size = map.getSize()
          map.fitBounds(bounds, { padding: [size.x / 4, size.y / 4] })
        }
      })
    }
  },
  mounted: function () {
    getTrials()
      .then(result => {
        if (result) {
          result.sort((a, b) => a.name.localeCompare(b.name))
          this.trials = result

          if (this.storeSelectedTrial) {
            this.selectedTrials = this.trials.filter(t => t.localId === this.storeSelectedTrial)
          }
        }
      })
  }
}
</script>

<style scoped>
.data-map {
  height: 500px;
}
</style>
