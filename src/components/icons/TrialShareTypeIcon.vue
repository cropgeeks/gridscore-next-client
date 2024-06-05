<template>
  <span>
    <span v-if="shareStatus === TRIAL_STATE_OWNER">
      <component :is="iconTag" :class="iconClass"><IBiIncognito/></component>
      <a href="#" @click.prevent="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeOwnerTitle' : 'trialShareOwnerTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeOwnerTitle' : 'trialShareOwnerTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_EDITOR">
      <component :is="iconTag" :class="iconClass"><IBiPencilSquare /></component>
      <a href="#" @click.prevent="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeEditorTitle' : 'trialShareEditorTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeEditorTitle' : 'trialShareEditorTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_VIEWER">
      <component :is="iconTag" :class="iconClass"><IBiEye /></component>
      <a href="#" @click.prevent="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeViewerTitle' : 'trialShareViewerTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeViewerTitle' : 'trialShareViewerTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_NOT_SHARED">
      <component :is="iconTag" :class="iconClass"><IBiXSquare /></component>
      <a href="#" @click.prevent="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeNoneTitle' : 'trialShareNoneTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeNoneTitle' : 'trialShareNoneTitle') }}</span>
    </span>
  </span>
</template>

<script>
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'

export default {
  props: {
    iconTag: {
      type: String,
      default: 'span'
    },
    iconClass: {
      type: String,
      default: ''
    },
    shareStatus: {
      type: String,
      default: TRIAL_STATE_NOT_SHARED
    },
    isTextCode: {
      type: Boolean,
      default: true
    },
    isLink: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      TRIAL_STATE_NOT_SHARED,
      TRIAL_STATE_EDITOR,
      TRIAL_STATE_OWNER,
      TRIAL_STATE_VIEWER
    }
  }
}
</script>

<style>

</style>
