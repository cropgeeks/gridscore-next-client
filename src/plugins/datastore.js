import { getCell, getTrialData } from '@/plugins/idb'
import store from '@/store'

const emitter = require('tiny-emitter/instance')

let trialData = null

const loadTrialData = () => {
  if (store.getters.storeSelectedTrial) {
    getTrialData(store.getters.storeSelectedTrial).then(td => {
      trialData = td

      emitter.emit('trial-data-loaded')
    }).catch(() => {
      trialData = null
    })
  } else {
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

  if (store.getters.storeSelectedTrial) {
    loadTrialData()
  }
}

const getGermplasmMatches = (searchTerm) => {
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
        column: c.column
      }
    })
  } else {
    return []
  }
}

const getTrialDataCached = () => {
  return trialData
}

export {
  init,
  getTrialDataCached,
  getGermplasmMatches
}
