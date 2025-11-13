<template>
  <div class="person-data-map" ref="mapElement" />
</template>

<script setup lang="ts">
  import type { TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import L, { type Polygon, type Map, type TileLayer } from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
  import iconUrl from 'leaflet/dist/images/marker-icon.png'
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
  import { categoricalColors } from '@/plugins/color'
  import type { PersonLocationData } from '@/pages/visualization/trial-statistics.vue'
  import { mapAreaTypeMap } from '@/plugins/constants'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  const compProps = defineProps<{
    trial: TrialPlus
    personData: { [index: string]: PersonLocationData }
    overall: PersonLocationData
    areaType: string
  }>()

  const store = coreStore()

  const mapElement = useTemplateRef('mapElement')
  let themeLayer: TileLayer
  let map: Map
  let polygons: Polygon[] = []

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

    L.control.layers(baseMaps).addTo(map)

    // Disable zoom until focus gained, disable when blur
    map.scrollWheelZoom.disable()
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

    nextTick(() => updateData())
  }

  async function updateData () {
    if (polygons) {
      polygons.forEach(p => map.removeLayer(p))
      polygons = []
    }

    const bounds = new L.LatLngBounds([])

    if (compProps.overall && compProps.overall.bounds.length > 0) {
      const polygon = L.polygon(compProps.overall.bounds.map(ll => [ll.lat || 0, ll.lng || 0]), undefined)

      // @ts-ignore
      polygon.getLatLngs().forEach(point => bounds.extend(point))

      const areaType = mapAreaTypeMap[compProps.areaType]
      const area = areaType?.convert(compProps.overall.area) || 0
      const displayValue = `Overall: ${area.toLocaleString()}`
      polygon.bindTooltip(`${displayValue} ${areaType?.unit}`, {
        permanent: true,
        direction: 'center',
        sticky: false,
      })

      polygon.addTo(map)
      polygons.push(polygon)
    }

    if (compProps.personData) {
      Object.keys(compProps.personData).forEach(p => {
        if (compProps.personData[p] && compProps.personData[p].bounds.length > 0) {
          const personIndex = compProps.trial.people.findIndex(pp => pp.id === p)
          const personObject = compProps.trial.people[personIndex]

          const polygon = L.polygon(compProps.personData[p].bounds.map(ll => [ll.lat || 0, ll.lng || 0]), personObject ? { color: categoricalColors.D3schemeCategory10[personIndex % categoricalColors.D3schemeCategory10.length] } : undefined)

          // @ts-ignore
          polygon.getLatLngs().forEach(point => bounds.extend(point))

          const areaType = mapAreaTypeMap[compProps.areaType]
          const area = areaType?.convert(compProps.personData[p].area) || 0
          const displayValue = `${personObject ? personObject.name : 'Overall'}: ${area.toLocaleString()}`
          polygon.bindTooltip(`${displayValue} ${areaType?.unit}`, {
            permanent: false,
            direction: 'top',
            sticky: true,
          })

          polygon.addTo(map)
          polygons.push(polygon)
        }
      })
    }

    if (bounds.isValid()) {
      const size = map.getSize()
      map.fitBounds(bounds, { padding: [size.x / 4, size.y / 4] })
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

  watch(() => compProps.overall, async () => updateData())
  watch(() => compProps.personData, async () => updateData())
  watch(() => compProps.areaType, async () => updateData())
</script>

<style scoped>
.person-data-map {
  height: 50vh;
}
</style>
