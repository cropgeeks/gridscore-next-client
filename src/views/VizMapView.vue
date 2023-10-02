<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageVisualizationMapTitle') }}</h1>
      <p>{{ $t('pageVisualizationMapText') }}</p>
    </b-container>

    <div class="data-map" ref="map" />

    <div v-if="selectedFeature" ref="popupContent">
      <h4>{{ selectedFeature.displayName }}</h4>
      <p class="text-muted">{{ $t('pageVisualizationMapPlotInfo', { row: selectedFeature.row + 1, column: selectedFeature.column + 1 }) }}</p>

      <div v-if="selectedFeature.measurements">
        <section v-for="(trait, traitId) in traitMap" :key="`trait-section-${traitId}`" class="mt-3">
          <h5 class="mb-1 mr-3">
            <span :style="{ color: trait.color }"><TraitIcon :trait="trait" /> {{ trait.name }}</span>
          </h5>
          <b-list-group class="map-measurement-list" v-if="selectedFeature.measurements[traitId] && selectedFeature.measurements[traitId].length > 0">
            <b-list-group-item class="flex-column align-items-start" v-for="(measure, index) in selectedFeature.measurements[traitId]" :key="`selected-measure-${traitId}-${index}`">
              <div class="d-flex w-100 justify-content-between align-items-center">
                <template v-if="trait.dataType === 'categorical'">
                  {{ measure.values.map(v => trait.restrictions.categories[v]).join(', ') }}
                </template>
                <template v-else>
                  {{ measure.values.join(', ') }}
                </template>
                <small v-b-tooltip="new Date(measure.timestamp).toLocaleString()"><BIconCalendar3 /> {{ getDaysAgoIn(measure.timestamp) }}</small>
              </div>
            </b-list-group-item>
          </b-list-group>
          <p v-else>{{ $t('pageVisualizationMapNoTraitData') }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { plotInfoToGeoJson } from '@/plugins/location'
import { BIconCalendar3 } from 'bootstrap-vue'
import { getTrialDataCached } from '@/plugins/datastore'
import { getTrialById } from '@/plugins/idb'
import TraitIcon from '@/components/icons/TraitIcon'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'

const emitter = require('tiny-emitter/instance')

require('leaflet.locatecontrol')

// Set the leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

export default {
  components: {
    BIconCalendar3,
    TraitIcon
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeDarkMode',
      'storeMapLayer'
    ]),
    traitMap: function () {
      const result = {}
      if (this.trial) {
        this.trial.traits.forEach((t, i) => {
          result[t.id] = t
        })
      }
      return result
    }
  },
  data: function () {
    return {
      trial: null,
      selectedFeature: null
    }
  },
  watch: {
    trial: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.updateThemeLayer()
    }
  },
  methods: {
    updateThemeLayer: function () {
      if (this.themeLayer) {
        this.themeLayer.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${this.storeDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`)
      }
    },
    getDaysAgoIn: function (timestamp) {
      const diffDays = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        return this.$tc('ttsDaysIn', Math.abs(diffDays))
      } else if (diffDays < 14) {
        return this.$tc('ttsDaysAgo', Math.abs(diffDays))
      } else {
        return new Date(timestamp).toLocaleDateString()
      }
    },
    initMap: function () {
      this.map = L.map(this.$refs.map)

      this.map.setView([22.5937, 2.1094], 3)

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
          this.map.addLayer(this.themeLayer)
          break
        case 'satellite':
          this.map.addLayer(satellite)
          break
        case 'osm':
        default:
          this.map.addLayer(openstreetmap)
          break
      }

      const baseMaps = {
        'Theme-based': this.themeLayer,
        OpenStreetMap: openstreetmap,
        'Esri WorldImagery': satellite
      }

      L.control.layers(baseMaps).addTo(this.map)

      // Listen for layer changes and store the user selection in the store
      this.map.on('baselayerchange', e => {
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

      L.control.locate({
        returnToPrevBounds: true
      }).addTo(this.map)

      // Disable zoom until focus gained, disable when blur
      this.map.scrollWheelZoom.disable()
      this.map.on('focus', () => this.map.scrollWheelZoom.enable())
      this.map.on('blur', () => this.map.scrollWheelZoom.disable())
      this.map.on('click', e => console.log(e.latlng))
    },
    update: async function () {
      // Remove the old geojson layer if required
      if (this.geoJsonLayer) {
        this.map.removeLayer(this.geoJsonLayer)
      }

      // Extract all the individual polygons from the data
      if (this.trialData) {
        const plotInfo = []
        Object.keys(this.trialData).forEach(td => {
          const [row, column] = td.split('|').map(c => +c)
          if (this.trialData[td].geography && (this.trialData[td].geography.corners || this.trialData[td].geography.center)) {
            plotInfo.push({
              properties: {
                germplasm: this.trialData[td].germplasm,
                rep: this.trialData[td].rep,
                row: row,
                column: column
              },
              corners: this.trialData[td].geography.corners,
              center: this.trialData[td].geography.center
            })
          }
        })

        // Create the geojson and the layer, then add to the map
        const geoJson = plotInfoToGeoJson(plotInfo)
        this.geoJsonLayer = L.geoJSON(geoJson, {
          fillColor: '#00a0f1',
          color: '#00a0f1',
          weight: 1,
          onEachFeature: (feature, layer) => {
            layer.bindPopup('', { maxHeight: 200 })
            layer.on('popupopen', e => {
              this.selectedFeature = this.trialData[`${feature.properties.row}|${feature.properties.column}`]

              this.$nextTick(() => e.popup.setContent(this.$refs.popupContent))
            })
          }
        })
        this.geoJsonLayer.addTo(this.map)

        // Get the bounds and fit the map to them
        const bounds = this.geoJsonLayer.getBounds()
        if (bounds && bounds.isValid()) {
          this.map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial
          this.trialData = getTrialDataCached()
        })
    },
    fakeGpsMovement: function () {
      const points = [
        {
          lat: 56.484180501316246,
          lng: -3.1377527117729187,
          steps: 600,
          heading: 270
        }, {
          lat: 56.484147918689615,
          lng: -3.1387156248092656,
          steps: 60,
          heading: 360
        }, {
          lat: 56.48420864083489,
          lng: -3.1387209892272954,
          steps: 600,
          heading: 90
        }, {
          lat: 56.48424418546024,
          lng: -3.1377661228179936,
          steps: 60,
          heading: 180
        }
      ]

      let counter = 0
      let steps = points[0].steps
      let pointIndex = 0
      setTimeout(() => {
        const id = setInterval(() => {
          counter++
          if (counter === steps) {
            counter = 0
            pointIndex = (pointIndex + 1) % points.length
            steps = points[pointIndex].steps
            if (pointIndex === 0) {
              clearInterval(id)
            }
          } else {
            const start = points[pointIndex]
            const end = points[(pointIndex + 1) % points.length]
            const dLat = start.lat + ((end.lat - start.lat) / steps) * counter
            const dLng = start.lng + ((end.lng - start.lng) / steps) * counter

            if (!this.gpsMarker) {
              this.gpsMarker = L.marker([dLat, dLng])
              this.gpsMarker.addTo(this.map)
            } else {
              this.gpsMarker.setLatLng([dLat, dLng])
            }
          }
        }, 100)
      }, 10000)
    }
  },
  mounted: function () {
    this.initMap()

    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()

    // this.fakeGpsMovement()
  },
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>
.data-map {
  height: 75vh;
}
.map-measurement-list {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
<style>
.leaflet-popup-content-wrapper {
  border-radius: 0;
}
.leaflet-popup-content {
  min-width: 200px!important;
  line-height: 1em;
  overflow-x: hidden;
  height: auto !important;
}
.leaflet-popup-content dl {
  margin-bottom: 0;
}
</style>
