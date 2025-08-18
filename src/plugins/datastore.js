import { getCell, getTrialById, getTrialData } from '@/plugins/idb'
import { coreStore } from '@/store'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

let trial = null
let trialData = null

let store

const getStore = () => {
  if (!store) {
    store = coreStore()
  }

  return store
}

const loadTrialData = async () => {
  const selectedTrial = getStore().storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      trialData = await getTrialData(selectedTrial)

      emitter.emit('trial-data-loaded')
    } catch (err) {
      trial = null
      trialData = null
    }
  } else {
    trial = null
    trialData = null
  }
}

const updateCellCache = (row, column, trialId) => {
  if (getStore().storeSelectedTrial === trialId) {
    if (trialData) {
      getCell(trialId, row, column)
        .then(cell => {
          const copy = JSON.parse(JSON.stringify(cell))
          trialData[`${row}|${column}`] = copy

          emitter.emit('plot-cache-changed', row, column, trialId, copy)
        })
    }
  }
}

const init = () => {
  emitter.on('trial-selected', loadTrialData)
  emitter.on('plot-comments-changed', updateCellCache)
  emitter.on('plot-marked-changed', updateCellCache)
  emitter.on('plot-data-changed', updateCellCache)

  if (getStore().storeSelectedTrial) {
    loadTrialData()
  }
}

const getGermplasmMatches = (trial, searchTerm) => {
  if (trialData && searchTerm && searchTerm !== '') {
    const lower = searchTerm.toLowerCase()

    return Object.values(trialData).filter(c => {
      return ((c.barcode !== undefined) && (c.barcode !== null) && (c.barcode.toLowerCase() === lower)) || (c.germplasm.toLowerCase() === lower) || (c.displayName.toLowerCase() === lower)
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
        displayRow: trial.layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM ? (c.row + 1) : (trial.layout.rows - c.row),
        displayColumn: trial.layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT ? (c.column + 1) : (trial.layout.columns - c.column)
      }
    })
  } else {
    return []
  }
}

const getTrialDataCached = () => {
  return trialData
}

const getTrialCached = () => {
  return JSON.parse(JSON.stringify(trial))
}

export {
  init,
  getTrialDataCached,
  getTrialCached,
  getGermplasmMatches,
  loadTrialData
}
