import { getCell, getTrialById, getTrialData } from '@/plugins/idb'
import store from '@/store'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

let trial = null
let trialData = null

const loadTrialData = () => {
  if (store.getters.storeSelectedTrial) {
    getTrialById(store.getters.storeSelectedTrial)
      .then(t => {
        trial = t
        return getTrialData(store.getters.storeSelectedTrial)
      })
      .then(td => {
        trialData = td

        emitter.emit('trial-data-loaded')
      })
      .catch(() => {
        trial = null
        trialData = null
      })
  } else {
    trial = null
    trialData = null
  }
}

const updateCellCache = (row, column, trialId) => {
  if (store.getters.storeSelectedTrial === trialId) {
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

  if (store.getters.storeSelectedTrial) {
    loadTrialData()
  }
}

const getGermplasmMatches = (trial, searchTerm) => {
  if (trialData && searchTerm && searchTerm !== '') {
    const lower = searchTerm.toLowerCase()

    return Object.values(trialData).filter(c => {
      return c.germplasm.toLowerCase() === lower || c.displayName.toLowerCase() === lower
    }).map(c => {
      return {
        name: c.germplasm,
        rep: c.rep,
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
  getGermplasmMatches
}
