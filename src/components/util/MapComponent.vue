<template>
  <div v-if="trial">
    <v-row>
      <v-col cols="12" xl="6">
        <HighlightSelect
          :trial="trial"
          ref="highlightSelection"
          allow-control-select
        />
      </v-col>
    </v-row>

    <div ref="mapElement" class="location-map map mt-5">
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
  </div>
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'

  import L, { type TileLayer, type Map, type Circle } from 'leaflet'
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
  import { categoricalColors } from '@/plugins/color'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  const store = coreStore()

  const trial = ref<TrialPlus>()

  const highlightSelection = useTemplateRef('highlightSelection')
  const mapElement = useTemplateRef('mapElement')
  let clusterer: any
  const selectedFeature = ref<CellPlus>()
  const bottomSheetVisible = ref(false)

  let themeLayer: TileLayer
  let map: Map
  // let geoJsonLayer: L.GeoJSON<any, any> | undefined = undefined
  let trialData: { [index: string]: CellPlus } | undefined = {}
  let circles: Circle[] = []
  let highlightColors: { [index: string]: string } = {}

  const userSelection = computed(() => highlightSelection.value?.userSelection)

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
    circles.forEach(c => c.removeFrom(map))
    circles = []

    // Remove the old geojson layer if required
    if (clusterer) {
      clusterer.clearLayers()
    } else {
      // @ts-ignore
      clusterer = L.markerClusterGroup({
        chunkedLoading: true,
        disableClusteringAtZoom: 16,
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
              treatment: trialData[td].treatment,
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

      highlightColors = {}

      if (geoJson) {
        // @ts-ignore
        const geoJsonLayer = L.geoJSON(geoJson, {
          style: feature => {
            if (feature) {
              const color = getColor(feature.properties)

              return {
                fillColor: color,
                color,
                weight: 1,
              }
            } else {
              return {}
            }
          },
          pointToLayer(feature, latlng) {
            const color = getColor(feature.properties)
            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: color,
              color,
              weight: 1,
              opacity: 1,
              fillOpacity: 0.5,
            })
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

  function getColor (properties: any) {
    let color: string | undefined = '#aaaaaa'

    if (properties && userSelection.value && userSelection.value.type) {
      let selectionField: string
      switch (userSelection.value.type) {
        case 'cell':
          selectionField = properties.displayName || properties.germplasm
          break
        case 'germplasm':
          selectionField = properties.germplasm
          break
        case 'reps':
          selectionField = properties.rep || ''
          break
        case 'treatments':
          selectionField = properties.treatment || ''
          break
        case 'controls':
          selectionField = (properties.categories || []).includes(CellCategory.CONTROL) ? CellCategory.CONTROL : 'N/A'
          break
      }

      if (userSelection.value.selectedItems.includes(selectionField)) {
        color = highlightColors[selectionField]

        if (!color) {
          color = categoricalColors.D3schemeCategory10[Object.keys(highlightColors).length % categoricalColors.D3schemeCategory10.length] || '#910080'
          highlightColors[selectionField] = color
        }
      }
    }

    return color
  }

  watch(() => store.storeIsDarkMode, async () => updateThemeLayer())

  watch(trial, async () => {
    nextTick(() => {
      initMap()
      update()
    })
  })

  watch(userSelection, async () => update(), { deep: true })

  onMounted(() => {
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
