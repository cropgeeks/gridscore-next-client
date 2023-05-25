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

const downloadText = (text, filename) => {
  const downloadLink = document.createElement('a')
  downloadLink.href = text
  downloadLink.target = '_blank'
  downloadLink.rel = 'noopener noreferrer'
  if (filename) {
    downloadLink.download = filename
  }
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

const padZerosTo = (str, length) => {
  while (str.length < length) {
    str = '0' + str
  }

  return str
}

const toLocalDateString = (date) => {
  const d = new Date(date)
  const month = padZerosTo('' + (d.getMonth() + 1), 2)
  const day = padZerosTo('' + d.getDate(), 2)
  const year = d.getFullYear()

  return [year, month, day].join('-')
}

const toLocalDateTimeString = (str) => {
  const date = toLocalDateString(str)
  const d = new Date(str)

  const hours = padZerosTo('' + d.getHours(), 2)
  const minutes = padZerosTo('' + d.getMinutes(), 2)
  const seconds = padZerosTo('' + d.getSeconds(), 2)

  const time = [hours, minutes, seconds].join('-')

  return date + '_' + time
}

export {
  getTraitTypeText,
  downloadText,
  toLocalDateString,
  toLocalDateTimeString
}
