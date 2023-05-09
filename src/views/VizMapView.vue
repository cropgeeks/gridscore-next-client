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
            <span :style="{ color: trait.color }"><BIconCircleFill /> {{ trait.name }}</span>
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
import { trialLayoutToPlots, toGeoJson, plotInfoToGeoJson } from '@/plugins/location'
import { BIconCalendar3, BIconCircleFill } from 'bootstrap-vue'
import { getTrialDataCached } from '@/plugins/datastore'
import { getTrialById } from '@/plugins/idb'

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
    BIconCircleFill
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
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
    }
  },
  methods: {
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
      const openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        id: 'OpenStreetMap',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 21,
        maxNativeZoom: 19
      })

      this.map.addLayer(openstreetmap)

      // Add an additional satellite layer
      const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        id: 'Esri WorldImagery',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 21,
        maxNativeZoom: 19
      })

      const baseMaps = {
        OpenStreetMap: openstreetmap,
        'Esri WorldImagery': satellite
      }

      L.control.layers(baseMaps).addTo(this.map)

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
      const plotInfo = []
      Object.keys(this.trialData).forEach(td => {
        const [row, column] = td.split('|').map(c => +c)
        if (this.trialData[td].geography && this.trialData[td].geography.corners) {
          plotInfo.push({
            properties: {
              germplasm: this.trialData[td].germplasm,
              rep: this.trialData[td].rep,
              row: row,
              column: column
            },
            corners: this.trialData[td].geography.corners
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
    },
    showExample: function () {
      // const trialGps = {
      //   topLeft: { lat: 52.074358, lng: 0.156727 },
      //   topRight: { lat: 52.075281, lng: 0.159694 },
      //   bottomRight: { lat: 52.072358, lng: 0.162083 },
      //   bottomLeft: { lat: 52.071430, lng: 0.159125 }
      // }
      // const data = trialLayoutToPlots(trialGps, 14, 19)

      const trialGps = {
        topLeft: { lat: 56.48414745586802, lng: -3.1377500295639043 },
        topRight: { lat: 56.48465544546168, lng: -3.137849271297455 },
        bottomRight: { lat: 56.484609534145285, lng: -3.138779997825623 },
        bottomLeft: { lat: 56.48411783527373, lng: -3.138699531555176 }
      }
      const data = trialLayoutToPlots(trialGps, 28, 8)

      const mapping = {}

      for (let row = 0; row < 28; row++) {
        for (let col = 0; col < 8; col++) {
          mapping[`${row}|${col}`] = data[row][col]
        }
      }

      const polygons = [].concat(...data)

      const geoJson = toGeoJson(polygons)

      L.geoJSON(geoJson, {
        weight: 1
      }).addTo(this.map)
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial
          this.trialData = getTrialDataCached()
        })
    }
  },
  mounted: function () {
    this.initMap()

    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()
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
