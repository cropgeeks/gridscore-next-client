import { CellCategory, TraitDataType } from '@/plugins/types/gridscore'
import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
import { toLocalDateTimeString } from '@/plugins/util'
import { mdiAlphabeticalVariant, mdiCalendar, mdiCamera, mdiCheckboxMarked, mdiDecimal, mdiFormatListNumbered, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiMapMarkerMultiple, mdiNotebook, mdiNumeric, mdiSprout, mdiTag, mdiTuneVariant, mdiVideo } from '@mdi/js'

const gridScoreVersion = '4.0.0'

const givenNames = ['Adie', 'Angie', 'Ashleigh', 'Ashton', 'Aubrey', 'Barnes', 'Barry', 'Basil', 'Bernadine', 'Bethany', 'Braden', 'Bradley', 'Brent', 'Bret', 'Brett', 'Burdine', 'Caden', 'Cadence', 'Carrington', 'Charlene', 'Charles', 'Charlton', 'Chay', 'Chet', 'Christopher', 'Cowden', 'Daris', 'Darleen', 'Darlene', 'Darnell', 'Deb', 'Demi', 'Dennis', 'Diamond', 'Doreen', 'Dorothy', 'Dustin', 'Earlene', 'Elaine', 'Elfriede', 'Ellis', 'Emery', 'Emory', 'Evan', 'Gabriel', 'Georgiana', 'Gladys', 'Greenbury', 'Gregory', 'Greig', 'Gwen', 'Harley', 'Hastings', 'Hazel', 'Heather', 'Helton', 'Henrietta', 'Heston', 'Holly', 'Hulda', 'Increase', 'India', 'Irene', 'Jackie', 'Jade', 'January', 'Jaylon', 'Jean', 'Jemma', 'Jenny', 'Jensen', 'Jerald', 'Jerrold', 'Jerry', 'Jessie', 'Jethro', 'Jigar', 'Jill', 'Jocelyn', 'Jodie', 'Joey', 'Justine', 'Kate', 'Kathryn', 'Keaton', 'Kendra', 'Kerr', 'Kimball', 'Kitty', 'Kristy', 'Kylie', 'Laren', 'Lawrence', 'Lawson', 'Leanne', 'Lianne', 'Louise', 'Luci', 'Maddox', 'Malford', 'Marlene', 'Maud', 'Melinda', 'Melville', 'Millicent', 'Mindi', 'Mindy', 'Molly', 'Mort', 'Nancy', 'Nelson', 'Nigel', 'Osbert', 'Ottilie', 'Pamela', 'Pascoe', 'Percy', 'Piper', 'Pippa', 'Poppy', 'Raleigh', 'Rebecca', 'Reynold', 'Rhoda', 'Riley', 'Roland', 'Rosaleen', 'Rosalie', 'Rosie', 'Ruby', 'Rupert', 'Ruth', 'Savannah', 'Scarlett', 'Sharon', 'Sheridan', 'Shiloh', 'Sidney', 'Stacy', 'Sue', 'Sydney', 'Tammy', 'Tim', 'Timmy', 'Timothy', 'Tracy', 'Travis', 'Trent', 'Trudie', 'Tucker', 'Velma', 'Vicary', 'Violet', 'Walker', 'Warren', 'Whitney', 'Wilfried', 'Woodrow']

export interface MapAreaType {
  name: string
  text: string
  convert: (area: number) => number
  unit: string
}

export interface CellCategoryInfo {
  title: string
  color: string
}

export interface MediaFilenamePart {
  id: string
  title: string
  icon: string
  example: string
  extract: (trial: TrialPlus, cell: CellPlus, trait?: TraitPlus, date?: Date) => string
}

const mapAreaTypes = [{
  name: 'meter',
  text: 'areaUnitMeter',
  convert: (v: number) => v,
  unit: 'm²',
}, {
  name: 'kilometer',
  text: 'areaUnitKilometer',
  convert: (v: number) => v / 1_000_000,
  unit: 'km²',
}, {
  name: 'hectare',
  text: 'areaUnitHectare',
  convert: (v: number) => v / 10_000,
  unit: 'hectare',
}, {
  name: 'acre',
  text: 'areaUnitAcre',
  convert: (v: number) => v * 0.000_247,
  unit: 'acres',
}, {
  name: 'miles',
  text: 'areaUnitMiles',
  convert: (v: number) => v * 3.861e-7,
  unit: 'sq mi',
}, {
  name: 'foot',
  text: 'areaUnitFoot',
  convert: (v: number) => v * 10.763_91,
  unit: 'sq ft',
}, {
  name: 'yard',
  text: 'areaUnitYard',
  convert: (v: number) => v * 1.195_99,
  unit: 'sq yd',
}]

const mapAreaTypeMap: { [index: string]: MapAreaType } = {}

mapAreaTypes.forEach(dt => {
  mapAreaTypeMap[dt.name] = dt
})

const mediaFilenameParts: MediaFilenamePart[] = [
  { id: 'trial', title: 'widgetMediaFilenameTrial', icon: mdiNotebook, example: 'Barley-trial-Season24', extract: (trial, cell) => trial.name },
  { id: 'timestamp', title: 'widgetMediaFilenameTimestamp', icon: mdiCalendar, example: toLocalDateTimeString(new Date()), extract: (trial, cell, trait, date) => toLocalDateTimeString(date || new Date()) },
  { id: 'germplasm', title: 'widgetMediaFilenameGermplasm', icon: mdiSprout, example: 'Laureate', extract: (trial, cell) => cell.displayName || cell.germplasm },
  { id: 'row', title: 'widgetMediaFilenameRow', icon: mdiLandRowsHorizontal, example: '1', extract: (trial, cell) => `${cell.displayRow || '1'}` },
  { id: 'column', title: 'widgetMediaFilenameColumn', icon: mdiLandRowsVertical, example: '7', extract: (trial, cell) => `${cell.displayColumn || '1'}` },
  { id: 'trait', title: 'widgetMediaFilenameTrait', icon: mdiTag, example: 'Awn length', extract: (trial, cell, trait) => trait?.name || '' },
]

const CELL_CATEGORIES: { [key: string]: CellCategoryInfo } = {}

CELL_CATEGORIES[CellCategory.CONTROL] = { title: 'cellCategoryControl', color: 'info' }

export interface DataType {
  title: string
  shortTitle: string
  icon: string
  value: TraitDataType
}

const dataTypes: DataType[] = [{
  title: 'traitTypeInt',
  shortTitle: 'traitTypeShortInt',
  icon: mdiNumeric,
  value: TraitDataType.int,
}, {
  title: 'traitTypeFloat',
  shortTitle: 'traitTypeShortFloat',
  icon: mdiDecimal,
  value: TraitDataType.float,
}, {
  title: 'traitTypeRange',
  shortTitle: 'traitTypeShortRange',
  icon: mdiTuneVariant,
  value: TraitDataType.range,
}, {
  title: 'traitTypeCategorical',
  shortTitle: 'traitTypeShortCategorical',
  icon: mdiFormatListNumbered,
  value: TraitDataType.categorical,
}, {
  title: 'traitTypeBoolean',
  shortTitle: 'traitTypeShortBoolean',
  icon: mdiCheckboxMarked,
  value: TraitDataType.boolean,
}, {
  title: 'traitTypeDate',
  shortTitle: 'traitTypeShortDate',
  icon: mdiCalendar,
  value: TraitDataType.date,
}, {
  title: 'traitTypeGps',
  shortTitle: 'traitTypeShortGps',
  icon: mdiMapMarkerMultiple,
  value: TraitDataType.gps,
}, {
  title: 'traitTypeImage',
  shortTitle: 'traitTypeShortImage',
  icon: mdiCamera,
  value: TraitDataType.image,
}, {
  title: 'traitTypeVideo',
  shortTitle: 'traitTypeShortVideo',
  icon: mdiVideo,
  value: TraitDataType.video,
}, {
  title: 'traitTypeText',
  shortTitle: 'traitTypeShortText',
  icon: mdiAlphabeticalVariant,
  value: TraitDataType.text,
}]

const dataTypeMap: { [index: string]: DataType } = {}

dataTypes.forEach(dt => {
  dataTypeMap[dt.value] = dt
})

function getRandomGivenName () {
  return givenNames[Math.floor(Math.random() * givenNames.length)]
}

export {
  gridScoreVersion,
  CELL_CATEGORIES,
  getRandomGivenName,
  dataTypes,
  dataTypeMap,
  mediaFilenameParts,
  mapAreaTypeMap,
}
