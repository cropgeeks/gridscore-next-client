import { i18n } from '@/plugins/i18n.js'

/**
 * For the given trait, return the i18n text
 * @param trait The trait for which to return the text
 */
const getTraitTypeText = (trait, short = false) => {
  switch (trait.dataType) {
    case 'date':
      return i18n.t(short ? 'traitTypeShortDate' : 'traitTypeDate')
    case 'int':
      return i18n.t(short ? 'traitTypeShortInt' : 'traitTypeInt')
    case 'float':
      return i18n.t(short ? 'traitTypeShortFloat' : 'traitTypeFloat')
    case 'text':
      return i18n.t(short ? 'traitTypeShortText' : 'traitTypeText')
    case 'categorical':
      return i18n.t(short ? 'traitTypeShortCategorical' : 'traitTypeCategorical')
    default:
      return null
  }
}

export {
  getTraitTypeText
}
