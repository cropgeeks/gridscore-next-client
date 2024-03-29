<template>
  <b-container class="mt-4">
    <h1 class="display-4">{{ $t('pageExportTitle') }}</h1>
    <p>{{ $t('pageExportText') }}</p>

    <b-tabs lazy v-if="trial">
      <b-tab>
        <template #title>
          <BIconFileEarmarkSpreadsheet /> {{ $t('pageExportTabTitleTab') }}
        </template>

        <p class="mt-3" v-html="$t('pageExportTrialFormatTab')" />

        <b-row>
          <b-col cols=12 md=6>
            <b-card class="mb-3" :title="$t('pageExportTrialFormatTabDataCardTitle')" :sub-title="$t('pageExportTrialFormatTabDataCardSubtitle')">
              <b-form-group :label="$t('formLabelExportTrialFormatGerminateAggregate')" :description="$t('formDescriptionExportTrialFormatGerminateAggregate')" label-for="aggregate">
                <b-form-checkbox id="aggregate" v-model="tabAggregate" switch>
                  {{ tabAggregate ? $t('genericYes') : $t('genericNo') }}
                </b-form-checkbox>
              </b-form-group>

              <b-button @click="exportDataTab" variant="primary"><BIconFileEarmarkSpreadsheet /> {{ $t('buttonExport') }}</b-button>
            </b-card>
          </b-col>
        </b-row>
      </b-tab>
      <b-tab>
        <template #title>
          <BIconChatRightQuoteFill /> {{ $t('pageExportTabTitleComments') }}
        </template>

        <p class="mt-3" v-html="$t('pageExportTrialFormatComment')" />

        <b-row>
          <b-col cols=12 md=6>
            <b-card class="mb-3" :title="$t('pageExportTrialFormatCommentTrialCardTitle')" :sub-title="$t('pageExportTrialFormatCommentTrialCardSubtitle')">
              <b-card-text :class="trialCommentCount < 1 ? 'text-danger' : null">{{ $tc('pageExportTrialFormatCommentTrialCount', trialCommentCount) }}</b-card-text>

              <b-button @click="exportTrialComments" variant="primary" :disabled="trialCommentCount < 1">
                <BIconstack>
                  <BIconChatRight stacked /><BIconArrowDown stacked :scale="0.5" :shift-v="2" />
                </BIconstack> {{ $t('buttonExport') }}
              </b-button>
            </b-card>
          </b-col>
          <b-col cols=12 md=6>
            <b-card class="mb-3" :title="$t('pageExportTrialFormatCommentPlotCardTitle')" :sub-title="$t('pageExportTrialFormatCommentPlotCardSubtitle')">
              <b-card-text :class="plotCommentCount < 1 ? 'text-danger' : null">{{ $tc('pageExportTrialFormatCommentPlotCount', plotCommentCount) }}</b-card-text>

              <b-button @click="exportPlotComments" variant="primary" :disabled="plotCommentCount < 1">
                <BIconstack>
                  <BIconChatRight stacked /><BIconArrowDown stacked :scale="0.5" :shift-v="2" />
                </BIconstack> {{ $t('buttonExport') }}
              </b-button>
            </b-card>
          </b-col>
        </b-row>
      </b-tab>
      <b-tab>
        <template #title>
          <BIconFlag /> {{ $t('pageExportTabTitleEvents') }}
        </template>

        <p class="mt-3" v-html="$t('pageExportTrialFormatEvent')" />

        <b-card class="mb-3" :title="$t('pageExportTrialFormatEventTrialCardTitle')" :sub-title="$t('pageExportTrialFormatEventTrialCardSubtitle')">
          <b-card-text :class="trialEventCount < 1 ? 'text-danger' : null">{{ $tc('pageExportTrialFormatEventTrialCount', trialEventCount) }}</b-card-text>

          <b-button @click="exportTrialEvents" variant="primary" :disabled="trialEventCount < 1">
            <BIconstack>
              <BIconFlag stacked /><BIconArrowDown stacked :scale="0.5" :shift-v="-5" />
            </BIconstack> {{ $t('buttonExport') }}
          </b-button>
        </b-card>
      </b-tab>
      <b-tab>
        <template #title>
          <IconGerminate /> Germinate
        </template>
        <div v-if="storeIsOffline" class="modal-banner bg-danger text-white text-center mb-3 mt-0 p-2">
          {{ $t('modalTextNetworkUnavailableWarning') }}
        </div>

        <p class="mt-3" v-html="$t('pageExportTrialFormatGerminate')" />

        <b-row>
          <b-col cols=12 md=6>
            <b-card class="mb-3" :title="$t('pageExportTrialFormatGerminateDataCardTitle')" :sub-title="$t('pageExportTrialFormatGerminateDataCardSubtitle')">
              <b-form-group :label="$t('formLabelExportTrialFormatGerminateAggregate')" :description="$t('formDescriptionExportTrialFormatGerminateAggregate')" label-for="aggregate">
                <b-form-checkbox id="aggregate" v-model="germinateAggregate" switch>
                  {{ germinateAggregate ? $t('genericYes') : $t('genericNo') }}
                </b-form-checkbox>
              </b-form-group>

              <b-button :disabled="storeIsOffline" :href="exportedFiles.germinate" @click="exportedFiles.germinate = null" variant="success" v-if="exportedFiles.germinate"><BIconDownload /> {{ $t('buttonDownload') }}</b-button>
              <b-button :disabled="storeIsOffline" @click="exportDataGerminate" variant="primary" v-else><BIconFileEarmarkSpreadsheet /> {{ $t('buttonExport') }}</b-button>
            </b-card>
          </b-col>
          <b-col cols=12 md=6 v-if="trial.layout && trial.layout.corners">
            <b-card class="mb-3" :title="$t('pageExportTrialFormatGerminateShapeCardTitle')" :sub-title="$t('pageExportTrialFormatGerminateShapeCardSubtitle')">
              <b-button :disabled="storeIsOffline" :href="exportedFiles.shapefile" @click="exportedFiles.shapefile = null" variant="success" v-if="exportedFiles.shapefile"><BIconDownload /> {{ $t('buttonDownload') }}</b-button>
              <b-button :disabled="storeIsOffline" @click="exportShapefileGerminate" variant="primary" v-else><BIconGrid3x2Gap /> {{ $t('buttonExport') }}</b-button>
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
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTrialById } from '@/plugins/idb'
import { getTrialDataCached } from '@/plugins/datastore'
import { exportToGerminate, exportToShapefile, shareTrial } from '@/plugins/api'
import IconGerminate from '@/components/icons/IconGerminate'
import IconBrapi from '@/components/icons/IconBrapi'
import TrialSynchronizationModal from '@/components/modals/TrialSynchronizationModal'
import { BIconGrid3x2Gap, BIconFileEarmarkSpreadsheet, BIconDownload, BIconFlag, BIconChatRightQuoteFill, BIconstack, BIconChatRight, BIconArrowDown } from 'bootstrap-vue'
import { downloadText, toLocalDateString, trialsDataToMatrix } from '@/plugins/misc'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM, TRIAL_EVENT_TYPE_MANAGEMENT, TRIAL_EVENT_TYPE_OTHER, TRIAL_EVENT_TYPE_WEATHER } from '@/plugins/constants'
import BrapiExportSection from '@/components/BrapiExportSection'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconGrid3x2Gap,
    BIconFileEarmarkSpreadsheet,
    BIconDownload,
    BIconChatRightQuoteFill,
    BIconstack,
    BIconFlag,
    BIconChatRight,
    BIconArrowDown,
    BrapiExportSection,
    IconGerminate,
    IconBrapi,
    TrialSynchronizationModal
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
    ...mapGetters([
      'storeSelectedTrial',
      'storeServerUrl',
      'storeIsOffline'
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
          const row = this.trial.layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM ? (c.row + 1) : (this.trial.layout.rows - c.row)
          const column = this.trial.layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT ? (c.column + 1) : (this.trial.layout.columns - c.column)
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
          this.$bvModal.msgBoxConfirm(this.$t('modalTextExportSynchronization'), {
            title: this.$t('modalTitleExportSynchronization'),
            okTitle: this.$t('buttonYes'),
            okVariant: 'primary',
            cancelVariant: 'primary',
            cancelTitle: this.$t('buttonNo')
          })
            .then(value => {
              if (value) {
                this.$refs.traitSyncModal.show()
              } else {
                emitter.emit('show-loading', true)
                exportToShapefile(shareCode)
                  .then(uuid => {
                    this.exportedFiles.shapefile = `${this.storeServerUrl}trial/${shareCode}/export/shapefile/${uuid}`
                    emitter.emit('show-loading', false)
                  })
                  .catch(this.errorHandler)
              }
            })
        } else {
          emitter.emit('show-loading', true)
          exportToShapefile(shareCode)
            .then(uuid => {
              this.exportedFiles.shapefile = `${this.storeServerUrl}trial/${shareCode}/export/shapefile/${uuid}`
              emitter.emit('show-loading', false)
            })
            .catch(this.errorHandler)
        }
      } else {
        emitter.emit('show-loading', true)
        shareTrial(this.trial.localId)
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
          this.$bvModal.msgBoxConfirm(this.$t('modalTextExportSynchronization'), {
            title: this.$t('modalTitleExportSynchronization'),
            okTitle: this.$t('buttonYes'),
            okVariant: 'primary',
            cancelVariant: 'primary',
            cancelTitle: this.$t('buttonNo')
          })
            .then(value => {
              if (value) {
                this.$refs.traitSyncModal.show()
              } else {
                emitter.emit('show-loading', true)
                exportToGerminate(shareCode, this.germinateAggregate)
                  .then(uuid => {
                    this.exportedFiles.germinate = `${this.storeServerUrl}trial/${shareCode}/export/g8/${uuid}`
                    emitter.emit('show-loading', false)
                  })
                  .catch(this.errorHandler)
              }
            })
        } else {
          emitter.emit('show-loading', true)
          exportToGerminate(shareCode, this.germinateAggregate)
            .then(uuid => {
              this.exportedFiles.germinate = `${this.storeServerUrl}trial/${shareCode}/export/g8/${uuid}`
              emitter.emit('show-loading', false)
            })
            .catch(this.errorHandler)
        }
      } else {
        emitter.emit('show-loading', true)
        shareTrial(this.trial.localId)
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
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style>

</style>
