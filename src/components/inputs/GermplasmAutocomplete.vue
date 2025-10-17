<template>
  <v-autocomplete
    v-model="searchMatch"
    :items="trialGermplasm"
    auto-select-first
    item-value="artificialId"
    item-title="displayName"
    :label="$t('formLabelSearch')"
    hide-details
    autofocus
    :density="density"
    return-object
    clearable
    autocomplete="off"
    :custom-filter="filterGermplasm"
    ref="searchField"
    prepend-inner-icon="mdi-magnify"
  >
    <template #item="{ props, item }">
      <v-list-item
        v-bind="props"
        :title="item.raw.displayName || item.raw.germplasm"
      >
        <PlotInformation :cell="item.raw" />
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
  import { getTrialDataCached, getTrialGermplasmCached } from '@/plugins/datastore'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { filterGermplasm } from '@/plugins/util'

  const searchMatch = defineModel<CellPlus>()
  const trialGermplasm = ref<CellPlus[]>([])

  export interface GermplasmAutoCompleteProps {
    trial: TrialPlus
    density?: 'default' | 'comfortable' | 'compact'
  }

  const compProps = withDefaults(defineProps<GermplasmAutoCompleteProps>(), {
    density: 'default',
  })

  const searchField = useTemplateRef('searchField')

  function getTrialGermplasm () {
    const data = getTrialDataCached()

    if (data && compProps.trial) {
      trialGermplasm.value = getTrialGermplasmCached()
    }
  }

  function focus () {
    nextTick(() => searchField.value?.focus())
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
