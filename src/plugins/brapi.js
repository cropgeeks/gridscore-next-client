import { i18n } from '@/plugins/i18n.js'
import { updateTrialBrapiConfig } from '@/plugins/idb'
import store from '@/store'
const axios = require('axios').default
const emitter = require('tiny-emitter/instance')

const serverInfos = {}

const brapiDefaultCatchHandler = (err) => {
  if (err.response) {
    // The request was made and the server responded with a status code that falls out of the range of 2xx
    // Log the user out if the result is forbidden and no error method has been provided
    // Otherwise, we assume that the calling method takes care of the error
    emitter.emit('show-loading', false)
    const variant = 'danger'
    const title = i18n.t('genericError')
    let message = err.response.statusText

    switch (err.response.status) {
      case 400:
        message = i18n.t('httpErrorFourOO')
        break
      case 401:
        message = i18n.t('httpErrorFourOOne')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(store.getters.storeSelectedTrial, { url: store.getters.brapiConfig.url, token: null })
          .then(() => emitter.emit('show-brapi-settings'))
        return
      case 403: {
        message = i18n.t('httpErrorFourOThree')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(store.getters.storeSelectedTrial, { url: store.getters.brapiConfig.url, token: null })
          .then(() => emitter.emit('show-brapi-settings'))
        break
      }
      case 404:
        message = i18n.t('httpErrorFourOFour')
        break
      case 405:
        message = i18n.t('httpErrorFourOFive')
        break
      case 408:
        message = i18n.t('httpErrorFourOEight')
        break
      case 409:
        message = i18n.t('httpErrorFourONine')
        break
      case 410:
        message = i18n.t('httpErrorFourTen')
        break
      case 500:
        message = i18n.t('httpErrorFiveOO')
        break
      case 501:
        message = i18n.t('httpErrorFiveOOne')
        break
      case 503:
        message = i18n.t('httpErrorFiveOThree')
        break
    }

    emitter.emit('toast', {
      message: message,
      title: title,
      variant: variant,
      autoHideDelay: 5000,
      appendToast: true
    })
  } else if (err.request) {
    // The request was made but no response was received `err.request` is an instance of XMLHttpRequest in the browser
    if (err.request.textStatus === 'timeout') {
      emitter.emit('toast', {
        message: i18n.t('toastTextBrapiTimeout'),
        title: i18n.t('toastTitleBrapiError'),
        variant: 'danger',
        autoHideDelay: 5000,
        appendToast: true
      })
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    if (process.env.NODE_ENV === 'development') {
      console.error(err)
    }
  }

  throw err
}

/**
 * Sends a BrAPI request to the server using the given parameter configuration
 * @param {String} url The requested (relative) server URL
 * @param {String} callName The BrAPI call name as returned from `serverinfo`
 * @param {Object} params (Optional) The request payload in the form of a Javascript object
 * @param {String} method (Optional) REST method (default: `'get'`)
 * @param {Boolean} infoCheck (Optional) Indicator whether the BrAPI server should be checked for availability of the requested endpoint. (default: `true`)
 * @returns Promise
 */
const brapiAxios = async (url, callName, params = null, method = 'get', infoCheck = true) => {
  const brapiConfig = store.getters.storeBrapiConfig
  const baseUrl = brapiConfig ? brapiConfig.url : null
  const token = brapiConfig ? brapiConfig.token : null

  if (infoCheck) {
    if (!serverInfos[baseUrl] || Object.keys(serverInfos[baseUrl]).length < 1) {
      await brapiGetInfo()
    }

    if (!serverInfos[baseUrl] || !serverInfos[baseUrl].some(c => c.service === callName && c.versions.indexOf('2.1') !== -1)) {
      emitter.emit('toast', {
        message: i18n.t('toastTextBrapiCallNotAvailable'),
        title: i18n.t('toastTitleBrapiError'),
        variant: 'danger',
        autoHideDelay: 5000,
        appendToast: true
      })
      return Promise.reject(new Error(`BrAPI call not available for the given URL: ${callName}`))
    }
  }

  const axiosParams = {
    baseURL: baseUrl,
    url: url,
    params: method === 'get' ? params : null,
    data: method !== 'get' ? params : null,
    method: method,
    crossDomain: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }

  const useAuth = token !== undefined && token !== null

  if (useAuth) {
    axiosParams.withCredentials = true
    axiosParams.headers.Authorization = `Bearer ${token}`
  }

  return axios(axiosParams)
}

/**
 * Retrieves the `serverinfo` from the BrAPI server to check availability of certain endpoints. Sets the field `serverInfo` for this BrAPI server
 */
const brapiGetInfo = async () => {
  const url = store.getters.storeBrapiConfig ? store.getters.storeBrapiConfig.url : null
  if (url) {
    await brapiAxios('serverinfo', 'serverinfo', null, 'get', false)
      .then(result => {
        if (result && result.data && result.data.result) {
          serverInfos[url] = result.data.result.calls
        } else {
          serverInfos[url] = null
        }
      })
  } else {
    emitter.emit('show-brapi-settings')
  }
}

/**
 * Retrieves the observation variables on the BrAPI server
 * @returns Promise
 */
const brapiGetVariables = () => {
  return brapiAxios('variables', 'variables', null, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

export {
  brapiAxios,
  brapiGetInfo,
  brapiGetVariables,
  brapiDefaultCatchHandler
}
