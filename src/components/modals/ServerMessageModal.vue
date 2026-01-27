<template>
  <b-modal :title="$t('modalTitleServerMessages')"
           :ok-title="$t('buttonClose')"
           ok-only
           scrollable
           no-fade
           size="lg"
           @hidden="$emit('modal-hidden')"
           ref="serverMessageModal">
    <b-alert variant="info" :model-value="true">
      <span v-html="$t('modalTextServerMessages')" />
    </b-alert>

    <b-card
      v-for="message in visibleMessages"
      :key="`message-${message.date}-${message.title}`"
      :title="message.title"
    >
      <b-card-subtitle v-if="message.date" class="mb-3 d-flex flex-wrap justify-content-between">
        <span><IBiCalendarDate /> {{ new Date(message.date).toLocaleDateString() }}</span>
        <b-badge :variant="messageSeverity[message.severity].variant">{{ messageSeverity[message.severity].text }}</b-badge>
      </b-card-subtitle>

      <span v-html="message.message" />
    </b-card>
  </b-modal>
</template>

<script lang="ts" setup>
import { coreStore } from '@/store'
import type { ServerMessage } from '@/plugins/types/client'
import { useI18n } from 'vue-i18n'

import semver from 'semver'
import { gridScoreVersion } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

// Composition stuff
const store = coreStore()
const { t } = useI18n()

const serverMessageModal = useTemplateRef('serverMessageModal')

const messages = ref<ServerMessage[]>([])
const visibleMessages = ref<ServerMessage[]>([])

const messageSeverity = computed(() => {
  return {
    info: { variant: 'info', text: t('serverMessageSeverityInfo') },
    warning: { variant: 'warning', text: t('serverMessageSeverityWarning') },
    error: { variant: 'danger', text: t('serverMessageSeverityError') }
  }
})

function updateVisibleMessages (forced = false) {
  const smlco = store.storeServerMessagesCheckedOn

  const currentVersion = gridScoreVersion

  let arr = messages.value.filter(m => {
    if (m.minVersion && !semver.gte(currentVersion, m.minVersion)) {
      return false
    }
    if (m.maxVersion && !semver.lte(currentVersion, m.maxVersion)) {
      return false
    }

    return true
  })
  if (smlco) {
    arr = arr.filter(m => new Date(m.date).getTime() > new Date(smlco).getTime())
  }

  visibleMessages.value = arr

  emitter.emit('show-toast', {
    message: t('toastNoMatchingDataFound'),
    variant: 'info',
    autoHideDelay: 5000,
    appendToast: true
  })
}

function getMessages (forced = false) {
  messages.value = []

  fetch(`https://ics.hutton.ac.uk/get-gridscore/servermessages.json?ts=${Date.now()}`)
    .then(response => response.json())
    .then(json => {
      if (Array.isArray(json)) {
        if (json.length > 0) {
          messages.value = json
          updateVisibleMessages(forced)
        }
      }
    })
    .catch(() => {
      messages.value = []
    })
}

onMounted(() => {
  getMessages()

  emitter.on('show-server-messages', getMessages)
})

onBeforeUnmount(() => {
  emitter.off('show-server-messages', getMessages)
})

watch(visibleMessages, async newValue => {
  if (newValue.length > 0) {
    serverMessageModal.value.show()

    store.setServerMessagesCheckedOn(new Date().toISOString().split('T')[0])
  }
})

</script>

<style scoped>
</style>
