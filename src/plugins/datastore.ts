import { getCell, getTrialById, getTrialData } from '@/plugins/idb'
import { coreStore } from '@/stores/app'

import emitter from 'tiny-emitter/instance'
import type { Cell } from '@/plugins/types/gridscore'
import type { CellPlus, TrialPlus } from './types/client'

let trial: TrialPlus | undefined = undefined
let trialData: { [key: string]: CellPlus } | undefined = undefined
let trialGermplasm: CellPlus[] | undefined = undefined

async function loadTrialData () {
  const store = coreStore()
  const selectedTrial = store.storeSelectedTrial
  if (selectedTrial) {
    try {
      trial = await getTrialById(selectedTrial)
      trialData = await getTrialData(selectedTrial)

      const allGermplasm: CellPlus[] = []

      Object.values(trialData).forEach(c => {
        if (c) {
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
        }
      })

      trialGermplasm = allGermplasm

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

function getTrialDataCached () {
  return trialData
}

function getTrialCached () {
  return JSON.parse(JSON.stringify(trial))
}

export {
  init,
  getTrialGermplasmCached,
  getTrialDataCached,
  getTrialCached,
  loadTrialData,
}
