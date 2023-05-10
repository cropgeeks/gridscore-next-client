import store from '@/store'
import { getTrialById, getTrialData, updateTrial } from './idb'

const emitter = require('tiny-emitter/instance')
const axios = require('axios').default
const acceptableStatusCodes = [400, 401, 403, 404, 409]

/**
 * Sends an axios REST request to the server with the given parameter configuration
 * @param {String} url The remote URL (relative) to send the request to
 * @param {Object} params (Optional) Request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @returns Promise
 */
const axiosCall = (url, params = null, method = 'get', ignoreErrors = false) => {
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
    axios({
      baseURL: store.getters.storeServerUrl,
      url: url,
      params: requestParams,
      data: requestData,
      method: method,
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
  return axiosCall('settings', null, 'get', true)
}

const shareTrial = async (localId) => {
  const trial = await getTrialById(localId)

  if (trial) {
    return getTrialData(trial.localId)
      .then(data => {
        const copy = JSON.parse(JSON.stringify(trial))
        copy.data = data

        return axiosCall('trial/share', copy, 'post')
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

const getTrialByCode = (shareCode) => {
  return axiosCall(`trial/${shareCode}`, null, 'get')
}

const synchronizeTrial = (shareCode, transactions) => {
  return axiosCall(`trial/${shareCode}/transaction`, transactions, 'post')
}

const exportToGerminate = (shareCode) => {
  return axiosCall(`trial/${shareCode}/export/g8`, null, 'get')
}

const exportToShapefile = (shareCode) => {
  return axiosCall(`trial/${shareCode}/export/shapefile`, null, 'get')
}

export {
  axiosCall,
  getServerSettings,
  shareTrial,
  getTrialByCode,
  synchronizeTrial,
  exportToGerminate,
  exportToShapefile
}
