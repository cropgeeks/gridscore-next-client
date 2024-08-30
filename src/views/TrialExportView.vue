<template>
  <b-container class="mt-4">
    <UseOnline v-slot="{ isOnline }">
      <h1 class="display-4">{{ $t('pageExportTitle') }}</h1>
      <p>{{ $t('pageExportText') }}</p>

      <b-tabs lazy v-if="trial">
        <b-tab>
          <template #title>
            <IBiFileEarmarkSpreadsheet /> {{ $t('pageExportTabTitleTab') }}
          </template>

          <p class="mt-3" v-html="$t('pageExportTrialFormatTab')" />

          <b-row>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialFormatTabDataCardTitle')" :subtitle="$t('pageExportTrialFormatTabDataCardSubtitle')">
                <b-form-group :label="$t('formLabelExportTrialFormatGerminateAggregate')" :description="$t('formDescriptionExportTrialFormatGerminateAggregate')" label-for="aggregate">
                  <b-form-checkbox id="aggregate" v-model="tabAggregate" switch>
                    {{ tabAggregate ? $t('genericYes') : $t('genericNo') }}
                  </b-form-checkbox>
                </b-form-group>

                <b-button @click="exportDataTab" variant="primary"><IBiFileEarmarkSpreadsheet /> {{ $t('buttonExport') }}</b-button>
              </b-card>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <template #title>
            <IBiTags /> {{ $t('pageExportTabTitleTraits') }}
          </template>

          <p class="mt-3" v-html="$t('pageExportTrialTraits')" />

          <b-row>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialTraitsGerminateCardTitle')" :subtitle="$t('pageExportTrialTraitsGerminateCardSubtitle')">
                <b-button @click="exportTraitsGerminate" variant="primary">
                  <IconGerminate /> {{ $t('buttonExport') }}
                </b-button>
              </b-card>
            </b-col>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialTraitsGridScoreCardTitle')" :subtitle="$t('pageExportTrialTraitsGridScoreCardSubtitle')">
                <b-button @click="exportTraitsGridScore" variant="primary">
                  <IconGridScore /> {{ $t('buttonExport') }}
                </b-button>
              </b-card>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <template #title>
            <IBiChatRightQuoteFill /> {{ $t('pageExportTabTitleComments') }}
          </template>

          <p class="mt-3" v-html="$t('pageExportTrialFormatComment')" />

          <b-row>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialFormatCommentTrialCardTitle')" :subtitle="$t('pageExportTrialFormatCommentTrialCardSubtitle')">
                <b-card-text :class="trialCommentCount < 1 ? 'text-danger' : null">{{ $t('pageExportTrialFormatCommentTrialCount', trialCommentCount) }}</b-card-text>

                <b-button @click="exportTrialComments" variant="primary" :disabled="trialCommentCount < 1">
                  <IBiChatRightText /> {{ $t('buttonExport') }}
                </b-button>
              </b-card>
            </b-col>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialFormatCommentPlotCardTitle')" :subtitle="$t('pageExportTrialFormatCommentPlotCardSubtitle')">
                <b-card-text :class="plotCommentCount < 1 ? 'text-danger' : null">{{ $t('pageExportTrialFormatCommentPlotCount', plotCommentCount) }}</b-card-text>

                <b-button @click="exportPlotComments" variant="primary" :disabled="plotCommentCount < 1">
                  <IBiChatRightText /> {{ $t('buttonExport') }}
                </b-button>
              </b-card>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <template #title>
            <IBiFlag /> {{ $t('pageExportTabTitleEvents') }}
          </template>

          <p class="mt-3" v-html="$t('pageExportTrialFormatEvent')" />

          <b-card class="mb-3" :title="$t('pageExportTrialFormatEventTrialCardTitle')" :subtitle="$t('pageExportTrialFormatEventTrialCardSubtitle')">
            <b-card-text :class="trialEventCount < 1 ? 'text-danger' : null">{{ $t('pageExportTrialFormatEventTrialCount', trialEventCount) }}</b-card-text>

            <b-button @click="exportTrialEvents" variant="primary" :disabled="trialEventCount < 1">
              <IBiFlag /> {{ $t('buttonExport') }}
            </b-button>
          </b-card>
        </b-tab>
        <b-tab>
          <template #title>
            <IconGerminate /> Germinate
          </template>
          <div v-if="isOnline === false" class="modal-banner bg-danger text-white text-center mb-3 mt-0 p-2">
            {{ $t('modalTextNetworkUnavailableWarning') }}
          </div>

          <p class="mt-3" v-html="$t('pageExportTrialFormatGerminate')" />

          <b-row>
            <b-col cols=12 md=6>
              <b-card class="mb-3" :title="$t('pageExportTrialFormatGerminateDataCardTitle')" :subtitle="$t('pageExportTrialFormatGerminateDataCardSubtitle')">
                <b-form-group :label="$t('formLabelExportTrialFormatGerminateAggregate')" :description="$t('formDescriptionExportTrialFormatGerminateAggregate')" label-for="aggregate">
                  <b-form-checkbox id="aggregate" v-model="germinateAggregate" switch>
                    {{ germinateAggregate ? $t('genericYes') : $t('genericNo') }}
                  </b-form-checkbox>
                </b-form-group>

                <b-button :disabled="isOnline === false" :href="exportedFiles.germinate" @click="exportedFiles.germinate = null" variant="success" v-if="exportedFiles.germinate"><IBiDownload /> {{ $t('buttonDownload') }}</b-button>
                <b-button :disabled="isOnline === false" @click="exportDataGerminate" variant="primary" v-else><IBiFileEarmarkSpreadsheet /> {{ $t('buttonExport') }}</b-button>
              </b-card>
            </b-col>
            <b-col cols=12 md=6 v-if="trial.layout && trial.layout.corners">
              <b-card class="mb-3" :title="$t('pageExportTrialFormatGerminateShapeCardTitle')" :subtitle="$t('pageExportTrialFormatGerminateShapeCardSubtitle')">
                <b-button :disabled="isOnline === false" :href="exportedFiles.shapefile" @click="exportedFiles.shapefile = null" variant="success" v-if="exportedFiles.shapefile"><IBiDownload /> {{ $t('buttonDownload') }}</b-button>
                <b-button :disabled="isOnline === false" @click="exportShapefileGerminate" variant="primary" v-else><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid-3x2-gap" viewBox="0 0 16 16">
                  <path d="M4 4v2H2V4zm1 7V9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m5 5V9a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1m0-5V4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1M9 4v2H7V4zm5 0h-2v2h2zM4 9v2H2V9zm5 0v2H7V9zm5 0v2h-2V9zm-3-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm1 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"/>
                </svg> {{ $t('buttonExport') }}</b-button>
              </b-card>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <template #title>
            <IconBrapi /> Breeding API
          </template>

          <BrapiExportSection :trial="trial" />
        </b-tab>
      </b-tabs>

      <TrialSynchronizationModal :trial="trial" ref="traitSyncModal" v-if="trial && trial.transactionCount > 0" />
    </UseOnline>
  </b-container>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialById } from '@/plugins/idb'
import { getTrialDataCached } from '@/plugins/datastore'
import { exportToGerminate, exportToShapefile, shareTrial } from '@/plugins/api'
import IconGerminate from '@/components/icons/IconGerminate.vue'
import IconBrapi from '@/components/icons/IconBrapi.vue'
import IconGridScore from '@/components/icons/IconGridScore.vue'
import TrialSynchronizationModal from '@/components/modals/TrialSynchronizationModal.vue'
import { downloadText, toLocalDateString, trialsDataToMatrix } from '@/plugins/misc'
import { TRIAL_EVENT_TYPE_MANAGEMENT, TRIAL_EVENT_TYPE_OTHER, TRIAL_EVENT_TYPE_WEATHER } from '@/plugins/constants'
import BrapiExportSection from '@/components/BrapiExportSection.vue'
import { UseOnline } from '@vueuse/components'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    BrapiExportSection,
    IconGerminate,
    IconBrapi,
    IconGridScore,
    TrialSynchronizationModal,
    UseOnline
  },
  data: function () {
    return {
      trial: null,
      exportedFiles: {
        germinate: null,
        shapefile: null
      },
      germinateAggregate: true,
      tabAggregate: true,
      plotCommentCount: 0
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial',
      'storeServerUrl'
    ]),
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    trialCommentCount: function () {
      if (this.trial) {
        return this.trial.comments ? this.trial.comments.length : 0
      } else {
        return 0
      }
    },
    trialEventCount: function () {
      if (this.trial) {
        return this.trial.events ? this.trial.events.length : 0
      } else {
        return 0
      }
    }
  },
  methods: {
    exportTrialComments: function () {
      let result = 'Date\tComment'

      this.trial.comments.forEach(c => {
        result += `\n${toLocalDateString(new Date(c.timestamp))}\t${c.content}`
      })

      downloadText(result, `gridscore-trial-comments-${this.safeTrialName}.txt`)
    },
    exportTrialEvents: function () {
      let result = 'Date\tEvent\tType\tImpact'

      this.trial.events.forEach(c => {
        let typeString
        switch (c.type) {
          case TRIAL_EVENT_TYPE_MANAGEMENT:
            typeString = this.$t('formSelectOptionEventTypeManagement')
            break
          case TRIAL_EVENT_TYPE_WEATHER:
            typeString = this.$t('formSelectOptionEventTypeWeather')
            break
          case TRIAL_EVENT_TYPE_OTHER:
            typeString = this.$t('formSelectOptionEventTypeOther')
            break
        }
        result += `\n${toLocalDateString(new Date(c.timestamp))}\t${c.content}\t${typeString}\t${c.impact}`
      })

      downloadText(result, `gridscore-trial-events-${this.safeTrialName}.txt`)
    },
    exportPlotComments: function () {
      let result = 'Germplasm\tRep\tRow\tColumn\tDate\tComment'

      Object.values(this.trialData).forEach(c => {
        if (c && c.comments && c.comments.length > 0) {
          const row = c.displayRow
          const column = c.displayColumn
          c.comments.forEach(cm => {
            result += `\n${c.germplasm}\t${c.rep || ''}\t${row}\t${column}\t${toLocalDateString(new Date(cm.timestamp))}\t${cm.content}`
          })
        }
      })

      downloadText(result, `gridscore-plot-comments-${this.safeTrialName}.txt`)
    },
    exportShapefileGerminate: function () {
      this.exportedFiles.shapefile = null

      let shareCode = null
      if (this.trial.shareCodes) {
        shareCode = Object.values(this.trial.shareCodes).find(c => c !== undefined && c !== null)
      }

      if (shareCode) {
        if (this.trial.transactionCount > 0) {
          emitter.emit('show-confirm', {
            title: 'modalTitleExportSynchronization',
            message: 'modalTextExportSynchronization',
            okTitle: 'buttonYes',
            cancelTitle: 'buttonNo',
            cancelVariant: 'primary',
            okVariant: 'primary',
            callback: (value) => {
              if (value) {
                this.$refs.traitSyncModal.show()
              } else {
                emitter.emit('show-loading', true)
                exportToShapefile((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, shareCode)
                  .then(uuid => {
                    this.exportedFiles.shapefile = `${this.storeServerUrl}trial/${shareCode}/export/shapefile/${uuid}`
                    emitter.emit('show-loading', false)
                  })
                  .catch(this.errorHandler)
              }
            }
          })
        } else {
          emitter.emit('show-loading', true)
          exportToShapefile((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, shareCode)
            .then(uuid => {
              this.exportedFiles.shapefile = `${this.storeServerUrl}trial/${shareCode}/export/shapefile/${uuid}`
              emitter.emit('show-loading', false)
            })
            .catch(this.errorHandler)
        }
      } else {
        emitter.emit('show-loading', true)
        shareTrial((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, this.trial.localId)
          .then(() => {
            return getTrialById(this.trial.localId)
          })
          .then((trial) => {
            this.trial = trial
            this.exportShapefileGerminate()
          })
          .catch(this.errorHandler)
      }
    },
    toGerminateDataType: function (type) {
      switch (type) {
        case 'int':
        case 'float':
        case 'range':
          return 'numeric'
        case 'gps':
        case 'image':
          return 'text'
        default:
          return type
      }
    },
    exportTraitsGerminate: function () {
      if (this.trial.traits && this.trial.traits.length > 0) {
        let text = 'Name\tShort Name\tDescription\tData Type\tUnit Name\tUnit Abbreviation\tUnit Descriptions\tTrait categories (comma separated)\tMin (only for numeric traits)\tMax (only for numeric traits)'

        this.trial.traits.forEach(t => {
          text += `\n${t.name}\t\t${t.description || ''}\t${this.toGerminateDataType(t.dataType)}\t\t\t\t${(t.restrictions && t.restrictions.categories) ? ('[[' + t.restrictions.categories.join(',') + ']]') : ''}\t${(t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''}\t${(t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''}`
        })

        downloadText(text, `germinate-traits-${this.safeTrialName}.txt`)
      }
    },
    exportTraitsGridScore: function () {
      if (this.trial.traits && this.trial.traits.length > 0) {
        const copy = JSON.parse(JSON.stringify(this.trial.traits))
        copy.forEach(t => {
          delete t.id
          delete t.progress
          delete t.editable
          delete t.color
        })
        const text = JSON.stringify(copy, null, 2)

        downloadText(text, `gridscore-traits-${this.safeTrialName}.txt`)
      }
    },
    exportDataTab: function () {
      emitter.emit('show-loading', true)

      const data = getTrialDataCached()
      // Header row
      const result = trialsDataToMatrix(data, this.trial, this.tabAggregate)

      downloadText(result, `gridscore-data-${this.safeTrialName}.txt`)

      emitter.emit('show-loading', false)
    },
    errorHandler: function (err) {
      console.log(err)
      if (err && err.status === 404) {
        // Handle missing trials
        emitter.emit('show-missing-trial', this.trial)
      }
      emitter.emit('show-loading', false)
    },
    exportDataGerminate: function () {
      this.exportedFiles.germinate = null

      let shareCode = null
      if (this.trial.shareCodes) {
        shareCode = Object.values(this.trial.shareCodes).find(c => c !== undefined && c !== null)
      }

      if (shareCode) {
        if (this.trial.transactionCount > 0) {
          emitter.emit('show-confirm', {
            title: 'modalTitleExportSynchronization',
            message: 'modalTextExportSynchronization',
            okTitle: 'buttonYes',
            cancelTitle: 'buttonNo',
            cancelVariant: 'primary',
            okVariant: 'primary',
            callback: (value) => {
              if (value) {
                this.$refs.traitSyncModal.show()
              } else {
                emitter.emit('show-loading', true)
                exportToGerminate((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, shareCode, this.germinateAggregate)
                  .then(uuid => {
                    this.exportedFiles.germinate = `${this.storeServerUrl}trial/${shareCode}/export/g8/${uuid}`
                    emitter.emit('show-loading', false)
                  })
                  .catch(this.errorHandler)
              }
            }
          })
        } else {
          emitter.emit('show-loading', true)
          exportToGerminate((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, shareCode, this.germinateAggregate)
            .then(uuid => {
              this.exportedFiles.germinate = `${this.storeServerUrl}trial/${shareCode}/export/g8/${uuid}`
              emitter.emit('show-loading', false)
            })
            .catch(this.errorHandler)
        }
      } else {
        emitter.emit('show-loading', true)
        shareTrial((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, this.trial.localId)
          .then(() => {
            return getTrialById(this.trial.localId)
          })
          .then((trial) => {
            this.trial = trial
            this.exportDataGerminate()
          })
          .catch(this.errorHandler)
      }
    },
    update: function () {
      // TODO
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial

          this.trialData = getTrialDataCached()
          let plotCommentCount = 0
          if (this.trialData) {
            Object.values(this.trialData).forEach(c => {
              if (c.comments) {
                plotCommentCount += c.comments.length
              }
            })
          }
          this.plotCommentCount = plotCommentCount

          if (this.trial) {
            this.$nextTick(() => this.update())
          }
        })
    }
  },
  mounted: function () {
    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style>

</style>
