import type { CellPlus, TrialPlus } from '@/plugins/types/client'
import { TraitDataType } from '@/plugins/types/gridscore'

export interface Centroid {
  mean: number
  weight: number
}

export interface ValidRangeInfo {
  lowerBound: number
  upperBound: number
  isReady: boolean
}

export interface DynamicQuantile {
  maxCentroids: number
  centroids: Centroid[]
  totalCount: number
  validRangeInfo: ValidRangeInfo | undefined
}

export function calculateTraitStats (trial: TrialPlus, data: { [key: string]: CellPlus }) {
  const total = Object.values(data).length

  trial.traits.forEach(t => {
    if (TraitDataType.isNumeric(t.dataType)) {
      t.suspiciousChecker = createDynamicQuantiles()
    }
  })

  Object.values(data).forEach(c => {
    if (c && c.measurements) {
      trial.traits.forEach(t => {
        const id = t.id || ''
        if (c.measurements[id] && c.measurements[id].length > 0) {
          t.progress = t.progress ? (t.progress + 1) : 1

          const svc = t.suspiciousChecker
          if (svc) {
            c.measurements[id].forEach(v => {
              v.values.forEach(vv => {
                if (vv !== undefined && vv !== null && vv.trim().length > 0) {
                  addValue(svc, +vv)
                }
              })
            })
          }
        }
      })
    }
  })

  trial.traits.forEach(t => {
    t.progress = t.progress ? (100 * t.progress / total) : 0
    if (t.suspiciousChecker) {
      calculateRange(t.suspiciousChecker)
    }
  })
}

/**
 * This class utilises a T-digest or dynamic quantile approach to provide information
 * about percentiles without actually keeping track of all individual data points.
 *
 * This in turn can be used to give estimations on whether a new data point should be considered
 * to be an outlier or not.
 */
export function createDynamicQuantiles (maxCentroids = 32) {
  return {
    maxCentroids,
    centroids: [],
    totalCount: 0,
    validRangeInfo: undefined,
  }
}

/**
 * Streams a new value into the sketch dynamically updating clusters.
 * Time Complexity: O(K) where K is maxCentroids (virtually instant).
 */
export function addValue (state: DynamicQuantile, val: number) {
  state.totalCount++

  // 1. First point initialization
  if (state.centroids.length < state.maxCentroids) {
    state.centroids.push({ mean: val, weight: 1 })
    return
  }

  // 2. Find the nearest cluster centroid to this value
  let nearestIdx = 0
  let minDist = Math.abs(val - (state.centroids[0]?.mean || 0))

  for (let i = 1; i < state.centroids.length; i++) {
    const dist = Math.abs(val - (state.centroids[i]?.mean || 0))
    if (dist < minDist) {
      minDist = dist
      nearestIdx = i
    }
  }

  // Update that closest centroid using a weighted running average
  const nearest = state.centroids[nearestIdx] || { weight: 0, mean: 0 }
  nearest.weight += 1
  nearest.mean = nearest.mean + (val - nearest.mean) / nearest.weight

  // 3. Keep them sorted by mean so compress() and percentiles can process chronologically
  state.centroids.sort((a, b) => a.mean - b.mean)

  // 4. Periodically compress closely grouped centroids to keep things accurate
  // (e.g., every 50 points, merge the two closest adjacent centroids)
  if (state.totalCount % 50 === 0) {
    compress(state)
  }
}

/**
 * Merges clusters that have drifted close together to keep memory bounded.
 */
function compress (state: DynamicQuantile) {
  if (state.centroids.length <= 2) {
    return
  }

  let bestMergeIdx = 0
  let minDelta = Infinity

  // Find the two adjacent centroids with the closest means
  for (let i = 0; i < state.centroids.length - 1; i++) {
    // @ts-ignore
    const delta = state.centroids[i + 1].mean - state.centroids[i].mean
    if (delta < minDelta) {
      minDelta = delta
      bestMergeIdx = i
    }
  }

  // Merge them
  const c1 = state.centroids[bestMergeIdx] || { weight: 0, mean: 0 }
  const c2 = state.centroids[bestMergeIdx + 1] || { weight: 0, mean: 0 }
  const totalWeight = c1.weight + c2.weight

  c1.mean = (c1.mean * c1.weight + c2.mean * c2.weight) / totalWeight
  c1.weight = totalWeight

  // Remove the duplicate merged entry
  state.centroids.splice(bestMergeIdx + 1, 1)
}

/**
 * Approximates a specific percentile (0.0 to 1.0) across the dynamic landscape.
 */
function getPercentile (state: DynamicQuantile, targetPercentile: number) {
  if (state.centroids.length === 0) {
    return 0
  }

  // Sort before computing percentiles
  state.centroids.sort((a, b) => a.mean - b.mean)

  const targetWeight = targetPercentile * state.totalCount
  let accumulatedWeight = 0

  for (let i = 0; i < state.centroids.length; i++) {
    accumulatedWeight += (state.centroids[i]?.weight || 0)
    if (accumulatedWeight >= targetWeight) {
      return state.centroids[i]?.mean || 0
    }
  }
  return state.centroids[state.centroids.length - 1]?.mean || 0
}

/**
 * Calculates the current approximate IQR boundaries.
 */
function getBounds (state: DynamicQuantile): ValidRangeInfo {
  const q1 = getPercentile(state, 0.25)
  const q3 = getPercentile(state, 0.75)
  const iqr = q3 - q1

  return {
    lowerBound: q1 - (1.5 * iqr),
    upperBound: q3 + (1.5 * iqr),
    isReady: state.totalCount >= 15, // Cold start guard
  }
}

export function calculateRange (state: DynamicQuantile) {
  state.validRangeInfo = getBounds(state)
}

export function isSuspicious (state: DynamicQuantile, value: number): boolean {
  if (state.validRangeInfo && state.validRangeInfo.isReady) {
    return value < state.validRangeInfo.lowerBound || value > state.validRangeInfo.upperBound
  } else {
    return false
  }
}
