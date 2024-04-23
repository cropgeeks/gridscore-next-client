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

export {
  getHighContrastTextColor,
  shadeColor,
  hexToRgb,
  rgbToHex
}
