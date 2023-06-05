const fixPer = require('fix-perspective')

/**
 * The euclidean space that can be used as the source or the target for the projection. Represents the space from (0, 0) to (100, 100).
 */
const euclideanSpace = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
]

/**
 * Projects the given source space onto the euclidean space
 * @param {*} source The source space in the form of an array of 2-dimensional corner coordinates in the order top-left, top-right, bottom-right, bottom-left
 * @returns The projection function used to convert between the two spaces.
 */
const projectToEuclidean = (source) => {
  return fixPer(source, euclideanSpace)
}

/**
 * Projects the euclidean space onto the given source space
 * @param {*} target The target space in the form of an array of 2-dimensional corner coordinates in the order top-left, top-right, bottom-right, bottom-left
 * @returns The projection function used to convert between the two spaces.
 */
const projectFromEuclidean = (target) => {
  return fixPer(euclideanSpace, target)
}

/**
 * Generates a grid of polygons representing the individual plots given the overall corner points of the trial and the number of rows and columns.
 * @param {*} corners The corner points of the trial in the form of an object <code>{ topLeft: { lat, lng }, topRight: { lat, lng }, bottomRight: { lat, lng }, bottomLeft: { lat, lng } }</code>
 * @param {*} rows The number of rows in the trial
 * @param {*} cols The number of columns in the trial
 * @returns A 2-dimensional array (rows by columns) representing the given field trial in form of a polygon each
 */
const trialLayoutToPlots = (corners, rows, cols) => {
  const gps = [
    { y: corners.topLeft.lat, x: corners.topLeft.lng },
    { y: corners.topRight.lat, x: corners.topRight.lng },
    { y: corners.bottomRight.lat, x: corners.bottomRight.lng },
    { y: corners.bottomLeft.lat, x: corners.bottomLeft.lng }
  ]

  const perspTransform = fixPer(euclideanSpace, gps)

  const width = 100.0 / cols
  const height = 100.0 / rows

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
        bottomLeft: { lat: bottomLeft.y, lng: bottomLeft.x }
      })
    }

    result.push(rowData)
  }

  return result
}

const plotInfoToGeoJson = (plotInfo) => {
  const geoJson = {
    type: 'FeatureCollection',
    features: []
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
              [p.corners.topLeft.lng, p.corners.topLeft.lat]
            ]]
          }
        })
      } else if (p.center) {
        geoJson.features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.center.lng, p.center.lat]
          },
          properties: p.properties || {}
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
const toGeoJson = (polygons, points) => {
  const geoJson = {
    type: 'FeatureCollection',
    features: []
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
            [p.topLeft.lng, p.topLeft.lat]
          ]]
        }
      })
    })
  }

  if (points) {
    points.forEach(p => {
      geoJson.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        },
        properties: {}
      })
    })
  }

  return geoJson
}

const isGeographyAllNull = (geography) => {
  return !geography || (!geography.topLeft && !geography.topRight && !geography.bottomRight && !geography.bottomLeft)
}

const isLocationValid = (location) => {
  return location && location.lat !== undefined && location.lat !== null && location.lat !== '' && location.lng !== undefined && location.lng !== null && location.lng !== ''
}

const isGeographyValid = (geography) => {
  if (!geography || !geography.topLeft || !geography.topRight || !geography.bottomRight || !geography.bottomLeft) {
    return false
  }

  const topLeft = geography.topLeft.lat !== undefined && geography.topLeft.lat !== null && geography.topLeft.lat !== '' && geography.topLeft.lng !== undefined && geography.topLeft.lng !== null && geography.topLeft.lng !== ''
  const topRight = geography.topRight.lat !== undefined && geography.topRight.lat !== null && geography.topRight.lat !== '' && geography.topRight.lng !== undefined && geography.topRight.lng !== null && geography.topRight.lng !== ''
  const bottomRight = geography.bottomRight.lat !== undefined && geography.bottomRight.lat !== null && geography.bottomRight.lat !== '' && geography.bottomRight.lng !== undefined && geography.bottomRight.lng !== null && geography.bottomRight.lng !== ''
  const bottomLeft = geography.bottomLeft.lat !== undefined && geography.bottomLeft.lat !== null && geography.bottomLeft.lat !== '' && geography.bottomLeft.lng !== undefined && geography.bottomLeft.lng !== null && geography.bottomLeft.lng !== ''

  return topLeft && topRight && bottomRight && bottomLeft
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
  isGeographyAllNull
}
