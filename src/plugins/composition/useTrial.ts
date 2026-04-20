import type { CellPlus, TrialPlus } from '@/plugins/types/client'
import { getTrialById, getTrialData } from '@/plugins/idb'
import { coreStore } from '@/stores/app'
import { CellCategory } from '@/plugins/types/gridscore'

import emitter from 'tiny-emitter/instance'

const trial = ref<TrialPlus>()
const trialGermplasm = ref<CellPlus[] | undefined>()
const trialReps = ref<string[]>([])
const trialTreatments = ref<string[]>([])
const trialControls = ref<Set<string>>(new Set())
const trialBookmarks = ref<Set<string>>(new Set())

export function useTrial () {
  const reloadTrial = async (force = false, localId?: string) => {
    const store = coreStore()
    const id = localId || store.storeSelectedTrial || ''

    if (force || !trial.value || id !== trial.value.localId) {
      trial.value = await getTrialById(id)

      const trialData = await getTrialData(id)

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

      trialGermplasm.value = allGermplasm
      trialReps.value = [...reps].sort((a, b) => a ? a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }) : -1)
      trialTreatments.value = [...treatments].sort((a, b) => a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }))
      trialControls.value = controls
      trialBookmarks.value = bookmarks

      emitter.emit('trial-data-loaded')
    }
  }

  const forceLoadTrial = () => reloadTrial(true)

  const initTrial = () => {
    emitter.on('trial-selected', forceLoadTrial)
  }

  return {
    initTrial,
    trial: readonly(trial),
    trialGermplasm: readonly(trialGermplasm),
    trialReps: readonly(trialReps),
    trialTreatments: readonly(trialTreatments),
    trialControls: readonly(trialControls),
    trialBookmarks: readonly(trialBookmarks),
    reloadTrial,
  }
}
