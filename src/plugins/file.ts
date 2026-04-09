export interface DownloadBlob {
  blob: Blob
  filename: string
  extension?: string
}

/**
 * Downloads the data file given in the parameter using the blow, filename and extension.
 * @param {Object} object Object of type `{ filename: '', blob: '', extension: '' }`
 */
function downloadBlob (object: DownloadBlob) {
  if (!object || !object.blob) {
    return
  }

  const filename = object.filename
  const extension = object.extension

  const url = window.URL.createObjectURL(object.blob)

  const downloadLink = document.createElement('a')
  downloadLink.href = url
  downloadLink.target = '_blank'
  downloadLink.rel = 'noopener noreferrer'
  if (filename) {
    downloadLink.download = filename

    if (extension) {
      downloadLink.download += '.' + extension
    }
  }
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

/**
 * Downloads all SVGs contained in the given DOM element into a single SVG file
 * @param {Element} container The DOM element
 * @param {Boolean} isPlotly Is this a plotly.js chart?
 * @param {String} filename The file name to use for the downloaded file
 */
function downloadSvgsFromContainer (container: Element, isPlotly: boolean, filename: string) {
  // get svg source.
  const serializer = new XMLSerializer()
  const svgs = isPlotly ? container.querySelectorAll('svg:not(.icon):not(:last-child)') : container.querySelectorAll('svg')
  let source = '<?xml version="1.0" standalone="no"?>\r\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'

  svgs.forEach(s => {
    // serializer.serializeToString(s)
    const children = s.children
    for (let i = 0; i < children.length; i++) {
      // @ts-ignore
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
  downloadSvgsFromContainer,
  downloadBlob,
}
