<template>
  <v-container v-if="trial">
    <UseOnline v-slot="{ isOnline }">
      <v-tabs
        color="primary"
        bg-color="surface"
        v-model="tab"
        center-active
        grow
      >
        <v-tab value="tab" :prepend-icon="mdiFileTable" :text="$t('pageExportTabTitleTab')" />
        <v-tab value="layout" :prepend-icon="mdiLandFields" :text="$t('pageExportTabTitleLayout')" />
        <v-tab value="traits" :prepend-icon="mdiTagMultiple" :text="$t('pageExportTabTitleTraits')" />
        <v-tab value="comments" :prepend-icon="mdiCommentMultiple" :text="$t('pageExportTabTitleComments')" />
        <v-tab value="events" :prepend-icon="mdiFlag" :text="$t('pageExportTabTitleEvents')" />
        <v-tab value="germinate" prepend-icon="$germinate">Germinate</v-tab>
        <v-tab value="brapi" prepend-icon="$brapi">Breeding API</v-tab>
      </v-tabs>

      <v-divider />

      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="tab">
          <v-sheet class="pa-5">
            <p class="mt-3" v-html="$t('pageExportTrialFormatTab')" />

            <v-row>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatTabWideDataCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatTabWideDataCardSubtitle') }}</span>
                  </template>

                  <template #text>
                    <v-switch
                      v-model="tabConfig.aggregate"
                      :label="$t('formLabelExportTrialFormatGerminateAggregate')"
                      :hint="$t('formDescriptionExportTrialFormatGerminateAggregate')"
                      persistent-hint
                      color="primary"
                    />
                  </template>

                  <template #actions>
                    <v-btn @click="exportTabData('wide')" color="primary" variant="tonal" :prepend-icon="mdiFileTable" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatTabLongDataCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatTabLongDataCardSubtitle') }}</span>
                  </template>

                  <template #text>
                    <v-switch
                      v-model="tabConfig.aggregate"
                      :label="$t('formLabelExportTrialFormatGerminateAggregate')"
                      :hint="$t('formDescriptionExportTrialFormatGerminateAggregate')"
                      persistent-hint
                      color="primary"
                    />

                    <v-switch
                      v-model="tabConfig.includePeople"
                      :label="$t('formLabelExportTrialFormatTabLongIncludePeople')"
                      :hint="$t('formDescriptionExportTrialFormatTabLongIncludePeople')"
                      persistent-hint
                      :disabled="tabConfig.aggregate"
                      color="primary"
                    />

                    <v-switch
                      v-model="tabConfig.useTimestamps"
                      :label="$t('formLabelExportTrialFormatTabLongUseTimestamps')"
                      :hint="$t('formDescriptionExportTrialFormatTabLongUseTimestamps')"
                      persistent-hint
                      :disabled="tabConfig.aggregate"
                      color="primary"
                    />
                  </template>

                  <template #actions>
                    <v-btn @click="exportTabData('long')" color="primary" variant="tonal" :prepend-icon="mdiFileTable" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="layout">
          <v-sheet class="pa-5">
            <p class="mt-3" v-html="$t('pageExportTrialFormatLayout')" />

            <v-card :title="$t('pageExportTrialFormatLayoutTrialCardTitle')">
              <template #subtitle><span class="text-wrap">{{ $t('pageExportTrialFormatLayoutTrialCardSubtitle') }}</span></template>
              <template #text>
                <div class="d-flex flex-wrap">
                  <v-list-item slim :prepend-icon="mdiLandRowsHorizontal" :title="$t('widgetTrialSelectorRows')">
                    <template #append><v-chip class="ms-3" size="small">{{ getNumberWithSuffix(trial.layout.rows, 1) }}</v-chip></template>
                  </v-list-item>
                  <v-list-item slim :prepend-icon="mdiLandRowsVertical" :title="$t('widgetTrialSelectorColumns')">
                    <template #append><v-chip class="ms-3" size="small">{{ getNumberWithSuffix(trial.layout.columns, 1) }}</v-chip></template>
                  </v-list-item>
                  <v-list-item slim :prepend-icon="mdiSprout" :title="$t('widgetTrialSelectorGermplasm')">
                    <template #append><v-chip class="ms-3" size="small">{{ getNumberWithSuffix(Object.keys(trialData || {}).length, 1) }}</v-chip></template>
                  </v-list-item>
                </div>
              </template>
              <template #actions>
                <v-btn @click="exportTrialLayoutLocal" color="primary" variant="tonal" :prepend-icon="mdiLandFields" :text="$t('buttonExport')" />
              </template>
            </v-card>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="traits">
          <v-sheet class="pa-5">
            <p class="mt-3" v-html="$t('pageExportTrialTraits')" />

            <v-row>
              <v-col cols="12" md="6" xl="4">
                <v-card :title="$t('pageExportTrialTraitsGerminateCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialTraitsGerminateCardSubtitle') }}</span>
                  </template>

                  <template #actions>
                    <v-btn @click="exportTraitsGerminate" color="primary" variant="tonal" prepend-icon="$germinate" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" xl="4">
                <v-card :title="$t('pageExportTrialTraitsGridScoreCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialTraitsGridScoreCardSubtitle') }}</span>
                  </template>

                  <template #actions>
                    <v-btn @click="exportTraitsGridScore" color="primary" variant="tonal" prepend-icon="$gridscore" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" xl="4">
                <v-card :title="$t('pageExportTrialTraitsTabularCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialTraitsTabularCardSubtitle') }}</span>
                  </template>

                  <template #actions>
                    <v-btn @click="exportTraitsTabular" color="primary" variant="tonal" :prepend-icon="mdiFileTable" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="comments">
          <v-sheet class="pa-5">
            <p class="mt-3" v-html="$t('pageExportTrialFormatComment')" />

            <v-row>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatCommentTrialCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatCommentTrialCardSubtitle') }}</span>
                  </template>

                  <template #text>
                    <p :class="trialCommentCount === 0 ? 'text-error' : undefined">{{ $t('pageExportTrialFormatCommentTrialCount', trialCommentCount) }}</p>
                  </template>

                  <template #actions>
                    <v-btn @click="exportTrialCommentsLocal" color="primary" :disabled="trialCommentCount === 0" variant="tonal" :prepend-icon="mdiCommentMultiple" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatCommentPlotCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatCommentPlotCardSubtitle') }}</span>
                  </template>

                  <template #text>
                    <p :class="plotCommentCount === 0 ? 'text-error' : undefined">{{ $t('pageExportTrialFormatCommentPlotCount', plotCommentCount) }}</p>
                  </template>

                  <template #actions>
                    <v-btn @click="exportPlotCommentsLocal" color="primary" :disabled="plotCommentCount === 0" variant="tonal" :prepend-icon="mdiCommentMultiple" :text="$t('buttonExport')" />
                  </template>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="events">
          <v-sheet class="pa-5">
            <p class="mt-3" v-html="$t('pageExportTrialFormatEvent')" />

            <v-card :title="$t('pageExportTrialFormatEventTrialCardTitle')">
              <template #subtitle>
                <span class="text-wrap">{{ $t('pageExportTrialFormatEventTrialCardSubtitle') }}</span>
              </template>

              <template #text>
                <p :class="trialEventCount === 0 ? 'text-error' : undefined">{{ $t('pageExportTrialFormatEventTrialCount', trialEventCount) }}</p>
              </template>

              <template #actions>
                <v-btn @click="exportTrialEventsLocal" color="primary" :disabled="trialEventCount === 0" variant="tonal" :prepend-icon="mdiFlag" :text="$t('buttonExport')" />
              </template>
            </v-card>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="germinate">
          <v-sheet class="pa-5">
            <v-alert
              v-if="isOnline === false"
              color="error"
              :icon="mdiLanDisconnect"
              density="compact"
              :text="$t('modalTextNetworkUnavailableWarning')"
              variant="tonal"
              border="start"
            />

            <p class="mt-3" v-html="$t('pageExportTrialFormatGerminate')" />

            <v-row>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatGerminateDataCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatGerminateDataCardSubtitle') }}</span>
                  </template>

                  <template #text>
                    <v-switch
                      v-model="germinateAggregate"
                      :label="$t('formLabelExportTrialFormatGerminateAggregate')"
                      :hint="$t('formDescriptionExportTrialFormatGerminateAggregate')"
                      persistent-hint
                      color="primary"
                    />
                  </template>

                  <template #actions>
                    <v-btn @click="exportDataGerminate" color="primary" :disabled="!isOnline || germinateFile !== undefined" variant="tonal" prepend-icon="$germinate" :text="$t('buttonExport')" />
                    <template v-if="germinateFile !== undefined">
                      <v-spacer />
                      <v-btn :href="germinateFile" @click="germinateFile = undefined" color="success" :disabled="!isOnline" variant="tonal" :prepend-icon="mdiDownload" :text="$t('buttonDownload')" />
                    </template>
                  </template>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card :title="$t('pageExportTrialFormatGerminateShapeCardTitle')">
                  <template #subtitle>
                    <span class="text-wrap">{{ $t('pageExportTrialFormatGerminateShapeCardSubtitle') }}</span>
                  </template>

                  <template #actions>
                    <v-btn @click="exportShapefileGerminate" color="primary" :disabled="!isOnline || shapeFile !== undefined" variant="tonal" prepend-icon="$germinate" :text="$t('buttonExport')" />
                    <template v-if="shapeFile !== undefined">
                      <v-spacer />
                      <v-btn :href="shapeFile" @click="shapeFile = undefined" color="success" :disabled="!isOnline" variant="tonal" :prepend-icon="mdiDownload" :text="$t('buttonDownload')" />
                    </template>
                  </template>
                </v-card>
              </v-col>
            </v-row>

            <v-alert class="mt-3" color="error" variant="tonal" :icon="mdiAlert" :text="germinateError" v-if="germinateError" />
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="brapi">
          <v-sheet class="pa-5">
            <v-alert
              v-if="isOnline === false"
              color="error"
              :icon="mdiLanDisconnect"
              density="compact"
              :text="$t('modalTextNetworkUnavailableWarning')"
              variant="tonal"
              border="start"
            />

            <p class="mt-3" v-html="$t('pageExportTrialFormatBrapi')" />

            <BrapiExportSection />
          </v-sheet>
        </v-tabs-window-item>
      </v-tabs-window>
    </UseOnline>
  </v-container>
</template>

<script setup lang="ts">
  import { downloadText, exportDataTab, exportPlotComments, exportTrialComments, exportTrialEvents, exportTrialLayout, traitsToGerminate, traitsToGridScore, traitsToTabular, trialToGerminate, trialToPotentialGerminate, type TabExportConfig } from '@/plugins/dataexport'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import { getTrialById } from '@/plugins/idb'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiAlert, mdiCommentMultiple, mdiDownload, mdiFileTable, mdiFlag, mdiLandFields, mdiLanDisconnect, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiSprout, mdiTagMultiple } from '@mdi/js'
  import { UseOnline } from '@vueuse/components'

  import emitter from 'tiny-emitter/instance'
  import { safeTrialName } from '@/plugins/util'
  import type { AxiosError } from 'axios'
  import BrapiExportSection from '@/components/dataexport/BrapiExportSection.vue'

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const trialData = shallowRef<{ [index: string]: CellPlus } | undefined>({})
  const tab = ref<'tab' | 'layout' | 'traits' | 'comments' | 'events' | 'germinate' | 'brapi'>('tab')
  const plotCommentCount = ref(0)
  const germinateAggregate = ref(true)
  const tabConfig = ref<TabExportConfig>({
    aggregate: true,
    includePeople: false,
    useTimestamps: false,
  })

  const germinateError = ref<string>()
  const germinateFile = ref<string>()
  const shapeFile = ref<string>()

  const trialCommentCount = computed(() => (trial.value?.comments || []).length)
  const trialEventCount = computed(() => (trial.value?.events || []).length)

  function exportTrialLayoutLocal () {
    if (trial.value && trialData.value) {
      exportTrialLayout(trial.value, trialData.value)
    }
  }

  function exportTabData (direction: 'wide' | 'long' = 'wide') {
    if (trial.value) {
      exportDataTab(trial.value, tabConfig.value, direction)
    }
  }

  function exportTraitsTabular () {
    if (trial.value) {
      const str = traitsToTabular(trial.value.traits)

      downloadText(str, `tabular-traits-${safeTrialName(trial.value)}.txt`)
    }
  }

  function exportTraitsGridScore () {
    if (trial.value) {
      const str = traitsToGridScore(trial.value.traits)

      downloadText(str, `gridscore-traits-${safeTrialName(trial.value)}.txt`)
    }
  }

  function exportTraitsGerminate () {
    if (trial.value) {
      const str = traitsToGerminate(trial.value.traits)

      downloadText(str, `germinate-traits-${safeTrialName(trial.value)}.txt`)
    }
  }

  function exportTrialCommentsLocal () {
    if (trial.value) {
      exportTrialComments(trial.value)
    }
  }

  function exportPlotCommentsLocal () {
    if (trial.value && trialData.value) {
      exportPlotComments(trial.value, trialData.value)
    }
  }

  function exportTrialEventsLocal () {
    if (trial.value && trialData.value) {
      exportTrialEvents(trial.value)
    }
  }

  function exportShapefileGerminate () {
    germinateError.value = undefined
    shapeFile.value = undefined
    if (trial.value) {
      trialToPotentialGerminate(trial.value, 'shapefile', germinateAggregate.value)
        .then(url => {
          shapeFile.value = url
        })
        .catch((e: AxiosError) => {
          germinateError.value = e.message
          handleError(e)
        })
    }
  }

  function exportDataGerminate () {
    germinateFile.value = undefined
    germinateError.value = undefined
    if (trial.value) {
      trialToPotentialGerminate(trial.value, 'template', germinateAggregate.value)
        .then(url => {
          germinateFile.value = url
        })
        .catch((e: AxiosError) => {
          germinateError.value = e.message
          handleError(e)
        })
    }
  }

  function handleError (err: AxiosError) {
    if (err && err.status === 404) {
      // Handle missing trials
      emitter.emit('show-missing-trial', trial.value)
    }
    emitter.emit('show-loading', false)
  }

  function updateTrialDataCache () {
    getTrialById(store.storeSelectedTrial || '')
      .then(tr => {
        trial.value = tr

        trialData.value = getTrialDataCached()
        let pcc = 0
        if (trialData.value) {
          Object.values(trialData.value).forEach(c => {
            if (c.comments) {
              pcc += c.comments.length
            }
          })
        }
        plotCommentCount.value = pcc
      })
  }

  watch(() => tabConfig.value.aggregate, async newValue => {
    if (newValue) {
      tabConfig.value.includePeople = false
      tabConfig.value.useTimestamps = false
    }
  })

  onMounted(() => {
    emitter.on('trial-data-loaded', updateTrialDataCache)

    updateTrialDataCache()
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })
</script>
