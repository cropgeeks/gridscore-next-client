import { DisplayOrder, TraitDataType, type Layout, type Trait } from '@/plugins/types/gridscore'
import { autoType, tsvParse } from 'd3-dsv'

import { i18n } from '@/plugins/vuetify'
import { coreStore } from '@/stores/app'
import type { FilterMatch, InternalItem } from 'vuetify'
import { ShareStatus, type CellPlus, type TrialPlus } from '@/plugins/types/client'
import { categoricalColors } from './color'

export const GERMINATE_EXPECTED_COLUMNS = ['Name', 'Short Name', 'Description', 'Data Type', 'Unit Name', 'Unit Abbreviation', 'Unit Descriptions', 'Trait categories (comma separated)', 'Min (only for numeric traits)', 'Max (only for numeric traits)']
export const TABULAR_EXPECTED_COLUMNS = ['Name', 'Description', 'Data Type', 'Allow repeats', 'Set size', 'Group name', 'Categories', 'Minimum', 'Maximum', 'Timeframe type', 'Timeframe start', 'Timeframe end', 'BrAPI ID']

const DIVISIONS = [
  { amount: 60, name: 'seconds' as const },
  { amount: 60, name: 'minutes' as const },
  { amount: 24, name: 'hours' as const },
  { amount: 7, name: 'days' as const },
  { amount: 4.345_24, name: 'weeks' as const },
  { amount: 12, name: 'months' as const },
  { amount: Number.POSITIVE_INFINITY, name: 'years' as const },
]

function isNumber (value: string, isInt = false) {
  try {
    const int = Number(value)
    if (isNaN(+value) || isNaN(int) || (isInt && !Number.isInteger(int))) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function getThemeColor (index: number) {
  return categoricalColors.GridScoreDefault[index % categoricalColors.GridScoreDefault.length] || '#00acef'
}

function getTraitColor (index: number) {
  const store = coreStore()

  return store.storeTraitColors[index % store.storeTraitColors.length]
}

function getRowLabel (layout: Layout, index: number): number {
  if (layout.rowLabels && layout.rowLabels.length === layout.rows) {
    return layout.rowLabels[index] || 1
  } else {
    return layout.rowOrder === DisplayOrder.BOTTOM_TO_TOP ? (layout.rows - index) : (index + 1)
  }
}

function getColumnLabel (layout: Layout, index: number): number {
  if (layout.columnLabels && layout.columnLabels.length === layout.columns) {
    return layout.columnLabels[index] || 1
  } else {
    return layout.columnOrder === DisplayOrder.RIGHT_TO_LEFT ? (layout.columns - index) : (index + 1)
  }
}

function getColumnIndex (layout: Layout, column: number): number {
  let index = -1
  if (layout.columnLabels && layout.columnLabels.length === layout.columns) {
    index = layout.columnLabels.indexOf(column)
  }

  if (index === -1) {
    index = layout.columnOrder === DisplayOrder.LEFT_TO_RIGHT ? (column - 1) : (layout.columns - column)
  }

  return index
}

function getRowIndex (layout: Layout, row: number) {
  let index = -1
  if (layout.rowLabels && layout.rowLabels.length === layout.rows) {
    index = layout.rowLabels.indexOf(row)
  }

  if (index === -1) {
    index = layout.rowOrder === DisplayOrder.TOP_TO_BOTTOM ? (row - 1) : (layout.rows - row)
  }

  return index
}

function toGerminateDataType (type: TraitDataType) {
  switch (type) {
    case TraitDataType.int:
    case TraitDataType.float:
    case TraitDataType.range:
      return 'numeric'
    case TraitDataType.gps:
    case TraitDataType.image:
    case TraitDataType.video:
      return TraitDataType.text
    case TraitDataType.multicat:
      return TraitDataType.categorical
    default:
      return type
  }
}

function toGridScoreDataType (type: string): TraitDataType {
  switch (type) {
    case 'numeric':
      return TraitDataType.float
    case 'date':
    case 'text':
    case 'categorical':
      return type as TraitDataType
    default:
      throw new Error(`Invalid Germinate trait data type: "${type}"`)
  }
}

function germinateToTraits (traitString: string): Trait[] {
  let error = 'Invalid Germinate trait format'

  try {
    const parsed = tsvParse(traitString)

    if (!parsed || !parsed.columns || !GERMINATE_EXPECTED_COLUMNS.every(c => parsed.columns.includes(c))) {
      throw new Error(error)
    }

    const traits: Trait[] = []

    for (const p of parsed) {
      let dt = TraitDataType.text

      try {
        dt = toGridScoreDataType(p['Data Type'] || 'text')
      } catch (e: any) {
        error = e.message
        throw new Error(error)
      }

      const trait: Trait = {
        name: p.Name || 'N/A',
        description: p.Description,
        dataType: dt,
        setSize: 1,
        allowRepeats: false,
      }

      if (p['Trait categories (comma separated)']) {
        trait.restrictions = {
          // eslint-disable-next-line
          categories: p['Trait categories (comma separated)'].replace(/[\[\]]/g, '').split(',').map(c => c.trim())
        }
      }

      if (p['Min (only for numeric traits)']) {
        if (!trait.restrictions) {
          trait.restrictions = {}
        }
        trait.restrictions.min = +p['Min (only for numeric traits)']
      }

      if (p['Max (only for numeric traits)']) {
        if (!trait.restrictions) {
          trait.restrictions = {}
        }
        trait.restrictions.max = +p['Max (only for numeric traits)']
      }

      if (p['Set size']) {
        trait.setSize = +p['Set size']
      }

      if (p['Is timeseries']) {
        trait.allowRepeats = p['Is timeseries'] === 'true'
      }

      if (p['Trait category']) {
        trait.group = {
          name: p['Trait category'],
        }
      }

      traits.push(trait)
    }

    return traits
  } catch {
    throw new Error(error)
  }
}

function getServerUrl (trial: TrialPlus) {
  if (trial) {
    const store = coreStore()
    let baseUrl = trial.remoteUrl || store.storeServerUrl || ''

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    return baseUrl
  } else {
    return undefined
  }
}

function getPriorityShareCode (trial: TrialPlus) {
  if (trial && trial.shareStatus !== ShareStatus.NOT_SHARED && trial.shareCodes) {
    return trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode
  } else {
    return undefined
  }
}

function tabularToTraits (traitString: string): Trait[] {
  const parsed = tsvParse(traitString, d => {
    const start = d['Timeframe start']
    const end = d['Timeframe end']
    // Use autoType for all fields
    const result: any = autoType(d)
    // But revert the dates back to just their strings
    result['Timeframe start'] = start
    result['Timeframe end'] = end

    return result
  })

  if (!parsed || !parsed.columns || !areArraysEqualSets(TABULAR_EXPECTED_COLUMNS, parsed.columns)) {
    throw new Error(i18n.global.t('formFeedbackTraitImportInvalidColumnHeaders', { headers: TABULAR_EXPECTED_COLUMNS.map(c => `'${c}'`).join(', ') }))
  }

  let error = undefined

  const validTypes = Object.values(TraitDataType)
  const traits: Trait[] = []

  for (const p of parsed) {
    const dt = p['Data Type']

    
    if (!validTypes.includes(dt)) {
      error = `Invalid tabular trait data type: "${dt}"`
    }

    const trait: Trait = {
      name: p.Name,
      description: p.Description,
      dataType: dt,
      allowRepeats: p['Allow repeats'] === '1' || p['Allow repeats'] === 1,
      setSize: p['Set size'] || 1,
      brapiId: p['BrAPI ID'],
      group: p['Group name'],
    }

    if (trait.dataType === TraitDataType.categorical && p.Categories && p.Categories.length > 0) {
      if (!trait.restrictions) {
        trait.restrictions = {}
      }
      trait.restrictions.categories = p.Categories.split(',').map((c: string) => c.trim())
    }

    if (TraitDataType.isNumeric(trait.dataType)) {
      if (p.Minimum !== undefined && p.Minimum !== null && p.Minimum !== '') {
        if (!trait.restrictions) {
          trait.restrictions = {}
        }
        trait.restrictions.min = p.Minimum
      }
      if (p.Maximum !== undefined && p.Maximum !== null && p.Maximum !== '') {
        if (!trait.restrictions) {
          trait.restrictions = {}
        }
        trait.restrictions.max = p.Maximum
      }
    }

    if (p['Timeframe type']) {
      trait.timeframe = {
        type: p['Timeframe type'],
      }

      const regex = /^\d{4}-\d{2}-\d{2}$/

      if (p['Timeframe start'] && p['Timeframe start'] !== '') {
        const start = p['Timeframe start']

        if (!start.test(regex)) {
          error = i18n.global.t('formFeedbackTraitImportInvalidDateFormat')
        } else {
          trait.timeframe.start = start
        }
      }

      if (p['Timeframe end'] && p['Timeframe end'] !== '') {
        const end = p['Timeframe end']

        if (!end.test(regex)) {
          error = i18n.global.t('formFeedbackTraitImportInvalidDateFormat')
        } else {
          trait.timeframe.end = end
        }
      }
    }
  }

  if (error) {
    throw new Error(error)
  } else {
    return traits
  }
}

function jsonToTraits (traitJson: string): Trait[] {
  let error = 'Invalid GridScore JSON'
  try {
    const parsed: any[] = JSON.parse(traitJson)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(error)
    }

    parsed.forEach(t => {
      if (t.group && typeof t.group === 'string') {
        t.group = {
          name: t.group,
        }
      }
    })

    const traits = parsed as Trait[]

    const validTypes = Object.values(TraitDataType)
    for (const trait of traits) {
      if (!validTypes.includes(trait.dataType)) {
        error = `Invalid GridScore trait data type: "${trait.dataType}"`
        throw new Error(error)
      }
    }

    return traits
  } catch {
    throw new Error(error)
  }
}

function areArraysEqualSets (a1: any[], a2: any[]) {
  const superSet: any = {}
  for (const i of a1) {
    const e = i + typeof i
    superSet[e] = 1
  }

  for (const i of a2) {
    const e = i + typeof i
    if (!superSet[e]) {
      return false
    }
    superSet[e] = 2
  }

  for (const e in superSet) {
    if (superSet[e] === 1) {
      return false
    }
  }

  return true
}

function padZerosTo (str: string, length: number) {
  while (str.length < length) {
    str = '0' + str
  }

  return str
}

function toLocalDateString (date: (string | Date | null) = null, opts?: any) {
  opts = Object.assign({}, { dateSeparator: '-' }, opts)
  const d = date === null ? new Date() : new Date(date)
  const month = padZerosTo('' + (d.getMonth() + 1), 2)
  const day = padZerosTo('' + d.getDate(), 2)
  const year = d.getFullYear()

  return [year, month, day].join(opts.dateSeparator)
}

function formatTimeAgo (date: string) {
  const store = coreStore()
  const formatter = new Intl.RelativeTimeFormat((store.storeLocale || 'en-GB').split('-')[0], {
    numeric: 'always',
  })

  let duration = (new Date(date).getTime() - Date.now()) / 1000

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (division) {
      if (Math.abs(duration) < division.amount) {
        return formatter.format(Math.round(duration), division.name)
      }
      duration /= division.amount
    }
  }
}

function getToday () {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  return new Date(today.getTime() + (offset * 60 * 1000))
}

function getDate (d: string) {
  const [yyyy, mm, dd] = d.split(/[^\d]+/).map(Number)

  if (yyyy === undefined || mm === undefined || dd === undefined) {
    return new Date()
  } else {
    const date = new Date()
    date.setUTCFullYear(+yyyy)
    date.setUTCMonth(mm - 1)
    date.setUTCDate(+dd)
    return date
  }
}

function toLocalDateTimeString (str: (string | Date), opts?: any) {
  opts = Object.assign({}, { dateSeparator: '-', timeSeparator: '-', overallSeparator: '_' }, opts)

  const date = toLocalDateString(str, opts)
  const d = new Date(str)

  const hours = padZerosTo('' + d.getHours(), 2)
  const minutes = padZerosTo('' + d.getMinutes(), 2)
  const seconds = padZerosTo('' + d.getSeconds(), 2)

  const time = [hours, minutes, seconds].join(opts.timeSeparator)

  return date + opts.overallSeparator + time
}

function isValidDateString (dateString: string) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/
  if (!regEx.test(dateString)) {
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

function intersection<T> (one: Set<T>, two: Set<T>) {
  return new Set<T>([...one].filter(a => two.has(a)))
}

function filterGermplasm (value: string, query: string, item?: InternalItem<string>): FilterMatch {
  if (query && query.length > 0 && item && item.raw) {
    return item.raw.toLowerCase().includes(query.toLowerCase())
  } else {
    return false
  }
}

function filterCells (value: string, query: string, item?: InternalItem<CellPlus>): FilterMatch {
  if (query && query.length > 0 && item && item.raw) {
    const lower = query.toLowerCase()
    const barcode = (item.raw.barcode || '').toLowerCase()
    const displayName = (item.raw.displayName || '').toLowerCase()
    const germplasm = (item.raw.germplasm || '').toLowerCase()

    return barcode.includes(lower) || displayName.includes(lower) || germplasm.includes(lower)
  } else {
    return false
  }
}

function checkDataMatchesTraitType (trait: Trait, value: string, checkDatesAndCategories = true) {
  const trimmed = (typeof value === 'string') ? value.trim() : value

  if (TraitDataType.isNumeric(trait.dataType)) {
    try {
      if (!isNumber(trimmed, (trait.dataType === TraitDataType.int || trait.dataType === TraitDataType.range))) {
        return false
      }

      const r = trait.restrictions

      if (r) {
        if (r.min !== undefined && r.min !== null && +value < r.min) {
          return false
        }
        if (r.max !== undefined && r.max !== null && +value > r.max) {
          return false
        }
      }
    } catch {
      return false
    }
  } else if (trait.dataType === TraitDataType.categorical && trait.restrictions && trait.restrictions.categories && checkDatesAndCategories) {
    return trait.restrictions.categories.includes(value)
  } else if (trait.dataType === TraitDataType.date && checkDatesAndCategories) {
    return isValidDateString(value)
  } else if (trait.dataType === TraitDataType.gps) {
    try {
      const [lat, lng] = trimmed.split(';')

      return lat !== undefined && lat !== null && lat !== '' && isNumber(lat, false) && lng !== undefined && lng !== null && lng !== '' && isNumber(lng, false)
    } catch {
      return false
    }
  }

  return true
}

function safeTrialName (trial: TrialPlus) {
  return trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
}

export {
  getRowLabel,
  getColumnLabel,
  getColumnIndex,
  filterGermplasm,
  filterCells,
  getRowIndex,
  jsonToTraits,
  germinateToTraits,
  toGerminateDataType,
  tabularToTraits,
  getTraitColor,
  getThemeColor,
  toLocalDateString,
  toLocalDateTimeString,
  padZerosTo,
  formatTimeAgo,
  getToday,
  getDate,
  isValidDateString,
  isNumber,
  checkDataMatchesTraitType,
  safeTrialName,
  getServerUrl,
  getPriorityShareCode,
  intersection,
}
