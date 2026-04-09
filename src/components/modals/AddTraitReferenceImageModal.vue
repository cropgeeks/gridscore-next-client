<template>
  <div>
    <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
      <v-card>
        <template #title>
          <div class="d-flex justify-space-between">
            <span>{{ $t('modalTitleUploadTraitReferenceImage') }}</span>
            <v-btn
              size="small"
              variant="flat"
              :icon="mdiClose"
              @click="hide"
            />
          </div>
        </template>
        <template #text>
          <p>{{ $t('modalTextUploadTraitReferenceImage') }}</p>

          <v-expansion-panels eager multiple v-model="expandedTraitGroups">
            <v-expansion-panel
              v-for="group in traitsByGroup"
              :key="`trait-group-${group.name}`"
              eager
            >
              <template #title>
                {{ group.name }} <v-badge inline :content="getNumberWithSuffix(group.traits.length, 1)" />
              </template>
              <template #text>
                <v-row>
                  <v-col
                    v-for="trait in group.traits"
                    :key="`trait-group-${group.name}-trait-${trait.id}`"
                    cols="12"
                    md="6"
                    lg="4"
                    class="d-flex"
                  >
                    <v-card
                      class="mb-3 d-flex flex-column"
                      variant="tonal"
                    >
                      <v-img
                        :key="`trait-image-${trait.id}-${imageId}`"
                        height="150px"
                        max-height="150px"
                        class="bg-surface-variant"
                        :src="trait.imageUrl"
                        cover
                      >
                        <div class="d-flex align-center justify-space-around h-100">
                          <v-btn :color="trait.imageUrl ? 'warning' : 'success'" :icon="trait.imageUrl ? mdiImageRefresh : mdiImagePlus" @click="showUploadForTrait(trait)" />
                          <v-btn :icon="mdiImageRemove" color="error" v-if="trait.imageUrl" @click="deleteImageForTrait(trait)" />
                        </div>
                      </v-img>
                      <v-card-title>
                        <div class="d-flex justify-space-between align-center flex-wrap">
                          <span>{{ trait.name }}</span>
                          <div>
                            <v-chip label size="small" color="primary" :prepend-icon="dts.find(dt => dt.value === trait.dataType)?.icon" :text="dts.find(dt => dt.value === trait.dataType)?.shortTitle" />
                          </div>
                        </div>
                      </v-card-title>
                      <v-card-subtitle>
                        <span class="text-wrap" v-if="trait.description">{{ trait.description }}</span>
                      </v-card-subtitle>

                      <v-card-text class="flex-grow-1 align-self-end">
                        <div class="mb-2">
                          <v-chip
                            label
                            class="me-2 mb-1"
                            size="small"
                            :text="$t(trait.allowRepeats ? 'formFeedbackTraitAllowRepeats' : 'formFeedbackTraitNoAllowRepeats')"
                            :prepend-icon="trait.allowRepeats ? mdiTimelinePlus : mdiTimelineRemove"
                          />

                          <v-chip
                            label
                            class="me-2 mb-1"
                            size="small"
                            :text="$t('formFeedbackTraitSetSize', { count: trait.setSize })"
                            :prepend-icon="mdiSetSplit"
                          />

                          <v-chip
                            v-if="trait.group && trait.group.name"
                            label
                            class="me-2 mb-1"
                            size="small"
                            :text="trait.group.name"
                            :prepend-icon="mdiTagText"
                          />
                        </div>
                        <div v-if="trait.timeframe" class="mb-2">
                          <v-chip
                            label
                            size="small"
                            class="me-2 mb-1"
                            :text="$t(trait.timeframe.type === TimeframeType.SUGGEST ? 'formSelectOptionTraitTimeframeSuggest' : 'formSelectOptionTraitTimeframeEnforce')"
                            :prepend-icon="trait.timeframe.type === TimeframeType.SUGGEST ? mdiAlert : mdiMinusCircle"
                          />
                          <v-chip
                            v-if="trait.timeframe.start"
                            label
                            size="small"
                            class="me-2 mb-1"
                            :text="trait.timeframe.start"
                            :prepend-icon="mdiCalendarStart"
                          />
                          <v-chip
                            v-if="trait.timeframe.end"
                            label
                            size="small"
                            class="me-2 mb-1"
                            :text="trait.timeframe.end"
                            :prepend-icon="mdiCalendarEnd"
                          />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>

        </template>

        <v-card-actions>
          <v-spacer />
          <v-btn :text="$t('buttonClose')" @click="hide" color="primary" variant="tonal" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <UploadTraitImageModal :trial="trial" :trait="selectedTrait" ref="uploadTraitImageModal" @image-uploaded="updateTrait()" v-if="trial && selectedTrait" />
  </div>
</template>

<script setup lang="ts">
  import { dataTypes, type DataType } from '@/plugins/constants'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TimeframeType } from '@/plugins/types/gridscore'
  import { getPriorityShareCode, getServerUrl } from '@/plugins/util'
  import { mdiAlert, mdiCalendarEnd, mdiCalendarStart, mdiClose, mdiImagePlus, mdiImageRefresh, mdiImageRemove, mdiMinusCircle, mdiSetSplit, mdiTagText, mdiTimelinePlus, mdiTimelineRemove } from '@mdi/js'
  import { useI18n } from 'vue-i18n'
  import UploadTraitImageModal from '@/components/modals/UploadTraitImageModal.vue'
  import { updateTrialTraitImage } from '@/plugins/idb'
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'
  import { getId } from '@/plugins/id'
  import { clearTraitImageCache } from '@/plugins/traitcache'
  import { deleteTraitImage } from '@/plugins/api'

  interface TraitGroup {
    name: string
    traits: TraitPlus[]
  }

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const store = coreStore()
  const dialog = ref(false)
  const selectedTrait = ref<TraitPlus>()
  const expandedTraitGroups = ref<number[]>([])
  const imageId = ref(getId())

  const { t } = useI18n()

  const uploadTraitImageModal = useTemplateRef('uploadTraitImageModal')

  const dts: ComputedRef<DataType[]> = computed(() => {
    return dataTypes.map(dt => {
      return {
        title: t(dt.title),
        shortTitle: t(dt.shortTitle),
        icon: dt.icon,
        value: dt.value,
      }
    })
  })

  const traitsByGroup = computed(() => {
    let groups: TraitGroup[] = []

    if (compProps.trial) {
      const result: { [index: string]: TraitPlus[] } = {}

      compProps.trial.traits.forEach(trait => {
        const group = (trait.group && trait.group.name) ? trait.group.name : t('dropdownOptionTraitNoGroup')

        const copy = JSON.parse(JSON.stringify(trait))

        let groupTraits = result[group]
        if (!groupTraits) {
          groupTraits = [copy]
        } else {
          groupTraits.push(copy)
        }
        result[group] = groupTraits
      })

      groups = Object.keys(result).map(k => {
        return {
          name: k,
          traits: result[k] || [],
        }
      })
    }

    return groups
  })

  function showUploadForTrait (t: TraitPlus) {
    selectedTrait.value = t

    nextTick(() => uploadTraitImageModal.value?.show())
  }

  function deleteImageForTrait (t: TraitPlus) {
    emitter.emit('show-loading', true)

    let remoteConfig = undefined

    if (compProps.trial && compProps.trial.remoteUrl) {
      remoteConfig = {
        remoteUrl: compProps.trial.remoteUrl,
        token: compProps.trial.remoteToken || undefined,
      }
    }

    deleteTraitImage(remoteConfig, getPriorityShareCode(compProps.trial) || '', t.id || '')
      .then(() => updateTrialTraitImage(compProps.trial.localId || '', t, false))
      .then(() => clearTraitImageCache(compProps.trial, [t.id || '']))
      .then(() => {
        const match = compProps.trial.traits.find(tt => tt.id === t.id)

        if (match) {
          match.hasImage = false
          match.imageUrl = undefined
        }
      })
      .then(refreshTrialInfo)
      .catch(async e => {
        console.log(e, e.status)
        if (e.status === 404) {
          const match = compProps.trial.traits.find(tt => tt.id === t.id)

          if (match) {
            match.hasImage = false
            match.imageUrl = undefined
          }
          // Delete then save to idb.
          updateTrialTraitImage(compProps.trial.localId || '', t, false)
            .then(refreshTrialInfo)
        }
      })
      .finally(() => {
        emitter.emit('show-loading', false)
      })
  }

  async function refreshTrialInfo () {
    emitter.emit('trials-updated')
    emitter.emit('trial-selected')

    await store.setSelectedTrial(compProps.trial.localId || '')

    imageId.value = getId()
  }

  function updateTrait () {
    const t = selectedTrait.value
    if (t) {
      const match = compProps.trial.traits.find(tt => tt.id === t.id)

      if (match) {
        match.hasImage = true

        const trialImageConfig = {
          serverUrl: getServerUrl(compProps.trial),
          priorityShareCode: getPriorityShareCode(compProps.trial),
        }

        match.imageUrl = `${trialImageConfig.serverUrl}trait/${trialImageConfig.priorityShareCode}/${t.id}/img`
      }

      updateTrialTraitImage(compProps.trial.localId || '', t, true)
        .then(refreshTrialInfo)
    }
  }

  watch(traitsByGroup, async newValue => {
    expandedTraitGroups.value = newValue ? Object.keys(newValue).map((v, index) => index) : []
  }, { immediate: true })

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>
