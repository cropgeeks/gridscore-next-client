import { updateTrialBrapiConfig } from '@/plugins/idb'
import { coreStore } from '@/stores/app'
import axios, { type AxiosError } from 'axios'
import emitter from 'tiny-emitter/instance'
import { i18n } from '@/plugins/vuetify'
import { Version, type BrapiCall, type Germplasm, type GermplasmSearch, type Observation, type ObservationUnit, type ObservationVariable, type ObservationVariableSearch, type Program, type ProgramParams, type Study, type StudyParams, type Trial, type TrialParams } from '@/plugins/types/brapi'

const serverInfos: { [index: string]: BrapiCall[] | undefined } = {}

function brapiDefaultCatchHandler (err: AxiosError) {
  if (err.response) {
    const store = coreStore()
    // The request was made and the server responded with a status code that falls out of the range of 2xx
    // Log the user out if the result is forbidden and no error method has been provided
    // Otherwise, we assume that the calling method takes care of the error
    emitter.emit('show-loading', false)
    let message = err.response.statusText

    switch (err.response.status) {
      case 400:
        message = i18n.global.t('httpErrorFourOO')
        break
      case 401:
        message = i18n.global.t('httpErrorFourOOne')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(store.storeSelectedTrial || '', { url: store.storeBrapiConfig.url, token: undefined })
          .then(() => emitter.emit('show-brapi-settings', 'errorMessageBrapiPermissionUnauthorized'))
        return
      case 403: {
        message = i18n.global.t('httpErrorFourOThree')
        // We're using the emitter to show the brapi settings modal
        updateTrialBrapiConfig(store.storeSelectedTrial || '', { url: store.storeBrapiConfig.url, token: undefined })
          .then(() => emitter.emit('show-brapi-settings', 'errorMessageBrapiPermissionForbidden'))
        break
      }
      case 404:
        message = i18n.global.t('httpErrorFourOFour')
        break
      case 405:
        message = i18n.global.t('httpErrorFourOFive')
        break
      case 408:
        message = i18n.global.t('httpErrorFourOEight')
        break
      case 409:
        message = i18n.global.t('httpErrorFourONine')
        break
      case 410:
        message = i18n.global.t('httpErrorFourTen')
        break
      case 500:
        message = i18n.global.t('httpErrorFiveOO')
        break
      case 501:
        message = i18n.global.t('httpErrorFiveOOne')
        break
      case 503:
        message = i18n.global.t('httpErrorFiveOThree')
        break
    }

    emitter.emit('show-snackbar', {
      text: message,
      color: 'error',
    })
  } else if (err.request) {
    // The request was made but no response was received `err.request` is an instance of XMLHttpRequest in the browser
    if (err.request.textStatus === 'timeout') {
      emitter.emit('show-snackbar', {
        text: i18n.global.t('toastTextBrapiTimeout'),
        color: 'error',
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
async function brapiAxios (url: string, callName: string, params: any = undefined, method: 'get' | 'post' | 'put' | 'patch' = 'get', infoCheck = true) {
  const store = coreStore()
  const brapiConfig = store.storeBrapiConfig
  const baseUrl = brapiConfig?.url || 'undefined'
  const token = brapiConfig?.token

  if (infoCheck) {
    if (!serverInfos[baseUrl] || Object.keys(serverInfos[baseUrl]).length === 0) {
      await brapiGetInfo()
    }

    console.log(serverInfos[baseUrl]?.find(c => c.service === callName))
    if (!serverInfos[baseUrl] || !serverInfos[baseUrl].some(c => c.service === callName && c.versions.includes(Version.TWO_ONE))) {
      emitter.emit('show-snackbar', {
        text: i18n.global.t('toastTextBrapiCallNotAvailable'),
        color: 'error',
      })

      throw new Error(`BrAPI call not available for the given URL: ${callName}`)
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
      'Content-Type': 'application/json; charset=utf-8',
    } as { [index: string]: any },
    timeout: 120_000,
  }

  const useAuth = token !== undefined && token !== null

  if (useAuth) {
    // TODO: Whyyyyyyyy? The line below causes CORS issues, while the one below that works just fine.
    // axiosParams.withCredentials = true
    axiosParams.headers['Access-Control-Allow-Credentials'] = true
    axiosParams.headers.Authorization = `Bearer ${token}`
  }

  return axios(axiosParams)
}

/**
 * Retrieves the `serverinfo` from the BrAPI server to check availability of certain endpoints. Sets the field `serverInfo` for this BrAPI server
 */
async function brapiGetInfo () {
  const store = coreStore()
  const url = store.storeBrapiConfig ? store.storeBrapiConfig.url : null
  if (url) {
    await brapiAxios('serverinfo', 'serverinfo', null, 'get', false)
      .then(result => {
        if (result && result.data && result.data.result) {
          serverInfos[url] = result.data.result.calls
        } else {
          serverInfos[url] = undefined
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
function brapiGetVariables (): Promise<ObservationVariable[]> {
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
function brapiGetPrograms (params?: ProgramParams): Promise<Program[]> {
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
function brapiGetTrials (params: TrialParams): Promise<Trial[]> {
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
function brapiGetStudyTypes (): Promise<string[]> {
  return brapiAxios('studytypes', 'studytypes', undefined, 'get', true)
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
function brapiGetStudies (params: StudyParams): Promise<Study[]> {
  return brapiAxios('studies', 'studies', params, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiPostGermplasmSearch (params: GermplasmSearch): Promise<Germplasm[]> {
  return brapiAxios('search/germplasm', 'search/germplasm', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiPostObservationVariableSearch (params: ObservationVariableSearch): Promise<ObservationVariable[]> {
  return brapiAxios('search/variables', 'search/variables', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiGetObservationUnits (studyDbId: string): Promise<ObservationUnit[]> {
  return brapiAxios('observationunits', 'observationunits', { studyDbId, includeObservations: false }, 'get', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiPostObservations (params: Observation[]): Promise<Observation[]> {
  return brapiAxios('observations', 'observations', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiPostObservationUnits (params: ObservationUnit[]): Promise<ObservationUnit[]> {
  return brapiAxios('observationunits', 'observationunits', params, 'post', true)
    .then(result => {
      if (result && result.data && result.data.result && result.data.result.data) {
        return result.data.result.data
      } else {
        return []
      }
    })
}

function brapiPostObservationVariables (params: ObservationVariable[]): Promise<ObservationVariable[]> {
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
  brapiDefaultCatchHandler,
}
