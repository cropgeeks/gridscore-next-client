import { DisplayOrder, TraitDataType, type Layout, type Trait } from '@/plugins/types/gridscore'
import { autoType, tsvParse } from 'd3-dsv'

import { i18n } from '@/plugins/vuetify'
import { coreStore } from '@/stores/app'

const GERMINATE_EXPECTED_COLUMNS = ['Name', 'Short Name', 'Description', 'Data Type', 'Unit Name', 'Unit Abbreviation', 'Unit Descriptions', 'Trait categories (comma separated)', 'Min (only for numeric traits)', 'Max (only for numeric traits)']
const TABULAR_EXPECTED_COLUMNS = ['Name', 'Description', 'Data Type', 'Allow repeats', 'Set size', 'Group name', 'Categories', 'Minimum', 'Maximum', 'Timeframe type', 'Timeframe start', 'Timeframe end', 'BrAPI ID']

const DIVISIONS = [
  { amount: 60, name: 'seconds' as const },
  { amount: 60, name: 'minutes' as const },
  { amount: 24, name: 'hours' as const },
  { amount: 7, name: 'days' as const },
  { amount: 4.345_24, name: 'weeks' as const },
  { amount: 12, name: 'months' as const },
  { amount: Number.POSITIVE_INFINITY, name: 'years' as const },
]

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
    case 'int':
    case 'float':
    case 'range':
      return 'numeric'
    case 'gps':
    case 'image':
    case 'video':
      return 'text'
    default:
      return type
  }
}

function toGridScoreDataType (type: string): TraitDataType {
  switch (type) {
    case 'numeric':
      return TraitDataType.float
    default:
      return type as TraitDataType
  }
}

function germinateToTraits (traitString: string): Trait[] {
  try {
    const parsed = tsvParse(traitString)

    if (!parsed || !parsed.columns || !GERMINATE_EXPECTED_COLUMNS.every(c => parsed.columns.includes(c))) {
      throw new Error('Invalid Germinate trait format')
    }

    const traits: Trait[] = parsed.map(p => {
      const trait: Trait = {
        name: p.Name || 'N/A',
        description: p.Description,
        dataType: toGridScoreDataType(p['Data Type'] || 'text'),
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

      return trait
    })

    return traits
  } catch {
    throw new Error('Invalid Germinate trait format')
  }
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

  const traits: Trait[] = parsed.map(p => {
    const trait: Trait = {
      name: p.Name,
      description: p.Description,
      dataType: p['Data Type'],
      allowRepeats: p['Allow repeats'] === '1' || p['Allow repeats'] === 1,
      setSize: p['Set size'] || 1,
      brapiId: p['BrAPI ID'],
      group: p['Group name'],
    }

    if (trait.dataType === 'categorical' && p.Categories && p.Categories.length > 0) {
      if (!trait.restrictions) {
        trait.restrictions = {}
      }
      trait.restrictions.categories = p.Categories.split(',').map((c: string) => c.trim())
    }

    if ((trait.dataType === 'int' || trait.dataType === 'float' || trait.dataType === 'range')) {
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

    return trait
  })

  if (error) {
    throw new Error(error)
  } else {
    return traits
  }
}

function jsonToTraits (traitJson: string): Trait[] {
  try {
    const parsed: any[] = JSON.parse(traitJson)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid GridScore JSON')
    }

    parsed.forEach(t => {
      if (t.group && typeof t.group === 'string') {
        t.group = {
          name: t.group,
        }
      }
    })

    return parsed as Trait[]
  } catch {
    throw new Error('Invalid GridScore JSON')
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

export {
  getRowLabel,
  getColumnLabel,
  getColumnIndex,
  getRowIndex,
  jsonToTraits,
  traitsToGerminate,
  germinateToTraits,
  traitsToTabular,
  tabularToTraits,
  getTraitColor,
  toLocalDateString,
  toLocalDateTimeString,
  padZerosTo,
  formatTimeAgo,
  getToday,
  getDate,
  isValidDateString,
}
