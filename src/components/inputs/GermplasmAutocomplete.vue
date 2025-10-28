<template>
  <v-autocomplete
    v-model="searchMatch"
    :items="trialGermplasm"
    auto-select-first
    item-value="artificialId"
    item-title="displayName"
    :label="$t(label)"
    :hide-details="hint === undefined"
    :autofocus="store.storeAutoSelectSearch !== false"
    :density="density"
    return-object
    clearable
    :multiple="multiple"
    :chips="multiple"
    autocomplete="off"
    :hint="hint"
    :persistent-hint="hint !== undefined"
    :custom-filter="filterGermplasm"
    ref="searchField"
    :prepend-inner-icon="mdiMagnify"
  >
    <template #item="{ props, item }">
      <v-list-item
        v-bind="props"
      >
        <template #title><PlotInformation :cell="item.raw" /></template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
  import { getTrialDataCached, getTrialGermplasmCached } from '@/plugins/datastore'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { filterGermplasm } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiMagnify } from '@mdi/js'

  const store = coreStore()

  const searchMatch = defineModel<CellPlus[]>('searchMatch')
  const trialGermplasm = ref<CellPlus[]>([])

  export interface GermplasmAutoCompleteProps {
    trial: TrialPlus
    density?: 'default' | 'comfortable' | 'compact'
    multiple?: boolean
    label?: string
    hint?: string
  }

  const compProps = withDefaults(defineProps<GermplasmAutoCompleteProps>(), {
    density: 'default',
    multiple: false,
    label: 'formLabelSearch',
  })

  const searchField = useTemplateRef('searchField')

  function getTrialGermplasm () {
    const data = getTrialDataCached()

    if (data && compProps.trial) {
      trialGermplasm.value = getTrialGermplasmCached()
    }
  }

  function focus () {
    if (store.storeAutoSelectSearch) {
      nextTick(() => searchField.value?.focus())
    }
  }

  watch(() => compProps.trial, async () => {
    getTrialGermplasm()
  })

  onMounted(() => {
    if (compProps.trial) {
      getTrialGermplasm()
    }
  })

  defineExpose({
    focus,
  })
</script>
