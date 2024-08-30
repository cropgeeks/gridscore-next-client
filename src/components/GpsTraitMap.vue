<template>
  <div>
    <div class="data-map" ref="map" />

    <b-modal ref="plotModal" :title="$t('modalTitleVizPlotDataDetails')" ok-only :ok-title="$t('buttonClose')" v-if="selectedFeature">
      <PlotDataSection :trial="trial" :cell="selectedFeature" :traits="[trait]" />
    </b-modal>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialDataCached } from '@/plugins/datastore'
import PlotDataSection from '@/components/PlotDataSection.vue'
import { categoricalColors } from '@/plugins/color'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import emitter from 'tiny-emitter/instance'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Set the leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
})

export default {
  components: {
    PlotDataSection
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeMapLayer',
      'storeHighlightControls'
    ])
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    trait: {
      type: Object,
      default: () => null
    },
    selectedGermplasm: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      selectedFeature: null
    }
  },
  watch: {
    trait: function () {
      this.update()
    },
    selectedGermplasm: function () {
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

      this.layerGroup = L.layerGroup().addTo(this.map)

      // Disable zoom until focus gained, disable when blur
      this.map.scrollWheelZoom.disable()
      this.map.on('focus', () => this.map.scrollWheelZoom.enable())
      this.map.on('blur', () => this.map.scrollWheelZoom.disable())
      this.map.on('click', e => console.log(e.latlng))
    },
    update: async function () {
      if (this.layerGroup) {
        this.layerGroup.clearLayers()
      }

      // Extract all the individual polygons from the data
      if (this.trialData && this.trait) {
        const bounds = L.latLngBounds()
        Object.keys(this.trialData).forEach((k, kIndex) => {
          const cell = this.trialData[k]

          const gps = []

          if (cell.measurements && cell.measurements[this.trait.id]) {
            cell.measurements[this.trait.id].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach(m => {
              m.values.forEach(v => gps.push({
                timestamp: m.timestamp,
                displayName: cell.displayName,
                latLng: v.split(';').map(Number)
              }))
            })
          }

          const color = (this.selectedGermplasm.length < 1 || this.selectedGermplasm.includes(cell.displayName)) ? categoricalColors.D3schemeCategory10[kIndex % categoricalColors.D3schemeCategory10.length] : 'gray'

          const line = L.polyline(gps.map(g => g.latLng), { weight: 3, color }).addTo(this.layerGroup)
          line.bindTooltip(cell.displayName)
          line.on('mouseover', e => {
            const l = e.target
            l.setStyle({
              weight: 10
            })
          })
          line.on('mouseout', e => {
            const l = e.target
            l.setStyle({
              weight: 3
            })
          })
          line.on('mousemove', e => {
            const l = e.target
            l._tooltip.setLatLng(e.latlng)
          })

          gps.forEach(g => {
            const m = L.circleMarker(g.latLng, { radius: 5, stroke: false, fillColor: color, fillOpacity: 0.8 })
            m.bindTooltip(`${g.displayName}: ${new Date(g.timestamp).toLocaleDateString()}`)
            m.on('click', () => {
              this.selectedFeature = cell
              this.$nextTick(() => this.$refs.plotModal.show())
            })
            m.addTo(this.layerGroup)
            bounds.extend(g.latLng)
          })
        })

        if (bounds.isValid()) {
          const padding = Math.min(this.$refs.map.offsetWidth, this.$refs.map.offsetHeight) * 0.05
          this.map.fitBounds(bounds, { padding: [padding, padding] })
        }
      }
    },
    updateTrialDataCache: function () {
      this.trialData = getTrialDataCached()

      this.update()
    }
  },
  mounted: function () {
    this.initMap()

    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>
.data-map {
  height: 50vh;
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
  max-height: 50vh;
  line-height: 1em;
  overflow-x: hidden;
  height: auto !important;
}
.leaflet-popup-content dl {
  margin-bottom: 0;
}

.dark-mode .leaflet-control-locate a .leaflet-control-locate-location-arrow {
  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M445 4 29 195c-48 23-32 93 19 93h176v176c0 51 70 67 93 19L508 67c16-38-25-79-63-63z"/></svg>');
}
</style>
