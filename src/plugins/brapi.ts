import { updateTrialBrapiConfig } from '@/plugins/idb'
import { coreStore } from '@/stores/app'
import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import emitter from 'tiny-emitter/instance'
import { i18n } from '@/plugins/vuetify'
import { Version, type BrapiCall, type Germplasm, type GermplasmSearch, type Observation, type ObservationUnit, type ObservationVariable, type ObservationVariableSearch, type Program, type ProgramParams, type Study, type StudyParams, type Trial, type TrialParams } from '@/plugins/types/brapi'
import { getTrialDataCached } from '@/plugins/datastore'
import type { CellPlus, TrialPlus } from '@/plugins/types/client'
import { toIsoString } from '@/plugins/formatting'
import { getPlotGeoCoordinates } from '@/plugins/location'
import { CellCategory, PersonType } from '@/plugins/types/gridscore'

const serverInfos: { [index: string]: BrapiCall[] | undefined } = {}

const BRAPI_OBSERVATION_UNIT_MISSING = 'BrAPI endpoint is missing observation unit'

function brapiDefaultCatchHandler (err: AxiosError | string) {
  if (err instanceof AxiosError) {
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
          break
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
  } else if (typeof err === 'string') {
    emitter.emit('show-snackbar', {
      text: err,
      color: 'error',
    })
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

  if (baseUrl !== 'undefined' && infoCheck) {
    if (!serverInfos[baseUrl] || Object.keys(serverInfos[baseUrl]).length === 0) {
      await brapiGetInfo()
    }

    if (!serverInfos[baseUrl] || !serverInfos[baseUrl].some(c => c.service === callName && c.versions.includes(Version.TWO_ONE))) {
      emitter.emit('show-snackbar', {
        text: i18n.global.t('toastTextBrapiCallNotAvailable'),
        color: 'error',
      })

      throw new Error(`BrAPI call not available for the given URL: ${callName}`)
    }
  }

  const axiosParams: AxiosRequestConfig = {
    baseURL: baseUrl,
    url,
    params: method === 'get' ? params : null,
    data: method !== 'get' ? params : null,
    method,
    // crossDomain: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    } as { [index: string]: any },
    timeout: 120_000,
  }

  const useAuth = token !== undefined && token !== null

  if (useAuth && axiosParams.headers) {
    // TODO: Whyyyyyyyy? The line below causes CORS issues, while the one below that works just fine.
    axiosParams.withCredentials = true
    // axiosParams.headers['Access-Control-Allow-Credentials'] = true
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
  if (url && url.length > 0) {
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

function brapiPostObservationData (trial: TrialPlus, brapiProgram: Program, brapiTrial: Trial, brapiStudy: Study, forceObservationUnitCreation: boolean) {
  return new Promise<boolean>((resolve, reject) => {
    const trialData = getTrialDataCached()
    if (trialData) {
      emitter.emit('show-loading', true, 1)

      // Generate a mapping based on display row and column for lookup
      const displayMapping: { [index: string]: string } = {}
      for (let y = 0; y < trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]

          if (cell) {
            displayMapping[`${cell.displayRow}|${cell.displayColumn}`] = `${y}|${x}`
          }
        }
      }

      // First, search for observation units from this study, save the observationUnitDbId for those that have local matches
      const observationUnitDbIds: { [index: string]: string } = {}
      brapiGetObservationUnits(brapiStudy.studyDbId)
        .then(ous => {
          if (ous && ous.length > 0) {
            ous.forEach(ou => {
              if (ou.observationUnitPosition && ou.observationUnitPosition.positionCoordinateX !== undefined && ou.observationUnitPosition.positionCoordinateY !== null) {
                const match = displayMapping[`${ou.observationUnitPosition.positionCoordinateY}|${ou.observationUnitPosition.positionCoordinateX}`]

                if (match) {
                  observationUnitDbIds[match] = ou.observationUnitDbId || ''
                }
              }
            })
          }
        })
        .catch(e => {
          reject(e)
          brapiDefaultCatchHandler(e)
        })

      // For legacy reasons we now need to send the observations as part of the ObservationUnit, then check if what we get back is what we sent.
      // If so, then the Germinate BrAPI backend is the old (wrong) version. However, that's all that's required in that case. If not, we need
      // to go on and actually send the observations separately using the observationunits we got back.
      sendDataLegacy(trial, brapiProgram, brapiTrial, brapiStudy, trialData)
        .then(data => {
          if (data && data.success === false) {
            sendDataCurrent(trial, brapiProgram, brapiTrial, brapiStudy, trialData, observationUnitDbIds, data.observationUnits || [], forceObservationUnitCreation)
              .then(value => resolve(value))
              .catch(e => {
                reject(e)
                brapiDefaultCatchHandler(e)
              })
          } else {
            resolve(false)
          }
        })
        .catch(e => {
          reject(e)
          brapiDefaultCatchHandler(e)
        })
    }
  })
}

interface LegacyResponse {
  success: boolean
  observationUnits?: ObservationUnit[]
}

function sendDataLegacy (trial: TrialPlus, brapiProgram: Program, brapiTrial: Trial, brapiStudy: Study, trialData: { [index: string]: CellPlus }): Promise<LegacyResponse> {
  emitter.emit('show-loading', true, 33.3)

  const data: ObservationUnit[] = []

  for (let y = 0; y < trial.layout.rows; y++) {
    // And each field column
    for (let x = 0; x < trial.layout.columns; x++) {
      // Get the data cell
      const cell = trialData[`${y}|${x}`]

      if (cell) {
        const geoCoordinates = getPlotGeoCoordinates(cell)

        const ou: ObservationUnit = {
          germplasmDbId: cell.brapiId || '',
          germplasmName: cell.germplasm,
          observationUnitPosition: {
            entryType: (cell.categories && cell.categories.includes(CellCategory.CONTROL)) ? 'CHECK' : 'TEST',
            geoCoordinates,
            positionCoordinateXType: 'GRID_COL',
            positionCoordinateX: `${cell.displayColumn}`,
            positionCoordinateYType: 'GRID_ROW',
            positionCoordinateY: `${cell.displayRow}`,
            observationLevel: (cell.rep !== undefined && cell.rep !== null)
              ? {
                  levelName: 'rep',
                  levelCode: cell.rep,
                }
              : undefined,
          },
          programDbId: brapiProgram.programDbId,
          trialDbId: brapiTrial.trialDbId,
          studyDbId: brapiStudy.studyDbId,
          observations: [] as Observation[],
        }

        trial.traits.forEach(t => {
          const measurements = cell.measurements[t.id || '']

          if (measurements) {
            measurements.forEach(m => {
              m.values.forEach(v => {
                if (v !== undefined && v !== null && v !== '') {
                  ou.observations?.push({
                    germplasmDbId: cell.brapiId || '',
                    germplasmName: cell.germplasm,
                    observationVariableDbId: t.brapiId || '',
                    observationVariableName: t.name,
                    studyDbId: brapiStudy.studyDbId,
                    value: t.dataType === 'categorical' ? (t.restrictions?.categories?.[+v] || v) : v,
                    observationTimeStamp: toIsoString(m.timestamp),
                    additionalInfo: {
                      traitMType: t.allowRepeats ? 'multi' : 'single',
                    },
                  })
                }
              })
            })
          }
        })

        if ((ou.observations || []).length > 0) {
          data.push(ou)
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    brapiPostObservationUnits(data)
      .then(observationUnits => {
        emitter.emit('plausible-event', { key: 'dataset-export', props: { format: 'brapi' } })
        // If any data has been returned, that means that we're dealing with the legacy implementation of Germinate.
        const dataAccepted = observationUnits.some(ou => ou.observations && ou.observations.length > 0)
        resolve({
          success: dataAccepted,
          observationUnits,
        })
      })
      .catch(e => {
        reject(e)
        brapiDefaultCatchHandler(e)
      })
  })
}

function sendDataCurrent (trial: TrialPlus, brapiProgram: Program, brapiTrial: Trial, brapiStudy: Study, trialData: { [index: string]: CellPlus }, observationUnitDbIds: { [index: string]: string }, observationUnits: ObservationUnit[], forceObservationUnitCreation: boolean) {
  return new Promise<boolean>((resolve, reject) => {
    emitter.emit('show-loading', true, 66.6)

    const observationUnitMap: { [index: string]: string } = {}

    if (forceObservationUnitCreation) {
      const units: ObservationUnit[] = []
      // Now check if they all exist
      for (let y = 0; y < trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]
          if (cell) {
            const geoCoordinates = getPlotGeoCoordinates(cell)
            const ou: ObservationUnit = {
              germplasmDbId: cell.brapiId || '',
              germplasmName: cell.germplasm,
              observationUnitPosition: {
                entryType: (cell.categories && cell.categories.includes(CellCategory.CONTROL)) ? 'CHECK' : 'TEST',
                geoCoordinates,
                positionCoordinateXType: 'GRID_COL',
                positionCoordinateX: `${cell.displayColumn}`,
                positionCoordinateYType: 'GRID_ROW',
                positionCoordinateY: `${cell.displayRow}`,
                observationLevel: (cell.rep !== undefined && cell.rep !== null)
                  ? {
                      levelName: 'rep',
                      levelCode: cell.rep,
                    }
                  : undefined,
              },
              programDbId: brapiProgram.programDbId,
              trialDbId: brapiTrial.trialDbId,
              studyDbId: brapiStudy.studyDbId,
              observations: [] as Observation[],
            }

            units.push(ou)
          }
        }
      }

      brapiPostObservationUnits(units)
        .then(observationUnits => {
          emitter.emit('plausible-event', { key: 'dataset-export', props: { format: 'brapi' } })
          observationUnits.forEach(ou => {
            if (ou.observationUnitDbId && ou.observationUnitPosition && ou.observationUnitPosition.positionCoordinateX !== undefined && ou.observationUnitPosition.positionCoordinateY !== undefined) {
              observationUnitMap[`${ou.observationUnitPosition.positionCoordinateY}|${ou.observationUnitPosition.positionCoordinateX}`] = ou.observationUnitDbId
            }
          })

          sendObservations(trial, brapiStudy, trialData, observationUnitMap)
            .then(result => resolve(result))
            .catch(e => {
              brapiDefaultCatchHandler(e)
              reject(e)
            })
            .finally(() => emitter.emit('show-loading', false))
        })
    } else {
      // Get the locally know ids first from the GET observationunits call
      for (let y = 0; y < trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]
          const id = observationUnitDbIds[`${y}|${x}`]
          if (cell && id) {
            observationUnitMap[`${cell.displayRow}|${cell.displayColumn}`] = id
          }
        }
      }

      // Then write the remote ones as well
      observationUnits.forEach(ou => {
        if (ou.observationUnitDbId && ou.observationUnitPosition && ou.observationUnitPosition.positionCoordinateX !== undefined && ou.observationUnitPosition.positionCoordinateY !== undefined) {
          observationUnitMap[`${ou.observationUnitPosition.positionCoordinateY}|${ou.observationUnitPosition.positionCoordinateX}`] = ou.observationUnitDbId
        }
      })

      // Now check if they all exist
      for (let y = 0; y < trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]

          if (cell) {
            const observationUnit = observationUnitMap[`${cell.displayRow}|${cell.displayColumn}`]

            if (!observationUnit) {
              reject(new AxiosError(`${BRAPI_OBSERVATION_UNIT_MISSING} for plot in row ${cell.displayRow} and column ${cell.displayColumn}`, '406'))
              return
            }
          }
        }
      }

      sendObservations(trial, brapiStudy, trialData, observationUnitMap)
        .then(result => resolve(result))
        .catch(e => {
          brapiDefaultCatchHandler(e)
          reject(e)
        })
        .finally(() => emitter.emit('show-loading', false))
    }
  })
}

function sendObservations (trial: TrialPlus, brapiStudy: Study, trialData: { [index: string]: CellPlus }, observationUnitMap: { [index: string]: string } = {}) {
  return new Promise<boolean>((resolve, reject) => {
    const data: Observation[] = []
    for (let y = 0; y < trial.layout.rows; y++) {
      // And each field column
      for (let x = 0; x < trial.layout.columns; x++) {
        // Get the data cell
        const cell = trialData[`${y}|${x}`]

        if (cell) {
          const observationUnit = observationUnitMap[`${cell.displayRow}|${cell.displayColumn}`]

          if (!observationUnit) {
            reject(new AxiosError(`${BRAPI_OBSERVATION_UNIT_MISSING} for plot in row ${cell.displayRow} and column ${cell.displayColumn}`, '406'))
            return
          }

          const geoCoordinates = getPlotGeoCoordinates(cell)

          const obs = {
            germplasmDbId: cell.brapiId,
            germplasmName: cell.germplasm,
            observationUnitDbId: observationUnit,
            studyDbId: brapiStudy.studyDbId,
            geoCoordinates,
          }

          if (cell.measurements) {
            trial.traits.forEach(t => {
              const measurements = cell.measurements[t.id || '']
              if (measurements) {
                measurements.forEach(m => {
                  let collector = undefined
                  let submitter = undefined

                  if (trial.people) {
                    const coll = trial.people.find(p => p.id === m.personId)
                    collector = coll ? coll.name : undefined

                    const sub = trial.people.find(p => p.types.includes(PersonType.DATA_SUBMITTER))
                    submitter = sub ? sub.name : undefined
                  }

                  m.values.forEach(v => {
                    if (v !== undefined && v !== null && v !== '') {
                      data.push(Object.assign({
                        observationVariableDbId: t.brapiId || '',
                        observationTimeStamp: toIsoString(m.timestamp),
                        additionalInfo: {
                          traitMType: t.allowRepeats ? 'multi' : 'single',
                        },
                        value: t.dataType === 'categorical' ? (t.restrictions?.categories?.[+v] || v) : v,
                        collector,
                        uploadedBy: submitter,
                      }, obs))
                    }
                  })
                })
              }
            })
          }
        }
      }
    }

    brapiPostObservations(data)
      .then(() => {
        emitter.emit('plausible-event', { key: 'dataset-export', props: { format: 'brapi' } })
        resolve(true)
      })
      .catch(e => {
        brapiDefaultCatchHandler(e)
        reject(e)
      })
      .finally(() => emitter.emit('show-loading', false))
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
  brapiPostObservationData,
  brapiDefaultCatchHandler,
}
