import store from '@/store'
import { getTrialById, getTrialData, getTrials, updateTrial } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

import axios from 'axios'
const acceptableStatusCodes = [400, 401, 403, 404, 409]

/**
 * Sends an axios REST request to the server with the given parameter configuration
 * @param {String} url The remote URL (relative) to send the request to
 * @param {Object} params (Optional) Request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @returns Promise
 */
const axiosCall = ({ baseUrl = null, url = null, params = null, method = 'get', ignoreErrors = false }) => {
  let requestData = null
  let requestParams = null

  // Stringify the data object for non-GET requests
  if (params !== null || params !== undefined) {
    if (method === 'get') {
      requestParams = params
    } else {
      requestData = params
    }
  }

  return new Promise((resolve, reject) => {
    axios.default({
      baseURL: baseUrl || store.getters.storeServerUrl,
      url,
      params: requestParams,
      data: requestData,
      method,
      crossDomain: true,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(data => {
      if (data && data.data) {
        resolve(data.data)
      } else {
        resolve(null)
      }
    }).catch(error => {
      emitter.emit('show-loading', false)
      if (!ignoreErrors) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (acceptableStatusCodes.includes(error.response.status)) {
            const err = new Error('API error')
            err.status = error.response.status
            reject(err)
            return
          } else {
            // Handle the error here, then reject
            emitter.emit('api-error', error.response)
          }
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          // Handle the error here, then reject
          emitter.emit('api-error', error.request)
        } else {
          // Something happened in setting up the request that triggered an Error
          // Handle the error here, then reject
          emitter.emit('api-error', error.message)
        }
      }

      reject(new Error('API error', { cause: error }))
    })
  })
}

const getServerSettings = () => {
  return axiosCall({ url: 'settings', method: 'get', ignoreErrors: true })
}

const shareTrial = async (localId) => {
  const trial = await getTrialById(localId)

  if (trial) {
    return getTrialData(trial.localId)
      .then(data => {
        const copy = JSON.parse(JSON.stringify(trial))
        copy.data = data

        return axiosCall({ url: 'trial/share', params: copy, method: 'post' })
      })
      .then(result => {
        if (result) {
          result.localId = localId
          return updateTrial(localId, result)
        } else {
          return new Promise(resolve => resolve(null))
        }
      })
      .then(trial => {
        emitter.emit('trial-properties-changed', localId)
        return trial
      })
  } else {
    return new Promise(resolve => resolve(null))
  }
}

const postCheckUpdate = () => {
  return getTrials()
    .then(trials => {
      const ids = trials.filter(t => t.shareCodes)
        .map(t => {
          return t.shareCodes.ownerCode || t.shareCodes.editorCode || t.shareCodes.viewerCode
        })
      return axiosCall({ url: 'trial/checkupdate', params: ids, method: 'post', ignoreErrors: true })
    })
}

const getTrialByCode = (shareCode) => {
  return axiosCall({ url: `trial/${shareCode}`, method: 'get' })
}

const getLegacyTrialByCode = (url, shareCode) => {
  if (url.endsWith('/#/')) {
    url = url.substring(0, url.length - 2)
  }
  if (!url.endsWith('/')) {
    url += '/'
  }
  if (!url.endsWith('api/')) {
    url += 'api/'
  }
  return axiosCall({ baseUrl: url, url: `config/${shareCode}`, method: 'get' })
}

const synchronizeTrial = (shareCode, transactions) => {
  return axiosCall({ url: `trial/${shareCode}/transaction`, params: transactions, method: 'post' })
}

const exportToGerminate = (shareCode, aggregate = true) => {
  return axiosCall({ url: `trial/${shareCode}/export/g8?aggregate=${aggregate}`, method: 'get' })
}

const exportToShapefile = (shareCode) => {
  return axiosCall({ url: `trial/${shareCode}/export/shapefile`, method: 'get' })
}

const extendTrialPeriod = (shareCode, captcha) => {
  return axiosCall({ url: `trial/${shareCode}/renew`, method: 'post', params: captcha })
}

const checkTrialArchiveExists = (shareCode) => {
  return axiosCall({ url: `trial/${shareCode}/export/archive/exists`, method: 'get' })
}

export {
  axiosCall,
  getServerSettings,
  shareTrial,
  getTrialByCode,
  getLegacyTrialByCode,
  postCheckUpdate,
  synchronizeTrial,
  exportToGerminate,
  exportToShapefile,
  extendTrialPeriod,
  checkTrialArchiveExists
}
