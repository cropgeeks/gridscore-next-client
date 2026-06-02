<template>
  <div>
    <div v-if="trialsWithLocations && trialsWithLocations.length > 0">
      <div ref="mapElement" class="location-map map mt-5">
        <v-bottom-sheet
          v-model="bottomSheetVisible"
          inset
          scrollable
          max-height="75vh"
          v-if="selectedTrial"
        >
          <v-card>
            <TrialCard :trial="selectedTrial" :interactive="false" :can-share="false" :show-options="false" show-select force-show-details @load="loadTrial(selectedTrial)" />
          </v-card>
        </v-bottom-sheet>
      </div>
    </div>
    <p class="text-error" v-else>{{ $t('pageVisualizationMapNoLocationData') }}</p>
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

  import type { TrialPlus } from '@/plugins/types/client'
  import { isGeographyValid, toGeoJson } from '@/plugins/location'

  import 'leaflet.markercluster'
  import { LocateControl } from 'leaflet.locatecontrol'
  import { getTrials } from '@/plugins/idb'

  // Set the leaflet marker icon
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  })

  const router = useRouter()
  const store = coreStore()

  const trials = ref<TrialPlus[]>([])
  const selectedTrial = ref<TrialPlus>()

  const trialsWithLocations = computed(() => trials.value.filter(t => t.layout.corners && isGeographyValid(t.layout.corners)))

  const mapElement = useTemplateRef('mapElement')
  const bottomSheetVisible = ref(false)

  let themeLayer: TileLayer
  let map: Map
  let clusterer: any

  function updateThemeLayer () {
    if (themeLayer) {
      themeLayer.setUrl(`//services.arcgisonline.com/arcgis/rest/services/Canvas/${store.storeIsDarkMode ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`)
    }
  }

  async function loadTrial (trial: TrialPlus) {
    await store.setSelectedTrial(trial.localId)

    router.push(store.storeDefaultDataEntryViewRoute)
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

    const topo = L.tileLayer('//{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      id: 'OpenTopoMap',
      attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | Kartendarstellung: &copy; <a href="http://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)</code>',
      maxZoom: 19,
      maxNativeZoom: 17,
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
      case 'topo': {
        map.addLayer(topo)
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
      OpenTopoMap: topo,
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
        case 'OpenTopoMap': {
          store.setMapLayer('topo')
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
      // console.log(latLng)
    })

    L.control.layers(baseMaps).addTo(map)

    // Disable zoom until focus gained, disable when blur
    map.scrollWheelZoom.disable()
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())

    update()
  }

  function invalidateSize () {
    nextTick(() => map?.invalidateSize())
  }

  function update () {
    // Remove the old geojson layer if required
    if (clusterer) {
      clusterer.clearLayers()
    } else {
      // @ts-ignore
      clusterer = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
      })
      map.addLayer(clusterer)
    }

    let overallBounds: L.LatLngBounds | undefined = undefined

    trialsWithLocations.value.forEach(t => {
      if (t.layout.corners) {
        const info = [t.name]
        if (t.group && t.group.name) {
          info.push(t.group.name)
        }
        info.push(new Date(t.updatedOn || '').toLocaleDateString())

        const geoJson = toGeoJson([t.layout.corners])

        if (geoJson) {
          // @ts-ignore
          const geoJsonLayer = L.geoJSON(geoJson, {
            style: feature => {
              if (feature) {
                const color = '#00acef'

                return {
                  fillColor: color,
                  color,
                  weight: 1,
                }
              } else {
                return {}
              }
            },
            onEachFeature: (feature, layer) => {
              // layer.bindTooltip(info.join('<br/>'))
              layer.on('click', () => {
                selectedTrial.value = t

                nextTick(() => {
                  bottomSheetVisible.value = true
                })
              })
            },
          })

          map.addLayer(geoJsonLayer)

          // Get the bounds and fit the map to them
          const bounds = geoJsonLayer.getBounds()

          if (bounds && bounds.isValid()) {
            const marker = L.circleMarker(bounds.getCenter(), {
              radius: 8,
              fillColor: '#00acef',
              color: '#00acef',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.5,
            })
            marker.bindTooltip(info.join('<br/>'))
            marker.on('click', () => {
              selectedTrial.value = t

              map.fitBounds(bounds, { padding: [50, 50] })

              nextTick(() => {
                bottomSheetVisible.value = true
              })
            })

            clusterer.addLayer(marker)

            if (!overallBounds) {
              overallBounds = bounds
            } else {
              overallBounds.extend(bounds.getSouthWest())
              overallBounds.extend(bounds.getNorthEast())
            }
          }
        }
      }
    })

    // @ts-expect-error
    if (overallBounds && overallBounds.isValid()) {
      map.fitBounds(overallBounds, { padding: [50, 50] })
    }
  }

  function updateTrials () {
    getTrials(false)
      .then(ts => {
        trials.value = ts || []

        nextTick(() => initMap())
      })
  }

  watch(() => store.storeIsDarkMode, async () => updateThemeLayer())

  onMounted(() => {
    updateTrials()
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
