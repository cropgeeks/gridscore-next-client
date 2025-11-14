import { type IDBPDatabase, openDB } from 'idb'
import { coreStore } from '@/stores/app'
import { DisplayOrder, TimeframeType, type BrapiConfig, type CellMetadata, type Comment, type Corners, type Event, type Group, type Markers, type Measurement, type Person, type PlotDetailContent, type SocialShareConfig, type Trait, type TraitMeasurement, type Transaction } from '@/plugins/types/gridscore'
import { ShareStatus, type CellPlus, type TraitPlus, type TrialPlus, type Geolocation, type TrialGroup } from '@/plugins/types/client'
import { getColumnLabel, getRowLabel } from '@/plugins/util'
import { getId } from '@/plugins/id'
import { clearTraitImageCache, forceUpdateTraitImageCache } from '@/plugins/traitcache'
import { trialLayoutToPlots } from '@/plugins/location'

let store: any | undefined

export interface DataModification {
  [index: string]: TraitMeasurement[]
}

export interface PlotModification {
  [index: string]: PlotDetailContent
}

export interface TrialModification {
  name: string
  description?: string
  socialShareConfig?: SocialShareConfig
  group?: TrialGroup
  markers?: Markers
  corners?: Corners
  traits: Trait[]
  people: Person[]
}

function getStore () {
  if (!store) {
    store = coreStore()
  }
  return store
}

async function getDb () {
  return new Promise<IDBPDatabase>((resolve, reject) => {
    openDB('gridscore-next-' + window.location.pathname, 8, {
      upgrade: (db, oldVersion, newVersion, transaction) => {
        let trials
        let data
        let transactions
        if (oldVersion === undefined || oldVersion < 1) {
          trials = db.createObjectStore('trials', { keyPath: 'localId', autoIncrement: false })
          trials.createIndex('shareCodes', 'shareCodes', { unique: false })
          trials.createIndex('name', 'name', { unique: false })
          trials.createIndex('description', 'description', { unique: false })
          trials.createIndex('layout', 'layout', { unique: false })
          trials.createIndex('traits', 'traits', { unique: false })
          trials.createIndex('brapiConfig', 'brapiConfig', { unique: false })
          trials.createIndex('createdOn', 'createdOn', { unique: false })
          trials.createIndex('updatedOn', 'updatedOn', { unique: false })
          trials.createIndex('lastSyncedOn', 'lastSyncedOn', { unique: false })
          trials.createIndex('comments', 'comments', { unique: false })

          data = db.createObjectStore('data', { keyPath: ['trialId', 'row', 'column'] })
          data.createIndex('trialId', 'trialId', { unique: false })
          data.createIndex('row', 'row', { unique: false })
          data.createIndex('column', 'column', { unique: false })
          data.createIndex('germplasm', 'germplasm', { unique: false })
          data.createIndex('rep', 'rep', { unique: false })
          data.createIndex('brapiId', 'brapiId', { unique: false })
          data.createIndex('measurements', 'measurements', { unique: false })
          data.createIndex('geography', 'geography', { unique: false })
          data.createIndex('comments', 'comments', { unique: false })
          data.createIndex('isMarked', 'isMarked', { unique: false })

          transactions = db.createObjectStore('transactions', { keyPath: 'trialId', autoIncrement: false })
          transactions.createIndex('content', 'content', { unique: false })
        }
        if (oldVersion < 2) {
          trials = transaction.objectStore('trials')
          trials.createIndex('group', 'group', { unique: false })
        }
        if (oldVersion < 3) {
          trials = transaction.objectStore('trials')
          trials.createIndex('events', 'events', { unique: false })
        }
        if (oldVersion < 4) {
          data = transaction.objectStore('data')
          data.createIndex('categories', 'categories', { unique: false })
        }
        if (oldVersion < 5) {
          trials = transaction.objectStore('trials')
          trials.createIndex('people', 'people', { unique: false })
        }
        if (oldVersion < 6) {
          trials = transaction.objectStore('trials')
          trials.createIndex('remoteUrl', 'remoteUrl', { unique: false })
        }
        if (oldVersion < 7) {
          trials = transaction.objectStore('trials')
          trials.createIndex('remoteToken', 'remoteToken', { unique: false })
        }
        if (oldVersion < 8) {
          data = transaction.objectStore('trials')
          data.createIndex('friendlyName', 'friendlyName', { unique: false })
          data.createIndex('pedigree', 'pedigree', { unique: false })
          data.createIndex('barcode', 'barcode', { unique: false })
          data.createIndex('treatment', 'treatment', { unique: false })
        }
      },
    }).then(db => resolve(db))
  })
}

async function initDb () {
  const db = await getDb()

  let cursor = await db.transaction('trials', 'readwrite').store.openCursor()

  while (cursor) {
    const trial = cursor.value

    if (trial) {
      delete trial.data

      // Write it back to the database
      await cursor.update(trial)
    }

    cursor = await cursor.continue()
  }
}

async function getTrialGroups () {
  const db = await getDb()

  const trials = await db.getAll('trials')

  if (trials) {
    const groups: Set<string> = new Set()

    trials.forEach(t => {
      if (t.group && t.group.name) {
        groups.add(t.group.name)
      }
    })

    return [...groups].sort((a: string, b: string) => a.localeCompare(b, getStore().storeLocale || 'en', { numeric: true, sensitivity: 'base' }))
  } else {
    return []
  }
}

async function deleteTrial (localId: string) {
  const db = await getDb()

  const trial = await getTrialById(localId)

  if (trial) {
    clearTraitImageCache(trial, trial.traits.map((t: Trait) => t.id))

    return db.delete('trials', localId)
      .then(() => {
        const range = IDBKeyRange.bound([localId, 0, 0], [localId, trial.layout.rows, trial.layout.columns])
        return db.delete('data', range)
      })
      .then(() => {
        return db.delete('transactions', localId)
      })
  } else {
    return new Promise<void>(resolve => resolve())
  }
}

async function updateTrialBrapiConfig (localId: string, brapiConfig: BrapiConfig) {
  const trial = await getTrialById(localId)

  if (trial) {
    trial.brapiConfig = brapiConfig

    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = logTransactions(trial) ? ((await db.get('transactions', localId)) || getEmptyTransaction(localId)) : null

      if (!transaction.brapiConfigChangeTransaction) {
        transaction.brapiConfigChangeTransaction = {
          url: undefined,
        }
      }

      transaction.brapiConfigChangeTransaction.url = brapiConfig ? brapiConfig.url : null

      // Store it back
      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise<void>(resolve => resolve())
  }
}

async function updateTrialProperties (localId: string, updates: TrialModification) {
  const trial = await getTrialById(localId)

  updates = JSON.parse(JSON.stringify(updates))

  if (trial) {
    const db = await getDb()

    const plotCorners = updates.corners ? trialLayoutToPlots(updates.corners, trial.layout.rows, trial.layout.columns) : null
    const originalTraits = JSON.parse(JSON.stringify(trial.traits))

    const retainedTraitIds = new Set(updates.traits.map(t => t.id))
    const traitsToRemove = originalTraits.filter((t: Trait) => !retainedTraitIds.has(t.id))

    if (traitsToRemove && traitsToRemove.length > 0) {
      clearTraitImageCache(JSON.parse(JSON.stringify(trial)), traitsToRemove.map((t: Trait) => t.id))
    }

    trial.name = updates.name
    trial.description = updates.description
    trial.socialShareConfig = updates.socialShareConfig
    trial.layout.markers = updates.markers
    trial.layout.corners = updates.corners
    trial.traits = updates.traits
    trial.group = updates.group

    if (logTransactions(trial)) {
      const transaction: Transaction = (await db.get('transactions', localId)) || getEmptyTransaction(localId)
      const copy = JSON.parse(JSON.stringify(updates))
      delete copy.traits
      delete copy.people
      transaction.trialEditTransaction = copy

      if (plotCorners) {
        const mapping: { [index: string]: Corners } = {}

        for (let row = 0; row < trial.layout.rows; row++) {
          for (let column = 0; column < trial.layout.columns; column++) {
            // @ts-ignore
            mapping[`${row}|${column}`] = plotCorners[row][column]
          }
        }

        if (transaction.trialEditTransaction) {
          transaction.trialEditTransaction.plotCorners = mapping
        }
      }

      if (!transaction.traitChangeTransactions) {
        transaction.traitChangeTransactions = []
      }

      traitsToRemove.forEach((t: Trait) => {
        transaction.trialTraitDeletedTransactions.push(t)
      })

      if (updates.people && updates.people.length > 0) {
        transaction.trialPersonAddedTransactions.push(...updates.people)
      }

      updates.traits.forEach((t: Trait) => {
        const match = originalTraits.find((ot: Trait) => ot.id === t.id)

        // If either the name, the description, the group or whether it has an image or not has changed, then store in the transaction.
        if (match.name !== t.name || match.description !== t.description || JSON.stringify(match.group) !== JSON.stringify(t.group) || match.hasImage !== t.hasImage) {
          const transMatch = transaction.traitChangeTransactions.find(tr => tr.id === t.id)

          if (transMatch) {
            // If there is an old transaction entry, update it
            transMatch.name = t.name
            transMatch.description = t.description
            transMatch.group = t.group ? t.group.name : null
            transMatch.hasImage = t.hasImage || false
            transMatch.imageUrl = t.imageUrl
            transMatch.timestamp = new Date().toISOString()
          } else {
            // Else, add a new one
            transaction.traitChangeTransactions.push({
              id: t.id || '',
              name: t.name,
              description: t.description,
              group: t.group ? t.group.name : null,
              hasImage: t.hasImage || false,
              imageUrl: t.imageUrl,
              timestamp: new Date().toISOString(),
            })
          }
        }
      })

      await db.put('transactions', transaction)
    }

    await db.put('trials', trial)

    // Get all data items belonging to this trial so we can update the plot corners
    let cursor = await db.transaction('data', 'readwrite').store.openCursor(IDBKeyRange.bound([trial.localId, 0, 0], [trial.localId, trial.layout.rows, trial.layout.columns]))

    while (cursor) {
      const cell = cursor.value

      if (cell) {
        traitsToRemove.forEach((t: Trait) => {
          delete cell.measurements[t.id || '']
        })

        if (plotCorners) {
          // @ts-ignore
          cell.geography.corners = plotCorners[cell.row][cell.column]
        } else {
          delete cell.geography.corners
        }

        // Write it back to the database
        await cursor.update(cell)
      }

      cursor = await cursor.continue()
    }

    return new Promise(resolve => resolve(trial))
  } else {
    return new Promise<void>(resolve => resolve())
  }
}

async function getTrialValidPlots (trialId: string): Promise<string[]> {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const range = IDBKeyRange.bound([trialId, 0, 0], [trialId, trial.layout.rows, trial.layout.columns])
    return db.getAll('data', range)
      .then(grid => {
        const result: string[] = []
        if (grid) {
          grid.forEach(c => {
            result.push(`${c.row}|${c.column}`)
          })
        }
        return result
      })
  } else {
    return new Promise(resolve => resolve([]))
  }
}

async function addTrialTraits (trialId: string, traits: Trait[]) {
  const trial = await getTrialById(trialId)

  traits = JSON.parse(JSON.stringify(traits))

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      transaction.trialTraitAddedTransactions.push(...traits)

      await db.put('transactions', transaction)
    }

    traits.forEach(t => {
      trial.traits.push(t)
    })
    trial.updatedOn = new Date().toISOString()

    await db.put('trials', trial)

    // Get all data items belonging to this trial so we can add the new trait information
    let cursor = await db.transaction('data', 'readwrite').store.openCursor(IDBKeyRange.bound([trial.localId, 0, 0], [trial.localId, trial.layout.rows, trial.layout.columns]))

    while (cursor) {
      const cell = cursor.value
      if (cell && cell.measurements) {
        traits.forEach(t => {
          cell.measurements[t.id || ''] = []
        })

        // Write it back to the database
        await cursor.update(cell)
        cursor = await cursor.continue()
      }
    }

    return new Promise(resolve => resolve(trial))
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function addTrial (trial: TrialPlus): Promise<string> {
  const db = await getDb()

  const id = trial.localId || getId()

  // Avoid Vue Proxy issues with IDB
  const copy = JSON.parse(JSON.stringify(trial))

  await db.add('trials', {
    localId: id,
    shareCodes: copy.shareCodes,
    name: copy.name,
    brapiId: copy.brapiId || null,
    description: copy.description,
    socialShareConfig: copy.socialShareConfig || null,
    group: copy.group || null,
    layout: copy.layout,
    traits: copy.traits,
    brapiConfig: copy.brapiConfig,
    createdOn: copy.createdOn || new Date().toISOString(),
    updatedOn: copy.updatedOn || new Date().toISOString(),
    remoteUrl: copy.remoteUrl || null,
    remoteToken: copy.remoteToken || null,
    lastSyncedOn: copy.lastSyncedOn,
    comments: copy.comments || [],
    events: copy.events || [],
    people: copy.people || [],
  })

  // Make sure all cached images are updated
  forceUpdateTraitImageCache(copy)

  return new Promise(resolve => {
    const tx = db.transaction('data', 'readwrite')

    const allData: CellPlus[] = []

    for (const k in trial.data) {
      const [row, column] = k.split('|').map(c => +c)
      let cell = trial.data[k]

      if (cell && cell !== undefined) {
        cell = JSON.parse(JSON.stringify(cell)) as CellPlus

        trial.traits.forEach(t => {
          if (cell && !cell.measurements[t.id || '']) {
            cell.measurements[t.id || ''] = []
          }
        })

        allData.push({
          trialId: id,
          row,
          column,
          germplasm: cell.germplasm,
          rep: cell.rep,
          friendlyName: cell.friendlyName,
          barcode: cell.barcode,
          pedigree: cell.pedigree,
          treatment: cell.treatment,
          brapiId: cell.brapiId,
          measurements: cell.measurements,
          geography: cell.geography,
          comments: cell.comments || [],
          isMarked: cell.isMarked,
          categories: cell.categories || [],
        })
      }
    }

    Promise.all(allData.map(cell => tx.store.add(cell)))
      .then(() => {
        resolve(id)
        return tx.done
      })
  })
}

async function getTransactionForTrial (localId: string) {
  const db = await getDb()

  const trial = await getTrialById(localId)

  if (trial) {
    return db.get('transactions', localId)
  } else {
    return new Promise(resolve => resolve(undefined))
  }
}

async function getTrials (includeTransactions?: boolean, ids?: string[]): Promise<TrialPlus[]> {
  const db = await getDb()

  const trials = await db.getAll('trials')
    .then(trials => {
      if (trials) {
        if (ids) {
          trials = trials.filter(t => ids.includes(t.localId))
        }

        trials.forEach(trial => {
          if (trial) {
            if (!trial.layout.rowOrder) {
              trial.layout.rowOrder = DisplayOrder.TOP_TO_BOTTOM
            }
            if (!trial.layout.columnOrder) {
              trial.layout.columnOrder = DisplayOrder.LEFT_TO_RIGHT
            }

            if (trial.traits) {
              trial.traits.forEach((t: TraitPlus, i: number) => {
                t.color = getStore().storeTraitColors[i % getStore().storeTraitColors.length]
                t.progress = 0
                t.editable = true
                if (t.timeframe && t.timeframe.type === TimeframeType.ENFORCE) {
                  const now = new Date().toISOString()
                  if (t.timeframe.start) {
                    const date = new Date(t.timeframe.start)
                    date.setHours(0)
                    date.setMinutes(0)
                    date.setSeconds(0)

                    if (now < date.toISOString()) {
                      t.editable = false
                    }
                  }

                  if (t.timeframe.end) {
                    const date = new Date(t.timeframe.end)
                    date.setHours(23)
                    date.setMinutes(59)
                    date.setSeconds(59)

                    if (now > date.toISOString()) {
                      t.editable = false
                    }
                  }
                }
              })
            }

            if (trial.shareCodes) {
              if (trial.shareCodes.ownerCode !== undefined && trial.shareCodes.ownerCode !== null) {
                trial.editable = true
                trial.shareStatus = ShareStatus.OWNER
              } else if (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null) {
                trial.editable = true
                trial.shareStatus = ShareStatus.EDITOR
              } else if (trial.shareCodes.viewerCode !== undefined && trial.shareCodes.viewerCode !== null) {
                trial.editable = false
                trial.shareStatus = ShareStatus.VIEWER
              } else {
                trial.editable = false
                trial.shareStatus = ShareStatus.NOT_SHARED
              }
            } else {
              trial.editable = true
              trial.shareStatus = ShareStatus.NOT_SHARED
            }
          }
        })
      }

      return trials
    })

  if (includeTransactions === false) {
    return trials
  } else {
    return Promise.all(trials.map(t => {
      return db.get('transactions', t.localId)
        .then((transaction: Transaction) => {
          t.transactionCount = 0
          if (transaction) {
            // Sum up all individual transaction types
            t.transactionCount += transaction.plotCommentAddedTransactions ? Object.values(transaction.plotCommentAddedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
            t.transactionCount += transaction.plotCommentDeletedTransactions ? Object.values(transaction.plotCommentDeletedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
            t.transactionCount += transaction.plotTraitDataChangeTransactions ? Object.values(transaction.plotTraitDataChangeTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
            t.transactionCount += transaction.plotGeographyChangeTransactions ? Object.values(transaction.plotGeographyChangeTransactions).length : 0
            t.transactionCount += transaction.plotDetailsChangeTransaction ? Object.values(transaction.plotDetailsChangeTransaction).length : 0
            t.transactionCount += transaction.plotMarkedTransactions ? Object.keys(transaction.plotMarkedTransactions).length : 0
            t.transactionCount += transaction.trialCommentAddedTransactions ? transaction.trialCommentAddedTransactions.length : 0
            t.transactionCount += transaction.trialCommentDeletedTransactions ? transaction.trialCommentDeletedTransactions.length : 0
            t.transactionCount += transaction.trialEventAddedTransactions ? transaction.trialEventAddedTransactions.length : 0
            t.transactionCount += transaction.trialEventDeletedTransactions ? transaction.trialEventDeletedTransactions.length : 0
            t.transactionCount += transaction.trialPersonAddedTransactions ? transaction.trialPersonAddedTransactions.length : 0
            t.transactionCount += transaction.trialGermplasmAddedTransactions ? transaction.trialGermplasmAddedTransactions.length : 0
            t.transactionCount += transaction.trialTraitAddedTransactions ? transaction.trialTraitAddedTransactions.length : 0
            t.transactionCount += transaction.trialEditTransaction ? 1 : 0
            t.transactionCount += transaction.brapiIdChangeTransaction ? Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length : 0
            t.transactionCount += transaction.brapiIdChangeTransaction ? Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length : 0
            t.transactionCount += transaction.brapiConfigChangeTransaction && transaction.brapiConfigChangeTransaction.url !== undefined && transaction.brapiConfigChangeTransaction.url !== null && transaction.brapiConfigChangeTransaction.url !== '' ? 1 : 0
            t.transactionCount += transaction.traitChangeTransactions ? transaction.traitChangeTransactions.length : 0
          }

          return t
        })
    }))
  }
}

async function updateTrial (localId: string, updatedTrial: TrialPlus) {
  const trial = await getTrialById(localId)

  if (trial) {
    const db = await getDb()

    // Delete and local changes that may have been made to the trial temporarily
    delete updatedTrial.editable
    delete updatedTrial.shareStatus
    delete updatedTrial.transactionCount
    delete updatedTrial.data

    // Set the trial group again
    if (trial.group && trial.group.name) {
      updatedTrial.group = {
        name: trial.group.name,
      }
    }

    if (updatedTrial.traits) {
      updatedTrial.traits.forEach((t: TraitPlus) => {
        delete t.color
        delete t.editable
        delete t.progress
      })
    }

    return db.put('trials', updatedTrial)
  } else {
    return new Promise<void>(resolve => resolve())
  }
}

async function getTrialById (localId: string) {
  const db = await getDb()

  const trial = await db.get('trials', localId)
  if (trial) {
    if (!trial.layout.rowOrder) {
      trial.layout.rowOrder = DisplayOrder.TOP_TO_BOTTOM
    }
    if (!trial.layout.columnOrder) {
      trial.layout.columnOrder = DisplayOrder.LEFT_TO_RIGHT
    }

    if (trial.traits) {
      trial.traits.forEach((t: TraitPlus, i: number) => {
        t.color = getStore().storeTraitColors[i % getStore().storeTraitColors.length]
        t.progress = 0
        t.editable = true
        if (t.timeframe && t.timeframe.type === TimeframeType.ENFORCE) {
          const now = new Date().toISOString()
          if (t.timeframe.start) {
            const date = new Date(t.timeframe.start)
            date.setHours(0)
            date.setMinutes(0)
            date.setSeconds(0)

            if (now < date.toISOString()) {
              t.editable = false
            }
          }

          if (t.timeframe.end) {
            const date = new Date(t.timeframe.end)
            date.setHours(23)
            date.setMinutes(59)
            date.setSeconds(59)

            if (now > date.toISOString()) {
              t.editable = false
            }
          }
        }
      })
    }

    if (trial.shareCodes) {
      if (trial.shareCodes.ownerCode !== undefined && trial.shareCodes.ownerCode !== null) {
        trial.editable = true
        trial.shareStatus = ShareStatus.OWNER
      } else if (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null) {
        trial.editable = true
        trial.shareStatus = ShareStatus.EDITOR
      } else if (trial.shareCodes.viewerCode !== undefined && trial.shareCodes.viewerCode !== null) {
        trial.editable = false
        trial.shareStatus = ShareStatus.VIEWER
      } else {
        trial.editable = false
        trial.shareStatus = ShareStatus.NOT_SHARED
      }
    } else {
      trial.editable = true
      trial.shareStatus = ShareStatus.NOT_SHARED
    }
  }

  if (trial) {
    getStore().setBrapiConfig(trial.brapiConfig)
  }

  if (trial) {
    return db.get('transactions', trial.localId)
      .then((transaction: Transaction) => {
        trial.transactionCount = 0
        if (transaction) {
          // Sum up all individual transaction types
          trial.transactionCount += transaction.plotCommentAddedTransactions ? Object.values(transaction.plotCommentAddedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          trial.transactionCount += transaction.plotCommentDeletedTransactions ? Object.values(transaction.plotCommentDeletedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          trial.transactionCount += transaction.plotTraitDataChangeTransactions ? Object.values(transaction.plotTraitDataChangeTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          trial.transactionCount += transaction.plotGeographyChangeTransactions ? Object.values(transaction.plotGeographyChangeTransactions).length : 0
          trial.transactionCount += transaction.plotDetailsChangeTransaction ? Object.values(transaction.plotDetailsChangeTransaction).length : 0
          trial.transactionCount += transaction.plotMarkedTransactions ? Object.keys(transaction.plotMarkedTransactions).length : 0
          trial.transactionCount += transaction.trialCommentAddedTransactions ? transaction.trialCommentAddedTransactions.length : 0
          trial.transactionCount += transaction.trialCommentDeletedTransactions ? transaction.trialCommentDeletedTransactions.length : 0
          trial.transactionCount += transaction.trialEventAddedTransactions ? transaction.trialEventAddedTransactions.length : 0
          trial.transactionCount += transaction.trialEventDeletedTransactions ? transaction.trialEventDeletedTransactions.length : 0
          trial.transactionCount += transaction.trialPersonAddedTransactions ? transaction.trialPersonAddedTransactions.length : 0
          trial.transactionCount += transaction.trialGermplasmAddedTransactions ? transaction.trialGermplasmAddedTransactions.length : 0
          trial.transactionCount += transaction.trialTraitAddedTransactions ? transaction.trialTraitAddedTransactions.length : 0
          trial.transactionCount += transaction.trialEditTransaction ? 1 : 0
          trial.transactionCount += transaction.brapiIdChangeTransaction ? Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length : 0
          trial.transactionCount += transaction.brapiIdChangeTransaction ? Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length : 0
          trial.transactionCount += transaction.brapiConfigChangeTransaction && transaction.brapiConfigChangeTransaction.url !== undefined && transaction.brapiConfigChangeTransaction.url !== null && transaction.brapiConfigChangeTransaction.url !== '' ? 1 : 0
          trial.transactionCount += transaction.traitChangeTransactions ? transaction.traitChangeTransactions.length : 0
        }

        return trial
      })
  } else {
    return new Promise(resolve => resolve(null))
  }
}

async function getCell (trialId: string, row: number, column: number) {
  const trial = await getTrialById(trialId)

  const db = await getDb()

  return db.get('data', [trialId, row, column])
    .then(c => {
      if (c) {
        let displayName = c.germplasm

        if (c.friendlyName) {
          displayName = c.friendlyName
        } else if (c.rep) {
          displayName += '-' + c.rep
        }

        c.displayName = displayName
        c.displayRow = getRowLabel(trial.layout, c.row)
        c.displayColumn = getColumnLabel(trial.layout, c.column)
      }

      return c
    })
}

async function getTrialData (trialId: string): Promise<{ [key: string]: CellPlus }> {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const range = IDBKeyRange.bound([trialId, 0, 0], [trialId, trial.layout.rows, trial.layout.columns])
    return db.getAll('data', range)
      .then(grid => {
        const result = {} as { [index: string]: CellPlus }
        if (grid) {
          grid.forEach((c: CellPlus) => {
            let displayName = c.germplasm

            if (c.friendlyName) {
              displayName = c.friendlyName
            } else if (c.rep) {
              displayName += '-' + c.rep
            }

            c.displayName = displayName
            c.displayRow = getRowLabel(trial.layout, c.row || 0)
            c.displayColumn = getColumnLabel(trial.layout, c.column || 0)

            result[`${c.row}|${c.column}`] = c
          })
        }
        return result
      })
  } else {
    return new Promise(resolve => resolve({}))
  }
}

async function setPlotMarked (trialId: string, row: number, column: number, isMarked: boolean) {
  const trial = await getTrialById(trialId)
  const cell = await getCell(trialId, row, column)

  if (trial && cell) {
    if (isMarked) {
      cell.isMarked = isMarked
    } else {
      delete cell.isMarked
    }
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      if (transaction.plotMarkedTransactions[`${row}|${column}`] !== undefined && transaction.plotMarkedTransactions[`${row}|${column}`] !== null && transaction.plotMarkedTransactions[`${row}|${column}`] !== isMarked) {
        // If there is a marking value and it's not the same as the new one, they cancel each other out, so remove the transaction item
        delete transaction.plotMarkedTransactions[`${row}|${column}`]
      } else {
        // Else, there isn't a value OR it's the same, so just set it again
        transaction.plotMarkedTransactions[`${row}|${column}`] = isMarked
      }

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  }
}

async function updateGermplasmBrapiIds (trialId: string, germplasmBrapiIds: { [index: string]: string }) {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      // Add the new ones
      if (!transaction.brapiIdChangeTransaction) {
        transaction.brapiIdChangeTransaction = {
          germplasmBrapiIds: {},
          traitBrapiIds: {},
        }
      }

      Object.entries(germplasmBrapiIds).forEach(([key, value]) => {
        transaction.brapiIdChangeTransaction.germplasmBrapiIds[key] = value
      })

      // Store it back
      await db.put('transactions', transaction)
    }

    // Get all data items belonging to this trial so we can add the new trait information
    let cursor = await db.transaction('data', 'readwrite').store.openCursor(IDBKeyRange.bound([trial.localId, 0, 0], [trial.localId, trial.layout.rows, trial.layout.columns]))

    while (cursor) {
      const cell = cursor.value
      if (cell && germplasmBrapiIds[`${cell.row}|${cell.column}`]) {
        cell.brapiId = germplasmBrapiIds[`${cell.row}|${cell.column}`]

        // Write it back to the database
        await cursor.update(cell)
      }

      // Continue with the next one
      cursor = await cursor.continue()
    }

    return new Promise(resolve => resolve(trial))
  }
}

async function updateTraitBrapiIds (trialId: string, traitBrapiIds: { [index: string]: string }) {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      // Add the new ones
      if (!transaction.brapiIdChangeTransaction) {
        transaction.brapiIdChangeTransaction = {
          germplasmBrapiIds: {},
          traitBrapiIds: {},
        }
      }

      Object.entries(traitBrapiIds).forEach(([key, value]) => {
        transaction.brapiIdChangeTransaction.traitBrapiIds[key] = value
      })

      // Store it back
      await db.put('transactions', transaction)
    }

    Object.entries(traitBrapiIds).forEach(([key, value]) => {
      const match = trial.traits.find((t: Trait) => t.id === key)

      if (match) {
        match.brapiId = value
      }
    })

    return db.put('trials', trial)
  }
}

async function changeTrialsData (trialId: string, dataMapping: DataModification, geolocation?: Geolocation) {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const transaction: Transaction = logTransactions(trial) ? ((await db.get('transactions', trialId)) || getEmptyTransaction(trialId)) : null

    for (const [key, data] of Object.entries(dataMapping)) {
      const [row, column] = key.split('|').map(c => +c)

      if (row !== undefined && column !== undefined) {
        const cell = await getCell(trialId, row, column)

        if (!cell.measurements) {
          cell.measurement = {}

          trial.traits.forEach((t: Trait) => {
            cell.measurements[t.id || ''] = []
          })
        }

        data.forEach(d => {
          const trait = trial.traits.find((t: Trait) => t.id === d.traitId)

          if (!cell.measurements[d.traitId]) {
            cell.measurements[d.traitId] = []
          }

          if (d.delete) {
            if (trait.allowRepeats) {
              // Remove any with the same timestamp
              cell.measurements[d.traitId] = cell.measurements[d.traitId].filter((cm: Measurement) => cm.timestamp !== d.timestamp)
            } else {
              if (cell.measurements[d.traitId].length > 0) {
                // Remove any value that may exist
                cell.measurements[d.traitId] = []
              }
            }
          } else {
            if (trait.allowRepeats) {
              const match = cell.measurements[d.traitId].find((cm: Measurement) => cm.timestamp === d.timestamp)

              if (match) {
                // Update the values
                match.values = d.values
                match.personId = d.personId
              } else {
                // If no match is found, simply append to the end
                cell.measurements[d.traitId].push({
                  personId: d.personId,
                  values: d.values,
                  timestamp: d.timestamp,
                })
              }
            } else {
              // Else, search for a match for this trait (the first entry)
              const match = cell.measurements[d.traitId].length > 0 ? cell.measurements[d.traitId][0] : null

              if (match) {
                // If it exists, update it
                match.values = d.values
                match.timestamp = d.timestamp
                match.personId = d.personId
              } else {
                // If not, create a new one
                cell.measurements[d.traitId].push({
                  personId: d.personId,
                  values: d.values,
                  timestamp: d.timestamp,
                })
              }
            }
          }
        })

        let centerTransaction = null

        // If there is a new geolocation
        if (geolocation && geolocation.lat !== undefined && geolocation.lat !== null && geolocation.lng !== undefined && geolocation.lng !== null) {
          // Check if either, there isn't a geolocation or there isn't a center or either lat or lng are missing
          if (!cell.geography) {
            cell.geography = {
              center: null,
              corners: null,
            }
          }
          if (!cell.geography.center || cell.geography.center.lat === undefined || cell.geography.lat === null || cell.geography.center.lng === undefined || cell.geography.lng === null) {
            // Set new center as the parameter
            cell.geography = {
              center: {
                lat: geolocation.lat,
                lng: geolocation.lng,
              },
            }

            centerTransaction = cell.geography.center
          } else {
            // Otherwise, take the average
            cell.geography.center.lat = (cell.geography.center.lat + geolocation.lat) / 2
            cell.geography.center.lng = (cell.geography.center.lng + geolocation.lng) / 2

            centerTransaction = cell.geography.center
          }
        }

        // Remove this as it was only added temporarily
        delete cell.displayName
        delete cell.displayRow
        delete cell.displayColumn

        if (logTransactions(trial)) {
          const traitMap = {} as { [index: string]: Trait }

          trial.traits.forEach((t: Trait) => {
            traitMap[t.id || ''] = t
          })

          const key = `${row}|${column}`

          // Create an array if it doesn't exist already
          if (!transaction.plotTraitDataChangeTransactions[key]) {
            transaction.plotTraitDataChangeTransactions[key] = []
          }

          if (centerTransaction) {
            transaction.plotGeographyChangeTransactions[key] = {
              row,
              column,
              center: centerTransaction,
            }
          }

          // Get all trait data transactions for this plot
          const cellDataTs = transaction.plotTraitDataChangeTransactions[key]

          if (cellDataTs.length > 0) {
            // For each new data change
            data.forEach(d => {
              // Check if there's an old transaction for that trait

              const trait = traitMap[d.traitId]

              const match = trait
                ? cellDataTs.find(od => {
                    if (trait.allowRepeats) {
                      return od.traitId === d.traitId && od.timestamp === d.timestamp
                    } else {
                      return od.traitId === d.traitId
                    }
                  })
                : undefined

              if (!match) {
                cellDataTs.push(d)
              } else {
                if (match.delete && !d.delete) {
                  // If the old one is a delete, but the new one isn't, remove the delete flag
                  delete match.delete
                } else if (!match.delete && d.delete) {
                  // If the old one isn't a delete, but the new one is, set the delete flag
                  match.delete = true
                }

                // In any case, update the values and timestamp
                match.personId = d.personId
                match.values = d.values
                match.timestamp = d.timestamp
              }
            })
          } else {
            // Simply add them all as new items
            transaction.plotTraitDataChangeTransactions[key].push(...data)
          }

          if (transaction.plotTraitDataChangeTransactions[key].length === 0) {
            delete transaction.plotTraitDataChangeTransactions[key]
          }
        }

        await db.put('data', cell)
      }
    }

    if (transaction) {
      await db.put('transactions', transaction)
    }

    return new Promise<void>(resolve => resolve())
  } else {
    return new Promise<void>(resolve => resolve())
  }
}

function getEmptyTransaction (trialId: string): Transaction {
  return {
    trialId,
    plotCommentAddedTransactions: {},
    plotCommentDeletedTransactions: {},
    plotMarkedTransactions: {},
    plotTraitDataChangeTransactions: {},
    plotGeographyChangeTransactions: {},
    plotDetailsChangeTransaction: {},
    trialCommentAddedTransactions: [],
    trialCommentDeletedTransactions: [],
    trialEventAddedTransactions: [],
    trialEventDeletedTransactions: [],
    trialPersonAddedTransactions: [],
    trialGermplasmAddedTransactions: [],
    trialGermplasmWithMetadataAddedTransactions: [],
    trialTraitAddedTransactions: [],
    trialTraitDeletedTransactions: [],
    traitChangeTransactions: [],
    trialEditTransaction: null,
    brapiIdChangeTransaction: {
      germplasmBrapiIds: {},
      traitBrapiIds: {},
    },
    brapiConfigChangeTransaction: {
      url: undefined,
    },
  }
}

function logTransactions (trial: TrialPlus) {
  if (!trial || !trial.shareCodes || (Object.keys(trial.shareCodes).length === 0)) {
    return false
  } else {
    return true
  }
}

async function addTrialComment (trialId: string, commentContent: string) {
  const trial = await getTrialById(trialId)

  commentContent = JSON.parse(JSON.stringify(commentContent))

  if (trial) {
    if (!trial.comments) {
      trial.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString(),
    }

    trial.comments.push(newComment)
    trial.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      transaction.trialCommentAddedTransactions.push(newComment)

      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function addPlotComment (trialId: string, row: number, column: number, commentContent: string) {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    if (!cell.comments) {
      cell.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString(),
    }

    cell.comments.push(newComment)
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      if (!transaction.plotCommentAddedTransactions[`${row}|${column}`]) {
        transaction.plotCommentAddedTransactions[`${row}|${column}`] = []
      }

      transaction.plotCommentAddedTransactions[`${row}|${column}`].push(newComment)

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve(cell))
  }
}

async function deleteTrialComment (trialId: string, comment: Comment) {
  const trial = await getTrialById(trialId)

  comment = JSON.parse(JSON.stringify(comment))

  if (trial) {
    const db = await getDb()
    trial.comments = trial.comments.filter((c: Comment) => c.timestamp !== comment.timestamp && c.content !== comment.content)
    trial.updatedOn = new Date().toISOString()
    // Make sure there's no data stored in the `trials` table

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      const match = transaction.trialCommentAddedTransactions.findIndex((c: Comment) => c.content === comment.content && c.timestamp === comment.timestamp)

      if (match === -1) {
        // No match, add a new DELETE transaction
        transaction.trialCommentDeletedTransactions.push(comment)
      } else {
        // Remove the match
        transaction.trialCommentAddedTransactions.splice(match, 1)
      }

      // Store it back
      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function addTrialEvent (trialId: string, event: Event) {
  const trial = await getTrialById(trialId)

  if (trial) {
    if (!trial.events) {
      trial.events = []
    }

    const newEvent = {
      content: event.content,
      type: event.type,
      impact: event.impact,
      timestamp: event.timestamp || new Date().toISOString(),
    }

    trial.events.push(newEvent)
    trial.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      transaction.trialEventAddedTransactions.push(newEvent)

      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function deleteTrialEvent (trialId: string, event: Event) {
  const trial = await getTrialById(trialId)

  event = JSON.parse(JSON.stringify(event))

  if (trial) {
    const db = await getDb()
    trial.events = trial.events.filter((c: Event) => c.timestamp !== event.timestamp && c.content !== event.content)
    trial.updatedOn = new Date().toISOString()
    // Make sure there's no data stored in the `trials` table

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      const match = transaction.trialEventAddedTransactions.findIndex((c: Event) => c.content === event.content && c.timestamp === event.timestamp && c.type === event.type && c.impact === event.impact)

      if (match === -1) {
        // No match, add a new DELETE transaction
        transaction.trialEventDeletedTransactions.push(event)
      } else {
        // Remove the match
        transaction.trialEventAddedTransactions.splice(match, 1)
      }

      // Store it back
      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function deletePlotComment (trialId: string, row: number, column: number, comment: Comment) {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    cell.comments = cell.comments.filter((c: Comment) => c.timestamp !== comment.timestamp && c.content !== comment.content)
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      const tAdd = transaction.plotCommentAddedTransactions[`${row}|${column}`]

      if (tAdd) {
        // There are add transactions, so search them
        const match = tAdd.findIndex((c: Comment) => c.content === comment.content && c.timestamp === comment.timestamp)

        if (match === -1) {
          // No match, add a new DELETE transaction
          if (!transaction.plotCommentDeletedTransactions[`${row}|${column}`]) {
            transaction.plotCommentDeletedTransactions[`${row}|${column}`] = []
          }

          transaction.plotCommentDeletedTransactions[`${row}|${column}`].push(comment)
        } else {
          // Remove the match
          tAdd.splice(match, 1)
        }
      } else {
        // There aren't any add transactions, so immediately add a delete transaction
        if (!transaction.plotCommentDeletedTransactions[`${row}|${column}`]) {
          transaction.plotCommentDeletedTransactions[`${row}|${column}`] = []
        }

        transaction.plotCommentDeletedTransactions[`${row}|${column}`].push(comment)
      }

      if (transaction.plotCommentAddedTransactions[`${row}|${column}`] && transaction.plotCommentAddedTransactions[`${row}|${column}`].length === 0) {
        delete transaction.plotCommentAddedTransactions[`${row}|${column}`]
      }

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve(cell))
  }
}

async function updatePlotMetadata (trialId: string, plotMetadata: PlotModification) {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const transaction: Transaction = logTransactions(trial) ? ((await db.get('transactions', trialId)) || getEmptyTransaction(trialId)) : null

    for (const [key, data] of Object.entries(plotMetadata)) {
      const [row, column] = key.split('|').map(c => +c)

      const cell = await getCell(trialId, row || 0, column || 0)
      // Remove this as it was only added temporarily
      delete cell.displayName
      delete cell.displayRow
      delete cell.displayColumn

      if (data.friendlyName === 'DELETE') {
        delete cell.friendlyName
      } else if (data.friendlyName !== null && data.friendlyName !== '') {
        cell.friendlyName = data.friendlyName
      }
      if (data.barcode === 'DELETE') {
        delete cell.barcode
      } else if (data.barcode !== null && data.barcode !== '') {
        cell.barcode = data.barcode
      }
      if (data.pedigree === 'DELETE') {
        delete cell.pedigree
      } else if (data.pedigree !== null && data.pedigree !== '') {
        cell.pedigree = data.pedigree
      }
      if (data.treatment === 'DELETE') {
        delete cell.treatment
      } else if (data.treatment !== null && data.treatment !== '') {
        cell.treatment = data.treatment
      }

      if (logTransactions(trial)) {
        // Set the transaction details to use whatever the current new state of the plot is.
        transaction.plotDetailsChangeTransaction[key] = {
          row: data.row,
          column: data.column,
          friendlyName: cell.friendlyName,
          barcode: cell.barcode,
          pedigree: cell.pedigree,
          treatment: cell.treatment,
        }
      }

      await db.put('data', cell)
    }

    if (transaction) {
      await db.put('transactions', transaction)
    }
  }
}

async function addTrialPeople (trialId: string, people: Person[]) {
  const trial = await getTrialById(trialId)

  people = JSON.parse(JSON.stringify(people))

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      transaction.trialPersonAddedTransactions.push(...people)

      await db.put('transactions', transaction)
    }

    if (!trial.people) {
      trial.people = []
    }

    people.forEach(p => {
      trial.people.push(p)
    })
    trial.updatedOn = new Date().toISOString()

    await db.put('trials', trial)

    return new Promise(resolve => resolve(trial))
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

async function addTrialGermplasm (trialId: string, germplasm: CellMetadata[]) {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      // Add the new ones
      transaction.trialGermplasmWithMetadataAddedTransactions.push(...germplasm)

      // Store it back
      await db.put('transactions', transaction)
    }

    const newData = germplasm.map((g, i) => {
      const cell = {
        trialId,
        row: trial.layout.rows + i,
        column: 0,
        friendlyName: g.friendlyName,
        treatment: g.treatment,
        barcode: g.barcode,
        pedigree: g.pedigree,
        germplasm: g.germplasm,
        rep: g.rep,
        brapiId: null,
        measurements: {} as { [index: string]: Measurement[] },
        geography: {},
        comments: [],
        categories: []
      }

      trial.traits.forEach((t: Trait) => {
        cell.measurements[t.id || ''] = []
      })

      return cell
    })

    trial.layout.rows += newData.length

    await db.put('trials', trial)

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('data', 'readwrite')

      Promise.all(newData.map(cell => tx.store.add(cell)))
        .then(() => {
          resolve()
          return tx.done
        })
        .catch(e => reject(e))
    })
  }
}

export {
  getDb,
  getTrialGroups,
  initDb,
  getTrials,
  updateTrialProperties,
  getCell,
  getTrialById,
  getTrialData,
  updatePlotMetadata,
  addTrialGermplasm,
  addTrial,
  updateTrial,
  deleteTrial,
  addTrialPeople,
  changeTrialsData,
  addTrialTraits,
  getTrialValidPlots,
  getTransactionForTrial,
  setPlotMarked,
  addPlotComment,
  deletePlotComment,
  addTrialComment,
  deleteTrialComment,
  addTrialEvent,
  deleteTrialEvent,
  updateTrialBrapiConfig,
  updateGermplasmBrapiIds,
  updateTraitBrapiIds,
}
