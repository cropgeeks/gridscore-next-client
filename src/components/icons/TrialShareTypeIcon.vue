<template>
  <span>
    <span v-if="shareStatus === TRIAL_STATE_OWNER">
      <component :is="iconTag" :class="iconClass"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-incognito" viewBox="0 0 16 16"><path fill-rule="evenodd" d="m4.736 1.968-.892 3.269-.014.058C2.113 5.568 1 6.006 1 6.5 1 7.328 4.134 8 8 8s7-.672 7-1.5c0-.494-1.113-.932-2.83-1.205a1.032 1.032 0 0 0-.014-.058l-.892-3.27c-.146-.533-.698-.849-1.239-.734C9.411 1.363 8.62 1.5 8 1.5c-.62 0-1.411-.136-2.025-.267-.541-.115-1.093.2-1.239.735Zm.015 3.867a.25.25 0 0 1 .274-.224c.9.092 1.91.143 2.975.143a29.58 29.58 0 0 0 2.975-.143.25.25 0 0 1 .05.498c-.918.093-1.944.145-3.025.145s-2.107-.052-3.025-.145a.25.25 0 0 1-.224-.274ZM3.5 10h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5Zm-1.5.5c0-.175.03-.344.085-.5H2a.5.5 0 0 1 0-1h3.5a1.5 1.5 0 0 1 1.488 1.312 3.5 3.5 0 0 1 2.024 0A1.5 1.5 0 0 1 10.5 9H14a.5.5 0 0 1 0 1h-.085c.055.156.085.325.085.5v1a2.5 2.5 0 0 1-5 0v-.14l-.21-.07a2.5 2.5 0 0 0-1.58 0l-.21.07v.14a2.5 2.5 0 0 1-5 0v-1Zm8.5-.5h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5Z"/></svg></component>
      <a href="#" @click="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeOwnerTitle' : 'trialShareOwnerTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeOwnerTitle' : 'trialShareOwnerTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_EDITOR">
      <component :is="iconTag" :class="iconClass"><BIconPencilSquare /></component>
      <a href="#" @click="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeEditorTitle' : 'trialShareEditorTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeEditorTitle' : 'trialShareEditorTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_VIEWER">
      <component :is="iconTag" :class="iconClass"><BIconEye /></component>
      <a href="#" @click="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeViewerTitle' : 'trialShareViewerTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeViewerTitle' : 'trialShareViewerTitle') }}</span>
    </span>
    <span v-else-if="shareStatus === TRIAL_STATE_NOT_SHARED">
      <component :is="iconTag" :class="iconClass"><BIconXSquare /></component>
      <a href="#" @click="$emit('on-share-clicked')" v-if="isLink"> {{ $t(isTextCode ? 'trialShareCodeNoneTitle' : 'trialShareNoneTitle') }}</a>
      <span v-else> {{ $t(isTextCode ? 'trialShareCodeNoneTitle' : 'trialShareNoneTitle') }}</span>
    </span>
  </span>
</template>

<script>
import { TRIAL_STATE_NOT_SHARED, TRIAL_STATE_EDITOR, TRIAL_STATE_OWNER, TRIAL_STATE_VIEWER } from '@/plugins/constants'
import { BIconPencilSquare, BIconEye, BIconXSquare } from 'bootstrap-vue'

export default {
  components: {
    BIconPencilSquare,
    BIconEye,
    BIconXSquare
  },
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
