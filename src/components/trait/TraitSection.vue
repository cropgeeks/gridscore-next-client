<template>
  <v-list-item v-if="trait" slim class="px-1">
    <template #prepend>
      <v-icon icon="mdi-circle" :color="trait.color" size="x-large" />
    </template>
    <template #title>
      <div class="d-flex flex-wrap align-center justify-space-between ga-2">
        <div class="d-flex flex-wrap align-center ga-2">
          <span class="text-h6" :style="{ color: trait.color }">{{ trait.name }}</span>
          <template v-if="showDetails">
            <v-chip size="small" label :text="$t((shortTitle ? dataTypeMap[trait.dataType]?.shortTitle : dataTypeMap[trait.dataType]?.title) || '')" :prepend-icon="dataTypeMap[trait.dataType]?.icon" />
            <v-chip size="small" label v-tooltip:top="$t(trait.allowRepeats ? 'tooltipTraitAllowRepeatsTrue' : 'tooltipTraitAllowRepeatsFalse')">
              <v-icon :icon="trait.allowRepeats ? 'mdi-repeat' : 'mdi-repeat-off'" />
            </v-chip>
            <v-chip size="small" label v-tooltip:top="$t('tooltipTraitSetSize')" :text="$n(trait.setSize || 1)" prepend-icon="mdi-set-split" />
          </template>
        </div>
      </div>
    </template>
    <template #append>
      <div class="d-flex flex-wrap ga-2">
        <slot name="default" />
      </div>
    </template>
    <template #subtitle v-if="showDetails && (trait.description || (trait.restrictions && (trait.restrictions.min !== undefined || trait.restrictions.max !== undefined)) || trait.timeframe)">
      <div class="d-flex flex-column">
        <div :class="store.storeShowFullTraitDescription ? 'text-wrap' : undefined" v-if="trait.description">{{ trait.description }}</div>
        <v-chip-group v-if="trait.restrictions || trait.timeframe">
          <v-chip label size="x-small" v-if="trait.restrictions && (trait.restrictions.min !== undefined) && (trait.restrictions.min !== null)" prepend-icon="mdi-greater-than-or-equal" :text="trait.restrictions.min" />
          <v-chip label size="x-small" v-if="trait.restrictions && (trait.restrictions.max !== undefined) && (trait.restrictions.max !== null)" prepend-icon="mdi-less-than-or-equal" :text="trait.restrictions.max" />
          <v-chip label size="x-small" v-tooltip:bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :color="trait.editable ? 'muted' : 'error'" v-if="trait.timeframe && trait.timeframe.start" prepend-icon="mdi-greater-than-or-equal" :text="trait.timeframe.start" />
          <v-chip label size="x-small" v-tooltip:bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :color="trait.editable ? 'muted' : 'error'" v-if="trait.timeframe && trait.timeframe.end" prepend-icon="mdi-less-than-or-equal" :text="trait.timeframe.end" />
        </v-chip-group>
      </div>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
  import { dataTypeMap } from '@/plugins/constants'
  import type { TraitPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  const store = coreStore()

  export interface TraitSectionProps {
    trait: TraitPlus
    showDetails?: boolean
    shortTitle?: boolean
  }

  const compProps = withDefaults(defineProps<TraitSectionProps>(), {
    showDetails: true,
    shortTitle: false,
  })
</script>
