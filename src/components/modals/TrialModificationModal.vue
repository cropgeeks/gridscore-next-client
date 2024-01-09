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

            <!-- Trial social media sharing content -->
            <b-form-group label-for="trial-social-content" :description="$t('formDescriptionTrialSetupTrialSocialContent')">
              <template v-slot:label>
                <BIconShareFill /><span> {{ $t('formLabelTrialSetupTrialSocialContent') }}</span>
              </template>
              <b-form-textarea id="trial-social-content" :state="formState.trialSocialContent" v-model="trialSocialContent" />
            </b-form-group>
          </b-col>
        </b-row>
      </b-form>

      <b-tabs v-model="tabIndex">
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
        <b-tab>
          <template #title>
            <BIconTags />
            <span> {{ $t('pageTrialSetupCardTraitsTitle') }} </span>
            <BIconCheck class="text-success" v-if="tabCorrect.traits === true" />
            <BIconX class="text-danger" v-else-if="tabCorrect.traits === false" />
          </template>
          <b-container class="mt-3">
            <p>{{ $t('pageTrialEditTraitText') }}</p>
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
      </b-tabs>

      <b-button variant="danger" v-if="layoutFeedback && layoutFeedback.length > 0" class="align-self-center my-2" @click="$refs.layoutFeedbackModal.show()"><BIconExclamationTriangleFill /> {{ $tc('formFeedbackLayout', layoutFeedback.length) }}</b-button>
    </div>
    <LayoutFeedbackModal :feedback="layoutFeedback" ref="layoutFeedbackModal" />
  </b-modal>
</template>

<script>
import TrialLayoutCorners from '@/components/TrialLayoutCorners'
import MarkerSetup from '@/components/MarkerSetup'
import LayoutFeedbackModal from '@/components/modals/LayoutFeedbackModal'
import TraitIcon from '@/components/icons/TraitIcon'
import { isGeographyValid, isGeographyAllNull } from '@/plugins/location'
import { BIconTextareaT, BIconCardText, BIconArrowsFullscreen, BIconCollection, BIconShareFill, BIconBoundingBoxCircles, BIconTags, BIconCheck, BIconX, BIconExclamationTriangleFill } from 'bootstrap-vue'
import { updateTrialProperties, getTrialGroups } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconTextareaT,
    BIconCardText,
    BIconArrowsFullscreen,
    BIconBoundingBoxCircles,
    BIconCheck,
    BIconTags,
    BIconCollection,
    BIconShareFill,
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
      trialSocialContent: null,
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
        trialDescription: null,
        trialSocialContent: null
      },
      tabCorrect: {
        markers: null,
        corners: null,
        traits: null
      },
      layoutFeedback: null,
      trialGroups: []
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
      if (newValue === 1 && this.$refs.trialLayoutCorners) {
        this.$nextTick(() => this.$refs.trialLayoutCorners.invalidateSize())
      } else if (newValue === 0 && this.$refs.markerSetup) {
        this.$nextTick(() => this.$refs.markerSetup.update())
      }
    }
  },
  methods: {
    reset: function (useTrial = false) {
      this.layoutFeedback = null
      this.tabIndex = 0
      if (useTrial && this.trial) {
        this.trialName = this.trial.name
        this.trialDescription = this.trial.description
        this.trialSocialContent = this.trial.socialShareContent || null
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
        this.trialSocialContent = null
        this.trialGroup = null
        this.traits = []
      }

      this.formState = {
        trialName: null,
        trialDescription: null,
        trialSocialContent: null,
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
        trialSocialContent: true,
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
          socialShareContent: this.trialSocialContent,
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
