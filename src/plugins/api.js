import { coreStore } from '@/store'
import { getTrialById, getTrialData, getTrials, updateTrial } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

import axios from 'axios'
import { gridScoreVersion } from '@/plugins/constants'

let store

const getStore = () => {
  if (!store) {
    store = coreStore()
  }
  return store
}

const acceptableStatusCodes = [400, 401, 403, 404, 409]

/**
 * Sends an axios REST request to the server with the given parameter configuration
 * @param {String} url The remote URL (relative) to send the request to
 * @param {Object} params (Optional) Request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @returns Promise
 */
const axiosCall = ({ baseUrl = null, url = null, remoteToken = null, params = null, method = 'get', ignoreErrors = false, checkRemote = true }) => {
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
    if (baseUrl && checkRemote) {
      axiosCall({ baseUrl: baseUrl, url: 'settings/version', checkRemote: false })
        .then(version => {
          if (version !== gridScoreVersion) {
            emitter.emit('api-error', 'Incompatible remote server version. Please update your client to match the server version.')
            reject(new Error('Incompatible remote server version. Please update your client to match the server version.'))
          } else {
            internalAxiosCall(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
          }
        })
        .catch(() => {
          // If the request fails, attempt to go ahead with it anyway.
          internalAxiosCall(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
        })
    } else {
      internalAxiosCall(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
    }
  })
}

const internalAxiosCall = (baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject) => {
  const config = {
    baseURL: baseUrl || getStore().storeServerUrl,
    url,
    params: requestParams,
    data: requestData,
    method,
    crossDomain: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }

  if ((remoteToken !== undefined) && (remoteToken !== null) && (remoteToken !== '')) {
    config.withCredentials = true
    config.headers.Authorization = `Bearer: ${remoteToken}`
  }

  axios.default(config).then(data => {
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
      } else if (error.message) {
        emitter.emit('api-error', error.message)
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
}

const getServerSettings = () => {
  return axiosCall({ url: 'settings', method: 'get', ignoreErrors: true })
}

const getServerVersion = (remoteConfig) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.url || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: 'settings/version', method: 'get', ignoreErrors: true })
}

const shareTrial = async (remoteConfig, localId) => {
  const trial = await getTrialById(localId)

  let remoteUrlWithApi = null
  if (remoteConfig && remoteConfig.url) {
    if (!remoteConfig.url.endsWith('/')) {
      remoteConfig.url += '/'
    }

    remoteUrlWithApi = remoteConfig.url
    if (!remoteUrlWithApi.endsWith('api/')) {
      remoteUrlWithApi += 'api/'
    }
  }

  if (trial) {
    return getTrialData(trial.localId)
      .then(data => {
        const copy = JSON.parse(JSON.stringify(trial))
        copy.data = data

        return axiosCall({ baseUrl: remoteUrlWithApi || ((trial && trial.remoteUrl) ? trial.remoteUrl : null), remoteToken: remoteConfig ? remoteConfig.token : null, url: 'trial/share', params: copy, method: 'post' })
      })
      .then(result => {
        if (result) {
          result.localId = localId
          result.remoteUrl = remoteConfig ? (remoteConfig.url || null) : null
          result.remoteToken = remoteConfig ? remoteConfig.token : null
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
  return new Promise((resolve, reject) => {
    getTrials()
      .then(trials => {
        const remotes = new Map()
        trials.filter(t => t.shareCodes)
          .forEach(t => {
            let remote = t.remoteUrl

            if (remote) {
              remote += 'api/'
            }

            const config = remotes.get(remote || null)
            let arr
            if (!arr) {
              arr = []
            } else {
              arr = config.list
            }

            arr.push(t.shareCodes.ownerCode || t.shareCodes.editorCode || t.shareCodes.viewerCode)

            remotes.set(remote || null, { list: arr, token: t.remoteToken || (config ? config.token : null) })
          })

        const remoteCalls = []

        remotes.forEach((value, key) => {
          remoteCalls.push(axiosCall({ baseUrl: key, remoteToken: value.token, url: 'trial/checkupdate', params: value.list, method: 'post', ignoreErrors: true }))
        })

        return Promise.all(remoteCalls)
      })
      .then(result => resolve(result.flat()))
  })
}

const getTrialByCode = (remoteConfig, shareCode) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.url || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}`, method: 'get' })
}

const getLegacyTrialByCode = (remoteUrl, shareCode) => {
  if (remoteUrl.endsWith('/#/')) {
    remoteUrl = remoteUrl.substring(0, remoteUrl.length - 2)
  }
  if (!remoteUrl.endsWith('/')) {
    remoteUrl += '/'
  }
  if (!remoteUrl.endsWith('api/')) {
    remoteUrl += 'api/'
  }
  return axiosCall({ baseUrl: remoteUrl, url: `config/${shareCode}`, method: 'get' })
}

const synchronizeTrial = (remoteConfig, shareCode, transactions) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}/transaction`, params: transactions, method: 'post' })
}

const exportToGerminate = (remoteConfig, shareCode, aggregate = true) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}/export/g8?aggregate=${aggregate}`, method: 'get' })
}

const exportToShapefile = (remoteConfig, shareCode) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}/export/shapefile`, method: 'get' })
}

const extendTrialPeriod = (remoteConfig, shareCode, captcha) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}/renew`, method: 'post', params: captcha })
}

const checkTrialArchiveExists = (remoteConfig, shareCode) => {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || null) : null, remoteToken: remoteConfig ? remoteConfig.token : null, url: `trial/${shareCode}/export/archive/exists`, method: 'get' })
}

export {
  axiosCall,
  getServerSettings,
  getServerVersion,
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
