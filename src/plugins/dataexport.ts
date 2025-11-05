import emitter from 'tiny-emitter/instance'
import { getTrialDataCached } from '@/plugins/datastore'
import type { TrialPlus, CellPlus, TraitPlus } from '@/plugins/types/client'
import { EventType, type Geography, type Measurement, type Trait } from '@/plugins/types/gridscore'
import { GERMINATE_EXPECTED_COLUMNS, safeTrialName, TABULAR_EXPECTED_COLUMNS, toGerminateDataType, toLocalDateString, toLocalDateTimeString } from '@/plugins/util'
import { saveAs } from 'file-saver'
import { i18n } from '@/plugins/vuetify'

interface IndividualMeasurement {
  traitId: string
  setPosition: number
  date: string
  value: string
  geography: Geography | undefined
}

export interface TabExportConfig {
  aggregate: boolean
  includePeople: boolean
  useTimestamps: boolean
}

function traitsToGridScore (traits: TraitPlus[]): string {
  const copy: TraitPlus[] = JSON.parse(JSON.stringify(traits))
  copy.forEach(t => {
    delete t.id
    delete t.progress
    delete t.editable
    delete t.color
  })
  return JSON.stringify(copy, null, 2)
}

function traitsToGerminate (traits: Trait[]): string {
  let text = GERMINATE_EXPECTED_COLUMNS.join('\t')

  traits.forEach(t => {
    text += `\n${t.name}\t\t${t.description || ''}\t${toGerminateDataType(t.dataType)}\t\t\t\t${(t.restrictions && t.restrictions.categories) ? ('[[' + t.restrictions.categories.join(',') + ']]') : ''}\t${(t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''}\t${(t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''}\t${t.setSize}\t${t.allowRepeats ? 'true' : 'false'}`
  })

  return text
}

function traitsToTabular (traits: Trait[]): string {
  let text = TABULAR_EXPECTED_COLUMNS.join('\t')

  traits.forEach(t => {
    text += `\n${t.name}\t${t.description || ''}\t${t.dataType}\t${t.allowRepeats ? 1 : 0}\t${t.setSize}\t${t.group || ''}`

    // Restrictions
    text += `\t${(t.restrictions && t.restrictions.categories) ? t.restrictions.categories.join(',') : ''}\t${(t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''}\t${(t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''}`

    // Timeframe
    if (t.timeframe) {
      text += `\t${t.timeframe.type}\t${t.timeframe.start || ''}\t${t.timeframe.end || ''}`
    } else {
      text += '\t\t\t'
    }
  })

  return text
}

function exportTrialLayout (trial: TrialPlus, trialData: { [index: string]: CellPlus }) {
  if (trial.layout && trialData) {
    let result = 'Germplasm\tRep\tRow\tColumn\tTreatment\tFriendly name\tBarcode\tPedigree'

    for (let row = 0; row < trial.layout.rows; row++) {
      for (let column = 0; column < trial.layout.columns; column++) {
        const c = trialData[`${row}|${column}`]

        if (c) {
          result += `\n${c.germplasm}\t${c.rep || ''}\t${c.displayRow}\t${c.displayColumn}\t${c.treatment || ''}\t${c.friendlyName || ''}\t${c.barcode || ''}\t${c.pedigree || ''}`
        }
      }
    }

    downloadText(result, `gridscore-layout-${safeTrialName(trial)}.txt`)
  }
}

function downloadText (text: string, filename: string) {
  const blobby = new Blob([text], { type: 'text/plain;charset=utf-8' })
  saveAs(blobby, filename)
}

function exportDataTab (trial: TrialPlus, tabConfig: TabExportConfig, direction: 'wide' | 'long' = 'wide') {
  emitter.emit('show-loading', true)

  const data = getTrialDataCached()
  if (data) {
    // Header row
    let result
    if (direction === 'wide') {
      result = trialsDataToMatrix(data, trial, tabConfig.aggregate)
    } else if (direction === 'long') {
      result = trialsDataToLongFormat(data, trial, tabConfig.aggregate, tabConfig.includePeople, tabConfig.useTimestamps)
    }

    if (result) {
      downloadText(result, `gridscore-data-${safeTrialName(trial)}.txt`)
    }
  }

  emitter.emit('show-loading', false)
}

function trialsDataToLongFormat (data: { [index: string]: CellPlus }, trial: TrialPlus, aggregate = true, includePeople = false, useTimestamps = false) {
  let result = 'Germplasm\tRep\tRow\tColumn\tSet entry\tDate\tLatitude\tLongitude\tTrait\tValue'

  if (aggregate) {
    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}\t`

        const dates = new Set<string>()
        Object.values(v.measurements).forEach(td => {
          td.forEach(dp => dates.add(dp.timestamp.split('T')[0] || ''))
        })

        const dateArray = [...dates].sort((a, b) => a.localeCompare(b))

        dateArray.forEach(date => {
          trial.traits.forEach(t => {
            const td = v.measurements[t.id || '']

            if (td) {
              const onDate = td.filter(dp => dp.timestamp.split('T')[0] === date).reduce((a: (string | undefined)[], b: Measurement) => a.concat(b.values), []).filter(v => v !== undefined && v !== null)

              if (onDate.length > 0) {
                let values
                const last: string | undefined = onDate[onDate.length - 1]
                if (t.dataType === 'float' || t.dataType === 'int' || t.dataType === 'range') {
                  values = `\t${onDate.reduce((acc, val) => acc + (+val), 0) / onDate.length}`
                } else if (t.dataType === 'categorical' && t.restrictions && t.restrictions.categories && last !== undefined) {
                  values = `\t${t.restrictions.categories[+last]}`
                } else {
                  values = `\t${onDate[onDate.length - 1]}`
                }

                result += `\n${germplasmMeta}\t${date}`

                if (v.geography) {
                  result += getLatLngAverage(v.geography)
                } else {
                  result += '\t\t'
                }

                result += `\t${t.name}\t${values}`
              }
            }
          })
        })
      }
    })
  } else {
    if (includePeople) {
      result += '\tPerson'
    }

    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}`

        trial.traits.forEach(t => {
          const td = v.measurements[t.id || '']

          if (td) {
            td.forEach(dp => {
              const values = (dp.values || [])
                .map((value, index) => {
                  return {
                    index,
                    value,
                  }
                })
                .filter(val => val !== undefined && val !== null && val.value !== undefined && val.value !== null && val.value !== '')
                .flat()

              if (values && values.length > 0) {
                values.forEach(val => {
                  result += `\n${germplasmMeta}\t${val.index + 1}\t${useTimestamps ? toLocalDateTimeString(dp.timestamp, { overallSeparator: ' ', dateSeparator: '-', timeSeparator: ':' }) : dp.timestamp.split('T')[0]}`

                  if (v.geography) {
                    result += getLatLngAverage(v.geography)
                  } else {
                    result += '\t\t'
                  }

                  result += `\t${t.name}\t${(t.dataType === 'categorical' && t.restrictions && t.restrictions.categories && val.value !== undefined) ? t.restrictions.categories[+val.value] : val.value}`

                  if (includePeople && trial.people && trial.people.length > 0) {
                    const person = trial.people.find(p => p.id === dp.personId)
                    result += `\t${person ? person.name : ''}`
                  } else {
                    result += '\t'
                  }
                })
              }
            })
          }
        })
      }
    })
  }

  return result
}

function trialsDataToMatrix (data: { [index: string]: CellPlus }, trial: TrialPlus, aggregate = true) {
  let result = `Line/Trait\tRep\tRow\tColumn\tSet\tDate\t${trial.traits.map(t => t.name).join('\t')}\tLatitude\tLongitude`

  if (aggregate) {
    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}`

        const dates = new Set<string>()
        Object.values(v.measurements).forEach(td => {
          td.forEach(dp => dates.add(dp.timestamp.split('T')[0] || ''))
        })

        const dateArray = [...dates].sort((a, b) => a.localeCompare(b))

        dateArray.forEach(date => {
          result += `\n${germplasmMeta}\t\t${date}`

          trial.traits.forEach(t => {
            const td = v.measurements[t.id || '']

            if (td) {
              const onDate: (string | undefined)[] = td.filter(dp => dp.timestamp.split('T')[0] === date).reduce((a: (string | undefined)[], b: Measurement) => a.concat(b.values), []).filter(v => v !== undefined && v !== null) || []

              if (onDate.length > 0) {
                const last: string | undefined = onDate[onDate.length - 1]
                if (t.dataType === 'float' || t.dataType === 'int' || t.dataType === 'range') {
                  result += `\t${onDate.filter(val => val !== undefined).reduce((acc, val) => acc + (+val), 0) / onDate.length}`
                } else if (t.dataType === 'categorical' && t.restrictions && t.restrictions.categories && last !== undefined) {
                  result += `\t${t.restrictions.categories[+last]}`
                } else {
                  result += `\t${onDate[onDate.length - 1]}`
                }
              } else {
                result += '\t'
              }
            } else {
              result += '\t'
            }
          })

          if (v.geography) {
            result += getLatLngAverage(v.geography)
          } else {
            result += '\t\t'
          }
        })
      }
    })
  } else {
    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}`

        const measurements: IndividualMeasurement[] = []

        trial.traits.forEach(t => {
          const td = v.measurements[t.id || '']

          if (td) {
            td.forEach(dp => {
              const values = (dp.values || [])
                .filter(val => val !== undefined && val !== null && val !== '')
                .flat()
                .filter(val => val !== undefined && val !== null && val !== '')

              if (values && values.length > 0) {
                values.forEach((val, setPosition) => {
                  const value = (t.dataType === 'categorical' && t.restrictions && t.restrictions.categories && val !== undefined) ? t.restrictions.categories[+val] : val

                  if (value !== undefined) {
                    measurements.push({
                      traitId: t.id || '',
                      setPosition,
                      date: dp.timestamp.split('T')[0] || '',
                      value,
                      geography: v.geography,
                    })
                  }
                })
              }
            })
          }
        })

        measurements.forEach(m => {
          const values = trial.traits.map(t => `${t.id === m.traitId ? m.value : ''}`).join('\t')
          result += `\n${germplasmMeta}\t${m.setPosition + 1}\t${m.date}\t${values}`

          if (m.geography) {
            result += getLatLngAverage(m.geography)
          } else {
            result += '\t\t'
          }
        })
      }
    })
  }

  return result
}

function getLatLngAverage (geography: Geography) {
  let result = ''

  if (geography) {
    if (geography.center) {
      result += `\t${geography.center.lat || ''}\t${geography.center.lng || ''}`
    } else if (geography.corners) {
      let latverage = 0
      let lngverage = 0
      let count = 0

      if (geography.corners.topLeft) {
        latverage += geography.corners.topLeft.lat || 0
        lngverage += geography.corners.topLeft.lng || 0
        count++
      }
      if (geography.corners.topRight) {
        latverage += geography.corners.topRight.lat || 0
        lngverage += geography.corners.topRight.lng || 0
        count++
      }
      if (geography.corners.bottomLeft) {
        latverage += geography.corners.bottomLeft.lat || 0
        lngverage += geography.corners.bottomLeft.lng || 0
        count++
      }
      if (geography.corners.bottomRight) {
        latverage += geography.corners.bottomRight.lat || 0
        lngverage += geography.corners.bottomRight.lng || 0
        count++
      }

      if (count) {
        result += `\t${latverage / count}\t${lngverage / count}`
      } else {
        result += '\t\t'
      }
    } else {
      result += '\t\t'
    }
  }

  return result
}

function exportTrialComments (trial: TrialPlus) {
  let result = 'Date\tComment'
  const comments = trial.comments || []

  comments.forEach(c => {
    result += `\n${toLocalDateString(new Date(c.timestamp))}\t${c.content}`
  })

  downloadText(result, `gridscore-trial-comments-${safeTrialName(trial)}.txt`)
}

function exportTrialEvents (trial: TrialPlus) {
  let result = 'Date\tEvent\tType\tImpact'
  const events = trial.events || []

  events.forEach(c => {
    let typeString
    switch (c.type) {
      case EventType.MANAGEMENT:
        typeString = i18n.global.t('formSelectOptionEventTypeManagement')
        break
      case EventType.WEATHER:
        typeString = i18n.global.t('formSelectOptionEventTypeWeather')
        break
      case EventType.OTHER:
        typeString = i18n.global.t('formSelectOptionEventTypeOther')
        break
    }
    result += `\n${toLocalDateString(new Date(c.timestamp || new Date()))}\t${c.content}\t${typeString}\t${c.impact}`
  })

  downloadText(result, `gridscore-trial-events-${safeTrialName(trial)}.txt`)
}

function exportPlotComments (trial: TrialPlus, trialData: { [index: string]: CellPlus }) {
  let result = 'Germplasm\tRep\tRow\tColumn\tDate\tComment'

  Object.values(trialData).forEach(c => {
    if (c && c.comments && c.comments.length > 0) {
      const row = c.displayRow
      const column = c.displayColumn
      c.comments.forEach(cm => {
        result += `\n${c.germplasm}\t${c.rep || ''}\t${row}\t${column}\t${toLocalDateString(new Date(cm.timestamp))}\t${cm.content}`
      })
    }
  })

  downloadText(result, `gridscore-plot-comments-${safeTrialName(trial)}.txt`)
}

export {
  downloadText,
  exportDataTab,
  exportTrialLayout,
  traitsToGerminate,
  traitsToTabular,
  traitsToGridScore,
  exportTrialComments,
  exportTrialEvents,
  exportPlotComments,
}
