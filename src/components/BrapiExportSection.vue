<template>
  <div>
    <p class="mt-3">{{ $t('pageExportTrialFormatBrapi') }}</p>

    <b-button class="mb-3" @click="showBrapiSettings"><IBiGearFill /> {{ $t('buttonBrapiSettings') }}</b-button>

    <b-form @submit.prevent="sendData">
      <b-row>
        <b-col cols=12 md=6 class="mb-3 d-flex flex-column align-items-start justify-content-between">
          <b-card class="mb-3" :title="$t('pageBrapiExportBrapiGermplasmIdTitle')">
            <p :class="allGermplasmValidDbId ? 'text-success' : 'text-danger'">{{ $t('pageBrapiExportBrapiGermplasmIdText', germplasmWithBrapiDbIds) }}</p>

            <b-button :variant="allGermplasmValidDbId ? null : 'primary'" :disabled="allGermplasmValidDbId" @click="searchBrapiGermplasmMatches"><IBiSearch /> {{ $t('buttonUpdate') }}</b-button>
          </b-card>
        </b-col>
        <b-col cols=12 md=6 class="mb-3 d-flex flex-column align-items-start justify-content-between">
          <b-card class="mb-3" :title="$t('pageBrapiExportBrapiTraitIdTitle')">
            <p :class="allTraitsValidDbId ? 'text-success' : 'text-danger'">{{ $t('pageBrapiExportBrapiTraitIdText', traitsWithBrapiDbIds) }}</p>
            <b-button class="mr-2" :variant="allTraitsValidDbId ? null : 'primary'" :disabled="allTraitsValidDbId" @click="searchBrapiTraitMatches"><IBiSearch /> {{ $t('buttonUpdate') }}</b-button>
            <span v-b-tooltip="allTraitsValidDbId || traitLookupRanAtLeastOnce ? '' : $t('tooltipBrapiExportBrapiTraitRunSearch')">
              <b-button :disabled="allTraitsValidDbId || !traitLookupRanAtLeastOnce" @click="writeTraitsWithoutBrapiId"><IBiCloudPlus /> {{ $t('buttonUpload') }}</b-button>
            </span>
          </b-card>
        </b-col>
      </b-row>

      <div class="mt-3" v-if="allGermplasmValidDbId && allTraitsValidDbId">
        <h3>{{ $t('pageBrapiExportFilterTitle') }}</h3>
        <b-row>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiProgram')" label-for="program">
              <b-form-select id="program" :options="programOptions" v-model="selectedProgram" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiTrial')" label-for="trial">
              <b-form-select id="trial" :options="trialOptions" v-model="selectedTrial" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiStudyType')" label-for="studyType">
              <b-form-select id="studyType" :options="studyTypeOptions" v-model="selectedStudyType" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiStudy')" label-for="study">
              <b-form-select id="study" :options="studyOptions" v-model="selectedStudy" />
            </b-form-group>
          </b-col>
        </b-row>

        <b-button class="mb-3" type="submit" variant="primary" :disabled="!canProceed"><IBiCloudUpload /> {{ $t('buttonSendData') }}</b-button>
      </div>
    </b-form>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiGetStudyTypes, brapiPostGermplasmSearch, brapiPostObservationVariables, brapiPostObservationVariableSearch, brapiDefaultCatchHandler, brapiPostObservationUnits, brapiPostObservations, brapiGetObservationUnits } from '@/plugins/brapi'
import { getTrialDataCached } from '@/plugins/datastore'
import { updateGermplasmBrapiIds, updateTraitBrapiIds } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'
import { getPlotGeoCoordinates } from '@/plugins/location'
import { CELL_CATEGORY_CONTROL, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      selectedProgram: null,
      selectedTrial: null,
      selectedStudyType: null,
      selectedStudy: null,
      programs: [],
      trials: [],
      studyTypes: [],
      studies: [],
      germplasmWithBrapiDbIds: {
        count: 0,
        total: 0,
        germplasmWithoutId: []
      },
      traitsWithBrapiDbIds: {
        count: 0,
        total: 0,
        traitsWithoutId: []
      },
      traitLookupRanAtLeastOnce: false
    }
  },
  watch: {
    'trial.brapiConfig.url': function () {
      this.updateBrapiGermplasmDbIdCounts()
      this.updateBrapiTraitDbIdCounts()
    },
    'trial.brapiConfig.token': function () {
      this.updateBrapiGermplasmDbIdCounts()
      this.updateBrapiTraitDbIdCounts()
    },
    selectedProgram: function () {
      this.selectedTrial = null

      this.updateTrials()
    },
    selectedTrial: function () {
      this.selectedStudyType = null

      this.updateStudyTypes()
    },
    selectedStudyType: function () {
      this.selectedStudy = null

      this.updateStudies()
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial'
    ]),
    allGermplasmValidDbId: function () {
      return this.germplasmWithBrapiDbIds.count === this.germplasmWithBrapiDbIds.total
    },
    allTraitsValidDbId: function () {
      return this.traitsWithBrapiDbIds.count === this.traitsWithBrapiDbIds.total
    },
    canProceed: function () {
      return this.selectedProgram && this.selectedTrial && this.selectedStudyType && this.selectedStudy && this.allGermplasmValidDbId
    },
    programOptions: function () {
      if (this.programs) {
        return this.programs.map(t => {
          return {
            value: t,
            text: `${t.programDbId} - ${t.programName}`
          }
        })
      } else {
        return []
      }
    },
    trialOptions: function () {
      if (this.trials) {
        return this.trials.map(t => {
          return {
            value: t,
            text: `${t.trialDbId} - ${t.trialName}`
          }
        })
      } else {
        return []
      }
    },
    studyTypeOptions: function () {
      if (this.studyTypes) {
        return this.studyTypes.map(t => {
          return {
            value: t,
            text: t
          }
        })
      } else {
        return []
      }
    },
    studyOptions: function () {
      if (this.studies) {
        return this.studies.map(t => {
          return {
            value: t,
            text: `${t.studyDbId} - ${t.studyName}`
          }
        })
      } else {
        return []
      }
    }
  },
  methods: {
    pad: function (num) {
      return (num < 10 ? '0' : '') + num
    },
    toIsoString: function (str) {
      const date = new Date(str)
      const tzo = -date.getTimezoneOffset()
      const dif = tzo >= 0 ? '+' : '-'

      return date.getFullYear() +
        '-' + this.pad(date.getMonth() + 1) +
        '-' + this.pad(date.getDate()) +
        'T' + this.pad(date.getHours()) +
        ':' + this.pad(date.getMinutes()) +
        ':' + this.pad(date.getSeconds()) +
        dif + this.pad(Math.floor(Math.abs(tzo) / 60)) + this.pad(Math.abs(tzo) % 60)
    },
    writeTraitsWithoutBrapiId: function () {
      if (this.traitsWithBrapiDbIds && this.traitsWithBrapiDbIds.traitsWithoutId && this.traitsWithBrapiDbIds.traitsWithoutId.length > 0) {
        const newTraits = this.trial.traits.concat().filter(t => this.traitsWithBrapiDbIds.traitsWithoutId.includes(t.name)).map(t => {
          const newT = {
            observationVariableName: t.name
          }

          const scale = {
            dataType: null,
            validValues: null
          }

          switch (t.type) {
            case 'date':
              scale.dataType = 'Date'
              break
            case 'text':
              scale.dataType = 'Text'
              break
            case 'float':
            case 'int':
            case 'range':
              scale.dataType = 'Numerical'
              break
            case 'categorical':
              scale.dataType = 'Ordinal'
              break
            default:
              scale.dataType = 'Text'
          }

          if (t.restrictions) {
            scale.validValues = {}
            if (t.restrictions.min !== undefined && t.restrictions.min !== null) {
              scale.validValues.minimumValue = t.restrictions.min
            }
            if (t.restrictions.max !== undefined && t.restrictions.max !== null) {
              scale.validValues.maximumValue = t.restrictions.max
            }
            if (t.restrictions.categories && t.restrictions.categories.length > 0) {
              scale.validValues.categories = t.restrictions.categories.map(c => {
                return {
                  label: c,
                  value: c
                }
              })
            }
          }

          newT.scale = scale

          return newT
        })

        brapiPostObservationVariables(newTraits)
          .then(() => this.searchBrapiTraitMatches())
          .catch(brapiDefaultCatchHandler)
      }
    },
    sendData: function () {
      const trialData = getTrialDataCached()
      if (trialData) {
        emitter.emit('show-loading', true, 1)

        // Generate a mapping based on display row and column for lookup
        const displayMapping = {}
        for (let y = 0; y < this.trial.layout.rows; y++) {
          // And each field column
          for (let x = 0; x < this.trial.layout.columns; x++) {
            // Get the data cell
            const cell = trialData[`${y}|${x}`]

            if (cell) {
              displayMapping[`${cell.displayRow}|${cell.displayColumn}`] = `${y}|${x}`
            }
          }
        }

        // First, search for observation units from this study, save the observationUnitDbId for those that have local matches
        brapiGetObservationUnits(this.selectedStudy.studyDbId)
          .then(ous => {
            if (ous && ous.length > 0) {
              ous.forEach(ou => {
                const match = displayMapping[`${ou.observationUnitPosition.positionCoordinateY}|${ou.observationUnitPosition.positionCoordinateX}`]

                if (match) {
                  trialData[match].observationUnitDbId = ou.observationUnitDbId
                }
              })
            }
          })

        // For legacy reasons we now need to send the observations as part of the ObservationUnit, then check if what we get back is what we sent.
        // If so, then the Germinate BrAPI backend is the old (wrong) version. However, that's all that's required in that case. If not, we need
        // to go on and actually send the observations separately using the observationunits we got back.
        this.sendDataLegacy(trialData)
          .then((data) => {
            if (data && data.length === 2) {
              if (data[0] === false) {
                this.sendDataCurrent(trialData, data[1])
              }
            }
          })
      }
    },
    sendDataLegacy: function (trialData) {
      emitter.emit('show-loading', true, 33.3)

      const data = []

      for (let y = 0; y < this.trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < this.trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]

          if (cell) {
            const geoCoordinates = getPlotGeoCoordinates(cell)

            const ou = {
              germplasmDbId: cell.brapiId,
              germplasmName: cell.germplasm,
              observationUnitPosition: {
                entryType: cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL) ? 'CHECK' : 'TEST',
                geoCoordinates: geoCoordinates,
                positionCoordinateXType: 'GRID_COL',
                positionCoordinateX: `${cell.displayColumn}`,
                positionCoordinateYType: 'GRID_ROW',
                positionCoordinateY: `${cell.displayRow}`,
                observationLevel: (cell.rep !== undefined && cell.rep !== null)
                  ? {
                      levelName: 'rep',
                      levelCode: cell.rep
                    }
                  : null
              },
              programDbId: this.selectedProgram.programDbId,
              trialDbId: this.selectedTrial.trialDbId,
              studyDbId: this.selectedStudy.studyDbId,
              observations: []
            }

            this.trial.traits.forEach(t => {
              const measurements = cell.measurements[t.id]

              if (measurements) {
                measurements.forEach(m => {
                  m.values.forEach(v => {
                    ou.observations.push({
                      germplasmDbId: cell.brapiId,
                      germplasmName: cell.germplasm,
                      observationVariableDbId: t.brapiId,
                      observationVariableName: t.name,
                      studyDbId: this.selectedStudy.studyDbId,
                      value: t.dataType === 'categorical' ? t.restrictions.categories[v] : `${v}`,
                      observationTimeStamp: this.toIsoString(m.timestamp),
                      additionalInfo: {
                        traitMType: t.allowRepeats ? 'multi' : 'single'
                      }
                    })
                  })
                })
              }
            })

            if (ou.observations.length > 0) {
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
            resolve([dataAccepted, observationUnits])
          })
          .catch(e => {
            brapiDefaultCatchHandler(e)
            reject(e)
          })
      })
    },
    sendDataCurrent: function (trialData, observationUnits) {
      emitter.emit('show-loading', true, 66.6)

      const data = []
      const observationUnitMap = {}

      // Get the locally know ids first from the GET observationunits call
      for (let y = 0; y < this.trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < this.trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]
          if (cell.observationUnitDbId) {
            observationUnitMap[`${cell.displayRow}|${cell.displayColumn}`] = cell.observationUnitDbId
          }
        }
      }

      // Then write the remote ones as well
      observationUnits.forEach(ou => {
        observationUnitMap[`${ou.observationUnitPosition.positionCoordinateY}|${ou.observationUnitPosition.positionCoordinateX}`] = ou.observationUnitDbId
      })

      for (let y = 0; y < this.trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < this.trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]

          if (cell) {
            const observationUnit = observationUnitMap[`${cell.displayRow}|${cell.displayColumn}`]

            if (!observationUnit) {
              console.error(`Missing observation unit for plot in row ${cell.displayRow} and column ${cell.displayColumn}`)
              continue
            }

            const geoCoordinates = getPlotGeoCoordinates(cell)

            const obs = {
              germplasmDbId: cell.brapiId,
              germplasmName: cell.germplasm,
              observationUnitDbId: observationUnit,
              studyDbId: this.selectedStudy.studyDbId,
              geoCoordinates: geoCoordinates
            }

            if (cell.measurements) {
              this.trial.traits.forEach(t => {
                const measurements = cell.measurements[t.id]
                measurements.forEach(m => {
                  let collector = null
                  let submitter = null

                  if (this.trial.people) {
                    const coll = this.trial.people.find(p => p.id === m.personId)
                    collector = coll ? coll.name : null

                    const sub = this.trial.people.find(p => p.types.includes(PERSON_TYPE_DATA_SUBMITTER))
                    submitter = sub ? sub.name : null
                  }

                  m.values.forEach(v => {
                    const currentObservation = Object.assign({
                      observationVariableDbId: t.brapiId,
                      observationTimeStamp: this.toIsoString(m.timestamp),
                      additionalInfo: {
                        traitMType: t.allowRepeats ? 'multi' : 'single'
                      },
                      value: t.dataType === 'categorical' ? t.restrictions.categories[v] : `${v}`,
                      collector: collector,
                      uploadedBy: submitter
                    }, obs)

                    data.push(currentObservation)
                  })
                })
              })
            }
          }
        }
      }

      brapiPostObservations(data)
        .then(() => {
          emitter.emit('plausible-event', { key: 'dataset-export', props: { format: 'brapi' } })
        })
        .catch(brapiDefaultCatchHandler)
        .finally(() => emitter.emit('show-loading', false))
    },
    updateBrapiTraitDbIdsInDatabase: function (map) {
      const mapping = {}

      this.trial.traits.forEach(t => {
        const brapiMatches = map.get(t.name.toLowerCase())

        if (brapiMatches && brapiMatches.length > 0) {
          brapiMatches.forEach(brapiMatch => {
            if (brapiMatch && brapiMatch.scale) {
              // Check data type
              let matches = false
              switch (brapiMatch.scale.dataType) {
                case 'Date':
                  matches = t.dataType === 'date'
                  break
                case 'Text':
                  matches = t.dataType === 'text'
                  break
                case 'Numeric':
                case 'Numerical':
                  matches = t.dataType === 'float' || t.dataType === 'int' || t.dataType === 'range'
                  break
                case 'Duration':
                  matches = t.dataType === 'int'
                  break
                case 'Nominal':
                case 'Ordinal':
                  matches = t.dataType === 'categorical'
                  break
              }

              if (matches) {
                t.brapiId = brapiMatch.observationVariableDbId
                mapping[t.id] = brapiMatch.observationVariableDbId
              }
            }
          })
        }
      })

      if (Object.keys(mapping).length > 0) {
        updateTraitBrapiIds(this.trial.localId, mapping)
          .then(() => emitter.emit('trial-selected'))
      }
    },
    updateBrapiGermplasmDbIdsInDatabase: function (map) {
      const trialData = getTrialDataCached()
      if (trialData) {
        emitter.emit('show-loading', true)

        const mapping = {}
        // For each field row
        for (let y = 0; y < this.trial.layout.rows; y++) {
          // And each field column
          for (let x = 0; x < this.trial.layout.columns; x++) {
            // Get the data cell
            const cell = trialData[`${y}|${x}`]
            // If there is data
            if (cell) {
              const id = map.get(cell.germplasm.toLowerCase())

              if (id !== undefined && id !== null) {
                mapping[`${y}|${x}`] = id
              }
            }
          }
        }

        emitter.emit('show-loading', false)

        // Store the data in the database
        if (Object.keys(mapping).length > 0) {
          updateGermplasmBrapiIds(this.trial.localId, mapping)
            .then(() => emitter.emit('trial-selected'))
        }
      }
    },
    searchBrapiTraitMatches: function () {
      brapiPostObservationVariableSearch({
        observationVariableNames: this.traitsWithBrapiDbIds.traitsWithoutId
      }).then(result => {
        this.traitLookupRanAtLeastOnce = true
        const map = new Map()
        if (result) {
          result.forEach(g => {
            const lower = g.observationVariableName.toLowerCase()
            let match = map.get(lower)
            if (!match) {
              match = []
            }

            match.push(g)

            map.set(lower, match)
          })

          this.updateBrapiTraitDbIdsInDatabase(map)
        }
      }).catch(brapiDefaultCatchHandler)
    },
    searchBrapiGermplasmMatches: function () {
      brapiPostGermplasmSearch({
        germplasmNames: this.germplasmWithBrapiDbIds.germplasmWithoutId
      }).then(result => {
        const map = new Map()
        if (result) {
          result.forEach(g => {
            map.set(g.germplasmName.toLowerCase(), g.germplasmDbId)
          })

          this.updateBrapiGermplasmDbIdsInDatabase(map)
        }
      }).catch(brapiDefaultCatchHandler)
    },
    showBrapiSettings: function () {
      emitter.emit('show-brapi-settings')
    },
    updatePrograms: function () {
      brapiGetPrograms()
        .then(result => {
          this.programs = result

          if (result && result.length > 0) {
            this.selectedProgram = result[0]
          } else {
            this.selectedProgram = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateTrials: function () {
      brapiGetTrials({
        programDbId: this.selectedProgram ? this.selectedProgram.programDbId : null
      })
        .then(result => {
          this.trials = result

          if (result && result.length > 0) {
            this.selectedTrial = result[0]
          } else {
            this.selectedTrial = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudyTypes: function () {
      brapiGetStudyTypes()
        .then(result => {
          this.studyTypes = result

          if (result && result.length > 0) {
            if (result.includes('trials')) {
              this.selectedStudyType = 'trials'
            } else {
              this.selectedStudyType = result[0]
            }
          } else {
            this.selectedStudyType = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudies: function () {
      brapiGetStudies({
        studyType: this.selectedStudyType,
        trialDbId: this.selectedTrial ? this.selectedTrial.trialDbId : null
      })
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            if (this.trial.brapiId) {
              const match = result.find(r => r.studyDbId === `${this.trial.brapiId}`)

              this.selectedStudy = match || result[0]
            } else {
              this.selectedStudy = result[0]
            }
          } else {
            this.selectedStudy = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateBrapiTraitDbIdCounts: function () {
      let count = 0
      const total = this.trial.traits.length
      const traitsWithoutId = []

      this.trial.traits.forEach(t => {
        if (t.brapiId !== undefined && t.brapiId !== null) {
          count++
        } else {
          traitsWithoutId.push(t.name)
        }
      })

      this.traitsWithBrapiDbIds = {
        count,
        total,
        traitsWithoutId
      }
    },
    updateBrapiGermplasmDbIdCounts: function () {
      const trialData = getTrialDataCached()
      if (!trialData) {
        this.germplasmWithBrapiDbIds = {
          count: 0,
          total: 0,
          germplasmWithoutId: []
        }
      } else {
        let count = 0
        let total = 0
        const germplasmWithoutId = []
        // For each field row
        for (let y = 0; y < this.trial.layout.rows; y++) {
          // And each field column
          for (let x = 0; x < this.trial.layout.columns; x++) {
            // Get the data cell
            const cell = trialData[`${y}|${x}`]
            // If there is data
            if (cell) {
              total++

              if (cell.brapiId) {
                count++
              } else {
                germplasmWithoutId.push(cell.germplasm)
              }
            }
          }
        }

        this.germplasmWithBrapiDbIds = {
          count,
          total,
          germplasmWithoutId
        }
      }
    },
    update: function () {
      this.updatePrograms()
      this.updateBrapiGermplasmDbIdCounts()
      this.updateBrapiTraitDbIdCounts()
    }
  },
  mounted: function () {
    this.update()

    emitter.on('trial-data-loaded', this.update)
    emitter.on('brapi-settings-changed', this.updatePrograms)
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.update)
    emitter.off('brapi-settings-changed', this.updatePrograms)
  }
}
</script>

<style>

</style>
