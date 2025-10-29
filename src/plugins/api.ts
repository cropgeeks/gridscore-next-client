import { coreStore, type PlausibleConfig } from '@/stores/app'
import { getTrialById, getTrialData, getTrials, updateTrial } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

import axios from 'axios'
import { gridScoreVersion } from '@/plugins/constants'
import type { RemoteConfig, TrialPlus } from './types/client'
import type { Transaction, TrialTimestamp, TrialUpdateCheck } from './types/gridscore'

interface InternalResult {
  trial: TrialPlus
  id: string
}

type IdToTimestamp = { [key: string]: TrialTimestamp }

const acceptableStatusCodes = new Set([400, 401, 403, 404, 409])

/**
 * Sends an axios REST request to the server with the given parameter configuration
 * @param {String} baseUrl The base URL of this request
 * @param {String} url The remote URL (relative) to send the request to
 * @param {String} remoteToken (Optional) Token to be provided for remote authentication
 * @param {Object} params (Optional) Request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @param {Boolean} ignoreErrors (Optional) Should any API errors be ignored rather than showing UI feedback? (default: `false`)
 * @param {Boolean} checkRemote (Optional) Should the remote endpoint be checked to see if it has a matching version? If they don't match, the returned Promise will be rejected (default: `true`)
 * @returns Promise
 */
function axiosCall<T> ({ baseUrl, url, remoteToken, params, method = 'get', ignoreErrors = false, checkRemote = true }: { baseUrl?: string, url: string, remoteToken?: string, params?: any, method?: string, ignoreErrors?: boolean, checkRemote?: boolean }): Promise<T> {
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
      axiosCall<T>({ baseUrl, url: 'settings/version', checkRemote: false })
        .then(version => {
          if (version !== gridScoreVersion) {
            emitter.emit('api-error', 'Incompatible remote server version. Please update your client to match the server version.')
            reject(new Error('Incompatible remote server version. Please update your client to match the server version.'))
          } else {
            internalAxiosCall<T>(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
          }
        })
        .catch(() => {
          // If the request fails, attempt to go ahead with it anyway.
          internalAxiosCall<T>(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
        })
    } else {
      internalAxiosCall<T>(baseUrl, url, remoteToken, method, requestParams, requestData, ignoreErrors, resolve, reject)
    }
  })
}

/**
 * Sends an axios REST request to the server with the given parameter configuration
 * @param {String} baseUrl The base URL of this request
 * @param {String} url The remote URL (relative) to send the request to
 * @param {String} remoteToken (Optional) Token to be provided for remote authentication
 * @param {Object} formData (Optional) Request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @param {Boolean} ignoreErrors (Optional) Should any API errors be ignored rather than showing UI feedback? (default: `false`)
 * @param {Boolean} checkRemote (Optional) Should the remote endpoint be checked to see if it has a matching version? If they don't match, the returned Promise will be rejected (default: `true`)
 * @returns Promise
 */
function axiosForm<T> ({ baseUrl, url, remoteToken, formData, method = 'get', ignoreErrors = false, checkRemote = true }: { baseUrl?: string, url?: string, remoteToken?: string, formData?: any, method?: string, ignoreErrors?: boolean, checkRemote?: boolean }): Promise<T> {
  return new Promise((resolve, reject) => {
    if (baseUrl && checkRemote) {
      axiosCall<T>({ baseUrl, url: 'settings/version', checkRemote: false })
        .then(version => {
          if (version !== gridScoreVersion) {
            emitter.emit('api-error', 'Incompatible remote server version. Please update your client to match the server version.')
            reject(new Error('Incompatible remote server version. Please update your client to match the server version.'))
          } else {
            internalAxiosForm<T>(baseUrl, url, remoteToken, method, formData, ignoreErrors, resolve, reject)
          }
        })
        .catch(() => {
          // If the request fails, attempt to go ahead with it anyway.
          internalAxiosForm<T>(baseUrl, url, remoteToken, method, formData, ignoreErrors, resolve, reject)
        })
    } else {
      internalAxiosForm<T>(baseUrl, url, remoteToken, method, formData, ignoreErrors, resolve, reject)
    }
  })
}

function internalAxiosForm<T> (baseUrl: string | undefined, url: string | undefined, remoteToken: string | undefined, method: string | undefined, formData: any | undefined, ignoreErrors: boolean | undefined, resolve: (args: T) => void, reject: ((args: Error) => void) | undefined) {
  const store = coreStore()
  const config: any = {
    baseURL: baseUrl || store.storeServerUrl,
    url,
    data: formData,
    method,
    crossDomain: true,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }

  if ((remoteToken !== undefined) && (remoteToken !== null) && (remoteToken !== '')) {
    config.withCredentials = true
    config.headers.Authorization = `Bearer ${remoteToken}`
  }

  axios(config).then(data => {
    if (data && data.data) {
      resolve(data.data)
    } else {
      resolve(undefined as T)
    }
  }).catch(error => {
    emitter.emit('show-loading', false)
    if (!ignoreErrors) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (acceptableStatusCodes.has(error.response.status)) {
          const err = new Error('API error')
          // @ts-ignore
          err.status = error.response.status
          if (reject) {
            reject(err)
          }
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

    if (reject) {
      // @ts-ignore
      reject(new Error('API error', { cause: error }))
    }
  })
}

function internalAxiosCall<T> (baseUrl: string | undefined, url: string | undefined, remoteToken: string | undefined, method: string | undefined, requestParams: any | undefined, requestData: any | undefined, ignoreErrors: boolean | undefined, resolve: (args: T) => void, reject: ((args: Error) => void) | undefined) {
  const store = coreStore()
  const config: any = {
    baseURL: baseUrl || store.storeServerUrl,
    url,
    params: requestParams,
    data: requestData,
    method,
    crossDomain: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }

  if ((remoteToken !== undefined) && (remoteToken !== null) && (remoteToken !== '')) {
    config.withCredentials = true
    config.headers.Authorization = `Bearer ${remoteToken}`
  }

  axios(config).then(data => {
    if (data && data.data) {
      resolve(data.data)
    } else {
      resolve(undefined as T)
    }
  }).catch(error => {
    emitter.emit('show-loading', false)
    if (!ignoreErrors) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (acceptableStatusCodes.has(error.response.status)) {
          const err = new Error('API error')
          // @ts-ignore
          err.status = error.response.status
          if (reject) {
            reject(err)
          }
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

    if (reject) {
      // @ts-ignore
      reject(new Error('API error', { cause: error }))
    }
  })
}

function getServerSettings () {
  return axiosCall<PlausibleConfig>({ url: 'settings', method: 'get', ignoreErrors: true })
}

function getServerVersion (remoteConfig: RemoteConfig) {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: 'settings/version', method: 'get', ignoreErrors: true })
}

async function shareTrial (remoteConfig: RemoteConfig, localId: string): Promise<TrialPlus | undefined> {
  const trial = await getTrialById(localId)

  if (remoteConfig && remoteConfig.remoteUrl) {
    if (!remoteConfig.remoteUrl.endsWith('/')) {
      remoteConfig.remoteUrl += '/'
    }
    if (!remoteConfig.remoteUrl.endsWith('api/')) {
      remoteConfig.remoteUrl += 'api/'
    }
  }

  if (trial) {
    return getTrialData(trial.localId)
      .then(data => {
        const copy = JSON.parse(JSON.stringify(trial))
        copy.data = data

        return axiosCall<TrialPlus>({ baseUrl: (remoteConfig ? remoteConfig.remoteUrl : undefined) || trial.remoteUrl || undefined, remoteToken: (remoteConfig ? remoteConfig.token : undefined) || trial.token || null, url: 'trial/share', params: copy, method: 'post' })
      })
      .then(result => {
        if (result) {
          result.localId = localId
          result.remoteUrl = remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined
          result.remoteToken = remoteConfig ? (remoteConfig.token || undefined) : undefined
          return new Promise<InternalResult | undefined>(resolve => {
            updateTrial(localId, result)
              .then(() => {
                resolve({
                  id: localId,
                  trial: result,
                })
              })
          })
        } else {
          return new Promise<InternalResult | undefined>(resolve => resolve(undefined))
        }
      })
      .then(result => {
        if (result) {
          emitter.emit('trial-properties-changed', result.id)
          return result.trial
        } else {
          return undefined
        }
      })
  } else {
    return new Promise(resolve => resolve(undefined))
  }
}

function postCheckUpdate () {
  return new Promise<TrialUpdateCheck>(resolve => {
    getTrials()
      .then(trials => {
        const remotes = new Map()
        trials.filter(t => t.shareCodes)
          .forEach(t => {
            let remote = t.remoteUrl

            if (remote && !remote.endsWith('api/')) {
              remote += 'api/'
            }

            const config = remotes.get(remote || null)
            const arr = config ? (config.list || []) : []

            arr.push(t.shareCodes?.ownerCode || t.shareCodes?.editorCode || t.shareCodes?.viewerCode || '')

            remotes.set(remote || null, { list: arr, token: t.remoteToken || (config ? config.token : null) })
          })

        const remoteCalls: Promise<TrialUpdateCheck>[] = []

        remotes.forEach((value, key) => {
          remoteCalls.push(axiosCall({ baseUrl: key, remoteToken: value.token, url: 'trial/checkupdate', params: value.list, method: 'post', ignoreErrors: true }))
        })

        return Promise.all(remoteCalls)
      })
      .then(result => {
        const mapped: TrialUpdateCheck = {}

        result.forEach(arr => {
          Object.keys(arr).forEach(k => {
            if (arr[k]) {
              mapped[k] = arr[k]
            }
          })
        })

        resolve(mapped)
      })
  })
}

function getTrialByCode (remoteConfig: RemoteConfig | undefined, shareCode: string) {
  return axiosCall<TrialPlus>({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}`, method: 'get' })
}

function getLegacyTrialByCode (remoteUrl: string, shareCode: string) {
  if (remoteUrl.endsWith('/#/')) {
    remoteUrl = remoteUrl.slice(0, -2)
  }
  if (!remoteUrl.endsWith('/')) {
    remoteUrl += '/'
  }
  if (!remoteUrl.endsWith('api/')) {
    remoteUrl += 'api/'
  }
  return axiosCall({ baseUrl: remoteUrl, url: `config/${shareCode}`, method: 'get' })
}

function synchronizeTrial (remoteConfig: RemoteConfig | undefined, shareCode: string, transactions?: Transaction) {
  return axiosCall<TrialPlus>({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}/transaction`, params: transactions, method: 'post' })
}

function exportToGerminate (remoteConfig: RemoteConfig | undefined, shareCode: string, aggregate = true) {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}/export/g8?aggregate=${aggregate}`, method: 'get' })
}

function exportToShapefile (remoteConfig: RemoteConfig | undefined, shareCode: string) {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}/export/shapefile`, method: 'get' })
}

function extendTrialPeriod (remoteConfig: RemoteConfig | undefined, shareCode: string, captcha: string) {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}/renew`, method: 'post', params: captcha })
}

function checkTrialArchiveExists (remoteConfig: RemoteConfig | undefined, shareCode: string) {
  return axiosCall({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trial/${shareCode}/export/archive/exists`, method: 'get' })
}

function postTraitImage (remoteConfig: RemoteConfig | undefined, shareCode: string, traitId: string, formData: any) {
  return axiosForm({ baseUrl: remoteConfig ? (remoteConfig.remoteUrl || undefined) : undefined, remoteToken: remoteConfig ? remoteConfig.token : undefined, url: `trait/${shareCode}/${traitId}/img`, method: 'post', formData })
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
  checkTrialArchiveExists,
  postTraitImage,
}
