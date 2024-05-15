<template>
  <b-modal :title="$t('modalTitleTrialModification')"
           :ok-title="$t('buttonSave')"
           no-fade
           @shown="reset(true)"
           @hidden="reset(false)"
           @ok.prevent="updateTrial"
           size="xl"
           ref="trialModificationModal">
    <div>
      <p>{{ $t('modalTextTrialModification') }}</p>

      <b-form @submit.prevent="updateTrial">
        <b-row>
          <b-col cols=12 lg=6>
            <!-- Trial name -->
            <b-form-group label-for="trial-name" :description="$t('formDescriptionTrialSetupTrialName')">
              <template v-slot:label>
                <BIconTextareaT /><span> {{ $t('formLabelTrialSetupTrialName') }}</span>
              </template>
              <b-form-input id="trial-name" :state="formState.trialName" required trim autofocus v-model="trialName" />
            </b-form-group>

            <!-- Trial group -->
            <b-form-group label-for="trial-group" :description="$t('formDescriptionTrialSetupTrialGroup')">
              <template v-slot:label>
                <BIconCollection /><span> {{ $t('formLabelTrialSetupTrialGroup') }}</span>
              </template>
              <b-form-input list="trial-groups" trim v-model="trialGroup" id="trial-group" />

              <datalist id="trial-groups">
                <option v-for="group in trialGroups" :key="`trial-group-${group}`">{{ group }}</option>
              </datalist>
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

            <!-- Trial social media sharing content; Commented out until feature becomes more consistent -->
            <!-- <b-form-group label-for="trial-social-config" :description="$t('formDescriptionTrialSetupTrialSocialContent')">
              <template v-slot:label>
                <span class="cursor-pointer" @click="socialConfigVisible = !socialConfigVisible"><BIconCaretRightFill :rotate="socialConfigVisible ? 90 : 0" /><span> {{ $t('formLabelTrialSetupTrialSocialContent') }}</span></span>
              </template>
              <b-collapse v-model="socialConfigVisible">
                <b-card>
                  <b-card-text class="text-info"><span v-html="$t('formDescriptionTrialSetupTrialSocialContentExtended')" /></b-card-text>
                  <b-form-group label-for="trial-social-title" :description="$t('formDescriptionTrialSetupTrialSocialTitle')">
                    <template v-slot:label>
                      <BIconCardHeading /> <span> {{ $t('formLabelTrialSetupTrialSocialTitle') }}</span>
                    </template>
                    <b-form-input id="trial-social-title" trim v-model="trialSocialConfig.title" />
                  </b-form-group>
                  <b-form-group label-for="trial-social-text" :description="$t('formDescriptionTrialSetupTrialSocialText')">
                    <template v-slot:label>
                      <BIconTextareaResize /> <span> {{ $t('formLabelTrialSetupTrialSocialText') }}</span>
                    </template>
                    <b-form-textarea id="trial-social-text" trim v-model="trialSocialConfig.text" />
                  </b-form-group>
                  <b-form-group label-for="trial-social-url" :description="$t('formDescriptionTrialSetupTrialSocialUrl')">
                    <template v-slot:label>
                      <BIconLink /> <span> {{ $t('formLabelTrialSetupTrialSocialUrl') }}</span>
                    </template>
                    <b-form-input id="trial-social-url" trim v-model="trialSocialConfig.url" />
                  </b-form-group>
                </b-card>
              </b-collapse>
            </b-form-group> -->
          </b-col>
        </b-row>
      </b-form>

      <b-tabs v-model="tabIndex">
        <b-tab>
          <template #title>
            <BIconTags />
            <span> {{ $t('pageTrialSetupCardTraitsTitle') }} </span>
            <BIconCheck class="text-success" v-if="tabCorrect.traits === true" />
            <BIconX class="text-danger" v-else-if="tabCorrect.traits === false" />
          </template>
          <b-container class="mt-3">
            <div class="d-flex flex-row justify-content-between align-items-center mb-3">
              <p class="mb-0">{{ $t('pageTrialEditTraitText') }}</p>
              <b-dropdown :text="$t('dropdownExportTraits')" class="float-right">
                <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportJson(true)">{{ $t('dropdownOptionExportTraitsJson') }}</b-dropdown-item-button>
                <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportGerminate(true)">{{ $t('dropdownOptionExportTraitsGerminate') }}</b-dropdown-item-button>
              </b-dropdown>
            </div>
            <b-row>
              <b-col class="mb-3" cols=12 md=6 v-for="trait in traits" :key="`trait-section-${trait.id}`">
                <h4 class="d-flex justify-content-between align-items-center">
                  <span :style="{ color: trait.color }">
                    <TraitIcon :trait="trait" />
                    <span class="mx-1">{{ trait.name }}</span>
                  </span>
                </h4>

                <b-form-group :label="$t('formLabelTraitName')" :description="$t('formDescriptionTraitName')" label-for="trait-name">
                  <b-form-input required v-model="trait.name" trim id="trait-name" />
                </b-form-group>

                <b-form-group :label="$t('formLabelTraitDescription')" :description="$t('formDescriptionTraitDescription')" label-for="trait-description">
                  <b-form-input required v-model="trait.description" trim id="trait-description" />
                </b-form-group>

                <b-form-group :label="$t('formLabelTraitGroup')" :description="$t('formDescriptionTraitGroup')" label-for="trait-group">
                  <b-form-input list="trait-groups" trim v-model="trait.group" id="trait-group" />

                  <datalist id="trait-groups">
                    <option v-for="group in traitGroups" :key="`trait-group-${group}`">{{ group }}</option>
                  </datalist>
                </b-form-group>
              </b-col>
            </b-row>
          </b-container>
        </b-tab>
        <b-tab>
          <template #title>
            <BIconBoundingBoxCircles />
            <span> {{ $t('pageTrialLayoutMarkersTitle') }} </span>
            <BIconCheck class="text-success" v-if="tabCorrect.markers === true" />
            <BIconX class="text-danger" v-else-if="tabCorrect.markers === false" />
          </template>
          <b-container class="mt-3">
            <p>{{ $t('pageTrialLayoutMarkersText') }}</p>
            <MarkerSetup ref="markerSetup" :layout="layout" @change="(markers) => { layout.markers = markers }" />
          </b-container>
        </b-tab>
        <b-tab>
          <template #title>
            <BIconArrowsFullscreen />
            <span> {{ $t('pageTrialLayoutCornersTitle') }} </span>
            <BIconCheck class="text-success" v-if="tabCorrect.corners === true" />
            <BIconX class="text-danger" v-else-if="tabCorrect.corners === false" />
          </template>
          <b-container class="mt-3">
            <p>{{ $t('pageTrialLayoutCornersText') }}</p>
            <TrialLayoutCorners ref="trialLayoutCorners" :layout="layout" @change="(corners) => { layout.corners = corners }" />
          </b-container>
        </b-tab>
      </b-tabs>

      <b-button variant="danger" v-if="layoutFeedback && layoutFeedback.length > 0" class="align-self-center my-2" @click="$refs.layoutFeedbackModal.show()"><BIconExclamationTriangleFill /> {{ $tc('formFeedbackLayout', layoutFeedback.length) }}</b-button>
    </div>
    <LayoutFeedbackModal :feedback="layoutFeedback" ref="layoutFeedbackModal" />
    <TraitImportExportGridScoreModal :traits="traitsToExport" ref="traitImportExportGridScoreModal" />
    <TraitImportExportGerminateModal :traits="traitsToExport" ref="traitImportExportGerminateModal" />
  </b-modal>
</template>

<script>
import TraitImportExportGerminateModal from '@/components/modals/TraitImportExportGerminateModal'
import TraitImportExportGridScoreModal from '@/components/modals/TraitImportExportGridScoreModal'
import TrialLayoutCorners from '@/components/TrialLayoutCorners'
import MarkerSetup from '@/components/MarkerSetup'
import LayoutFeedbackModal from '@/components/modals/LayoutFeedbackModal'
import TraitIcon from '@/components/icons/TraitIcon'
import { isGeographyValid, isGeographyAllNull } from '@/plugins/location'
import { BIconTextareaT, BIconCardText, BIconArrowsFullscreen, BIconCollection, BIconBoundingBoxCircles, BIconTags, BIconCheck, BIconX, BIconExclamationTriangleFill } from 'bootstrap-vue'
import { updateTrialProperties, getTrialGroups } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TraitImportExportGerminateModal,
    TraitImportExportGridScoreModal,
    BIconTextareaT,
    // BIconCardHeading,
    BIconCardText,
    BIconArrowsFullscreen,
    BIconBoundingBoxCircles,
    // BIconCaretRightFill,
    // BIconTextareaResize,
    // BIconLink,
    BIconCheck,
    BIconTags,
    BIconCollection,
    BIconX,
    BIconExclamationTriangleFill,
    LayoutFeedbackModal,
    MarkerSetup,
    TrialLayoutCorners,
    TraitIcon
  },
  data: function () {
    return {
      tabIndex: 0,
      trialName: null,
      trialDescription: null,
      socialConfigVisible: false,
      trialSocialConfig: {
        title: null,
        text: null,
        url: null
      },
      trialGroup: null,
      traits: [],
      layout: {
        rows: null,
        columns: null,
        corners: null,
        markers: null
      },
      formState: {
        trialName: null,
        trialDescription: null
      },
      tabCorrect: {
        markers: null,
        corners: null,
        traits: null
      },
      layoutFeedback: null,
      trialGroups: [],
      traitsToExport: null
    }
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    traitGroups: function () {
      const set = new Set()

      if (this.traits && this.traits.length > 0) {
        this.traits.forEach(t => {
          if (t.group && t.group !== '') {
            set.add(t.group)
          }
        })
      }

      if (set.size > 0) {
        return [...set].sort((a, b) => a.localeCompare(b))
      } else {
        return []
      }
    }
  },
  watch: {
    trial: {
      immediate: true,
      handler: function () {
        this.reset(true)
      }
    },
    tabIndex: function (newValue) {
      if (newValue === 2 && this.$refs.trialLayoutCorners) {
        this.$nextTick(() => this.$refs.trialLayoutCorners.invalidateSize())
      } else if (newValue === 1 && this.$refs.markerSetup) {
        this.$nextTick(() => this.$refs.markerSetup.update())
      }
    }
  },
  methods: {
    importExportGerminate: function (xport) {
      if (xport && this.traits && this.traits.length > 0) {
        const temp = JSON.parse(JSON.stringify(this.traits))
        temp.forEach(t => {
          delete t.id
          delete t.progress
          delete t.editable
          delete t.color
        })
        this.traitsToExport = temp
      } else {
        this.traitsToExport = null
      }

      this.$nextTick(() => this.$refs.traitImportExportGerminateModal.show())
    },
    importExportJson: function (xport) {
      if (xport && this.traits && this.traits.length > 0) {
        const temp = JSON.parse(JSON.stringify(this.traits))
        temp.forEach(t => {
          delete t.id
          delete t.progress
          delete t.editable
          delete t.color
        })
        this.traitsToExport = temp
      } else {
        this.traitsToExport = null
      }

      this.$nextTick(() => this.$refs.traitImportExportGridScoreModal.show())
    },
    reset: function (useTrial = false) {
      this.socialConfigVisible = false
      this.layoutFeedback = null
      this.tabIndex = 0
      this.traitsToExport = null
      if (useTrial && this.trial) {
        this.trialName = this.trial.name
        this.trialDescription = this.trial.description
        this.trialSocialConfig = this.trial.socialShareConfig || { title: null, text: null, url: null }
        this.trialGroup = this.trial.group ? this.trial.group.name : null
        this.traits = JSON.parse(JSON.stringify(this.trial.traits))
        this.traits.forEach(t => {
          if (t.group) {
            t.group = t.group.name
          }
        })
        this.layout = JSON.parse(JSON.stringify(this.trial.layout))
      } else {
        this.trialName = null
        this.trialDescription = null
        this.trialSocialConfig = { title: null, text: null, url: null }
        this.trialGroup = null
        this.traits = []
      }

      this.formState = {
        trialName: null,
        trialDescription: null,
        trialGroup: null
      }
      this.tabCorrect = {
        markers: null,
        corners: null,
        traits: null
      }

      getTrialGroups().then(groups => {
        this.trialGroups = groups || []
      })
    },
    updateTrial: function () {
      const feedback = []

      this.formState = {
        trialName: this.trialName !== undefined && this.trialName !== null && this.trialName !== '',
        trialDescription: true,
        trialGroup: true
      }

      if (this.layout.corners) {
        this.tabCorrect.corners = isGeographyValid(this.layout.corners) || isGeographyAllNull(this.layout.corners)

        if (!this.tabCorrect.corners) {
          feedback.push(this.$t('formFeedbackSetupInvalidCorners'))
        }
      } else {
        this.tabCorrect.corners = true
      }

      if (this.layout.markers) {
        this.tabCorrect.markers = this.layout.markers === null || (this.layout.markers.anchor && this.layout.markers.everyRow > 0 && this.layout.markers.everyRow <= this.layout.rows && this.layout.markers.everyColumn > 0 && this.layout.markers.everyColumn <= this.layout.columns)

        if (!this.tabCorrect.markers) {
          feedback.push(this.$t('formFeedbackSetupInvalidMarkers'))
        }
      } else {
        this.tabCorrect.markers = true
      }

      this.tabCorrect.traits = this.traits.every(t => t.name !== undefined && t.name !== null && t.name !== '')

      this.layoutFeedback = feedback

      if (this.tabCorrect.corners && this.tabCorrect.markers && this.tabCorrect.traits && this.formState.trialName && this.formState.trialDescription) {
        const finalTraits = JSON.parse(JSON.stringify(this.traits))
        finalTraits.forEach(t => {
          if (t.group) {
            t.group = {
              name: t.group
            }
          }
        })

        updateTrialProperties(this.trial.localId, {
          name: this.trialName,
          description: this.trialDescription,
          socialShareConfig: this.trialSocialConfig,
          group: { name: this.trialGroup },
          markers: this.layout.markers,
          corners: this.layout.corners,
          traits: finalTraits
        }).then(() => {
          emitter.emit('trials-updated')
          this.hide()
        })
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.trialModificationModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialModificationModal.hide())

      this.localSettings = null
    }
  }
}
</script>

<style scoped>
</style>
