<template>
  <v-dialog
    v-model="dialog"
    max-width="min(90vw, 1024px)"
    ref="serverMessageModal"
  >
    <v-card :title="$t('modalTitleServerMessages')">
      <template #text>
        <v-alert
          color="info"
          :icon="mdiInformation"
          density="compact"
          :text="$t('modalTextServerMessages')"
          variant="tonal"
          class="mb-5"
          border="start"
        />

        <v-card
          v-for="message in visibleMessages"
          :key="`message-${message.date}-${message.title}`"
          :title="message.title"
        >
          <template #subtitle v-if="message.date">
            <div class="mb-3 d-flex flex-wrap justify-space-between">
              <v-chip label :prepend-icon="mdiCalendar" :text="new Date(message.date).toLocaleDateString()" />
              <v-chip label variant="tonal" :color="messageSeverity[message.severity].variant" :text="messageSeverity[message.severity].text" />
            </div>
          </template>

          <template #text>
            <p v-html="message.message" />
          </template>
        </v-card>
      </template>

      <template #actions>
        <v-spacer />
        <v-btn :text="$t('buttonClose')" color="primary" variant="tonal" @click="dialog = false" />
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { coreStore } from '@/stores/app'
  import type { ServerMessage } from '@/plugins/types/client'
  import { useI18n } from 'vue-i18n'

  import semver from 'semver'
  import { gridScoreVersion } from '@/plugins/constants'
  import { mdiCalendar, mdiInformation } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  // Composition stuff
  const store = coreStore()
  const { t } = useI18n()

  const dialog = ref(false)

  const messages = ref<ServerMessage[]>([])
  const visibleMessages = ref<ServerMessage[]>([])

  const messageSeverity = computed(() => {
    return {
      info: { variant: 'info', text: t('serverMessageSeverityInfo') },
      warning: { variant: 'warning', text: t('serverMessageSeverityWarning') },
      error: { variant: 'error', text: t('serverMessageSeverityError') },
    }
  })

  function updateVisibleMessages (forced = false) {
    const smlco = store.storeServerMessagesCheckedOn

    const currentVersion = gridScoreVersion

    let arr = messages.value.filter((m: ServerMessage) => {
      if (m.minVersion && !semver.gte(currentVersion, m.minVersion)) {
        return false
      }
      if (m.maxVersion && !semver.lte(currentVersion, m.maxVersion)) {
        return false
      }

      return true
    })
    if (smlco) {
      arr = arr.filter((m: ServerMessage) => new Date(m.date).getTime() > new Date(smlco).getTime())
    }

    visibleMessages.value = arr

    if (forced && arr.length === 0) {
      // Show toast
      emitter.emit('show-snackbar', {
        text: t('toastNoMatchingDataFound'),
        color: 'info',
      })
    }
  }

  function getMessages (forced = false) {
    messages.value = []

    fetch(`https://ics.hutton.ac.uk/get-gridscore/servermessages.json?ts=${Date.now()}`)
      .then(response => response.json())
      .then(json => {
        if (Array.isArray(json) && json.length > 0) {
          messages.value = json
          updateVisibleMessages(forced)
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
      dialog.value = true

      emitter.emit('plausible-event', { key: 'server-messages-shown', props: { date: newValue[newValue.length - 1]?.date } })

      store.setServerMessagesCheckedOn(new Date().toISOString().split('T')[0])
    }
  })
</script>

<style scoped>
</style>
