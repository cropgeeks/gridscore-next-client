<template>
  <v-row>
    <v-col cols="12" md="6">
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
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="brapiToken"
        :label="$t('formLabelBrapiToken')"
        :hint="$t('formDescriptionBrapiToken')"
        persistent-hint
      />
    </v-col>
  </v-row>

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
  import { updateTrialBrapiConfig } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import type { BrapiConfig } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { mdiRefresh } from '@mdi/js'

  const compProps = defineProps<{
    trial?: TrialPlus
  }>()

  const store = coreStore()

  const brapiUrl = ref<string | undefined>(store.storeBrapiConfig?.url)
  const brapiToken = ref<string | undefined>(store.storeBrapiConfig?.token)

  function save () {
    const config: BrapiConfig = {
      url: brapiUrl.value,
      token: brapiToken.value === '' ? undefined : brapiToken.value,
    }
    store.setBrapiConfig(config)

    if (compProps.trial) {
      updateTrialBrapiConfig(compProps.trial.localId || '', config)
        .then(() => emit('brapi-config-updated'))
    } else {
      emit('brapi-config-updated')
    }
  }

  const emit = defineEmits(['brapi-config-updated'])
</script>
