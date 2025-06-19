<template>
  <div id="help-toolbar" :class="`position-absolute w-100 ${expanded ? '' : 'hidden'}`">
    <b-button-toolbar class="bg-dark flex-column flex-sm-row justify-content-between">
      <b-button-group class="flex-wrap">
        <b-button variant="primary" @click="install" v-if="showInstall"><IBiBoxArrowDown /> <span>{{ $t('widgetHelpToolbarInstall') }}</span></b-button>
        <b-button variant="dark" @click="installHelpModal.show()" v-else-if="!isInstalledAndroid"><IBiBoxArrowDown /> <span>{{ $t('widgetHelpToolbarInstall') }}</span></b-button>
        <b-button variant="dark" href="mailto:sebastian.raubach@hutton.ac.uk?subject=GridScore"><IBiPersonRaisedHand /> <span>{{ $t('widgetHelpToolbarSupport') }}</span></b-button>
        <b-button variant="dark" href="https://cropgeeks.github.io/gridscore-next-client" target="_blank"><IBiInfoCircleFill /> <span>{{ $t('widgetHelpToolbarDocumentation') }}</span></b-button>
      </b-button-group>
      <b-button-group class="flex-wrap">
        <b-button variant="dark" href="https://github.com/cropgeeks/gridscore-next-client/issues/new/choose" target="_blank"><IBiGithub /> <span>{{ $t('widgetHelpToolbarSuggestions') }}</span></b-button>
      </b-button-group>
    </b-button-toolbar>

    <span id="toggle" :class="`${expanded ? 'bg-primary' : 'bg-dark'} rounded-pill rounded-top-0`" @click="expanded = !expanded">
      <IBiChevronDown class="text-white" />
    </span>

    <b-modal
      ref="installHelpModal"
      :ok-title="$t('buttonClose')"
      ok-only
      :title="$t('widgetHelpToolbarInstall')">

      <p>{{ $t('widgetHelpToolbarInstallInstructions') }}</p>

      <b-button variant="primary" href="https://www.installpwa.com/from/gridscore.hutton.ac.uk" target="_blank">{{ $t('widgetHelpToolbarInstallInstructionsButton') }}</b-button>
    </b-modal>
  </div>
</template>

<script lang="ts" setup>
import emitter from 'tiny-emitter/instance'
import { coreStore } from '@/store'

// COMPOSITION
const store = coreStore()
const route = useRoute()

// REFS
const installHelpModal = ref()
const expanded = ref<boolean>(false)
const showInstall = ref<boolean>(false)

let deferredPrompt: any

watch(expanded, async newValue => {
  if (newValue === false && showInstall.value) {
    store.setToolbarHiddenAfterInstallShown(true)
  }
})

async function install () {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    emitter.emit('plausible-event', { key: 'installation', props: { userChoice: outcome } })

    showInstall.value = false
    deferredPrompt = undefined
  }
}

const isInstalledAndroid: ComputedRef<boolean> = computed(() => {
  // @ts-ignore
  return document.referrer.startsWith('android-app://') || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
})

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Stash the event so it can be triggered later.
    deferredPrompt = e

    if (!store.toolbarHiddenAfterInstallShown && route.name === 'home') {
      expanded.value = true
    }
    showInstall.value = true
  })
})
</script>

<style>
#help-toolbar .btn-toolbar {
  box-sizing: content-box;
  border-bottom: 1px solid var(--bs-primary);
}

#help-toolbar.hidden .btn-toolbar,
#help-toolbar.hidden .btn-toolbar .btn,
#help-toolbar.hidden .btn-toolbar .btn * {
  height: 0;
  padding: 0;
  margin: 0;
  border: 0;
}
#help-toolbar.hidden .btn-toolbar .btn span {
  display: none;
}

#help-toolbar {
  z-index: 100;
}

#help-toolbar #toggle {
  z-index: -1;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 1em 0.4em 1em;
  margin-bottom: -1.5em;
  margin-inline: auto; 
  width: fit-content;
}

#help-toolbar #toggle:hover {
  cursor: pointer;
}

#help-toolbar.hidden #toggle svg {
  transform: rotate(0);
}

#help-toolbar #toggle svg {
  transform: rotate(180deg);
  transition: transform .35s ease;
}
</style>
