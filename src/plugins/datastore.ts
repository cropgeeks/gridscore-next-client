import { getCell, getTrialById, getTrialData } from '@/plugins/idb'
import { coreStore } from '@/stores/app'

import emitter from 'tiny-emitter/instance'
import { CellCategory, type Cell } from '@/plugins/types/gridscore'
import type { CellPlus, MiniCell, TrialPlus } from '@/plugins/types/client'

let trial: TrialPlus | undefined = undefined
let trialData: { [key: string]: CellPlus } | undefined = undefined
let trialGermplasm: CellPlus[] | undefined = undefined
let trialReps: string[] = []
let trialTreatments: string[] = []
let trialControls: MiniCell[] = []

async function loadTrialData () {
  const store = coreStore()
  const selectedTrial = store.storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      trialData = await getTrialData(selectedTrial)

      const allGermplasm: CellPlus[] = []
      const reps = new Set<string>()
      const treatments = new Set<string>()
      const controls: MiniCell[] = []

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
            controls.push({
              row: c.row || 0,
              column: c.column || 0,
              germplasm: c.germplasm,
              rep: c.rep,
              displayColumn: c.displayColumn,
              displayRow: c.displayRow,
              displayName: c.displayName,
            })
          }
        }
      })

      reps.delete('')
      treatments.delete('')

      trialGermplasm = allGermplasm
      trialReps = [...reps].sort((a, b) => a ? a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }) : -1)
      trialTreatments = [...treatments].sort((a, b) => a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }))
      trialControls = controls.concat()

      emitter.emit('trial-data-loaded')
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

async function init () {
  emitter.on('trial-selected', loadTrialData)
  emitter.on('plot-comments-changed', updateCellCache)
  emitter.on('plot-marked-changed', updateCellCache)
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
  return JSON.parse(JSON.stringify(trialControls))
}

function getTrialDataCached () {
  return trialData
}

function getTrialCached () {
  return JSON.parse(JSON.stringify(trial))
}

export {
  init,
  getTrialGermplasmCached,
  getTrialRepsCached,
  getTrialTreatmentsCached,
  getTrialControlsCached,
  getTrialDataCached,
  getTrialCached,
  loadTrialData,
}
