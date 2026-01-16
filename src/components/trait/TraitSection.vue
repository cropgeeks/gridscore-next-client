<template>
  <div>
    <v-list-item v-if="trait" slim class="px-1 full-opacity-subtitle">
      <template #prepend>
        <v-icon :icon="store.storeCanvasShape === CanvasShape.SQUARE ? mdiSquare : mdiCircle" :color="trait.color" size="x-large" />
      </template>
      <template #title>
        <div class="d-flex flex-wrap align-center justify-space-between ga-2">
          <div class="d-flex flex-wrap align-center ga-2">
            <span class="text-h6" :style="{ color: trait.color }">{{ trait.name }}</span>
            <template v-if="showDetails">
              <v-chip size="small" label :text="$t((shortTitle ? dataTypeMap[trait.dataType]?.shortTitle : dataTypeMap[trait.dataType]?.title) || '')" :prepend-icon="dataTypeMap[trait.dataType]?.icon" />
              <v-menu v-if="trait.hasImage && imageUrl" location="bottom">
                <template #activator="{ props }">
                  <v-chip
                    v-bind="props"
                    label
                    size="small"
                    v-tooltip:top="$t('tooltipTraitImageClickToView')"
                  >
                    <v-icon :icon="mdiImageSearch" />
                  </v-chip>
                </template>

                <v-card>
                  <v-card-text>
                    <img :src="imageUrl" class="d-inline-block reference-image" crossorigin="anonymous" @click="imageFullscreen = true">
                  </v-card-text>
                </v-card>
              </v-menu>
              <v-chip size="small" label v-tooltip:top="$t(trait.allowRepeats ? 'tooltipTraitAllowRepeatsTrue' : 'tooltipTraitAllowRepeatsFalse')">
                <v-icon :icon="trait.allowRepeats ? mdiRepeat : mdiRepeatOff" />
              </v-chip>
              <v-chip size="small" label v-tooltip:top="$t('tooltipTraitSetSize')" :text="$n(trait.setSize || 1)" :prepend-icon="mdiSetSplit" />
            </template>
          </div>
        </div>
      </template>
      <template #append>
        <div class="d-flex flex-wrap ga-2">
          <slot name="default" />
        </div>
      </template>
      <template #subtitle v-if="showSubtitle && (trait.description || (trait.restrictions && (trait.restrictions.min !== undefined || trait.restrictions.max !== undefined)) || trait.timeframe)">
        <div class="d-flex flex-column">
          <div :class="store.storeShowFullTraitDescription ? 'text-wrap' : 'text-clamp-1'" v-if="trait.description">{{ trait.description }}</div>
          <v-chip-group v-if="trait.restrictions || trait.timeframe">
            <v-chip label size="x-small" v-if="trait.restrictions && (trait.restrictions.min !== undefined) && (trait.restrictions.min !== null)" :prepend-icon="mdiGreaterThanOrEqual" :text="trait.restrictions.min" />
            <v-chip label size="x-small" v-if="trait.restrictions && (trait.restrictions.max !== undefined) && (trait.restrictions.max !== null)" :prepend-icon="mdiLessThanOrEqual" :text="trait.restrictions.max" />
            <v-chip label size="x-small" v-tooltip:bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :base-color="trait.editable ? 'muted' : 'error'" v-if="trait.timeframe && trait.timeframe.start" :prepend-icon="mdiGreaterThanOrEqual" :text="trait.timeframe.start" />
            <v-chip label size="x-small" v-tooltip:bottom="$t(trait.editable ? 'tooltipTraitTimeframeOutwithSuggest' : 'tooltipTraitTimeframeOutwithEnforce')" :base-color="trait.editable ? 'muted' : 'error'" v-if="trait.timeframe && trait.timeframe.end" :prepend-icon="mdiLessThanOrEqual" :text="trait.timeframe.end" />
          </v-chip-group>
        </div>
      </template>
    </v-list-item>

    <v-dialog
      v-model="imageFullscreen"
      transition="dialog-bottom-transition"
      fullscreen
      v-if="trait.hasImage && imageUrl"
      @click="imageFullscreen = false"
    >
      <v-card>
        <v-toolbar>
          <v-btn
            :icon="mdiClose"
            @click="imageFullscreen = false"
          />
        </v-toolbar>

        <v-card-text>
          <img :src="imageUrl" class="d-inline-block reference-image-fullscreen" crossorigin="anonymous">
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { dataTypeMap } from '@/plugins/constants'
  import { CanvasShape, type TraitPlus, type TrialPlus } from '@/plugins/types/client'
  import { getPriorityShareCode, getServerUrl } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiCircle, mdiSquare, mdiGreaterThanOrEqual, mdiLessThanOrEqual, mdiRepeat, mdiRepeatOff, mdiSetSplit, mdiImageSearch, mdiClose } from '@mdi/js'

  const store = coreStore()

  const imageFullscreen = ref(false)

  export interface TraitSectionProps {
    trial?: TrialPlus
    trait: TraitPlus
    showDetails?: boolean
    shortTitle?: boolean
    showSubtitle?: boolean
  }

  const compProps = withDefaults(defineProps<TraitSectionProps>(), {
    showDetails: true,
    shortTitle: false,
    showSubtitle: false,
  })

  const trialImageConfig = computed(() => {
    if (compProps.trial) {
      return {
        serverUrl: getServerUrl(compProps.trial),
        priorityShareCode: getPriorityShareCode(compProps.trial),
      }
    } else {
      return undefined
    }
  })

  const imageUrl = computed(() => {
    if (compProps.trait.imageUrl) {
      return compProps.trait.imageUrl
    } else {
      if (trialImageConfig.value) {
        return `${trialImageConfig.value.serverUrl}trait/${trialImageConfig.value.priorityShareCode}/${compProps.trait.id}/img`
      } else {
        return undefined
      }
    }
  })
</script>

<style>
.full-opacity-subtitle .v-list-item-subtitle {
  opacity: 1;
}

.reference-image {
  max-width: 90vw;
  max-height: 90vh;
}

.reference-image-fullscreen {
  max-width: 100%;
  max-height: 100%;
}
</style>
