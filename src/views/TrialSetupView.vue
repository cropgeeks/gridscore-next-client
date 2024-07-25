<template>
  <b-container class="my-4">
    <div class="d-flex align-items-center justify-content-between">
      <h1 class="display-4">{{ $t(trialToCopy ? 'modalTitleTrialDuplicate' : 'pageTrialSetupTitle') }}</h1>
      <h4><a href="#" class="text-dark" @click.prevent="$refs.setupTour.start()"><IBiQuestionCircle /></a></h4>
    </div>
    <p>{{ $t(trialToCopy ? 'modalTextTrialDuplicate' : 'pageTrialSetupText') }}</p>

    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 lg=6>
          <!-- Trial name -->
          <b-form-group label-for="trial-name" :description="$t('formDescriptionTrialSetupTrialName')">
            <template v-slot:label>
              <IBiTextareaT /> <span>{{ $t('formLabelTrialSetupTrialName') }}</span>
            </template>
            <b-form-input id="trial-name" :state="formState.trialName" required autofocus v-model.trim="trialName" />
          </b-form-group>

          <!-- Trial group -->
          <b-form-group label-for="trial-group" :description="$t('formDescriptionTrialSetupTrialGroup')">
            <template v-slot:label>
              <IBiCollection /> <span>{{ $t('formLabelTrialSetupTrialGroup') }}</span>
            </template>
            <b-form-input list="trial-groups" :state="formState.trialGroup" v-model.trim="trialGroup" id="trial-group" />

            <datalist id="trial-groups">
              <option v-for="group in trialGroups" :key="`trial-group-${group}`">{{ group }}</option>
            </datalist>
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6>
          <!-- Trial description -->
          <b-form-group label-for="trial-description" :description="$t('formDescriptionTrialSetupTrialDescription')">
            <template v-slot:label>
              <IBiCardText /> <span>{{ $t('formLabelTrialSetupTrialDescription') }}</span>
            </template>
            <b-form-textarea id="trial-description" :state="formState.trialDescription" v-model="trialDescription" />
          </b-form-group>

          <!-- Trial people -->
          <b-form-group label-for="trial-people" :description="$t('formDescriptionTrialSetupTrialPeople')">
            <template v-slot:label>
              <IBiPeopleFill /> <span>{{ $t('formLabelTrialSetupTrialPeople') }}</span>
            </template>
            <div>
              <h5 v-for="(person, personIndex) in people" :key="`person-${person.id}`" class="d-inline-block">
                <b-badge :variant="storeDarkMode ? 'dark' : 'light'"><PersonTypeIcon class="me-1" :personType="type" v-for="type in person.types" :key="`person-${person.id}-type-${type}`" :style="{ color: personStyle[type] }" /> {{ person.name }}</b-badge>
                <b-badge variant="danger" href="#" @click.prevent="deletePerson(personIndex)" class="me-2">
                  <IBiTrash />
                </b-badge>
              </h5>
            </div>
          </b-form-group>

          <b-button @click="$refs.editPeopleModal.show()"><IBiPersonPlusFill /> {{ $t('buttonAdd') }}</b-button>

          <!-- Trial social media sharing content; Commented out until feature becomes more consistent -->
          <!-- <b-form-group label-for="trial-social-config" :description="$t('formDescriptionTrialSetupTrialSocialContent')">
            <template v-slot:label>
              <span class="cursor-pointer" @click="socialConfigVisible = !socialConfigVisible"><IBiCaretRightFill :style="{ transform: `rotate(${socialConfigVisible ? 90 : 0}deg)` }" /> <span>{{ $t('formLabelTrialSetupTrialSocialContent') }}</span></span>
            </template>
            <b-collapse v-model="socialConfigVisible">
              <b-card>
                <b-card-text class="text-info"><span v-html="$t('formDescriptionTrialSetupTrialSocialContentExtended')" /></b-card-text>
                <b-form-group label-for="trial-social-title" :description="$t('formDescriptionTrialSetupTrialSocialTitle')">
                  <template v-slot:label>
                    <IBiCardHeading /> <span> {{ $t('formLabelTrialSetupTrialSocialTitle') }}</span>
                  </template>
                  <b-form-input id="trial-social-title" v-model.trim="trialSocialConfig.title" />
                </b-form-group>
                <b-form-group label-for="trial-social-text" :description="$t('formDescriptionTrialSetupTrialSocialText')">
                  <template v-slot:label>
                    <IBiTextareaResize /> <span> {{ $t('formLabelTrialSetupTrialSocialText') }}</span>
                  </template>
                  <b-form-textarea id="trial-social-text" v-model.trim="trialSocialConfig.text" />
                </b-form-group>
                <b-form-group label-for="trial-social-url" :description="$t('formDescriptionTrialSetupTrialSocialUrl')">
                  <template v-slot:label>
                    <IBiLink /> <span> {{ $t('formLabelTrialSetupTrialSocialUrl') }}</span>
                  </template>
                  <b-form-input id="trial-social-url" v-model.trim="trialSocialConfig.url" />
                </b-form-group>
              </b-card>
            </b-collapse>
          </b-form-group> -->
        </b-col>
        <b-col cols=12 class="mb-3">
          <b-form-group v-if="trialToCopy" :label="$t('formLabelDuplicateTrialCopyData')" :description="$t('formDescriptionDuplicateTrialCopyData')" label-for="copyData">
            <b-form-checkbox switch id="copyData" v-model="copyData" :disabled="layout.rows !== trialToCopy.layout.rows || layout.columns !== trialToCopy.layout.columns">{{ $t(copyData ? 'genericYes' : 'genericNo') }}</b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6 class="mb-3">
          <b-card no-body class="h-100" id="layout-card">
            <b-card-body>
              <b-card-title>{{ $t('pageTrialSetupCardLayoutTitle') }}</b-card-title>
              <b-card-subtitle>{{ $t('pageTrialSetupCardLayoutSubTitle') }}</b-card-subtitle>

              <b-button class="mt-3 stretched-link" :variant="germplasmCount > 0 ? 'success' : 'primary'" @click="layoutSidebarVisible = true">
                <IBiCheck v-if="germplasmCount > 0" />
                <IBiPencilSquare v-else />
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
          <b-card no-body class="h-100" id="trait-card">
            <b-card-body>
              <b-card-title>{{ $t('pageTrialSetupCardTraitsTitle') }}</b-card-title>
              <b-card-subtitle>{{ $t('pageTrialSetupCardTraitsSubTitle') }}</b-card-subtitle>

              <b-button class="mt-3 stretched-link" :variant="traits.length > 0 ? 'success' : 'primary'" @click="traitSidebarVisible = true">
                <IBiCheck v-if="traits.length > 0" />
                <IBiPencilSquare v-else />
                {{ traits.length > 0 ? $t('buttonChange') : $t('buttonDefine') }}
              </b-button>
            </b-card-body>
            <b-card-body :class="`${formState.traits === false ? 'bg-danger' : 'bg-dark'} text-center text-light`">
              <b-row>
                <b-col cols=6 md=3>
                  <h1>{{ numericTraitCount }}</h1>
                  <span>{{ $t('pageTrialSetupNumericTraitCount', numericTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ categoricalTraitCount }}</h1>
                  <span>{{ $t('pageTrialSetupCategoricalTraitCount', categoricalTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ dateTraitCount }}</h1>
                  <span>{{ $t('pageTrialSetupDateTraitCount', dateTraitCount) }}</span>
                </b-col>
                <b-col cols=6 md=3>
                  <h1>{{ textTraitCount }}</h1>
                  <span>{{ $t('pageTrialSetupTextTraitCount', textTraitCount) }}</span>
                </b-col>
              </b-row>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-button variant="primary" type="submit" :disabled="!trialValid"><IBiJournalPlus /> {{ $t('buttonCreateTrial') }}</b-button>
    </b-form>

    <b-offcanvas
      id="trial-layout-sidebar"
      backdrop
      shadow
      no-close-on-esc
      no-close-on-backdropf
      v-model="layoutSidebarVisible">
      <template #header="{ hide }">
        <div class="d-flex flex-wrap w-100 justify-content-between">
          <strong>{{ $t('pageSetupGermplasmGridSidebarTitle') }}</strong>
          <b-button :variant="layoutFeedbackIsOnlyWarning ? 'warning' : 'danger'" v-if="layoutFeedback && layoutFeedback.length > 0" class="align-self-center my-2" @click="$refs.layoutFeedbackModal.show()"><IBiExclamationTriangleFill /> {{ $t('formFeedbackLayout', layoutFeedback.length) }}</b-button>
          <div>
            <b-button class="ms-auto me-2" @click="hide">
              <IBiX /> {{ $t('buttonCancel') }}
            </b-button>
            <b-button variant="primary" class="mx-2" @click="$refs.trialSetupLayout.checkData()">
              <IBiCardChecklist /> {{ $t('buttonCheck') }}
            </b-button>
          </div>
        </div>
      </template>
      <div class="px-3 py-2">
        <TrialLayoutComponent :initialLayout="layout" :initialGermplasm="germplasmMap" ref="trialSetupLayout" @data-changed="updateTrialLayout" />
      </div>
    </b-offcanvas>

    <b-offcanvas
      id="trait-sidebar"
      backdrop
      shadow
      right
      no-close-on-esc
      no-close-on-backdrop
      v-model="traitSidebarVisible">
      <template #header="{ hide }">
        <div class="d-flex flex-wrap w-100 justify-content-between">
          <strong>{{ $t('pageSetupTraitSidebarTitle') }}</strong>
          <div>
            <b-button class="ms-auto me-2" @click="hide">
              <IBiX /> {{ $t('buttonCancel') }}
            </b-button>
            <b-button variant="primary" class="mx-2" @click="$refs.traitDefinition.emitData()">
              <IBiSave /> {{ $t('buttonSave') }}
            </b-button>
          </div>
        </div>
      </template>
      <div class="px-3 py-2">
        <TraitDefinitionComponent :initialTraits="traits" ref="traitDefinition" @finished="updateTraitDefinitions" />
      </div>
    </b-offcanvas>

    <LayoutFeedbackModal :feedback="layoutFeedback" @warnings-accepted="acceptWarnings" ref="layoutFeedbackModal" />
    <EditPeopleModal ref="editPeopleModal" @person-added="addPerson" />

    <Tour :steps="tourSteps" :resetOnRouterNav="true" :hideBackButton="false" ref="setupTour" />
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import TrialLayoutComponent from '@/components/TrialLayoutComponent.vue'
import TraitDefinitionComponent from '@/components/TraitDefinitionComponent.vue'
import LayoutFeedbackModal from '@/components/modals/LayoutFeedbackModal.vue'
import EditPeopleModal from '@/components/modals/EditPeopleModal.vue'
import PersonTypeIcon from '@/components/icons/PersonTypeIcon.vue'
import Tour from '@/components/Tour.vue'
import { addTrial, getTrialById, getTrialData, getTrialGroups } from '@/plugins/idb'
import { trialLayoutToPlots } from '@/plugins/location'
import { CELL_CATEGORY_CONTROL, DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_DATA_SUBMITTER, PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_QUALITY_CHECKER } from '@/plugins/constants'
import { brapiGetObservationUnits, brapiGetStudies } from '@/plugins/brapi'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    PersonTypeIcon,
    Tour,
    TrialLayoutComponent,
    EditPeopleModal,
    TraitDefinitionComponent,
    LayoutFeedbackModal
  },
  data: function () {
    return {
      layoutSidebarVisible: false,
      traitSidebarVisible: false,
      socialConfigVisible: false,
      trialName: null,
      trialDescription: null,
      trialBrapiId: null,
      trialSocialConfig: {
        title: 'GridScore',
        text: '#GridScore',
        url: 'https://gridscore.hutton.ac.uk'
      },
      trialGroup: null,
      trialGroups: [],
      people: [],
      layout: {
        rows: 1,
        columns: 1,
        corners: null,
        markers: null,
        rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
        columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT,
        rowLabels: [1],
        columnLabels: [1]
      },
      germplasmMap: {},
      traits: [],
      formState: {
        trialName: null,
        trialDescription: null,
        trialGroup: null,
        layout: null
      },
      brapiConfig: null,
      layoutFeedback: null,
      layoutDataIsValid: false,
      traitFeedback: null,
      newTrialCreatedSuccessfully: false,
      trialToCopy: null,
      copyData: false,
      layoutFeedbackIsOnlyWarning: true,
      warningsAccepted: false,
      PERSON_TYPE_DATA_COLLECTOR,
      PERSON_TYPE_DATA_SUBMITTER,
      PERSON_TYPE_CORRESPONDING_AUTHOR,
      PERSON_TYPE_QUALITY_CHECKER
    }
  },
  beforeRouteLeave: function (to, from, next) {
    if (!this.newTrialCreatedSuccessfully) {
      // Ask for confirmation. check this isn't a navigation initiated by finalising the trial setup
      emitter.emit('show-confirm', {
        title: 'modalTitleLeaveSetup',
        message: 'modalTextLeaveSetup',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            next()
          }
        }
      })
    } else {
      next()
    }
  },
  computed: {
    ...mapGetters([
      'storeTraitColors',
      'storeDarkMode'
    ]),
    personStyle: function () {
      const result = {}
      result[PERSON_TYPE_CORRESPONDING_AUTHOR] = this.storeTraitColors[0 % this.storeTraitColors.length]
      result[PERSON_TYPE_DATA_COLLECTOR] = this.storeTraitColors[1 % this.storeTraitColors.length]
      result[PERSON_TYPE_QUALITY_CHECKER] = this.storeTraitColors[2 % this.storeTraitColors.length]
      result[PERSON_TYPE_DATA_SUBMITTER] = this.storeTraitColors[3 % this.storeTraitColors.length]

      return result
    },
    tourSteps: function () {
      return [{
        title: () => this.$t('tourTitleSetupStart'),
        text: () => this.$t('tourTextSetupStart'),
        target: () => '.navbar',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupTrialName'),
        text: () => this.$t('tourTextSetupTrialName'),
        target: () => '#trial-name',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupTrialDescription'),
        text: () => this.$t('tourTextSetupTrialDescription'),
        target: () => '#trial-description',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupTrialGroup'),
        text: () => this.$t('tourTextSetupTrialGroup'),
        target: () => '#trial-group',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupTrialLayout'),
        text: () => this.$t('tourTextSetupTrialLayout'),
        target: () => '#layout-card',
        position: 'top'
      }, {
        title: () => this.$t('tourTitleSetupTrialTraits'),
        text: () => this.$t('tourTextSetupTrialTraits'),
        target: () => '#trait-card',
        position: 'top'
      }]
    },
    categoricalTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'categorical').length
      } else {
        return 0
      }
    },
    numericTraitCount: function () {
      if (this.traits) {
        return this.traits.filter(t => t.dataType === 'int' || t.dataType === 'float' || t.dataType === 'range').length
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
        return this.traits.filter(t => t.dataType === 'text' || t.dataType === 'gps' || t.dataType === 'image').length
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
        if (!this.layoutFeedbackIsOnlyWarning || !this.warningsAccepted) {
          return false
        }
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
    deletePerson: function (index) {
      this.people.splice(index, 1)
    },
    addPerson: function (newPerson) {
      this.people.push(newPerson)
    },
    acceptWarnings: function () {
      this.warningsAccepted = true
      this.$refs.trialSetupLayout.checkData()
    },
    updateTraitDefinitions: function (traits) {
      this.traits = traits
      this.traitSidebarVisible = false
    },
    updateTrialLayout: function (payload) {
      this.layoutDataIsValid = payload.layoutValid
      this.layoutFeedback = payload.feedback

      this.layoutFeedbackIsOnlyWarning = payload.feedback && (payload.feedback.length < 1 || !payload.feedback.some(f => f.type === 'danger'))

      if (payload.feedback.length < 1 || (this.layoutFeedbackIsOnlyWarning && this.warningsAccepted)) {
        this.layout = payload.layout
        this.germplasmMap = payload.germplasmMap
        this.layoutSidebarVisible = false
      }
    },
    onSubmit: function () {
      // Ask for confirmation. check this isn't a navigation initiated by finalising the trial setup
      emitter.emit('show-confirm', {
        title: 'modalTitleCreateTrial',
        message: 'modalTextCreateTrial',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
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

              if (c.control) {
                c.categories = [CELL_CATEGORY_CONTROL]
              } else {
                c.categories = []
              }
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
              brapiId: this.trialBrapiId,
              brapiConfig: this.brapiConfig,
              socialShareConfig: this.trialSocialConfig,
              group: (this.trialGroup && this.trialGroup.length > 0) ? { name: this.trialGroup } : null,
              layout: this.layout,
              traits: this.traits,
              people: this.people,
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
        }
      })
    }
  },
  mounted: function () {
    this.$store.dispatch('setSelectedTrial', null)

    getTrialGroups().then(groups => {
      this.trialGroups = groups || []
    })

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
            this.trialBrapiId = trial.brapiId || null
            this.trialSocialConfig = trial.socialShareConfig || { title: 'GridScore', text: '#GridScore', url: 'https://gridscore.hutton.ac.uk' }
            this.trialGroup = trial.group ? trial.group.name : null
            this.layout = JSON.parse(JSON.stringify(trial.layout))
            this.people = JSON.parse(JSON.stringify(trial.people))
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
                c.control = (c.categories || []).includes(CELL_CATEGORY_CONTROL)
              })
              this.germplasmMap = copy
            } else {
              this.germplasmMap = {}
            }

            this.trialToCopy = trial
          }
        })
    } else if (this.$route.query && this.$route.query.germinateConfig) {
      const cf = JSON.parse(this.$route.query.germinateConfig)

      if (cf.brapiConfig && cf.brapiConfig.url && cf.brapiConfig.token && cf.datasetId) {
        this.$store.commit('ON_BRAPI_CONFIG_CHANGED', cf.brapiConfig)

        this.brapiConfig = JSON.parse(JSON.stringify(cf.brapiConfig))

        brapiGetStudies({ studyDbId: cf.datasetId }).then(result => {
          if (result && result.length > 0) {
            emitter.emit('show-confirm', {
              title: 'modalTitleCreateTrialGerminateImport',
              message: 'modalTextCreateTrialGerminateImport',
              okTitle: 'buttonYes',
              cancelTitle: 'buttonNo',
              okVariant: 'danger',
              callback: (result) => {
                if (result) {
                  this.trialName = result[0].studyName
                  this.trialDescription = result[0].studyDescription
                  this.trialBrapiId = `${cf.datasetId}`

                  brapiGetObservationUnits(cf.datasetId).then(result => {
                    if (result && result.length > 0) {
                      let rows = 1
                      let columns = 1

                      const map = {}

                      result.forEach(c => {
                        const cell = {
                          germplasm: c.germplasmName,
                          rep: null,
                          brapiId: c.germplasmDbId
                        }
                        if (c.observationUnitPosition) {
                          const pos = c.observationUnitPosition
                          if (pos.observationLevel && pos.observationLevel.levelName === 'rep') {
                            cell.rep = pos.observationLevel.levelCode
                          }

                          let row = null
                          let column = null
                          if (pos.positionCoordinateXType === 'GRID_COL') {
                            column = +pos.positionCoordinateY
                            columns = Math.max(columns, column)
                          }
                          if (pos.positionCoordinateYType === 'GRID_ROW') {
                            row = +pos.positionCoordinateX
                            rows = Math.max(rows, row)
                          }

                          map[`${row}|${column}`] = cell
                        }
                      })

                      this.layout = {
                        rows: rows + 1,
                        columns: columns + 1,
                        corners: null,
                        markers: null,
                        rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
                        columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
                      }

                      // TODO: Preset order to be FielDHub default?

                      this.germplasmMap = map
                    }
                  })
                }
              }
            })
          }
        })
      }
    }
  }
}
</script>

<style>
#trial-layout-sidebar .b-offcanvas-header {
  flex-direction: column;
  align-items: stretch;
}
#trial-layout-sidebar,
#trait-sidebar {
  width: 100vw;
}
</style>
