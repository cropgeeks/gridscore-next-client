import { i18n } from '@/plugins/i18n'
import { updateTrialBrapiConfig } from '@/plugins/idb'
import { coreStore } from '@/store'
import axios from 'axios'
import emitter from 'tiny-emitter/instance'

const serverInfos = {}

let store

const getStore = () => {
  if (!store) {
    store = coreStore()
  }
  return store
}

const { t } = i18n.global

const brapiDefaultCatchHandler = (err) => {
  if (err.response) {
    // The request was made and the server responded with a status code that falls out of the range of 2xx
    // Log the user out if the result is forbidden and no error method has been provided
    // Otherwise, we assume that the calling method takes care of the error
    emitter.emit('show-loading', false)
    const variant = 'danger'
    const title = t('genericError')
    let message = err.response.statusText

    switch (err.response.status) {
      case 400:
        message = t('httpErrorFourOO')
        break
      case 401:
        message = t('httpErrorFourOOne')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(getStore().storeSelectedTrial, { url: getStore().storeBrapiConfig.url, token: null })
          .then(() => emitter.emit('show-brapi-settings', 'errorMessageBrapiPermissionUnauthorized'))
        return
      case 403: {
        message = t('httpErrorFourOThree')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(getStore().storeSelectedTrial, { url: getStore().storeBrapiConfig.url, token: null })
          .then(() => emitter.emit('show-brapi-settings', 'errorMessageBrapiPermissionForbidden'))
        break
      }
      case 404:
        message = t('httpErrorFourOFour')
        break
      case 405:
        message = t('httpErrorFourOFive')
        break
      case 408:
        message = t('httpErrorFourOEight')
        break
      case 409:
        message = t('httpErrorFourONine')
        break
      case 410:
        message = t('httpErrorFourTen')
        break
      case 500:
        message = t('httpErrorFiveOO')
        break
      case 501:
        message = t('httpErrorFiveOOne')
        break
      case 503:
        message = t('httpErrorFiveOThree')
        break
    }

    emitter.emit('toast', {
      message,
      title,
      variant,
      autoHideDelay: 5000,
      appendToast: true
    })
  } else if (err.request) {
    // The request was made but no response was received `err.request` is an instance of XMLHttpRequest in the browser
    if (err.request.textStatus === 'timeout') {
      emitter.emit('toast', {
        message: t('toastTextBrapiTimeout'),
        title: t('toastTitleBrapiError'),
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
  const brapiConfig = getStore().storeBrapiConfig
  const baseUrl = brapiConfig ? brapiConfig.url : null
  const token = brapiConfig ? brapiConfig.token : null

  if (infoCheck) {
    if (!serverInfos[baseUrl] || Object.keys(serverInfos[baseUrl]).length < 1) {
      await brapiGetInfo()
    }

    if (!serverInfos[baseUrl] || !serverInfos[baseUrl].some(c => c.service === callName && c.versions.indexOf('2.1') !== -1)) {
      emitter.emit('toast', {
        message: t('toastTextBrapiCallNotAvailable'),
        title: t('toastTitleBrapiError'),
        variant: 'danger',
        autoHideDelay: 5000,
        appendToast: true
      })
      return Promise.reject(new Error(`BrAPI call not available for the given URL: ${callName}`))
    }
  }

  const axiosParams = {
    baseURL: baseUrl,
    url,
    params: method === 'get' ? params : null,
    data: method !== 'get' ? params : null,
    method,
    crossDomain: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    timeout: 120000
  }

  const useAuth = token !== undefined && token !== null

  if (useAuth) {
    // TODO: Whyyyyyyyy?
    // axiosParams.withCredentials = true
    axiosParams.headers['Access-Control-Allow-Credentials'] = true
    axiosParams.headers.Authorization = `Bearer ${token}`
  }

  return axios.default(axiosParams)
}

/**
 * Retrieves the `serverinfo` from the BrAPI server to check availability of certain endpoints. Sets the field `serverInfo` for this BrAPI server
 */
const brapiGetInfo = async () => {
  const url = getStore().storeBrapiConfig ? getStore().storeBrapiConfig.url : null
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

/**
 * Retrieves the programs on the BrAPI server
 * @param {*} params The query parameters
 * @returns Promise
 */
const brapiGetPrograms = (params) => {
  return brapiAxios('programs', 'programs', params, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

/**
 * Retrieves the trials on the BrAPI server
 * @param {*} params The query parameters
 * @returns Promise
 */
const brapiGetTrials = (params) => {
  return brapiAxios('trials', 'trials', params, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

/**
 * Retrieves the study types on the BrAPI server
 * @param {*} params The query parameters
 * @returns Promise
 */
const brapiGetStudyTypes = (params) => {
  return brapiAxios('studytypes', 'studytypes', params, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

/**
 * Retrieves the studies on the BrAPI server
 * @param {*} params The query parameters
 * @returns Promise
 */
const brapiGetStudies = (params) => {
  return brapiAxios('studies', 'studies', params, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiPostGermplasmSearch = (params) => {
  return brapiAxios('search/germplasm', 'search/germplasm', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiPostObservationVariableSearch = (params) => {
  return brapiAxios('search/variables', 'search/variables', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiGetObservationUnits = (studyDbId) => {
  return brapiAxios('observationunits', 'observationunits', { studyDbId, includeObservations: false }, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiPostObservations = (params) => {
  return brapiAxios('observations', 'observations', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiPostObservationUnits = (params) => {
  return brapiAxios('observationunits', 'observationunits', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

const brapiPostObservationVariables = (params) => {
  return brapiAxios('variables', 'variables', params, 'post', true)
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
  brapiGetPrograms,
  brapiGetTrials,
  brapiGetStudyTypes,
  brapiGetStudies,
  brapiPostGermplasmSearch,
  brapiGetObservationUnits,
  brapiPostObservations,
  brapiPostObservationUnits,
  brapiPostObservationVariables,
  brapiPostObservationVariableSearch,
  brapiDefaultCatchHandler
}
