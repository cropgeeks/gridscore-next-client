import { changeTrialsDataInternal, getCell, getTrialById, getTrialData, type DataModification } from '@/plugins/idb'
import { coreStore } from '@/stores/app'

import emitter from 'tiny-emitter/instance'
import { CellCategory, TraitDataType, type Cell } from '@/plugins/types/gridscore'
import type { CellPlus, Geolocation, TrialPlus } from '@/plugins/types/client'
import { addValue, calculateRange, createDynamicQuantiles, removeValue, type DynamicQuantile } from '@/plugins/stats'

export interface TraitStats {
  dpCount: number
  totalCount: number
  progress: number
  minValue?: number
  suspiciousChecker?: DynamicQuantile
}

let trial: TrialPlus | undefined = undefined
let trialData: { [key: string]: CellPlus } | undefined = undefined
const trialTraitStats = ref<{ [key: string]: TraitStats }>({})
let trialGermplasm: CellPlus[] | undefined = undefined
let trialReps: string[] = []
let trialTreatments: string[] = []
let trialControls: Set<string> = new Set()
let trialBookmarks: Set<string> = new Set()

async function loadTrialData () {
  const store = coreStore()
  const selectedTrial = store.storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      trialData = await getTrialData(selectedTrial)
      trialTraitStats.value = {}

      const allGermplasm: CellPlus[] = []
      const reps = new Set<string>()
      const treatments = new Set<string>()
      const controls: Set<string> = new Set()
      const bookmarks: Set<string> = new Set()

      Object.values(trialData).forEach(c => {
        if (c) {
          reps.add(c.rep || '')
          treatments.add(c.treatment || '')
          allGermplasm.push({
            artificialId: `${c.row}|${c.column}`,
            row: c.row || 0,
            column: c.column || 0,
            displayName: c.displayName,
            rep: c.rep,
            barcode: c.barcode,
            germplasm: c.germplasm,
            displayRow: c.displayRow,
            displayColumn: c.displayColumn,
            isMarked: c.isMarked,
            measurements: {},
            comments: [],
            categories: c.categories,
          })

          if (c.categories.includes(CellCategory.CONTROL)) {
            controls.add(`${c.row}|${c.column}`)
          }
          if (c.isMarked) {
            bookmarks.add(`${c.row}|${c.column}`)
          }
        }
      })

      reps.delete('')
      treatments.delete('')

      trialGermplasm = allGermplasm
      trialReps = [...reps].sort((a, b) => a ? a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }) : -1)
      trialTreatments = [...treatments].sort((a, b) => a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }))
      trialControls = controls
      trialBookmarks = bookmarks

      calculateTraitStats()
    } catch {
      trial = undefined
      trialData = undefined
      trialGermplasm = undefined
    }
  } else {
    trial = undefined
    trialData = undefined
    trialGermplasm = undefined
  }

  emitter.emit('trial-data-loaded')
}

async function updateTrialInformation () {
  const store = coreStore()
  const selectedTrial = store.storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      emitter.emit('trial-information-updated')
    } catch {
      // Nothing happens here
    }
  }
}

function updateCellCache (row: number, column: number, trialId: string) {
  const store = coreStore()
  if (store.storeSelectedTrial === trialId && trialData) {
    getCell(trialId, row, column)
      .then((cell: Cell) => {
        const copy = JSON.parse(JSON.stringify(cell))
        if (trialData) {
          trialData[`${row}|${column}`] = copy
        }

        emitter.emit('plot-cache-changed', row, column, trialId, copy)
      })
  }
}

export function calculateTraitStats () {
  const t = trial
  const td = trialData
  if (t && td) {
    const total = Object.values(td).length
    const store = coreStore()

    t.traits.forEach(t => {
      trialTraitStats.value[t.id || ''] = {
        progress: 0,
        dpCount: 0,
        totalCount: 0,
        minValue: Number.MAX_SAFE_INTEGER,
      }
    })

    if (store.suspiciousDataPointHighlight) {
      t.traits.forEach(t => {
        const stats = trialTraitStats.value[t.id || '']
        if (stats && (TraitDataType.isNumeric(t.dataType) || t.dataType === TraitDataType.date)) {
          stats.suspiciousChecker = createDynamicQuantiles()
        }
      })
    }

    Object.values(td).forEach(c => {
      if (c && c.measurements) {
        t.traits.forEach(t => {
          const id = t.id || ''
          const stats = trialTraitStats.value[id]
          const isNumeric = TraitDataType.isNumeric(t.dataType)
          if (stats && c.measurements[id] && c.measurements[id].length > 0 && (isNumeric || t.dataType === TraitDataType.date)) {
            c.measurements[id].forEach(v => {
              v.values.forEach(vv => {
                if (vv !== undefined && vv !== null && vv.trim().length > 0) {
                  stats.minValue = Math.min(stats.minValue || Number.MAX_SAFE_INTEGER, isNumeric ? +vv : new Date(vv).getTime())
                }
              })
            })
          }
        })
      }
    })

    Object.values(td).forEach(c => {
      if (c && c.measurements) {
        t.traits.forEach(t => {
          const id = t.id || ''
          const stats = trialTraitStats.value[id]
          if (stats && c.measurements[id] && c.measurements[id].length > 0) {
            stats.dpCount = stats.dpCount ? (stats.dpCount + 1) : 1
            const isNumeric = TraitDataType.isNumeric(t.dataType)

            const svc = stats.suspiciousChecker
            if (svc) {
              c.measurements[id].forEach(v => {
                v.values.forEach(vv => {
                  if (vv !== undefined && vv !== null && vv.trim().length > 0) {
                    addValue(svc, isNumeric ? +vv : (new Date(vv).getTime() - (stats.minValue || 0)))
                  }
                })
              })
            }
          }
        })
      }
    })

    t.traits.forEach(t => {
      const stats = trialTraitStats.value[t.id || '']
      if (stats) {
        stats.totalCount = total
        stats.progress = Math.max(0, Math.min(100, stats.dpCount ? (100 * stats.dpCount / stats.totalCount) : 0))
        if (store.suspiciousDataPointHighlight && stats.suspiciousChecker) {
          calculateRange(stats.suspiciousChecker)
        }
      }
    })
  }
}

function updateMarked (row: number, column: number, trialId: string) {
  const key = `${row}|${column}`

  if (trialBookmarks.has(key)) {
    trialBookmarks.delete(key)
  } else {
    trialBookmarks.add(key)
  }

  updateCellCache(row, column, trialId)
}

function changeTrialsData (trialId: string, dataMapping: DataModification, geolocation?: Geolocation) {
  Object.values(dataMapping).forEach(k => {
    k.forEach(tm => {
      const ts = trialTraitStats.value[tm.traitId || '']
      const sus = ts?.suspiciousChecker
      const trait = trial?.traits.find(t => t.id === tm.traitId)

      if (ts && sus && trait) {
        const isNumeric = TraitDataType.isNumeric(trait.dataType)
        const isDate = trait.dataType === TraitDataType.date

        if (tm.delete) {
          ts.dpCount--
          if (isNumeric || isDate) {
            tm.values.forEach(tmv => {
              if (tmv !== undefined) {
                // Remove this value from the stats
                removeValue(sus, isNumeric ? +tmv : (new Date(tmv).getTime() - (ts.minValue || 0)))
              }
            })
          }
        } else {
          ts.dpCount++
          if (isNumeric || isDate) {
            tm.values.forEach(tmv => {
              if (tmv !== undefined) {
                // Add this value to the stats
                addValue(sus, isNumeric ? +tmv : (new Date(tmv).getTime() - (ts.minValue || 0)))
              }
            })
          }
        }

        ts.progress = Math.max(0, Math.min(100, ts.dpCount ? (100 * ts.dpCount / ts.totalCount) : 0))

        calculateRange(sus)
      }
    })
  })

  return changeTrialsDataInternal(trialId, dataMapping, geolocation)
}

async function init () {
  emitter.on('trial-selected', loadTrialData)
  emitter.on('plot-comments-changed', updateCellCache)
  emitter.on('trial-properties-changed', updateTrialInformation)
  emitter.on('plot-marked-changed', updateMarked)
  emitter.on('plot-locked-changed', updateCellCache)
  emitter.on('plot-data-changed', updateCellCache)

  if (coreStore().storeSelectedTrial) {
    await loadTrialData()
  }
}

function getTrialGermplasmCached () {
  return JSON.parse(JSON.stringify(trialGermplasm))
}

function getTrialRepsCached () {
  return JSON.parse(JSON.stringify(trialReps))
}

function getTrialTreatmentsCached () {
  return JSON.parse(JSON.stringify(trialTreatments))
}

function getTrialControlsCached () {
  return new Set<string>(trialControls)
}

function getTrialBookmarksCached () {
  return new Set<string>(trialBookmarks)
}

function getTrialDataCached () {
  return trialData
}

function getTrialCached () {
  return trial !== undefined ? JSON.parse(JSON.stringify(trial)) : trial
}

export {
  init,
  getTrialGermplasmCached,
  getTrialRepsCached,
  getTrialTreatmentsCached,
  getTrialControlsCached,
  getTrialBookmarksCached,
  getTrialDataCached,
  getTrialCached,
  changeTrialsData,
  loadTrialData,
  trialTraitStats,
}
