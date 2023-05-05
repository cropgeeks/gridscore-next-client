<template>
  <b-container class="my-4">
    <h1 class="display-4">{{ $t('pageTrialSetupTitle') }}</h1>
    <p>{{ $t('pageTrialSetupText') }}</p>

    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 lg=6>
          <!-- Trial name -->
          <b-form-group label-for="trial-name" :description="$t('formDescriptionTrialSetupTrialName')">
            <template v-slot:label>
              <BIconTextareaT /><span> {{ $t('formLabelTrialSetupTrialName') }}</span>
            </template>
            <b-form-input id="trial-name" :state="formState.trialName" required autofocus v-model="trialName" />
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
        <TrialLayoutComponent ref="trialSetupLayout" @change="updateTrialLayout" />
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
        <TraitDefinitionComponent ref="traitDefinition" @finished="updateTraitDefinitions" />
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
import { addTrial } from '@/plugins/idb'
import { trialLayoutToPlots } from '@/plugins/location'

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
        markers: null
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
      newTrialCreatedSuccessfully: false
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

          Object.values(data).forEach(c => {
            c.measurements = {}
            this.traits.forEach(t => {
              c.measurements[t.id] = []
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

          addTrial(finalTrial).then(trialId => {
            this.newTrialCreatedSuccessfully = true
            this.$store.dispatch('setSelectedTrial', trialId)
            this.$router.push({ name: 'home' })
          })
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
