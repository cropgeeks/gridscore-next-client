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
              <b-button @click="exportDataTab" variant="primary"><BIconFileEarmarkSpreadsheet /> {{ $t('buttonExport') }}</b-button>
            </b-card>
          </b-col>
        </b-row>
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
import { BIconGrid3x2Gap, BIconFileEarmarkSpreadsheet, BIconDownload } from 'bootstrap-vue'
import { downloadText } from '@/plugins/misc'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'
import BrapiExportSection from '@/components/BrapiExportSection'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconGrid3x2Gap,
    BIconFileEarmarkSpreadsheet,
    BIconDownload,
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
      }
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeServerUrl',
      'storeIsOffline'
    ])
  },
  methods: {
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
      let result = `Line/Trait\tRep\tRow\tColumn\tDate\t${this.trial.traits.map(t => t.name).join('\t')}\tLatitude\tLongitude`

      Object.values(data).forEach(v => {
        if (v.measurements) {
          const row = this.trial.layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM ? (v.row + 1) : (this.trial.layout.rows - v.row)
          const column = this.trial.layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT ? (v.column + 1) : (this.trial.layout.columns - v.column)
          const germplasmMeta = `${v.germplasm}\t${v.rep || ''}\t${row}\t${column}`

          const dates = new Set()
          Object.values(v.measurements).forEach(td => {
            td.forEach(dp => dates.add(dp.timestamp.split('T')[0]))
          })

          const dateArray = [...dates].sort((a, b) => a.localeCompare(b))

          dateArray.forEach(date => {
            result += `\n${germplasmMeta}\t${date}`

            this.trial.traits.forEach(t => {
              const td = v.measurements[t.id]

              if (td) {
                const onDate = v.measurements[t.id].filter(dp => dp.timestamp.split('T')[0] === date).reduce((a, b) => a.concat(b.values), []).filter(v => v !== undefined && v !== null)

                if (onDate.length > 0) {
                  if (t.dataType === 'float' || t.dataType === 'int') {
                    result += `\t${onDate.reduce((acc, val) => acc + (+val), 0) / onDate.length}`
                  } else if (t.dataType === 'categorical') {
                    result += `\t${t.restrictions.categories[onDate[onDate.length - 1]]}`
                  } else {
                    result += `\t${onDate[onDate.length - 1]}`
                  }
                } else {
                  result += '\t'
                }
              } else {
                result += '\t'
              }
            })

            if (v.geography) {
              if (v.geography.center) {
                result += `\t${v.geography.center.lat || ''}\t${v.geography.center.lng || ''}`
              } else if (v.geography.corners) {
                let latverage = 0
                let lngverage = 0
                let count = 0

                if (v.geography.corners.topLeft) {
                  latverage += v.geography.corners.topLeft.lat || 0
                  lngverage += v.geography.corners.topLeft.lng || 0
                  count++
                }
                if (v.geography.corners.topRight) {
                  latverage += v.geography.corners.topRight.lat || 0
                  lngverage += v.geography.corners.topRight.lng || 0
                  count++
                }
                if (v.geography.corners.bottomLeft) {
                  latverage += v.geography.corners.bottomLeft.lat || 0
                  lngverage += v.geography.corners.bottomLeft.lng || 0
                  count++
                }
                if (v.geography.corners.bottomRight) {
                  latverage += v.geography.corners.bottomRight.lat || 0
                  lngverage += v.geography.corners.bottomRight.lng || 0
                  count++
                }

                if (count) {
                  result += `\t${latverage / count}\t${lngverage / count}`
                } else {
                  result += '\t\t'
                }
              } else {
                result += '\t\t'
              }
            }
          })
        }
      })

      const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result)

      downloadText(href, 'gridscore.txt')

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
                exportToGerminate(shareCode)
                  .then(uuid => {
                    this.exportedFiles.germinate = `${this.storeServerUrl}trial/${shareCode}/export/g8/${uuid}`
                    emitter.emit('show-loading', false)
                  })
                  .catch(this.errorHandler)
              }
            })
        } else {
          emitter.emit('show-loading', true)
          exportToGerminate(shareCode)
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
