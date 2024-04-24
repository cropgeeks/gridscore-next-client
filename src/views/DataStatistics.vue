<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageDataStatisticsTitle') }}</h1>
      <p>{{ $t('pageDataStatisticsText') }}</p>

      <b-row>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelDataStatsTrial')" label-for="trials">
            <b-form-select id="trials" multiple v-model="selectedTrials" :options="trialOptions" />
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
                <h3 class="mb-0" :style="{ color: storeTraitColors[0] }"><BIconUiChecksGrid /></h3>
                <span>{{ $t('widgetTrialDataStatsPlots', { count: (stats[trial.localId].plots || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[1] }"><BIconTags /></h3>
                <span>{{ $t('widgetTrialDataStatsTraits', { count: (stats[trial.localId].traits || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[2] }"><BIconChatLeftText /></h3>
                <span>{{ $t('widgetTrialDataStatsComments', { count: (stats[trial.localId].comments || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[3] }"><BIconFlag /></h3>
                <span>{{ $t('widgetTrialDataStatsEvents', { count: (stats[trial.localId].events || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 offset-xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[4] }"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-123" viewBox="0 0 16 16">
                  <path d="M2.873 11.297V4.142H1.699L0 5.379v1.137l1.64-1.18h.06v5.961zm3.213-5.09v-.063c0-.618.44-1.169 1.196-1.169.676 0 1.174.44 1.174 1.106 0 .624-.42 1.101-.807 1.526L4.99 10.553v.744h4.78v-.99H6.643v-.069L8.41 8.252c.65-.724 1.237-1.332 1.237-2.27C9.646 4.849 8.723 4 7.308 4c-1.573 0-2.36 1.064-2.36 2.15v.057zm6.559 1.883h.786c.823 0 1.374.481 1.379 1.179.01.707-.55 1.216-1.421 1.21-.77-.005-1.326-.419-1.379-.953h-1.095c.042 1.053.938 1.918 2.464 1.918 1.478 0 2.642-.839 2.62-2.144-.02-1.143-.922-1.651-1.551-1.714v-.063c.535-.09 1.347-.66 1.326-1.678-.026-1.053-.933-1.855-2.359-1.845-1.5.005-2.317.88-2.348 1.898h1.116c.032-.498.498-.944 1.206-.944.703 0 1.206.435 1.206 1.07.005.64-.504 1.106-1.2 1.106h-.75z"/>
                </svg></h3>
                <span>{{ $t('widgetTrialDataStatsMeasurements', { count: (stats[trial.localId].measurements || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[5] }"><BIconBoundingBoxCircles /></h3>
                <span v-if="stats[trial.localId].area">{{ $t('widgetTrialDataStatsArea', { area: (areaUnits[areaUnit].convert(stats[trial.localId].area) || 0).toLocaleString(), unit: areaUnits[areaUnit].unit }) }}</span>
                <span v-else>{{ $t('widgetTrialDataStatsAreaUnknown') }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[7] }"><BIconCalendarRangeFill /></h3>
                <span>{{ $t('widgetTrialDataStatsDayRange', { count: (stats[trial.localId].dayRange || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
            <b-col cols=6 md=4 lg=3 xl=2 class="mb-3">
              <b-card class="h-100 bg-dark text-light">
                <h3 class="mb-0" :style="{ color: storeTraitColors[8] }"><BIconCalendarDateFill /></h3>
                <span>{{ $t('widgetTrialDataStatsActiveDays', { count: (stats[trial.localId].activeDays || 0).toLocaleString() }) }}</span>
              </b-card>
            </b-col>
          </b-row>
          <b-row v-if="stats[trial.localId] && stats[trial.localId].measurements">
            <b-col cols=12 md=6 v-if="chartData && chartData[trial.localId] && Object.keys(chartData[trial.localId]).length > 0">
              <div v-for="year in Object.keys(chartData[trial.localId])" :key="`trial-${trial.localId}-year-${year}`">
                <h3>{{ year }}</h3>
                <DataCalendarHeatmapChart :chartData="chartData[trial.localId][year]" />
              </div>
            </b-col>
            <b-col cols=12 md=6>
              <div :ref="`map-${trial.localId}`" class="data-map" />
            </b-col>
          </b-row>
        </div>
      </template>
    </b-container>
  </div>
</template>

<script>
import DataCalendarHeatmapChart from '@/components/charts/DataCalendarHeatmapChart'
import { BIconUiChecksGrid, BIconTags, BIconBoundingBoxCircles, BIconChatLeftText, BIconFlag, BIconCalendarRangeFill, BIconCalendarDateFill } from 'bootstrap-vue'

import { mapGetters } from 'vuex'
import { getTrialData, getTrials } from '@/plugins/idb'
import { toLocalDateString } from '@/plugins/misc'
import { convexHull, geodesicArea } from '@/plugins/location'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Set the leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

let plotInfo = {}

export default {
  components: {
    DataCalendarHeatmapChart,
    BIconUiChecksGrid,
    BIconTags,
    BIconCalendarDateFill,
    BIconCalendarRangeFill,
    BIconBoundingBoxCircles,
    BIconChatLeftText,
    BIconFlag
  },
  data: function () {
    return {
      trials: [],
      selectedTrials: [],
      chartData: null,
      stats: {},
      areaUnit: 'meter'
    }
  },
  computed: {
    ...mapGetters([
      'storeDarkMode',
      'storeMapLayer',
      'storeTraitColors'
    ]),
    trialOptions: function () {
      return this.trials.map(t => {
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
      this.updateThemeLayer()
    },
    selectedTrials: async function (newValue) {
      const calendarData = {}
      const tempStats = {}
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
        plotInfo[trial.localId] = []

        Object.values(d).forEach(plot => {
          Object.keys(plot.measurements).forEach(t => {
            const m = plot.measurements[t]

            if (m.length > 0) {
              tempStats[trial.localId].traits.add(t)
              tempStats[trial.localId].plots.add(`${t.localId}|${plot.row}|${plot.column}`)
            }

            m.forEach(mm => {
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
            plotInfo[trial.localId].push({
              corners: plot.geography.corners,
              center: plot.geography.center
            })
          }

          if (plot.comments) {
            tempStats[trial.localId].comments += plot.comments.length
          }
        })

        // Create the geojson and the layer, then add to the map
        if (plotInfo[trial.localId]) {
          const points = []

          plotInfo[trial.localId].forEach(p => {
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

          plotInfo[trial.localId] = {
            // plots: plotInfoToGeoJson(plotInfo[trial.localId], false),
            plots: null,
            points: points
          }
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
      }

      this.chartData = calendarData
      this.stats = tempStats

      this.$nextTick(() => this.updateMaps())
    }
  },
  methods: {
    updateThemeLayer: function () {
      if (this.themeLayer) {
        this.themeLayer.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${this.storeDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`)
      }
    },
    updateMaps: function () {
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
        this.themeLayer = L.tileLayer(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${this.storeDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`, {
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
            map.addLayer(this.themeLayer)
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
          'Theme-based': this.themeLayer,
          OpenStreetMap: openstreetmap,
          'Esri WorldImagery': satellite
        }

        L.control.layers(baseMaps).addTo(map)

        // Listen for layer changes and store the user selection in the store
        map.on('baselayerchange', e => {
          switch (e.name) {
            case 'Theme-based':
              this.$store.dispatch('setMapLayer', 'theme')
              break
            case 'OpenStreetMap':
              this.$store.dispatch('setMapLayer', 'osm')
              break
            case 'Esri WorldImagery':
              this.$store.dispatch('setMapLayer', 'satellite')
              break
          }
        })

        // Disable zoom until focus gained, disable when blur
        map.scrollWheelZoom.disable()
        map.on('focus', () => map.scrollWheelZoom.enable())
        map.on('blur', () => map.scrollWheelZoom.disable())

        const bounds = L.latLngBounds()

        if (pi.plots) {
          const geoJsonLayer = L.geoJSON(pi.plots, {
            style: (feature) => {
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

        if (pi.points && pi.points.length > 0) {
          const convexHullPoints = convexHull(pi.points.map(p => {
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

          L.polygon(pts).addTo(map)
        }

        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] })
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
