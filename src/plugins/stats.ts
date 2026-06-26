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

/**
 * Identifies rows in a 2D array where replicate values are significantly different.
 * @param {Array<Array<number|null>>} matrix - 2D array of trait values.
 * @param {number} thresholdZ - Z-score threshold for significance (default: 2.5)
 * @returns {Array<Object>} - Analysis results mapping to the original matrix indices.
 */
export function zScoreRepAnalysis (matrix: number[][], thresholdZ = 2.5) {
  // Step 1: Calculate Mean, SD, and CV for each row index
  const rowStats = matrix.map((row, rowIndex) => {
    // Filter out null, undefined, or NaN values
    const validValues = row.filter(val => val !== null && val !== undefined && !isNaN(val))

    // Need at least 2 replicates to evaluate variation
    if (validValues.length < 2) {
      return { rowIndex, cv: null, mean: null, isSignificant: false }
    }

    const n = validValues.length
    const mean = validValues.reduce((sum, val) => sum + val, 0) / n

    // Sample standard deviation (n - 1)
    const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
    const sd = Math.sqrt(variance)

    // Coefficient of Variation (CV) to normalize across different value ranges
    const cv = mean === 0 ? 0 : sd / Math.abs(mean)

    return { rowIndex, cv, mean, sd, isSignificant: false, zScore: 0 }
  })

  // Step 2: Calculate the baseline trial-wide variation metrics
  const validCVs = rowStats.map(r => r.cv).filter(cv => cv !== null)

  if (validCVs.length === 0) {
    // Return an empty/false structure if no valid data exists
    return matrix.map((_, rowIndex) => ({ rowIndex, isSignificant: false }))
  }

  const trialMeanCV = validCVs.reduce((sum, cv) => sum + cv, 0) / validCVs.length
  const trialVarianceCV = validCVs.reduce((sum, cv) => sum + Math.pow(cv - trialMeanCV, 2), 0) / validCVs.length
  const trialSdCV = Math.sqrt(trialVarianceCV)

  // Step 3: Flag the outlier rows
  return rowStats.map(row => {
    if (row.cv === null) {
      row.isSignificant = false
    } else {
      // How many standard deviations is this row's CV from the trial average?
      const zScore = (row.cv - trialMeanCV) / (trialSdCV || 1)

      row.isSignificant = zScore > thresholdZ
      row.zScore = zScore
    }
    return row
  })
}

/**
 * This class utilises a T-digest or dynamic quantile approach to provide information
 * about percentiles without actually keeping track of all individual data points.
 *
 * This in turn can be used to give estimations on whether a new data point should be considered
 * to be an outlier or not.
 */
export function createDynamicQuantiles (maxCentroids = 32): DynamicQuantile {
  return {
    maxCentroids,
    centroids: [],
    totalCount: 0,
    validRangeInfo: undefined,
  }
}

export function removeValue (state: DynamicQuantile, val: number) {
  let nearestIdx = 0
  let minDist = Math.abs(val - (state.centroids[0]?.mean || 0))

  for (let i = 1; i < state.centroids.length; i++) {
    const dist = Math.abs(val - (state.centroids[i]?.mean || 0))
    if (dist < minDist) {
      minDist = dist
      nearestIdx = i
    }
  }

  const nearest = state.centroids[nearestIdx] || { weight: 0, mean: 0 }

  if (nearest.weight > 1) {
    // Reverse the weighted moving average formula
    const newWeight = nearest.weight - 1
    nearest.mean = ((nearest.mean * nearest.weight) - val) / newWeight
    nearest.weight = newWeight
  } else {
    // If this was the only item in the cluster, remove the cluster entirely
    state.centroids.splice(nearestIdx, 1)
  }

  state.totalCount--
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

function disagreementRate (repValues: (number | null)[]) {
  const vals = repValues.filter(v => v !== null && !isNaN(v))
  if (vals.length < 2) {
    return null
  }
  let pairs = 0, disagreements = 0
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      pairs++
      if (vals[i] !== vals[j]) {
        disagreements++
      }
    }
  }
  return disagreements / pairs // 0 = perfect agreement, 1 = all different
}

export function flagHighDisagreementRows (data: (number | null)[][], threshold: number | null = null) {
  const rates = data.map(row => disagreementRate(row))
  const validRates = rates.filter(r => r !== null)

  // if no threshold supplied, derive one empirically:
  // flag rows that are outliers in the trial's own disagreement distribution
  if (threshold === null) {
    const mean = validRates.reduce((a, b) => a + b, 0) / validRates.length
    const sd = Math.sqrt(validRates.reduce((s, r) => s + (r - mean) ** 2, 0) / validRates.length)
    threshold = mean + 2 * sd // flag anything > 2 SD above trial mean
  }

  return rates.map((rate, gi) => ({
    germplasmIndex: gi,
    disagreementRate: rate,
    threshold,
    suspicious: rate === null ? null : rate > (threshold || 0),
  }))
}
