import { calculateTransformation } from '@/plugins/transform'
import type { Corners, LatLng } from '@/plugins/types/gridscore'

export interface XY {
  x: number
  y: number
}

export interface PlotInfo {
  properties: PlotInfoProperties
  corners: Corners
  center: LatLng
}

export interface PlotInfoProperties {
  germplasm: string
  rep: string
  row: string
  column: string
  categories: string[]
}

/**
 * The euclidean space that can be used as the source or the target for the projection. Represents the space from (0, 0) to (100, 100).
 */
const euclideanSpace: XY[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]

/**
 * Projects the given source space onto the euclidean space
 * @param {*} source The source space in the form of an array of 2-dimensional corner coordinates in the order top-left, top-right, bottom-right, bottom-left
 * @returns The projection function used to convert between the two spaces.
 */
function projectToEuclidean (source: XY[]) {
  return calculateTransformation(source, euclideanSpace)
}

/**
 * Projects the euclidean space onto the given source space
 * @param {*} target The target space in the form of an array of 2-dimensional corner coordinates in the order top-left, top-right, bottom-right, bottom-left
 * @returns The projection function used to convert between the two spaces.
 */
function projectFromEuclidean (target: XY[]) {
  return calculateTransformation(euclideanSpace, target)
}

/**
 * Generates a grid of polygons representing the individual plots given the overall corner points of the trial and the number of rows and columns.
 * @param {*} corners The corner points of the trial in the form of an object <code>{ topLeft: { lat, lng }, topRight: { lat, lng }, bottomRight: { lat, lng }, bottomLeft: { lat, lng } }</code>
 * @param {*} rows The number of rows in the trial
 * @param {*} cols The number of columns in the trial
 * @returns A 2-dimensional array (rows by columns) representing the given field trial in form of a polygon each
 */
function trialLayoutToPlots (corners: Corners, rows: number, cols: number) {
  // @ts-ignore
  const gps: XY[] = [
    { y: corners.bottomLeft.lat, x: corners.bottomLeft.lng },
    { y: corners.bottomRight.lat, x: corners.bottomRight.lng },
    { y: corners.topRight.lat, x: corners.topRight.lng },
    { y: corners.topLeft.lat, x: corners.topLeft.lng },
  ]

  const perspTransform = calculateTransformation(euclideanSpace, gps)

  const width = 100 / cols
  const height = 100 / rows

  const factor = 0.05
  const gap = Math.min(height * factor, width * factor)

  const result = []
  for (let y = 0; y < rows; y++) {
    const rowData = []

    const latStart = y * height + gap
    const latEnd = (y + 1) * height - gap

    for (let x = 0; x < cols; x++) {
      const lngStart = x * width + gap
      const lngEnd = (x + 1) * width - gap

      const topLeft = perspTransform(lngStart, latStart)
      const topRight = perspTransform(lngEnd, latStart)
      const bottomRight = perspTransform(lngEnd, latEnd)
      const bottomLeft = perspTransform(lngStart, latEnd)

      rowData.push({
        topLeft: { lat: topLeft.y, lng: topLeft.x },
        topRight: { lat: topRight.y, lng: topRight.x },
        bottomRight: { lat: bottomRight.y, lng: bottomRight.x },
        bottomLeft: { lat: bottomLeft.y, lng: bottomLeft.x },
      })
    }

    result.unshift(rowData)
  }

  return result
}

function plotInfoToGeoJson (plotInfo: PlotInfo[], includePoints = true) {
  const geoJson = {
    type: 'FeatureCollection',
    features: [] as any[],
  }

  if (plotInfo) {
    plotInfo.forEach(p => {
      if (p.corners) {
        geoJson.features.push({
          properties: p.properties || {},
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [p.corners.topLeft.lng, p.corners.topLeft.lat],
              [p.corners.topRight.lng, p.corners.topRight.lat],
              [p.corners.bottomRight.lng, p.corners.bottomRight.lat],
              [p.corners.bottomLeft.lng, p.corners.bottomLeft.lat],
              [p.corners.topLeft.lng, p.corners.topLeft.lat],
            ]],
          },
        })
      } else if (p.center && includePoints) {
        geoJson.features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.center.lng, p.center.lat],
          },
          properties: p.properties || {},
        })
      }
    })
  }

  return geoJson
}

/**
 * Converts the given polygons and points to valid geoJson
 * @param {*} polygons An array of objects of the form <code>{ topLeft: { lat, lng }, topRight: { lat, lng }, bottomRight: { lat, lng }, bottomLeft: { lat, lng } }</code>
 * @param {*} points An array of objects of the form <code>{ lat, lng }</code>
 * @returns The geojson object
 */
function toGeoJson (polygons: Corners[], points?: LatLng[]) {
  const geoJson = {
    type: 'FeatureCollection',
    features: [] as any[],
  }

  if (polygons) {
    polygons.forEach(p => {
      geoJson.features.push({
        properties: {},
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [p.topLeft.lng, p.topLeft.lat],
            [p.topRight.lng, p.topRight.lat],
            [p.bottomRight.lng, p.bottomRight.lat],
            [p.bottomLeft.lng, p.bottomLeft.lat],
            [p.topLeft.lng, p.topLeft.lat],
          ]],
        },
      })
    })
  }

  if (points) {
    points.forEach(p => {
      geoJson.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
        properties: {},
      })
    })
  }

  return geoJson
}

function isGeographyAllNull (geography: Corners) {
  return !geography || (!geography.topLeft && !geography.topRight && !geography.bottomRight && !geography.bottomLeft)
}

function isLocationValid (location: LatLng) {
  return location && location.lat !== undefined && location.lat !== null && location.lng !== undefined && location.lng !== null
}

function areAllUndefined (cs: Corners) {
  return cs.topLeft && cs.topRight && cs.bottomLeft && cs.bottomRight && [cs.topLeft.lat, cs.topLeft.lng, cs.topRight.lat, cs.topRight.lng, cs.bottomLeft.lat, cs.bottomLeft.lng, cs.bottomRight.lat, cs.bottomRight.lng].every(v => v === undefined || v === null)
}

function isGeographyValid (geography: Corners) {
  if (!geography || !geography.topLeft || !geography.topRight || !geography.bottomRight || !geography.bottomLeft) {
    return false
  }

  const topLeft = geography.topLeft.lat !== undefined && geography.topLeft.lat !== null && geography.topLeft.lng !== undefined && geography.topLeft.lng !== null
  const topRight = geography.topRight.lat !== undefined && geography.topRight.lat !== null && geography.topRight.lng !== undefined && geography.topRight.lng !== null
  const bottomRight = geography.bottomRight.lat !== undefined && geography.bottomRight.lat !== null && geography.bottomRight.lng !== undefined && geography.bottomRight.lng !== null
  const bottomLeft = geography.bottomLeft.lat !== undefined && geography.bottomLeft.lat !== null && geography.bottomLeft.lng !== undefined && geography.bottomLeft.lng !== null

  return topLeft && topRight && bottomRight && bottomLeft
}

function removeMiddle (a: XY, b: XY, c: XY) {
  const cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x)
  const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)
  return cross < 0 || (cross === 0 && dot <= 0)
}

function convexHull (points: XY[]) {
  points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y)

  const n = points.length
  const hull = []

  for (let i = 0; i < 2 * n; i++) {
    const j = i < n ? i : 2 * n - 1 - i

    // @ts-ignore
    while (hull.length >= 2 && removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])) {
      hull.pop()
    }
    hull.push(points[j])
  }

  hull.pop()
  return hull
}

function toRadians (angleInDegrees: number) {
  return (angleInDegrees * Math.PI) / 180
}

function geodesicArea (latLngs: LatLng[]) {
  let area = 0
  const len = latLngs.length
  let x1 = latLngs[latLngs.length - 1]?.lng
  let y1 = latLngs[latLngs.length - 1]?.lat

  for (let i = 0; i < len; i++) {
    const x2 = latLngs[i]?.lng
    const y2 = latLngs[i]?.lat
    area += toRadians((x2 || 0) - (x1 || 0)) * (2 + Math.sin(toRadians(y1 || 0)) + Math.sin(toRadians(y2 || 0)))
    x1 = x2
    y1 = y2
  }

  return Math.abs((area * 6_378_137 * 6_378_137) / 2)
}

// TODO: Determine type
function getPlotGeoCoordinates (cell: any) {
  if (cell && cell.geometry) {
    if (cell.geography.corners && isGeographyValid(cell.geography.corners)) {
      const c = cell.geography.corners
      // Counter-clockwise direction with start and end identical

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [c.topLeft.lat, c.topLeft.lng],
              [c.bottomLeft.lat, c.bottomLeft.lng],
              [c.bottomRight.lat, c.bottomRight.lng],
              [c.topRight.lat, c.topRight.lng],
              [c.topLeft.lat, c.topLeft.lng],
            ],
          ],
        },
      }
    } else {
      const center = getPlotCenter(cell)

      if (center) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: center,
          },
        }
      }
    }
  }

  return null
}

// TODO: Determine type
function getPlotCenter (cell: any) {
  if (cell && cell.geography) {
    if (cell.geography.corners && isGeographyValid(cell.geography.corners)) {
      const c = cell.geography.corners
      const lat = c.topLeft.lat + c.topRight.lat + c.bottomRight.lat + c.bottomLeft.lat
      const lng = c.topLeft.lng + c.topRight.lng + c.bottomRight.lng + c.bottomLeft.lng

      return [lng / 4, lat / 4]
    } else if (cell.geography.center && isLocationValid(cell.geography.center)) {
      return [cell.geography.center.lng, cell.geography.center.lat]
    }
  }

  return null
}

export {
  euclideanSpace,
  projectToEuclidean,
  projectFromEuclidean,
  trialLayoutToPlots,
  toGeoJson,
  plotInfoToGeoJson,
  isLocationValid,
  isGeographyValid,
  isGeographyAllNull,
  convexHull,
  geodesicArea,
  getPlotCenter,
  getPlotGeoCoordinates,
  areAllUndefined,
}
