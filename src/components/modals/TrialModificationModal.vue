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
          <b-container>
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
          <b-container>
            <p>{{ $t('pageTrialLayoutCornersText') }}</p>
            <TrialLayoutCorners ref="trialLayoutCorners" :layout="layout" @change="(corners) => { layout.corners = corners }" />
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
import { isGeographyValid, isGeographyAllNull } from '@/plugins/location'
import { BIconTextareaT, BIconCardText, BIconArrowsFullscreen, BIconBoundingBoxCircles, BIconCheck, BIconX, BIconExclamationTriangleFill } from 'bootstrap-vue'
import { updateTrialProperties } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconTextareaT,
    BIconCardText,
    BIconArrowsFullscreen,
    BIconBoundingBoxCircles,
    BIconCheck,
    BIconX,
    BIconExclamationTriangleFill,
    LayoutFeedbackModal,
    MarkerSetup,
    TrialLayoutCorners
  },
  data: function () {
    return {
      tabIndex: 0,
      trialName: null,
      trialDescription: null,
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
        corners: null
      },
      layoutFeedback: null
    }
  },
  props: {
    trial: {
      type: Object,
      default: () => null
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
        this.layout = JSON.parse(JSON.stringify(this.trial.layout))
      } else {
        this.trialName = null
        this.trialDescription = null
      }

      this.formState = {
        trialName: null,
        trialDescription: null
      }
      this.tabCorrect = {
        markers: null,
        corners: null
      }
    },
    updateTrial: function () {
      const feedback = []

      this.formState = {
        trialName: this.trialName !== undefined && this.trialName !== null && this.trialName !== '',
        trialDescription: true
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

      this.layoutFeedback = feedback

      if (this.tabCorrect.corners && this.tabCorrect.markers && this.formState.trialName && this.formState.trialDescription) {
        updateTrialProperties(this.trial.localId, {
          name: this.trialName,
          description: this.trialDescription,
          markers: this.layout.markers,
          corners: this.layout.corners
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
