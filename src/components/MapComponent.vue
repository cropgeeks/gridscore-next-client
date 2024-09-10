<template>
  <div>
    <div :class="`data-map-${mapClass}`" ref="map" />

    <div v-if="selectedFeature" ref="popupContent">
      <PlotDataSection :trial="trial" :traits="trial.traits" :cell="selectedFeature" />
    </div>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { plotInfoToGeoJson } from '@/plugins/location'
import { getTrialDataCached } from '@/plugins/datastore'
import { getTrialById } from '@/plugins/idb'
import PlotDataSection from '@/components/PlotDataSection.vue'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { CELL_CATEGORY_CONTROL } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

import 'leaflet.locatecontrol'

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
      'storeSelectedTrial',
      'storeDarkMode',
      'storeMapLayer',
      'storeHighlightControls'
    ])
  },
  props: {
    mapClass: {
      type: String,
      default: 'vh-75'
    },
    highlightCheck: {
      type: Function,
      default: () => false
    },
    showControls: {
      type: Boolean,
      default: true
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
      if (this.clusterer) {
        this.clusterer.clearLayers()
      } else {
        this.clusterer = L.markerClusterGroup({
          chunkedLoading: true
        })
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
                row,
                column,
                categories: this.trialData[td].categories || []
              },
              corners: this.trialData[td].geography.corners,
              center: this.trialData[td].geography.center
            })
          }
        })

        // Create the geojson and the layer, then add to the map
        const geoJson = plotInfoToGeoJson(plotInfo)

        if (this.highlightCheck && !this.trial.layout.corners) {
          const checks = plotInfo.filter(pi => this.highlightCheck(pi.properties) && pi.center)

          checks.forEach(c => {
            L.circle(c.center, { radius: 5, fillColor: '#910080', color: '#910080', fillOpacity: 0.3, weight: 0 }).addTo(this.map)
          })
        }

        const geoJsonLayer = L.geoJSON(geoJson, {
          style: (feature) => {
            let color = '#00a0f1'

            if (this.showControls) {
              if (this.storeHighlightControls && feature.properties.categories.includes(CELL_CATEGORY_CONTROL)) {
                color = '#910080'
              }
            }
            if (this.highlightCheck) {
              if (this.highlightCheck(feature.properties)) {
                color = '#910080'
              }
            }

            return {
              fillColor: color,
              color,
              weight: 1
            }
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup('', { maxHeight: 200 })
            layer.on('popupopen', e => {
              this.selectedFeature = this.trialData[`${feature.properties.row}|${feature.properties.column}`]

              this.$nextTick(() => e.popup.setContent(this.$refs.popupContent))
            })
          }
        })

        this.clusterer.addLayer(geoJsonLayer)
        this.map.addLayer(this.clusterer)

        // Get the bounds and fit the map to them
        const bounds = geoJsonLayer.getBounds()
        if (bounds && bounds.isValid()) {
          this.map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trialData = getTrialDataCached()
          this.trial = trial
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
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>
.data-map-vh-50 {
  height: 50vh;
}
.data-map-vh-75 {
  height: 75vh;
}
.data-map-vh-100 {
  height: 100vh;
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
.data-map-vh-50 .leaflet-popup-content {
  max-height: max(300px, calc(50vh - 100px));
}
.data-map-vh-75 .leaflet-popup-content {
  max-height: max(300px, calc(75vh - 100px));
}
.data-map-vh-100 .leaflet-popup-content {
  max-height: max(300px, calc(100vh - 100px));
}
.leaflet-popup-content dl {
  margin-bottom: 0;
}

.dark-mode .leaflet-control-locate a .leaflet-control-locate-location-arrow {
  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M445 4 29 195c-48 23-32 93 19 93h176v176c0 51 70 67 93 19L508 67c16-38-25-79-63-63z"/></svg>');
}
</style>
