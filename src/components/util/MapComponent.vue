<template>
  <div ref="mapElement" class="location-map map">
    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
      v-if="selectedFeature && trial"
    >
      <v-card :title="selectedFeature.displayName || selectedFeature.germplasm">
        <PlotDataInformation :trial="trial" :cell="selectedFeature" />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'

  import L, { type TileLayer, type Map } from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
  import iconUrl from 'leaflet/dist/images/marker-icon.png'
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
  import 'leaflet.markercluster/dist/MarkerCluster.css'
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
  import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'

  import emitter from 'tiny-emitter/instance'
  import { getTrialById } from '@/plugins/idb'
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { plotInfoToGeoJson } from '@/plugins/location'
  import { CellCategory } from '@/plugins/types/gridscore'

  import 'leaflet.markercluster'
  import { LocateControl } from 'leaflet.locatecontrol'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  export interface MapComponentProps {
    showControls?: boolean
    highlightCheck?: (cell: CellPlus) => boolean
  }

  const compProps = withDefaults(defineProps<MapComponentProps>(), {
    showControls: false,
    highlightCheck: (cell: CellPlus) => false,
  })

  const store = coreStore()

  const trial = ref<TrialPlus>()

  const mapElement = useTemplateRef('mapElement')
  let clusterer: any
  const selectedFeature = ref<CellPlus>()
  const bottomSheetVisible = ref(false)

  let themeLayer: TileLayer
  let map: Map
  // let geoJsonLayer: L.GeoJSON<any, any> | undefined = undefined
  let trialData: { [index: string]: CellPlus } | undefined = {}

  function updateThemeLayer () {
    if (themeLayer) {
      themeLayer.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${store.storeIsDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`)
    }
  }

  function initMap () {
    if (!mapElement.value) {
      return
    }

    map = L.map(mapElement.value)
    map.setView([22.5937, 2.1094], 3)

    themeLayer = L.tileLayer(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${store.storeIsDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`, {
      id: store.storeIsDarkMode ? 'Esri Dark Gray Base' : 'Esri Light Gray Base',
      attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community',
      maxZoom: 21,
      maxNativeZoom: 15,
    })

    const openstreetmap = L.tileLayer('//tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 21,
      maxNativeZoom: 19,
    })

    // Add an additional satellite layer
    const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      id: 'Esri WorldImagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 21,
      maxNativeZoom: 19,
    })

    switch (store.storeMapLayer) {
      case 'theme': {
        map.addLayer(themeLayer)
        break
      }
      case 'satellite': {
        map.addLayer(satellite)
        break
      }
      default: {
        map.addLayer(openstreetmap)
        break
      }
    }

    const baseMaps = {
      'Theme-based': themeLayer,
      OpenStreetMap: openstreetmap,
      'Esri WorldImagery': satellite,
    }

    map.on('baselayerchange', e => {
      switch (e.name) {
        case 'Theme-based': {
          store.setMapLayer('theme')
          break
        }
        case 'OpenStreetMap': {
          store.setMapLayer('osm')
          break
        }
        case 'Esri WorldImagery': {
          store.setMapLayer('satellite')
          break
        }
      }
    })

    new LocateControl({
      returnToPrevBounds: true,
    }).addTo(map)

    map.on('click', e => {
      const latLng = e.latlng

      // TODO
    })

    L.control.layers(baseMaps).addTo(map)

    // Disable zoom until focus gained, disable when blur
    map.scrollWheelZoom.disable()
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())
  }

  function invalidateSize () {
    nextTick(() => map?.invalidateSize())
  }

  function updateTrialDataCache () {
    if (store.storeSelectedTrial) {
      getTrialById(store.storeSelectedTrial)
        .then(t => {
          trialData = getTrialDataCached()
          trial.value = t
        })
    }
  }

  function update () {
    // Remove the old geojson layer if required
    if (clusterer) {
      clusterer.clearLayers()
    } else {
      // @ts-ignore
      clusterer = L.markerClusterGroup({
        chunkedLoading: true,
      })
    }

    // Extract all the individual polygons from the data
    if (trialData) {
      const plotInfo: any[] = []
      Object.keys(trialData).forEach(td => {
        const [row, column] = td.split('|').map(c => +c)
        if (trialData && trialData[td] && trialData[td].geography && (trialData[td].geography.corners || trialData[td].geography.center)) {
          plotInfo.push({
            properties: {
              displayName: trialData[td].displayName,
              germplasm: trialData[td].germplasm,
              rep: trialData[td].rep,
              row,
              column,
              categories: trialData[td].categories || [],
            },
            corners: trialData[td].geography.corners,
            center: trialData[td].geography.center,
          })
        }
      })

      // Create the geojson and the layer, then add to the map
      const geoJson = plotInfoToGeoJson(plotInfo)

      if (!trial.value?.layout.corners) {
        const checks = plotInfo.filter(pi => compProps.highlightCheck(pi.properties) && pi.center)

        checks.forEach(c => {
          L.circle(c.center, { radius: 5, fillColor: '#910080', color: '#910080', fillOpacity: 0.3, weight: 0 }).addTo(map)
        })
      }

      if (geoJson) {
        // @ts-ignore
        const geoJsonLayer = L.geoJSON(geoJson, {
          style: feature => {
            let color = '#00a0f1'

            if (compProps.showControls && store.storeHighlightControls && feature?.properties.categories.includes(CellCategory.CONTROL)) {
              color = '#910080'
            }
            if (feature && feature.properties && compProps.highlightCheck(feature.properties)) {
              color = '#910080'
            }

            return {
              fillColor: color,
              color,
              weight: 1,
            }
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.displayName || feature.properties.germplasm)
            layer.on('click', () => {
              if (trialData) {
                selectedFeature.value = trialData[`${feature.properties.row}|${feature.properties.column}`]

                nextTick(() => {
                  bottomSheetVisible.value = true
                })
              }
            })
          },
        })

        clusterer.addLayer(geoJsonLayer)

        // Get the bounds and fit the map to them
        const bounds = geoJsonLayer.getBounds()
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
      map.addLayer(clusterer)
    }
  }

  watch(() => store.storeIsDarkMode, async () => updateThemeLayer())

  watch(trial, async () => update())

  onMounted(() => {
    initMap()

    updateTrialDataCache()
    emitter.on('trial-data-loaded', updateTrialDataCache)
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })

  defineExpose({
    invalidateSize,
  })
</script>

<style scoped>
.map {
  height: 75vh;
}
</style>
