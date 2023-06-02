import { openDB } from 'idb'
import { getId } from '@/plugins/id'
import store from '@/store'
import { TRAIT_TIMEFRAME_TYPE_ENFORCE, TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER, TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'
import { trialLayoutToPlots } from './location'

let db

const getDb = async () => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db)
    } else {
      openDB('gridscore-next-' + window.location.pathname, 1, {
        upgrade: function (db, oldVersion, newVersion, transaction) {
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
        }
      }).then(db => resolve(db))
    }
  })
}

const getTrials = async () => {
  const db = await getDb()

  const trials = await db.getAll('trials')
    .then(trials => {
      if (trials) {
        trials.forEach(trial => {
          if (trial) {
            if (trial.traits) {
              trial.traits.forEach((t, i) => {
                t.color = store.getters.storeTraitColors[i % store.getters.storeTraitColors.length]
                t.progress = 0
                t.editable = true
                if (t.timeframe && t.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE) {
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
                trial.shareStatus = TRIAL_STATE_OWNER
              } else if (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null) {
                trial.editable = true
                trial.shareStatus = TRIAL_STATE_EDITOR
              } else if (trial.shareCodes.viewerCode !== undefined && trial.shareCodes.viewerCode !== null) {
                trial.editable = false
                trial.shareStatus = TRIAL_STATE_VIEWER
              } else {
                trial.editable = false
                trial.shareStatus = TRIAL_STATE_NOT_SHARED
              }
            } else {
              trial.editable = true
              trial.shareStatus = TRIAL_STATE_NOT_SHARED
            }
          }
        })
      }

      return trials
    })

  return Promise.all(trials.map(t => {
    return db.get('transactions', t.localId)
      .then(transaction => {
        t.transactionCount = 0
        if (transaction) {
          // Sum up all individual transaction types
          t.transactionCount += transaction.plotCommentAddedTransactions ? Object.values(transaction.plotCommentAddedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          t.transactionCount += transaction.plotCommentDeletedTransactions ? Object.values(transaction.plotCommentDeletedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          t.transactionCount += transaction.plotTraitDataChangeTransactions ? Object.values(transaction.plotTraitDataChangeTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
          t.transactionCount += transaction.plotMarkedTransactions ? Object.keys(transaction.plotMarkedTransactions).length : 0
          t.transactionCount += transaction.trialCommentAddedTransactions ? transaction.trialCommentAddedTransactions.length : 0
          t.transactionCount += transaction.trialCommentDeletedTransactions ? transaction.trialCommentDeletedTransactions.length : 0
          t.transactionCount += transaction.trialGermplasmAddedTransactions ? transaction.trialGermplasmAddedTransactions.length : 0
          t.transactionCount += transaction.trialTraitAddedTransactions ? transaction.trialTraitAddedTransactions.length : 0
          t.transactionCount += transaction.trialEditTransaction ? 1 : 0
        }

        return t
      })
  }))
}

const updateTrial = async (localId, updatedTrial) => {
  const trial = await getTrialById(localId)

  if (trial) {
    const db = await getDb()
    return db.put('trials', updatedTrial)
  } else {
    return new Promise(resolve => resolve())
  }
}

const updateTrialProperties = async (localId, updates) => {
  const trial = await getTrialById(localId)

  if (trial) {
    const db = await getDb()

    const plotCorners = updates.corners ? trialLayoutToPlots(updates.corners, trial.layout.rows, trial.layout.columns) : null

    trial.name = updates.name
    trial.description = updates.description
    trial.layout.markers = updates.markers
    trial.layout.corners = updates.corners

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', localId)) || getEmptyTransaction(localId)
      transaction.trialEditTransaction = updates

      if (plotCorners) {
        const mapping = {}

        for (let row = 0; row < trial.layout.rows; row++) {
          for (let column = 0; column < trial.layout.columns; column++) {
            mapping[`${row}|${column}`] = plotCorners[row][column]
          }
        }

        transaction.trialEditTransaction.plotCorners = mapping
      }

      await db.put('transactions', transaction)
    }

    await db.put('trials', trial)

    // Get all data items belonging to this trial so we can update the plot corners
    let cursor = await db.transaction('data', 'readwrite').store.openCursor(IDBKeyRange.bound([trial.localId, 0, 0], [trial.localId, trial.layout.rows, trial.layout.columns]))

    while (cursor) {
      const cell = cursor.value

      if (cell) {
        if (plotCorners) {
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
    return new Promise(resolve => resolve())
  }
}

const updateTrialBrapiConfig = async (localId, brapiConfig) => {
  const trial = await getTrialById(localId)

  if (trial) {
    trial.brapiConfig = brapiConfig
    const db = await getDb()
    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve())
  }
}

const getTrialValidPlots = async (trialId) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const range = IDBKeyRange.bound([trialId, 0, 0], [trialId, trial.layout.rows, trial.layout.columns])
    return db.getAll('data', range)
      .then(grid => {
        const result = []
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

const getTrialById = async (localId) => {
  const db = await getDb()

  const trial = await db.get('trials', localId)
    .then(trial => {
      if (trial) {
        if (trial.traits) {
          trial.traits.forEach((t, i) => {
            t.color = store.getters.storeTraitColors[i % store.getters.storeTraitColors.length]
            t.progress = 0
            t.editable = true
            if (t.timeframe && t.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE) {
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
            trial.shareStatus = TRIAL_STATE_OWNER
          } else if (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null) {
            trial.editable = true
            trial.shareStatus = TRIAL_STATE_EDITOR
          } else if (trial.shareCodes.viewerCode !== undefined && trial.shareCodes.viewerCode !== null) {
            trial.editable = false
            trial.shareStatus = TRIAL_STATE_VIEWER
          } else {
            trial.editable = false
            trial.shareStatus = TRIAL_STATE_NOT_SHARED
          }
        } else {
          trial.editable = true
          trial.shareStatus = TRIAL_STATE_NOT_SHARED
        }
      }

      if (trial) {
        store.dispatch('setBrapiConfig', trial.brapiConfig)
      }

      return trial
    })

  return db.get('transactions', trial.localId)
    .then(transaction => {
      trial.transactionCount = 0
      if (transaction) {
        // Sum up all individual transaction types
        trial.transactionCount += transaction.plotCommentAddedTransactions ? Object.values(transaction.plotCommentAddedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
        trial.transactionCount += transaction.plotCommentDeletedTransactions ? Object.values(transaction.plotCommentDeletedTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
        trial.transactionCount += transaction.plotTraitDataChangeTransactions ? Object.values(transaction.plotTraitDataChangeTransactions).map(tr => tr.length).reduce((a, b) => a + b, 0) : 0
        trial.transactionCount += transaction.plotMarkedTransactions ? Object.keys(transaction.plotMarkedTransactions).length : 0
        trial.transactionCount += transaction.trialCommentAddedTransactions ? transaction.trialCommentAddedTransactions.length : 0
        trial.transactionCount += transaction.trialCommentDeletedTransactions ? transaction.trialCommentDeletedTransactions.length : 0
        trial.transactionCount += transaction.trialGermplasmAddedTransactions ? transaction.trialGermplasmAddedTransactions.length : 0
        trial.transactionCount += transaction.trialTraitAddedTransactions ? transaction.trialTraitAddedTransactions.length : 0
        trial.transactionCount += transaction.trialEditTransaction ? 1 : 0
      }

      return trial
    })
}

const getTransactionForTrial = async (localId) => {
  const db = await getDb()

  const trial = await getTrialById(localId)

  if (trial) {
    return db.get('transactions', localId)
  } else {
    return new Promise(resolve => resolve(null))
  }
}

const changeTrialsData = async (trialId, row, column, data) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const cell = await getCell(trialId, row, column)

    if (!cell.measurements) {
      cell.measurement = {}

      trial.traits.forEach(t => {
        cell.measurements[t.id] = []
      })
    }

    data.forEach(d => {
      const trait = trial.traits.find(t => t.id === d.traitId)

      if (!cell.measurements[d.traitId]) {
        cell.measurements[d.traitId] = []
      }

      if (d.delete) {
        if (trait.allowRepeats) {
          // Remove any with the same timestamp
          cell.measurements[d.traitId] = cell.measurements[d.traitId].filter(cm => cm.timestamp !== d.timestamp)
        } else {
          if (cell.measurements[d.traitId].length > 0) {
            // Remove any value that may exist
            cell.measurements[d.traitId] = []
          }
        }
      } else {
        if (trait.allowRepeats) {
          const match = cell.measurements[d.traitId].find(cm => cm.timestamp === d.timestamp)

          if (match) {
            // Update the values
            match.values = d.values
          } else {
            // If no match is found, simply append to the end
            cell.measurements[d.traitId].push({
              values: d.values,
              timestamp: d.timestamp
            })
          }
        } else {
          // Else, search for a match for this trait (the first entry)
          const match = cell.measurements[d.traitId].length > 0 ? cell.measurements[d.traitId][0] : null

          if (match) {
            // If it exists, update it
            match.values = d.values
            match.timestamp = d.timestamp
          } else {
            // If not, create a new one
            cell.measurements[d.traitId].push({
              values: d.values,
              timestamp: d.timestamp
            })
          }
        }
      }
    })

    // Remove this as it was only added temporarily
    delete cell.displayName

    const db = await getDb()

    if (logTransactions(trial)) {
      const traitMap = {}

      trial.traits.forEach(t => {
        traitMap[t.id] = t
      })

      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      // Create an array if it doesn't exist already
      if (!transaction.plotTraitDataChangeTransactions[`${row}|${column}`]) {
        transaction.plotTraitDataChangeTransactions[`${row}|${column}`] = []
      }

      // Get all trait data transactions for this plot
      const cellDataTs = transaction.plotTraitDataChangeTransactions[`${row}|${column}`]

      if (cellDataTs.length > 0) {
        // For each new data change
        data.forEach(d => {
          // Check if there's an old transaction for that trait

          const trait = traitMap[d.traitId]

          const match = cellDataTs.find(od => {
            if (trait.allowRepeats) {
              return od.traitId === d.traitId && od.timestamp === d.timestamp
            } else {
              return od.traitId === d.traitId
            }
          })

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
            match.values = d.values
            match.timestamp = d.timestamp
          }
        })
      } else {
        // Simply add them all as new items
        transaction.plotTraitDataChangeTransactions[`${row}|${column}`].push(...data)
      }

      if (transaction.plotTraitDataChangeTransactions[`${row}|${column}`].length < 1) {
        delete transaction.plotTraitDataChangeTransactions[`${row}|${column}`]
      }

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve())
  }
}

const deleteTrial = async (localId) => {
  const db = await getDb()

  const trial = await getTrialById(localId)

  if (trial) {
    return db.delete('trials', localId)
      .then(() => {
        const range = IDBKeyRange.bound([localId, 0, 0], [localId, trial.layout.rows, trial.layout.columns])
        return db.delete('data', range)
      })
      .then(() => {
        return db.delete('transactions', localId)
      })
  } else {
    return new Promise(resolve => resolve())
  }
}

const addTrial = async (trial) => {
  const db = await getDb()

  const id = trial.localId || getId()

  await db.add('trials', {
    localId: id,
    shareCodes: trial.shareCodes,
    name: trial.name,
    description: trial.description,
    layout: trial.layout,
    traits: trial.traits,
    brapiConfig: trial.brapiConfig,
    createdOn: trial.createdOn || new Date().toISOString(),
    updatedOn: trial.updatedOn || new Date().toISOString(),
    lastSyncedOn: trial.lastSyncedOn,
    comments: trial.comments || []
  })

  return new Promise(resolve => {
    const tx = db.transaction('data', 'readwrite')

    const allData = []

    Object.keys(trial.data).forEach(k => {
      const [row, column] = k.split('|').map(c => +c)
      const cell = trial.data[k]

      allData.push({
        trialId: id,
        row: row,
        column: column,
        germplasm: cell.germplasm,
        rep: cell.rep,
        brapiId: cell.brapiId,
        measurements: cell.measurements,
        geography: cell.geography,
        comments: cell.comments || [],
        isMarked: cell.isMarked
      })
    })

    Promise.all(allData.map(cell => tx.store.add(cell)))
      .then(() => {
        resolve(id)
        return tx.done
      })
  })
}

const getCell = async (trialId, row, column) => {
  const db = await getDb()

  return db.get('data', [trialId, row, column])
    .then(c => {
      if (c) {
        let displayName = c.germplasm

        if (c.rep) {
          displayName += '-' + c.rep
        }

        c.displayName = displayName
      }

      return c
    })
}

const getTrialData = async (trialId) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const range = IDBKeyRange.bound([trialId, 0, 0], [trialId, trial.layout.rows, trial.layout.columns])
    return db.getAll('data', range)
      .then(grid => {
        const result = {}
        if (grid) {
          grid.forEach(c => {
            let displayName = c.germplasm

            if (c.rep) {
              displayName += '-' + c.rep
            }

            c.displayName = displayName

            result[`${c.row}|${c.column}`] = c
          })
        }
        return result
      })
  } else {
    return new Promise(resolve => resolve({}))
  }
}

const getEmptyTransaction = (trialId) => {
  return {
    trialId: trialId,
    plotCommentAddedTransactions: {},
    plotCommentDeletedTransactions: {},
    plotMarkedTransactions: {},
    plotTraitDataChangeTransactions: {},
    trialCommentAddedTransactions: [],
    trialCommentDeletedTransactions: [],
    trialGermplasmAddedTransactions: [],
    trialTraitAddedTransactions: [],
    trialEditTransaction: null
  }
}

const deleteTrialComment = async (trialId, comment) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    trial.comments = trial.comments.filter(c => c.timestamp !== comment.timestamp && c.content !== comment.content)
    trial.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      const match = transaction.trialCommentAddedTransactions.findIndex(c => c.content === comment.content && c.timestamp === comment.timestamp)

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

const addTrialGermplasm = async (trialId, germplasm) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      // Add the new ones
      transaction.trialGermplasmAddedTransactions.push(...germplasm)

      // Store it back
      await db.put('transactions', transaction)
    }

    const newData = germplasm.map((g, i) => {
      const cell = {
        trialId: trialId,
        row: trial.layout.rows + i,
        column: 0,
        germplasm: g,
        rep: null,
        brapiId: null,
        measurements: {},
        geography: {},
        comments: []
      }

      trial.traits.forEach(t => {
        cell.measurements[t.id] = []
      })

      return cell
    })

    trial.layout.rows += newData.length

    await db.put('trials', trial)

    return new Promise((resolve, reject) => {
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

const addTrialTraits = async (trialId, traits) => {
  const trial = await getTrialById(trialId)

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
          cell.measurements[t.id] = []
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

const addTrialComment = async (trialId, commentContent) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    if (!trial.comments) {
      trial.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString()
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

const setPlotMarked = async (trialId, row, column, isMarked) => {
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

const deletePlotComment = async (trialId, row, column, comment) => {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    cell.comments = cell.comments.filter(c => c.timestamp !== comment.timestamp && c.content !== comment.content)
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = (await db.get('transactions', trialId)) || getEmptyTransaction(trialId)

      const tAdd = transaction.plotCommentAddedTransactions[`${row}|${column}`]

      if (tAdd) {
        // There are add transactions, so search them
        const match = tAdd.findIndex(c => c.content === comment.content && c.timestamp === comment.timestamp)

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

      if (transaction.plotCommentAddedTransactions[`${row}|${column}`].length < 1) {
        delete transaction.plotCommentAddedTransactions[`${row}|${column}`]
      }

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve(cell))
  }
}

const addPlotComment = async (trialId, row, column, commentContent) => {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    if (!cell.comments) {
      cell.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString()
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

const logTransactions = (trial) => {
  if (!trial || !trial.shareCodes || (Object.keys(trial.shareCodes).length < 1)) {
    return false
  } else {
    return true
  }
}

export {
  getDb,
  getCell,
  getTrials,
  getTrialById,
  getTrialData,
  deleteTrial,
  addTrial,
  deleteTrialComment,
  deletePlotComment,
  addPlotComment,
  addTrialComment,
  setPlotMarked,
  updateTrial,
  updateTrialBrapiConfig,
  updateTrialProperties,
  addTrialTraits,
  getTransactionForTrial,
  changeTrialsData,
  getTrialValidPlots,
  addTrialGermplasm
}
