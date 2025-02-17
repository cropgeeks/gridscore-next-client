<template>
  <span :style="{ color: trait.color }">
    <TraitIcon :trait="trait" />
    <span class="mx-1 trait-name">{{ trait.name }}</span>
    <b-badge class="mx-1 trait-data-type" variant="light">{{ traitTypeText }}</b-badge>
    <IBiCardText class="text-muted mx-1" v-b-tooltip="trait.description" v-if="showDescription && trait.description" />
    <BPopover
      v-if="trait.imageUrl || (trait.hasImage && traitImageConfig.priorityShareCode && traitImageConfig.serverUrl)"
      custom-class="trait-image"
      :click="true"
      :close-on-hide="true"
      ref="traitImagePopover"
    >
      <b-img @click="$refs.traitImageModal.show()" fluid-grow :src="trait.imageUrl || `${traitImageConfig.serverUrl}trait/${traitImageConfig.priorityShareCode}/${trait.id}/img`" crossorigin="anonymous" />
      <template #target>
        <b-badge class="mx-1" variant="light">
          <IBiImage />
        </b-badge>
      </template>
    </BPopover>

    <b-modal
      v-if="trait.hasImage"
      ref="traitImageModal"
      :fullscreen="true"
      hide-footer
      hide-header
      no-fade
      @show="$refs.traitImagePopover.hide()">
      <b-img fluid-grow class="fullscreen-image" @click="$refs.traitImageModal.hide()" :src="trait.imageUrl || `${traitImageConfig.serverUrl}trait/${traitImageConfig.priorityShareCode}/${trait.id}/img`" crossorigin="anonymous" />
    </b-modal>
  </span>
</template>

<script>
import TraitIcon from '@/components/icons/TraitIcon.vue'
import { getTrialCached } from '@/plugins/datastore';
import { getPriorityShareCode, getServerUrl, getTraitTypeText } from '@/plugins/misc'

export default {
  components: {
    TraitIcon
  },
  props: {
    trait: {
      type: Object,
      default: () => { return { name: null, dataType: 'date' } }
    },
    traitIndex: {
      type: Number,
      default: 0
    },
    short: {
      type: Boolean,
      default: false
    },
    showDescription: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    traitImageConfig: function () {
      const trial = getTrialCached()

      if (trial) {
        return {
          serverUrl: getServerUrl(trial),
          priorityShareCode: getPriorityShareCode(trial)
        }
      }
    },
    priorityShareCode: function () {
      if (this.trial && this.trial.shareStatus !== TRIAL_STATE_NOT_SHARED) {
        return this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode || this.trial.shareCodes.viewerCode
      } else {
        return null
      }
    },
    traitTypeText: function () {
      if (this.trait) {
        return getTraitTypeText(this.trait, this.short)
      } else {
        return null
      }
    }
  }
}
</script>

<style>
.trait-image {
  max-width: 100vw;
  max-height: 100vh;
  height: auto;
}

@media (min-width: 992px) {
  .trait-image {
    max-width: 50vw;
    max-height: 50vh;
    height: auto;
  }
}
</style>
