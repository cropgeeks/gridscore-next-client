import { i18n } from '@/plugins/i18n'
import { getId } from '@/plugins/id'
import { trialLayoutToPlots } from '@/plugins/location'
import { coreStore } from '@/store'
import { TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'

import INumber from '~icons/bi/123'
import IDecimal from '~icons/bi/regex'
import ISlider from '~icons/bi/sliders'
import ICategory from '~icons/bi/list-ol'
import IBoolean from '~icons/bi/check-square'
import IDate from '~icons/bi/calendar-date'
import IGps from '~icons/bi/geo-alt-fill'
import IImage from '~icons/bi/camera-fill'
import IVideo from '~icons/bi/camera-video-fill'
import IText from '~icons/bi/textarea-t'

import { saveAs } from 'file-saver'
import { DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_RIGHT_TO_LEFT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

const { t } = i18n.global

const givenNames = ['Adie', 'Angie', 'Ashleigh', 'Ashton', 'Aubrey', 'Barnes', 'Barry', 'Basil', 'Bernadine', 'Bethany', 'Braden', 'Bradley', 'Brent', 'Bret', 'Brett', 'Burdine', 'Caden', 'Cadence', 'Carrington', 'Charlene', 'Charles', 'Charlton', 'Chay', 'Chet', 'Christopher', 'Cowden', 'Daris', 'Darleen', 'Darlene', 'Darnell', 'Deb', 'Demi', 'Dennis', 'Diamond', 'Doreen', 'Dorothy', 'Dustin', 'Earlene', 'Elaine', 'Elfriede', 'Ellis', 'Emery', 'Emory', 'Evan', 'Gabriel', 'Georgiana', 'Gladys', 'Greenbury', 'Gregory', 'Greig', 'Gwen', 'Harley', 'Hastings', 'Hazel', 'Heather', 'Helton', 'Henrietta', 'Heston', 'Holly', 'Hulda', 'Increase', 'India', 'Irene', 'Jackie', 'Jade', 'January', 'Jaylon', 'Jean', 'Jemma', 'Jenny', 'Jensen', 'Jerald', 'Jerrold', 'Jerry', 'Jessie', 'Jethro', 'Jigar', 'Jill', 'Jocelyn', 'Jodie', 'Joey', 'Justine', 'Kate', 'Kathryn', 'Keaton', 'Kendra', 'Kerr', 'Kimball', 'Kitty', 'Kristy', 'Kylie', 'Laren', 'Lawrence', 'Lawson', 'Leanne', 'Lianne', 'Louise', 'Luci', 'Maddox', 'Malford', 'Marlene', 'Maud', 'Melinda', 'Melville', 'Millicent', 'Mindi', 'Mindy', 'Molly', 'Mort', 'Nancy', 'Nelson', 'Nigel', 'Osbert', 'Ottilie', 'Pamela', 'Pascoe', 'Percy', 'Piper', 'Pippa', 'Poppy', 'Raleigh', 'Rebecca', 'Reynold', 'Rhoda', 'Riley', 'Roland', 'Rosaleen', 'Rosalie', 'Rosie', 'Ruby', 'Rupert', 'Ruth', 'Savannah', 'Scarlett', 'Sharon', 'Sheridan', 'Shiloh', 'Sidney', 'Stacy', 'Sue', 'Sydney', 'Tammy', 'Tim', 'Timmy', 'Timothy', 'Tracy', 'Travis', 'Trent', 'Trudie', 'Tucker', 'Velma', 'Vicary', 'Violet', 'Walker', 'Warren', 'Whitney', 'Wilfried', 'Woodrow']

const DIVISIONS = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' }
]

const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  if (a) {
    return `rgba(${r},${g},${b},${a})`
  } else {
    return `rgba(${r},${g},${b})`
  }
}

let store

const getStore = () => {
  if (!store) {
    store = coreStore()
  }
  return store
}

const invertHex = (hex) => (Number(`0x1${hex.replace('#', '')}`) ^ 0xFFFFFF).toString(16).substring(1).toUpperCase()

const formatTimeAgo = (date) => {
  const formatter = new Intl.RelativeTimeFormat((getStore().storeLocale || 'en-GB').split('-')[0], {
    numeric: 'always'
  })

  let duration = (new Date(date) - new Date()) / 1000

  for (let i = 0; i <= DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
}

/**
 * For the given trait, return the i18n text
 * @param trait The trait for which to return the text
 */
const getTraitTypeText = (trait, short = false) => {
  switch (trait.dataType) {
    case 'date':
      return t(short ? 'traitTypeShortDate' : 'traitTypeDate')
    case 'int':
      return t(short ? 'traitTypeShortInt' : 'traitTypeInt')
    case 'float':
      return t(short ? 'traitTypeShortFloat' : 'traitTypeFloat')
    case 'range':
      return t(short ? 'traitTypeShortRange' : 'traitTypeRange')
    case 'text':
      return t(short ? 'traitTypeShortText' : 'traitTypeText')
    case 'categorical':
      return t(short ? 'traitTypeShortCategorical' : 'traitTypeCategorical')
    case 'gps':
      return t(short ? 'traitTypeShortGps' : 'traitTypeGps')
    case 'image':
      return t(short ? 'traitTypeShortImage' : 'traitTypeImage')
    case 'video':
      return t(short ? 'traitTypeShortVideo' : 'traitTypeVideo')
    default:
      return null
  }
}

/**
 * For the given trait, return the representative icon
 * @param dataType The trait data type for which to return the icon
 */
const getTraitTypeIcon = dataType => {
  switch (dataType) {
    case 'date':
      return IDate
    case 'int':
      return INumber
    case 'float':
      return IDecimal
    case 'range':
      return ISlider
    case 'text':
      return IText
    case 'categorical':
      return ICategory
    case 'boolean':
      return IBoolean
    case 'gps':
      return IGps
    case 'image':
      return IImage
    case 'video':
      return IVideo
    default:
      return null
  }
}

const isInteger = event => {
  const charCode = (event.which) ? event.which : event.keyCode
  if (charCode < 48 || charCode > 57) {
    event.preventDefault()
  } else {
    return true
  }
}

const downloadText = (text, filename) => {
  const blobby = new Blob([text], { type: 'text/plain;charset=utf-8' })
  saveAs(blobby, filename)
}

const padZerosTo = (str, length) => {
  while (str.length < length) {
    str = '0' + str
  }

  return str
}

const toLocalDateString = (date = null, opts) => {
  opts = Object.assign({}, { dateSeparator: '-' }, opts)
  const d = date === null ? new Date() : new Date(date)
  const month = padZerosTo('' + (d.getMonth() + 1), 2)
  const day = padZerosTo('' + d.getDate(), 2)
  const year = d.getFullYear()

  return [year, month, day].join(opts.dateSeparator)
}

const toLocalDateTimeString = (str, opts) => {
  opts = Object.assign({}, { dateSeparator: '-', timeSeparator: '-', overallSeparator: '_' }, opts)

  const date = toLocalDateString(str, opts)
  const d = new Date(str)

  const hours = padZerosTo('' + d.getHours(), 2)
  const minutes = padZerosTo('' + d.getMinutes(), 2)
  const seconds = padZerosTo('' + d.getSeconds(), 2)

  const time = [hours, minutes, seconds].join(opts.timeSeparator)

  return date + opts.overallSeparator + time
}

const migrateOldGridScoreTrial = (old) => {
  return new Promise((resolve, reject) => {
    const converted = {
      name: old.name,
      description: 'GridScore trial imported from old version on: ' + (new Date().toLocaleDateString()),
      comments: (old.comment !== undefined && old.comment !== null && old.comment !== '') ? [{ content: old.comment, timestamp: new Date().toISOString() }] : [],
      traits: old.traits.map(t => {
        return {
          name: t.name,
          dataType: t.type,
          allowRepeats: t.mType === 'multi',
          setSize: 1,
          restrictions: t.restrictions,
          id: getId()
        }
      }),
      layout: {
        rows: old.rows,
        columns: old.cols
      },
      data: {}
    }

    let plotCorners = null

    if (old.cornerPoints && old.cornerPoints.length === 4 && old.cornerPoints.filter(c => c !== null).length === 4) {
      converted.layout.corners = {
        topLeft: {
          lat: old.cornerPoints[3][0],
          lng: old.cornerPoints[3][1]
        },
        topRight: {
          lat: old.cornerPoints[2][0],
          lng: old.cornerPoints[2][1]
        },
        bottomRight: {
          lat: old.cornerPoints[1][0],
          lng: old.cornerPoints[1][1]
        },
        bottomLeft: {
          lat: old.cornerPoints[0][0],
          lng: old.cornerPoints[0][1]
        }
      }

      plotCorners = trialLayoutToPlots(converted.layout.corners, converted.layout.rows, converted.layout.columns)
    }

    if (old.markers) {
      converted.layout.markers = {
        everyColumn: old.markers.everyCol,
        everyRow: old.markers.everyRow,
        anchor: null
      }

      switch (old.markers.corner) {
        case 'topleft':
          converted.layout.markers.anchor = 'topLeft'
          break
        case 'topright':
          converted.layout.markers.anchor = 'topRight'
          break
        case 'bottomright':
          converted.layout.markers.anchor = 'bottomRight'
          break
        case 'bottomleft':
          converted.layout.markers.anchor = 'bottomLeft'
          break
      }
    }

    if (old.brapiConfig) {
      converted.brapiConfig = old.brapiConfig
    }

    for (let y = 0; y < old.rows; y++) {
      for (let x = 0; x < old.cols; x++) {
        const cell = old.data[y][x]

        if (cell) {
          const newCell = {
            germplasm: cell.name,
            measurements: {},
            geography: {}
          }

          if (cell.isMarked) {
            newCell.isMarked = true
          }
          if (cell.rep) {
            newCell.rep = cell.rep
          } else {
            newCell.rep = null
          }

          converted.traits.forEach(t => {
            const oldIndex = old.traits.findIndex(ot => ot.name === t.name)
            newCell.measurements[t.id] = []

            let values = cell.values[oldIndex]
            let dates = cell.dates[oldIndex]

            if (old.traits[oldIndex].mType === 'multi') {
              values = JSON.parse(values)
              dates = JSON.parse(dates)

              if (values === null) {
                return
              }

              for (let i = 0; i < values.length; i++) {
                if (values[i] === undefined || values[i] === null || values[i] === '') {
                  continue
                }

                newCell.measurements[t.id].push({
                  values: t.dataType === 'categorical' ? [t.restrictions.categories.indexOf(values[i])] : [values[i]],
                  timestamp: new Date(dates[i]).toISOString()
                })
              }
            } else {
              if (values !== undefined && values !== null && values !== '') {
                newCell.measurements[t.id].push({
                  values: t.dataType === 'categorical' ? [t.restrictions.categories.indexOf(values)] : [values],
                  timestamp: new Date(dates).toISOString()
                })
              }
            }
          })

          if (cell.geolocation && cell.geolocation.lat !== undefined && cell.geolocation.lat !== null && cell.geolocation.lng !== undefined && cell.geolocation.lng !== null) {
            newCell.geography.center = {
              lat: cell.geolocation.lat,
              lng: cell.geolocation.lng
            }
          }

          if (plotCorners) {
            newCell.geography.corners = plotCorners[y][x]
          }

          if (cell.comment && cell.comment !== '') {
            newCell.comments = [{
              content: cell.comment,
              timestamp: new Date().toISOString()
            }]
          }

          converted.data[`${y}|${x}`] = newCell
        }
      }
    }

    converted.createdOn = new Date().toISOString()
    converted.updatedOn = new Date().toISOString()

    resolve(converted)
  })
}

const isNumber = (value, isInt) => {
  try {
    const int = Number(value)
    if (isNaN(value) || isNaN(int) || (isInt && !Number.isInteger(int))) {
      return false
    }

    return true
  } catch (err) {
    return false
  }
}

const checkDataMatchesTraitType = (trait, value, checkDatesAndCategories = true) => {
  const trimmed = (typeof value === 'string') ? value.trim() : value

  if (trait.dataType === 'int' || trait.dataType === 'float' || trait.dataType === 'range') {
    try {
      if (!isNumber(trimmed, (trait.dataType === 'int' || trait.dataType === 'range'))) {
        return false
      }

      const r = trait.restrictions

      if (r) {
        if (r.min !== undefined && r.min !== null) {
          if (value < r.min) {
            return false
          }
        }
        if (r.max !== undefined && r.max !== null) {
          if (value > r.max) {
            return false
          }
        }
      }
    } catch (err) {
      return false
    }
  } else if (trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && checkDatesAndCategories) {
    return trait.restrictions.categories.includes(value)
  } else if (trait.dataType === 'date' && checkDatesAndCategories) {
    return isValidDateString(value)
  } else if (trait.dataType === 'gps') {
    try {
      const [lat, lng] = trimmed.split(';')

      return lat !== undefined && lat !== null && lat !== '' && isNumber(lat, false) && lng !== undefined && lng !== null && lng !== '' && isNumber(lng, false)
    } catch (err) {
      return false
    }
  }

  return true
}

const isValidDateString = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/
  if (!dateString.match(regEx)) {
    // Invalid format
    return false
  }
  const d = new Date(dateString)
  const dNum = d.getTime()
  if (!dNum && dNum !== 0) {
    // NaN value, Invalid date
    return false
  }
  return d.toISOString().slice(0, 10) === dateString
}

/**
 * Formats the given value into a human-readable number (e.g. 1.000 -> 1K, 1.000.000 -> 1G)
 * @param {Number} value The value to format
 * @param {Number} decimals The decimal places
 * @param {Number} k The thousand value (e.g. 1000 or 1024)
 * @param {String} separator The separator between the number and the letter
 */
const getNumberWithSuffix = (value, decimals = 2, k = 1000, separator = '') => {
  if (value === undefined || value === null || value === 0) {
    return '0'
  }

  // Check if advanced number formatting is available
  if ('Intl' in window && Intl.NumberFormat) {
    const locale = (getStore().storeLocale || 'en-GB').replace('_', '-')
    let formatter
    if (k === 1024) {
      // Handle byte values
      const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte']
      let size = Math.abs(Number(value))
      let u = 0
      while (size >= 1024 && u < UNITS.length - 1) {
        size /= 1024
        ++u
      }
      formatter = Intl.NumberFormat(locale, { style: 'unit', unit: UNITS[u], unitDisplay: 'short', maximumFractionDigits: decimals })
      value = size
    } else {
      // Handle regular numeric values
      formatter = Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: decimals })
    }

    return formatter.format(value)
  } else {
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    const i = Math.floor(Math.log(value) / Math.log(k))

    return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + separator + sizes[i]
  }
}

const trialsDataToLongFormat = (data, trial, aggregate = true, includePeople = false, useTimestamps = false) => {
  let result = 'Germplasm\tRep\tRow\tColumn\tSet entry\tDate\tLatitude\tLongitude\tTrait\tValue'

  if (aggregate) {
    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}\t`

        const dates = new Set()
        Object.values(v.measurements).forEach(td => {
          td.forEach(dp => dates.add(dp.timestamp.split('T')[0]))
        })

        const dateArray = [...dates].sort((a, b) => a.localeCompare(b))

        dateArray.forEach(date => {
          trial.traits.forEach(t => {
            const td = v.measurements[t.id]

            if (td) {
              const onDate = v.measurements[t.id].filter(dp => dp.timestamp.split('T')[0] === date).reduce((a, b) => a.concat(b.values), []).filter(v => v !== undefined && v !== null)

              if (onDate.length > 0) {
                let values
                if (t.dataType === 'float' || t.dataType === 'int' || t.dataType === 'range') {
                  values = `\t${onDate.reduce((acc, val) => acc + (+val), 0) / onDate.length}`
                } else if (t.dataType === 'categorical') {
                  values = `\t${t.restrictions.categories[onDate[onDate.length - 1]]}`
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
          const td = v.measurements[t.id]

          if (td) {
            td.forEach(dp => {
              const values = (dp.values || [])
                .map((value, index) => {
                  return {
                    index,
                    value
                  }
                })
                .filter(val => val !== undefined && val !== null && val.value !== undefined && val.value !== null && val.value !== '')
                .reduce((acc, value) => acc.concat(value), [])

              if (values && values.length > 0) {
                values.forEach(val => {
                  result += `\n${germplasmMeta}\t${val.index + 1}\t${useTimestamps ? toLocalDateTimeString(dp.timestamp, { overallSeparator: ' ', dateSeparator: '-', timeSeparator: ':' }) : dp.timestamp.split('T')[0]}`

                  if (v.geography) {
                    result += getLatLngAverage(v.geography)
                  } else {
                    result += '\t\t'
                  }

                  result += `\t${t.name}\t${t.dataType === 'categorical' ? t.restrictions.categories[+val.value] : val.value}`

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

const trialsDataToMatrix = (data, trial, aggregate = true) => {
  let result = `Line/Trait\tRep\tRow\tColumn\tDate\t${trial.traits.map(t => t.name).join('\t')}\tLatitude\tLongitude`

  if (aggregate) {
    Object.values(data).forEach(v => {
      if (v.measurements) {
        const row = v.displayRow
        const column = v.displayColumn
        const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}`

        const dates = new Set()
        Object.values(v.measurements).forEach(td => {
          td.forEach(dp => dates.add(dp.timestamp.split('T')[0]))
        })

        const dateArray = [...dates].sort((a, b) => a.localeCompare(b))

        dateArray.forEach(date => {
          result += `\n${germplasmMeta}\t${date}`

          trial.traits.forEach(t => {
            const td = v.measurements[t.id]

            if (td) {
              const onDate = v.measurements[t.id].filter(dp => dp.timestamp.split('T')[0] === date).reduce((a, b) => a.concat(b.values), []).filter(v => v !== undefined && v !== null)

              if (onDate.length > 0) {
                if (t.dataType === 'float' || t.dataType === 'int' || t.dataType === 'range') {
                  result += `\t${onDate.reduce((acc, val) => acc + (+val), 0) / onDate.length}`
                } else if (t.dataType === 'categorical') {
                  result += `\t${t.restrictions.categories[onDate[onDate.length - 1]]}`
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

        const measurements = []

        trial.traits.forEach(t => {
          const td = v.measurements[t.id]

          if (td) {
            td.forEach(dp => {
              const values = (dp.values || []).filter(val => val !== undefined && val !== null && val !== '')
                .reduce((acc, value) => acc.concat(value), [])
                .filter(val => val !== undefined && val !== null && val !== '')

              if (values && values.length > 0) {
                values.forEach(val => {
                  measurements.push({
                    traitId: t.id,
                    date: dp.timestamp.split('T')[0],
                    value: t.dataType === 'categorical' ? t.restrictions.categories[+val] : val,
                    geography: v.geography
                  })
                })
              }
            })
          }
        })

        measurements.forEach(m => {
          const values = trial.traits.map(t => `${t.id === m.traitId ? m.value : ''}`).join('\t')
          result += `\n${germplasmMeta}\t${m.date}\t${values}`

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

const getLatLngAverage = (geography) => {
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

const truncateAfterWords = (str, words) => {
  if (!str) {
    return str
  }

  const parts = str.split(' ')

  if (parts.length > words) {
    return parts.splice(0, words).map(p => p.replace(/[^a-z0-9]/gi, '-')).join('-')
  } else {
    return parts.map(p => p.replace(/[^a-z0-9]/gi, '-')).join('-')
  }
}

const debounce = (fn, wait) => {
  let timer
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    const context = this
    timer = setTimeout(() => {
      fn.apply(context, args)
    }, wait)
  }
}

const getRowIndex = (layout, row) => {
  let index = -1
  if (layout.rowLabels && layout.rowLabels.length === layout.rows) {
    index = layout.rowLabels.indexOf(row)
  }

  if (index === -1) {
    index = layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM ? (row - 1) : (layout.rows - row)
  }

  return index
}

const getColumnIndex = (layout, column) => {
  let index = -1
  if (layout.columnLabels && layout.columnLabels.length === layout.columns) {
    index = layout.columnLabels.indexOf(column)
  }

  if (index === -1) {
    index = layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT ? (column - 1) : (layout.columns - column)
  }

  return index
}

const getRowLabel = (layout, index) => {
  if (layout.rowLabels && layout.rowLabels.length === layout.rows) {
    return layout.rowLabels[index]
  } else {
    return layout.rowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? (layout.rows - index) : (index + 1)
  }
}

const getColumnLabel = (layout, index) => {
  if (layout.columnLabels && layout.columnLabels.length === layout.columns) {
    return layout.columnLabels[index]
  } else {
    return layout.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? (layout.columns - index) : (index + 1)
  }
}

const getRandomGivenName = () => {
  return givenNames[Math.floor(Math.random() * givenNames.length)]
}

const getServerUrl = (trial) => {
  if (trial) {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    return baseUrl
  } else {
    return null
  }
}

const getPriorityShareCode = (trial) => {
  if (trial && trial.shareStatus !== TRIAL_STATE_NOT_SHARED) {
    return trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode
  } else {
    return null
  }
}

/**
 * Downloads all SVGs contained in the given DOM element into a single SVG file
 * @param {Element} container The DOM element
 * @param {Boolean} isPlotly Is this a plotly.js chart?
 * @param {String} filename The file name to use for the downloaded file
 */
const downloadSvgsFromContainer = (container, isPlotly, filename) => {
  // get svg source.
  const serializer = new XMLSerializer()
  const svgs = isPlotly ? container.querySelectorAll('svg:not(.icon):not(:last-child)') : container.querySelectorAll('svg')
  let source = '<?xml version="1.0" standalone="no"?>\r\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'

  svgs.forEach(s => {
    // serializer.serializeToString(s)
    const children = s.children
    for (let i = 0; i < children.length; i++) {
      source += serializer.serializeToString(children[i]) + '\r\n'
    }
  })

  source += '</svg>'

  // convert svg source to URI data scheme.
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)

  const downloadLink = document.createElement('a')
  downloadLink.href = url
  downloadLink.download = filename + '.svg'
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

export {
  trialsDataToLongFormat,
  trialsDataToMatrix,
  getTraitTypeText,
  getTraitTypeIcon,
  invertHex,
  hexToRgba,
  downloadText,
  toLocalDateString,
  toLocalDateTimeString,
  migrateOldGridScoreTrial,
  checkDataMatchesTraitType,
  isValidDateString,
  getNumberWithSuffix,
  truncateAfterWords,
  formatTimeAgo,
  debounce,
  getRowLabel,
  getColumnLabel,
  getRowIndex,
  getColumnIndex,
  getRandomGivenName,
  getServerUrl,
  getPriorityShareCode,
  isNumber,
  downloadSvgsFromContainer,
  isInteger
}
