interface Color {
  r: number
  g: number
  b: number
}

/**
 * Converts a HEX value into an RGB object
 * @param {String} hex The hex color
 */
function hexToRgb (hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return (result && result.length === 4) ? { r: Number.parseInt(result[1] || '', 16), g: Number.parseInt(result[2] || '', 16), b: Number.parseInt(result[3] || '', 16) } : { r: 0, g: 0, b: 0 }
}

function rgbToHex (c: Color) {
  return `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`
}

function invertHex (hex: string) {
  // @ts-ignore
  return (Number(`0x1${hex.replace('#', '')}`) ^ 0xFFFFFF).toString(16).slice(1).toUpperCase()
}

function brighten (c: Color, factor: number): Color {
  let r = c.r
  let g = c.g
  let b = c.b
  const i = Math.round(1 / (1 - factor))
  if (r === 0 && g === 0 && b === 0) {
    return {
      r: i,
      g: i,
      b: i,
    }
  }

  if (r > 0 && r < i) {
    r = i
  }
  if (g > 0 && g < i) {
    g = i
  }
  if (b > 0 && b < i) {
    b = i
  }

  return {
    r: Math.min(255, Math.round(r / factor)),
    g: Math.min(255, Math.round(g / factor)),
    b: Math.min(255, Math.round(b / factor)),
  }
}

function shadeColor (hex: string, percent: number) {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return hex
  }

  let r = rgb.r * (100 + percent) / 100
  let g = rgb.g * (100 + percent) / 100
  let b = rgb.b * (100 + percent) / 100

  r = Math.round(Math.min(r, 255))
  g = Math.round(Math.min(g, 255))
  b = Math.round(Math.min(b, 255))

  return rgbToHex({ r, g, b })
}

const categoricalColors = {
  GridScoreDefault: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
  CBQuantPair12: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
  CBQuantSet19: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
  CBQuantDark28: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
  OkabeIto: ['#E69F00', '#56B4E9', '#009E73', '#F5C710', '#0072B2', '#D55E00', '#CC79A7', '#999999', '#000000'],
  D3schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  Hutton: ['#FF9E15', '#D6C200', '#799900', '#6AA2B8', '#00748C', '#CF009E', '#853175', '#C2002F', '#555559'],
  HighlightPastel: ['#A1C9F4', '#FFB482', '#8DE5A1', '#FF9F9B', '#D0BBFF', '#DEBB9B', '#FAB0E4', '#CFCFCF', '#FFFEA3', '#B9F2F0'],
  HighlightDark: ['#001C7F', '#B1400D', '#12711C', '#8C0800', '#591E71', '#592F0D', '#A23582', '#3C3C3C', '#B8850A', '#006374'],
}

const THEME_COLORS = ['#00a0f1', '#5ec418', '#910080', '#ff7c00', '#c5e000']

function validateColorName (color: string) {
  const style = new Option().style
  style.color = color

  // Check if the computed color is the same as the input color
  return style.color === color
}

function toCssNamedColors (colors: (string | undefined)[]) {
  const result: { [key: string]: string } = {}

  colors.forEach((c = 'undefined') => {
    const shortened = c.toLowerCase().replace(/[^a-z]/g, '')
    if (shortened.length > 0 && validateColorName(shortened)) {
      result[c] = shortened
    }
  })

  return result
}

export {
  shadeColor,
  hexToRgb,
  rgbToHex,
  validateColorName,
  toCssNamedColors,
  invertHex,
  brighten,
  categoricalColors,
  THEME_COLORS,
}
