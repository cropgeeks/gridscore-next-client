<template>
  <b-container class="my-4">
    <template v-if="trialToCopy">
      <h1 class="display-4">{{ $t('modalTitleTrialDuplicate') }}</h1>
      <p>{{ $t('modalTextTrialDuplicate') }}</p>
    </template>
    <template v-else>
      <h1 class="display-4">{{ $t('pageTrialSetupTitle') }}</h1>
      <p>{{ $t('pageTrialSetupText') }}</p>
    </template>

    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 lg=6>
          <!-- Trial name -->
          <b-form-group label-for="trial-name" :description="$t('formDescriptionTrialSetupTrialName')">
            <template v-slot:label>
              <BIconTextareaT /><span> {{ $t('formLabelTrialSetupTrialName') }}</span>
            </template>
            <b-form-input id="trial-name" :state="formState.trialName" trim required autofocus v-model="trialName" />
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6>
          <!-- Trial description -->
          <b-form-group label-for="trial-description" :description="$t('formDescriptionTrialSetupTrialDescription')">
            <template v-slot:label>
              <BIconCardText /><span> {{ $t('formLabelTrialSetupTrialDescription') }}</span>
            </template>
            <b-form-textarea id="trial-description" :state="formState.trialDescription" v-model="trialDescription" />
          </b-form-group>
        </b-col>
        <b-col cols=12 class="mb-3">
          <b-form-group v-if="trialToCopy" :label="$t('formLabelDuplicateTrialCopyData')" :description="$t('formDescriptionDuplicateTrialCopyData')" label-for="copyData">
            <b-form-checkbox switch id="copyData" v-model="copyData" :disabled="layout.rows !== trialToCopy.layout.rows || layout.columns !== trialToCopy.layout.columns">{{ $t(copyData ? 'genericYes' : 'genericNo') }}</b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6 class="mb-3">
          <b-card no-body class="h-100">
            <b-card-body>
              <b-card-title>{{ $t('pageTrialSetupCardLayoutTitle') }}</b-card-title>
              <b-card-sub-title>{{ $t('pageTrialSetupCardLayoutSubTitle') }}</b-card-sub-title>

              <b-button class="mt-3 stretched-link" :variant="germplasmCount > 0 ? 'success' : 'primary'" @click="layoutSidebarVisible = true">
                <BIconCheck v-if="germplasmCount > 0" />
                <BIconPencilSquare v-else />
                {{ germplasmCount > 0 ? $t('buttonChange') : $t('buttonDefine') }}
              </b-button>
            </b-card-body>
            <b-card-body :class="`${formState.layout === false ? 'bg-danger' : 'bg-dark'} text-center text-light`">
              <b-row>
                <b-col cols=6 md=3>
                  <h1>{{ layout.rows }} | {{ layout.columns }}</h1>
                  <span>{{ $t('pageTrialSetupLayoutRowColumnCount') }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ germplasmCount }} | {{ repCount }}</h1>
                  <span>{{ $t('pageTrialSetupLayoutGermplasmRepCount') }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ layout.corners ? $t('genericYes') : $t('genericNo') }}</h1>
                  <span>{{ $t('pageTrialSetupLayoutHasCorners') }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ layout.markers ? $t('genericYes') : $t('genericNo') }}</h1>
                  <span>{{ $t('pageTrialSetupLayoutHasMarkers') }}</span>
                </b-col>
              </b-row>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col cols=12 lg=6 class="mb-3">
          <b-card no-body class="h-100">
            <b-card-body>
              <b-card-title>{{ $t('pageTrialSetupCardTraitsTitle') }}</b-card-title>
              <b-card-sub-title>{{ $t('pageTrialSetupCardTraitsSubTitle') }}</b-card-sub-title>

              <b-button class="mt-3 stretched-link" :variant="traits.length > 0 ? 'success' : 'primary'" @click="traitSidebarVisible = true">
                <BIconCheck v-if="traits.length > 0" />
                <BIconPencilSquare v-else />
                {{ traits.length > 0 ? $t('buttonChange') : $t('buttonDefine') }}
              </b-button>
            </b-card-body>
            <b-card-body :class="`${formState.traits === false ? 'bg-danger' : 'bg-dark'} text-center text-light`">
              <b-row>
                <b-col cols=6 md=3>
                  <h1>{{ numericTraitCount }}</h1>
                  <span>{{ $tc('pageTrialSetupNumericTraitCount', numericTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ categoricalTraitCount }}</h1>
                  <span>{{ $tc('pageTrialSetupCategoricalTraitCount', categoricalTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ dateTraitCount }}</h1>
                  <span>{{ $tc('pageTrialSetupDateTraitCount', dateTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ textTraitCount }}</h1>
                  <span>{{ $tc('pageTrialSetupTextTraitCount', textTraitCount) }}</span>
                </b-col>
              </b-row>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-button variant="primary" type="submit" :disabled="!trialValid"><BIconJournalPlus /> {{ $t('buttonCreateTrial') }}</b-button>
    </b-form>

    <b-sidebar
      id="trial-layout-sidebar"
      backdrop
      shadow
      no-close-on-esc
      no-close-on-backdrop
      width="100%"
      v-model="layoutSidebarVisible">
      <template #header="{ hide }">
        <div class="d-flex flex-wrap w-100">
          <strong>{{ $t('pageSetupGermplasmGridSidebarTitle') }}</strong>
          <b-button class="ml-auto mr-2" @click="hide">
            <BIconX /> {{ $t('buttonCancel') }}
          </b-button>
          <b-button variant="primary" class="mx-2" @click="$refs.trialSetupLayout.checkData()">
            <BIconCardChecklist /> {{ $t('buttonCheck') }}
          </b-button>
        </div>
        <b-button variant="danger" v-if="layoutFeedback && layoutFeedback.length > 0" class="align-self-center my-2" @click="$refs.layoutFeedbackModal.show()"><BIconExclamationTriangleFill /> {{ $tc('formFeedbackLayout', layoutFeedback.length) }}</b-button>
      </template>
      <div class="px-3 py-2">
        <TrialLayoutComponent :initialLayout="layout" :initialGermplasm="germplasmMap" ref="trialSetupLayout" @change="updateTrialLayout" />
      </div>
    </b-sidebar>

    <b-sidebar
      id="trait-sidebar"
      backdrop
      shadow
      right
      no-close-on-esc
      no-close-on-backdrop
      width="100%"
      v-model="traitSidebarVisible">
      <template #header="{ hide }">
        <div class="d-flex flex-wrap w-100">
          <strong>{{ $t('pageSetupTraitSidebarTitle') }}</strong>
          <b-button class="ml-auto mr-2" @click="hide">
            <BIconX /> {{ $t('buttonCancel') }}
          </b-button>
          <b-button variant="primary" class="mx-2" @click="$refs.traitDefinition.emitData()">
            <BIconSave /> {{ $t('buttonSave') }}
          </b-button>
        </div>
      </template>
      <div class="px-3 py-2">
        <TraitDefinitionComponent :initialTraits="traits" ref="traitDefinition" @finished="updateTraitDefinitions" />
      </div>
    </b-sidebar>

    <LayoutFeedbackModal :feedback="layoutFeedback" ref="layoutFeedbackModal" />
  </b-container>
</template>

<script>
import { BIconTextareaT, BIconCardText, BIconCheck, BIconPencilSquare, BIconJournalPlus, BIconX, BIconSave, BIconCardChecklist, BIconExclamationTriangleFill } from 'bootstrap-vue'
import TrialLayoutComponent from '@/components/TrialLayoutComponent'
import TraitDefinitionComponent from '@/components/TraitDefinitionComponent'
import LayoutFeedbackModal from '@/components/modals/LayoutFeedbackModal'
import { addTrial, getTrialById, getTrialData } from '@/plugins/idb'
import { trialLayoutToPlots } from '@/plugins/location'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconTextareaT,
    BIconCardText,
    BIconCheck,
    BIconPencilSquare,
    BIconX,
    BIconJournalPlus,
    BIconCardChecklist,
    BIconExclamationTriangleFill,
    BIconSave,
    TrialLayoutComponent,
    TraitDefinitionComponent,
    LayoutFeedbackModal
  },
  data: function () {
    return {
      layoutSidebarVisible: false,
      traitSidebarVisible: false,
      trialName: null,
      trialDescription: null,
      layout: {
        rows: 1,
        columns: 1,
        corners: null,
        markers: null,
        rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
        columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
      },
      germplasmMap: {},
      traits: [],
      formState: {
        trialName: null,
        trialDescription: null,
        layout: null
      },
      layoutFeedback: null,
      layoutDataIsValid: false,
      traitFeedback: null,
      newTrialCreatedSuccessfully: false,
      trialToCopy: null,
      copyData: false
    }
  },
  beforeRouteLeave: function (to, from, next) {
    if (!this.newTrialCreatedSuccessfully) {
      // Ask for confirmation. check this isn't a navigation initiated by finalising the trial setup
      this.$bvModal.msgBoxConfirm(this.$t('modalTextLeaveSetup'), {
        title: this.$t('modalTitleLeaveSetup'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      }).then(value => {
        if (value) {
          next()
        }
      })
    } else {
      next()
    }
  },
  computed: {
    categoricalTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'categorical').length
      } else {
        return 0
      }
    },
    numericTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'int' || t.dataType === 'float').length
      } else {
        return 0
      }
    },
    dateTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'date').length
      } else {
        return 0
      }
    },
    textTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'text').length
      } else {
        return 0
      }
    },
    germplasmCount: function () {
      if (this.germplasmMap) {
        const set = new Set()

        Object.keys(this.germplasmMap).forEach(k => {
          set.add(this.germplasmMap[k].germplasm)
        })

        return [...set].length
      } else {
        return null
      }
    },
    repCount: function () {
      if (this.germplasmMap) {
        const set = new Set()

        Object.keys(this.germplasmMap).forEach(k => {
          if (this.germplasmMap[k].rep) {
            set.add(this.germplasmMap[k].rep)
          }
        })

        return [...set].length
      } else {
        return null
      }
    },
    trialValid: function () {
      if (!this.trialName || this.trialName === '') {
        return false
      }
      if (this.layoutFeedback && this.layoutFeedback.length > 0) {
        return false
      }
      if (!this.layout.rows || !this.layout.columns) {
        return false
      }
      if (!this.germplasmMap || Object.keys(this.germplasmMap).length < 1) {
        return false
      }
      if (!this.traits || this.traits.length < 1) {
        return false
      }

      return true
    }
  },
  watch: {
    layoutSidebarVisible: function (newValue) {
      this.$nextTick(() => {
        this.$refs.trialSetupLayout.toggleTable(newValue)
      })
    }
  },
  methods: {
    updateTraitDefinitions: function (traits) {
      this.traits = traits
      this.traitSidebarVisible = false
    },
    updateTrialLayout: function (payload) {
      this.layoutDataIsValid = payload.layoutValid
      this.layoutFeedback = payload.feedback

      if (payload.layoutValid) {
        this.layout = payload.layout
        this.germplasmMap = payload.germplasmMap
        this.layoutSidebarVisible = false
      }
    },
    onSubmit: function () {
      // Ask for confirmation. check this isn't a navigation initiated by finalising the trial setup
      this.$bvModal.msgBoxConfirm(this.$t('modalTextCreateTrial'), {
        title: this.$t('modalTitleCreateTrial'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      }).then(value => {
        if (value) {
          const sameDimensions = this.trialToCopy ? (this.trialToCopy.layout.rows === this.layout.rows && this.trialToCopy.layout.columns === this.layout.columns) : true

          const data = JSON.parse(JSON.stringify(this.germplasmMap))

          let plotCorners = null

          if (this.layout.corners) {
            plotCorners = trialLayoutToPlots(this.layout.corners, this.layout.rows, this.layout.columns)
          }

          for (let row = 0; row < this.layout.rows; row++) {
            for (let column = 0; column < this.layout.columns; column++) {
              if (data[`${row}|${column}`]) {
                data[`${row}|${column}`].geography = {}

                if (plotCorners) {
                  data[`${row}|${column}`].geography.corners = plotCorners[row][column]
                }
              }
            }
          }

          Object.keys(data).forEach(k => {
            const c = data[k]
            c.measurements = {}
            this.traits.forEach(t => {
              if (this.trialToCopy && this.copyData && sameDimensions) {
                const toCopy = this.trialToCopy.data[k]
                c.measurements[t.id] = JSON.parse(JSON.stringify(toCopy.measurements[t.id] || []))
              } else {
                c.measurements[t.id] = []
              }
            })
            c.comments = []
          })

          const now = new Date().toISOString()

          this.traits.forEach(t => {
            if (t.group && t.group !== '') {
              t.group = {
                name: t.group
              }
            } else {
              delete t.group
            }
          })

          const finalTrial = {
            name: this.trialName,
            description: this.trialDescription,
            layout: this.layout,
            traits: this.traits,
            data: data,
            comments: [],
            updatedOn: now,
            createdOn: now,
            lastSyncedOn: null
          }

          emitter.emit('plausible-event', {
            key: 'trial-created',
            props: {
              rows: finalTrial.layout.rows,
              columns: finalTrial.layout.columns,
              traits: finalTrial.traits.length,
              markers: finalTrial.layout.markers !== null,
              corners: finalTrial.layout.corners !== null
            }
          })

          addTrial(finalTrial).then(trialId => {
            this.newTrialCreatedSuccessfully = true
            this.$store.dispatch('setSelectedTrial', trialId)
            this.$router.push({ name: 'home' })
          })
        }
      })
    }
  },
  mounted: function () {
    if (this.$route.params && this.$route.params.trialId) {
      getTrialById(this.$route.params.trialId)
        .then(trial => {
          if (trial) {
            return new Promise(resolve => {
              getTrialData(trial.localId)
                .then(data => {
                  trial.data = data
                  resolve(trial)
                })
            })
          } else {
            return new Promise(resolve => resolve(null))
          }
        })
        .then(trial => {
          if (trial) {
            this.trialName = this.$t('modalTextTrialDuplicateOfName', { original: trial.name })
            this.trialDescription = this.$t('modalTextTrialDuplicateOfDate', { original: trial.description, date: new Date().toLocaleDateString() })
            this.layout = JSON.parse(JSON.stringify(trial.layout))
            this.traits = JSON.parse(JSON.stringify(trial.traits)).map(t => {
              if (t.group && t.group.name) {
                t.group = t.group.name
              }
              return t
            })

            if (trial.data) {
              const copy = JSON.parse(JSON.stringify(trial.data))
              Object.values(copy).forEach(c => {
                delete c.isMarked
                c.comments = []
              })
              this.germplasmMap = copy
            } else {
              this.germplasmMap = {}
            }

            this.trialToCopy = trial
          }
        })
    }
  }
}
</script>

<style>
#trial-layout-sidebar .b-sidebar-header {
  flex-direction: column;
  align-items: stretch;
}
</style>
