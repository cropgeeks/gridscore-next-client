import { getCell, getTrialById, getTrialData } from '@/plugins/idb'
import { coreStore } from '@/stores/app'

import emitter from 'tiny-emitter/instance'
import { DisplayOrder, type Cell } from '@/plugins/types/gridscore'
import type { CellPlus, TrialPlus } from './types/client'

let trial: TrialPlus | undefined = undefined
let trialData: { [key: string]: CellPlus } | undefined = undefined

async function loadTrialData () {
  const store = coreStore()
  const selectedTrial = store.storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      trialData = await getTrialData(selectedTrial)

      emitter.emit('trial-data-loaded')
    } catch {
      trial = undefined
      trialData = undefined
    }
  } else {
    trial = undefined
    trialData = undefined
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

function getGermplasmMatches (trial: TrialPlus, searchTerm: string) {
  if (trialData && searchTerm && searchTerm !== '') {
    const lower = searchTerm.toLowerCase()

    return Object.values(trialData).filter(c => {
      return ((c.barcode !== undefined) && (c.barcode !== null) && (c.barcode.toLowerCase() === lower)) || (c.germplasm.toLowerCase() === lower) || (c.displayName?.toLowerCase() === lower)
    }).map(c => {
      return {
        name: c.germplasm,
        rep: c.rep,
        barcode: c.barcode,
        pedigree: c.pedigree,
        treatment: c.treatment,
        displayName: c.displayName,
        row: c.row,
        column: c.column,
        displayRow: trial.layout.rowOrder === DisplayOrder.TOP_TO_BOTTOM ? ((c.row || 0) + 1) : (trial.layout.rows - (c.row || 0)),
        displayColumn: trial.layout.columnOrder === DisplayOrder.LEFT_TO_RIGHT ? ((c.column || 0) + 1) : (trial.layout.columns - (c.column || 0)),
      }
    })
  } else {
    return []
  }
}

function getTrialDataCached () {
  return trialData
}

function getTrialCached () {
  return JSON.parse(JSON.stringify(trial))
}

export {
  init,
  getTrialDataCached,
  getTrialCached,
  getGermplasmMatches,
  loadTrialData,
}
