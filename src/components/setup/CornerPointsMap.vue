<template>
  <div v-if="corners">
    <p>{{ $t('pageTrialLayoutCornersText') }}</p>

    <v-switch v-model="cornersEnabled" color="primary" :label="$t('formLabelUseCorners')" />

    <div v-show="cornersEnabled && corners">
      <v-row class="mb-5" v-if="corners && cornerLabels">
        <v-col cols="12" lg="6">
          <v-card :title="$t('formLabelFieldLayoutRowColumn', cornerLabels.topLeft)">
            <template #text>
              <GpsInput v-model="corners.topLeft" />
            </template>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card :title="$t('formLabelFieldLayoutRowColumn', cornerLabels.topRight)">
            <template #text>
              <GpsInput v-model="corners.topRight" />
            </template>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card :title="$t('formLabelFieldLayoutRowColumn', cornerLabels.bottomLeft)">
            <template #text>
              <GpsInput v-model="corners.bottomLeft" />
            </template>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card :title="$t('formLabelFieldLayoutRowColumn', cornerLabels.bottomRight)">
            <template #text>
              <GpsInput v-model="corners.bottomRight" />
            </template>
          </v-card>
        </v-col>
      </v-row>

      <div ref="mapElement" class="location-map map">
        <div ref="popupContent" class="popup-content">
          <p>{{ $t('formLabelFieldLayoutUseAsCorner') }}</p>

          <v-row v-if="cornerLabels">
            <v-col cols="6">
              <v-btn prepend-icon="mdi-arrow-top-left" :text="$t('formLabelFieldLayoutRowColumn', cornerLabels.topLeft)" @click="setCorner('topLeft')" />
            </v-col>
            <v-col cols="6">
              <v-btn append-icon="mdi-arrow-top-right" :text="$t('formLabelFieldLayoutRowColumn', cornerLabels.topRight)" @click="setCorner('topRight')" />
            </v-col>
            <v-col cols="6">
              <v-btn prepend-icon="mdi-arrow-bottom-left" :text="$t('formLabelFieldLayoutRowColumn', cornerLabels.bottomLeft)" @click="setCorner('bottomLeft')" />
            </v-col>
            <v-col cols="6">
              <v-btn append-icon="mdi-arrow-bottom-right" :text="$t('formLabelFieldLayoutRowColumn', cornerLabels.bottomRight)" @click="setCorner('bottomRight')" />
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Corners, Layout } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'

  import L, { type TileLayer, type Map, type Marker, LatLngBounds } from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
  import iconUrl from 'leaflet/dist/images/marker-icon.png'
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import GpsInput from '@/components/inputs/GpsInput.vue'
  import { isGeographyValid, isLocationValid, toGeoJson, trialLayoutToPlots } from '@/plugins/location'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  const store = coreStore()

  const model = defineModel<Layout>()
  const cornersEnabled = ref<boolean>(false)
  const corners = ref<Corners>()

  const mapElement = useTemplateRef('mapElement')
  const popupContent = ref('')

  let themeLayer: TileLayer
  let map: Map
  let marker: Marker | undefined = undefined
  let markerTopLeft: Marker | undefined = undefined
  let markerTopRight: Marker | undefined = undefined
  let markerBottomLeft: Marker | undefined = undefined
  let markerBottomRight: Marker | undefined = undefined
  let geoJsonLayer: L.GeoJSON<any, any> | undefined = undefined
  let bounds: LatLngBounds | undefined = undefined

  const cornerLabels = computed(() => {
    if (model.value) {
      return {
        topLeft: {
          column: getColumnLabel(model.value, 0),
          row: getRowLabel(model.value, 0),
        },
        topRight: {
          column: getColumnLabel(model.value, model.value.columns - 1),
          row: getRowLabel(model.value, 0),
        },
        bottomLeft: {
          column: getColumnLabel(model.value, 0),
          row: getRowLabel(model.value, model.value.rows - 1),
        },
        bottomRight: {
          column: getColumnLabel(model.value, model.value.columns - 1),
          row: getRowLabel(model.value, model.value.rows - 1),
        },
      }
    } else {
      return undefined
    }
  })

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

    map.on('click', e => {
      const latLng = e.latlng

      if (marker) {
        marker.setLatLng([latLng.lat, latLng.lng])
      } else {
        marker = L.marker([latLng.lat, latLng.lng])
        marker.addTo(map)
      }

      marker.bindPopup(popupContent.value).openPopup()
    })

    L.control.layers(baseMaps).addTo(map)

    // Disable zoom until focus gained, disable when blur
    map.scrollWheelZoom.disable()
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())
  }

  function setCorner (corner: string) {
    if (marker && corners.value) {
      const latLng = marker.getLatLng()
      // @ts-ignore
      corners.value[corner] = {
        lat: latLng.lat,
        lng: latLng.lng,
      }

      marker.closePopup()
    }
  }

  function updateGrid () {
    if (!corners.value || !map) {
      return
    }

    // Remove the old geojson layer if required
    if (geoJsonLayer) {
      map.removeLayer(geoJsonLayer)
    }

    if (marker) {
      marker.remove()
      marker = undefined
    }

    bounds = L.latLngBounds([])

    // Add visual markers to corners
    if (markerTopLeft) {
      map.removeLayer(markerTopLeft)
    }
    if (isLocationValid(corners.value.topLeft)) {
      // @ts-ignore
      markerTopLeft = L.marker([corners.value.topLeft.lat, corners.value.topLeft.lng])
      markerTopLeft.addTo(map)
      bounds.extend(markerTopLeft.getLatLng())
    }
    if (markerTopRight) {
      map.removeLayer(markerTopRight)
    }
    if (isLocationValid(corners.value.topRight)) {
      // @ts-ignore
      markerTopRight = L.marker([corners.value.topRight.lat, corners.value.topRight.lng])
      markerTopRight.addTo(map)
      bounds.extend(markerTopRight.getLatLng())
    }
    if (markerBottomLeft) {
      map.removeLayer(markerBottomLeft)
    }
    if (isLocationValid(corners.value.bottomLeft)) {
      // @ts-ignore
      markerBottomLeft = L.marker([corners.value.bottomLeft.lat, corners.value.bottomLeft.lng])
      markerBottomLeft.addTo(map)
      bounds.extend(markerBottomLeft.getLatLng())
    }
    if (markerBottomRight) {
      map.removeLayer(markerBottomRight)
    }
    if (isLocationValid(corners.value.bottomRight)) {
      // @ts-ignore
      markerBottomRight = L.marker([corners.value.bottomRight.lat, corners.value.bottomRight.lng])
      markerBottomRight.addTo(map)
      bounds.extend(markerBottomRight.getLatLng())
    }

    if (model.value && isGeographyValid(corners.value)) {
      const data = trialLayoutToPlots(corners.value, model.value.rows, model.value.columns)

      const polygons = data.flat()

      const geoJson = toGeoJson(polygons)
      // @ts-ignore
      geoJsonLayer = L.geoJSON(geoJson, {
        fillColor: '#00a0f1',
        color: '#00a0f1',
        weight: 1,
      })
      geoJsonLayer.addTo(map)
    }

    // Get the bounds and fit the map to them
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  const isValid = computed(() => {
    if (!cornersEnabled.value) {
      return true
    }

    if (!corners.value) {
      return false
    }

    return isGeographyValid(corners.value)
  })

  function invalidateSize () {
    nextTick(() => {
      map?.invalidateSize()

      nextTick(() => {
        // Get the bounds and fit the map to them
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      })
    })
  }

  watch(() => store.storeIsDarkMode, async () => updateThemeLayer())

  watch(corners, async newValue => {
    nextTick(() => updateGrid())

    if (model.value) {
      model.value.corners = newValue
    }
  }, { deep: true })
  watch(cornersEnabled, async newValue => {
    nextTick(() => invalidateSize())

    if (model.value) {
      if (newValue) {
        model.value.corners = corners.value
      } else {
        model.value.corners = undefined
      }
    }
  })

  onMounted(() => {
    if (model.value?.corners) {
      corners.value = model.value.corners
      cornersEnabled.value = true
    } else {
      corners.value = {
        topLeft: {
          lat: undefined,
          lng: undefined,
        },
        topRight: {
          lat: undefined,
          lng: undefined,
        },
        bottomLeft: {
          lat: undefined,
          lng: undefined,
        },
        bottomRight: {
          lat: undefined,
          lng: undefined,
        },
      }
    }

    nextTick(() => initMap())
  })

  defineExpose({
    invalidateSize,
    isValid,
  })
</script>

<style scoped>
.map {
  height: 50vh;
}
</style>

<style>
.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.location-map .leaflet-popup-content-wrapper {
  padding: 0;
  border-radius: 3px;
}

.location-map .leaflet-popup-content {
  margin: 0;
  padding: 1em;
  width: min(85vw, 450px)!important;
}

.location-map .leaflet-popup-content .v-list-item-subtitle {
  text-wrap: wrap;
  line-clamp: unset;
  -webkit-line-clamp: unset;
}
</style>
