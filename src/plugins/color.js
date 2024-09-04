/**
 * Converts a HEX value into an RGB object
 * @param {String} hex The hex color
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
}

const rgbToHex = (c) => `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`

/**
 * Determines the best text color (either white or black) given the background color
 * @param {String} backgroundColor The background color in HEX
 */
const getHighContrastTextColor = (backgroundColor) => {
  if (backgroundColor) {
    const rgb = hexToRgb(backgroundColor)
    if (!rgb) {
      return 'black'
    }
    const o = Math.round(((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000)
    return (o > 125) ? 'black' : 'white'
  } else {
    return 'black'
  }
}

const shadeColor = (hex, percent) => {
  const rgb = hexToRgb(hex)

  let r = parseInt(rgb.r * (100 + percent) / 100)
  let g = parseInt(rgb.g * (100 + percent) / 100)
  let b = parseInt(rgb.b * (100 + percent) / 100)

  r = (r < 255) ? r : 255
  g = (g < 255) ? g : 255
  b = (b < 255) ? b : 255

  r = Math.round(r)
  g = Math.round(g)
  b = Math.round(b)

  return rgbToHex({ r, g, b })
}

const categoricalColors = {
  GridScoreDefault: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
  CBQuantPair12: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
  CBQuantSet19: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
  CBQuantDark28: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
  OkabeIto: ['#E69F00', '#56B4E9', '#009E73', '#F5C710', '#0072B2', '#D55E00', '#CC79A7', '#999999', '#000000'],
  D3schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  Hutton: ['#FF9E15', '#D6C200', '#799900', '#6AA2B8', '#00748C', '#CF009E', '#853175', '#C2002F', '#555559']
}

const validateColorName = color => {
  const style = new Option().style
  style.color = color

  // Check if the computed color is the same as the input color
  return style.color === color
}

const toCssNamedColors = colors => {
  const result = {}

  colors.forEach(c => {
    const shortened = c.toLowerCase().replace(/[^a-z]/g, '')
    if (shortened.length > 0 && validateColorName(shortened)) {
      result[c] = shortened
    }
  })

  return result
}

export {
  getHighContrastTextColor,
  shadeColor,
  hexToRgb,
  rgbToHex,
  validateColorName,
  toCssNamedColors,
  categoricalColors
}
