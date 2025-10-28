<template>
  <v-card>
    <v-toolbar density="comfortable" color="surface" class="trait-toolbar">
      <v-toolbar-title class="ms-4">
        <TraitSection :trait="trait" :show-subtitle="false" />
      </v-toolbar-title>
    </v-toolbar>

    <div class="data-map" ref="mapElement" />
  </v-card>
</template>

<script setup lang="ts">
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import L, { type LayerGroup, type Map, type TileLayer } from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
  import iconUrl from 'leaflet/dist/images/marker-icon.png'
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { Measurement } from '@/plugins/types/gridscore'
  import { categoricalColors } from '@/plugins/color'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  interface GpsData {
    timestamp: string
    displayName: string
    latLng: [number, number]
  }

  const compProps = defineProps<{
    trial: TrialPlus
    trait: TraitPlus
    selectedGermplasm: string[]
  }>()

  const store = coreStore()

  const mapElement = useTemplateRef('mapElement')
  let themeLayer: TileLayer
  let layerGroup: LayerGroup
  let map: Map
  let trialData: { [index: string]: CellPlus } | undefined = undefined

  watch(() => store.storeIsDarkMode, async () => updateThemeLayer())

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

    layerGroup = L.layerGroup().addTo(map)
    L.control.layers(baseMaps).addTo(map)

    // Disable zoom until focus gained, disable when blur
    map.scrollWheelZoom.disable()
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

    nextTick(() => updateData())
  }

  async function updateData () {
    if (!trialData) {
      trialData = getTrialDataCached()
    }

    if (layerGroup) {
      layerGroup.clearLayers()
    }

    // Extract all the individual polygons from the data
    const trialDataConst = trialData
    if (trialDataConst && compProps.trait) {
      const bounds = L.latLngBounds([])
      Object.keys(trialDataConst).forEach((k, kIndex) => {
        const cell = trialDataConst[k]

        const gps: GpsData[] = []

        if (cell && cell.measurements && cell.measurements[compProps.trait.id || '']) {
          cell.measurements[compProps.trait.id || '']?.sort((a: Measurement, b: Measurement) => a.timestamp.localeCompare(b.timestamp)).forEach((m: Measurement) => {
            m.values.forEach(v => {
              if (v !== undefined && v !== null && v !== '') {
                gps.push({
                  timestamp: m.timestamp,
                  displayName: cell.displayName || cell.germplasm,
                  // @ts-ignore
                  latLng: v.split(';').map(Number),
                })
              }
            })
          })

          const color = (compProps.selectedGermplasm.length === 0 || compProps.selectedGermplasm.includes(cell.displayName || cell.germplasm)) ? categoricalColors.D3schemeCategory10[kIndex % categoricalColors.D3schemeCategory10.length] : 'gray'

          const line = L.polyline(gps.map(g => g.latLng), { weight: 3, color }).addTo(layerGroup)
          line.bindTooltip(cell.displayName || cell.germplasm)
          line.on('mouseover', e => {
            const l = e.target
            l.setStyle({
              weight: 10,
            })
          })
          line.on('mouseout', e => {
            const l = e.target
            l.setStyle({
              weight: 3,
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
              emit('cell-clicked', cell.row, cell.column)
            })
            m.addTo(layerGroup)
            bounds.extend(g.latLng)
          })
        }
      })

      if (bounds.isValid()) {
        const padding = Math.min(mapElement.value?.offsetWidth || 0, mapElement.value?.offsetHeight || 0) * 0.05
        map.fitBounds(bounds, { padding: [padding, padding] })
      }
    }
  }

  function updateThemeLayer () {
    if (themeLayer) {
      themeLayer.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${store.storeIsDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`)
    }
  }

  function invalidateSize () {
    nextTick(() => map?.invalidateSize())
  }

  defineExpose({
    invalidateSize,
  })

  onMounted(() => initMap())

  const emit = defineEmits(['cell-clicked'])

  watch(() => compProps.selectedGermplasm, async () => updateData())
</script>

<style scoped>
.data-map {
  height: 50vh;
}
</style>
