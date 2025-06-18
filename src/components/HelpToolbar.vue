<template>
  <div id="help-toolbar" class="position-absolute w-100">
    <b-button-toolbar v-if="expanded" class="bg-dark d-flex flex-column flex-sm-row justify-content-between">
      <b-button-group class="flex-wrap">
        <b-button variant="dark" @click="install" v-if="showInstall"><IBiBoxArrowDown /> Install GridScore</b-button>
        <b-button variant="dark" href="mailto:sebastian.raubach@hutton.ac.uk?subject=GridScore"><IBiPersonRaisedHand /> Help</b-button>
        <b-button variant="dark" href="https://cropgeeks.github.io/gridscore-next-client" target="_blank"><IBiInfoCircleFill /> Documentation</b-button>
      </b-button-group>
      <b-button-group class="flex-wrap">
        <b-button variant="dark" href="https://github.com/cropgeeks/gridscore-next-client/issues/new/choose"><IBiGithub /> Suggestions</b-button>
      </b-button-group>
    </b-button-toolbar>

    <span id="toggle" class="bg-dark rounded-pill rounded-top-0" @click="expanded = !expanded">
      <IBiChevronUp v-if="expanded" class="text-white" />
      <IBiChevronDown v-else class="text-white" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import emitter from 'tiny-emitter/instance'

const expanded = ref<boolean>(false)
const showInstall = ref<boolean>(false)

let deferredPrompt: any

async function install () {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    emitter.emit('plausible-event', { key: 'installation', props: { userChoice: outcome } })

    deferredPrompt = undefined
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Stash the event so it can be triggered later.
    deferredPrompt = e

    expanded.value = true
    showInstall.value = true
  })
})
</script>

<style>
#help-toolbar {
  z-index: 100;
}

#help-toolbar #toggle {
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
</style>
