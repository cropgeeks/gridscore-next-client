<template>
  <v-text-field
    v-model="brapiUrl"
    :label="$t('formLabelBrapiUrl')"
    :messages="['f']"
    type="url"
    required
  >
    <template #message>
      <span v-html="$t('formDescriptionBrapiUrl')" />
    </template>
  </v-text-field>

  <v-text-field
    v-model="brapiToken"
    class="mt-3"
    :label="$t('formLabelBrapiToken')"
    :hint="$t('formDescriptionBrapiToken')"
    persistent-hint
  />

  <v-btn
    class="mt-3"
    :prepend-icon="mdiRefresh"
    :text="$t('buttonUpdate')"
    color="primary"
    variant="tonal"
    :disabled="!brapiUrl || brapiUrl.trim().length === 0"
    @click="save"
  />
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'
  import { mdiRefresh } from '@mdi/js'

  const store = coreStore()

  const brapiUrl = ref<string | undefined>(store.storeBrapiConfig?.url)
  const brapiToken = ref<string | undefined>(store.storeBrapiConfig?.token)

  function save () {
    store.setBrapiConfig({
      url: brapiUrl.value,
      token: brapiToken.value,
    })

    emit('brapi-config-updated')
  }

  const emit = defineEmits(['brapi-config-updated'])
</script>
