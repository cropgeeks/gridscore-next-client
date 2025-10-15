<template>
  <v-dialog
    v-model="dialog"
    transition="dialog-bottom-transition"
    persistent
    scrollable
    fullscreen
    v-if="cell"
  >
    <v-card>
      <v-toolbar>
        <v-btn
          icon="mdi-close"
          @click="confirmClose"
        />

        <v-toolbar-title>{{ cell.displayName }}</v-toolbar-title>

        <v-toolbar-items>
          <ResponsiveButton
            :text="$t('buttonCancel')"
            prepend-icon="mdi-cancel"
            variant="text"
            @click="dialog = false"
          />
          <ResponsiveButton
            :text="$t(isGuidedWalk ? 'buttonClose' : 'buttonSave')"
            :disabled="isGuidedWalk ? false : !canSave"
            prepend-icon="mdi-content-save"
            variant="text"
            @click="save"
          />
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text class="py-0">
        <v-container>
          <PlotInformation :cell="cell" />

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
                <template
                  v-for="(trait, traitIndex) in group.traits"
                  :key="`trait-group-${group.name}-trait-${trait.id}`"
                >
                  <TraitInputSection
                    v-model="cellData[trait.id || '']"
                    v-if="cellData[trait.id || '']"
                    :trait="trait"
                    :trait-index="traitIndex"
                    :measurements="cell.measurements[trait.id || '']"
                    :people="trial.people"
                    @traverse="(setIndex: number) => traverse(trait, traitIndex, group.traits, setIndex)"
                    :ref="(el) => (refs[`${trait.id}`] = el)"
                  />
                </template>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { changeTrialsData, getCell, type DataModification } from '@/plugins/idb'
  import type { CellPlus, Geolocation, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import PlotInformation from '@/components/plot/PlotInformation.vue'
  import { useI18n } from 'vue-i18n'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import ResponsiveButton from '@/components/util/ResponsiveButton.vue'
  import TraitInputSection from '@/components/trait/TraitInputSection.vue'
  import type { TraitMeasurement } from '@/plugins/types/gridscore'

  import emitter from 'tiny-emitter/instance'

  interface TraitGroup {
    name: string
    traits: TraitPlus[]
    valid: boolean | undefined
  }

  type CellData = { [key: string]: TraitData }
  export type TraitData = { [key: string]: string }

  const emit = defineEmits(['data-changed'])

  const compProps = defineProps<{
    trial: TrialPlus
    geolocation?: Geolocation
  }>()

  const { t } = useI18n()
  const store = coreStore()

  const dialog = ref(false)
  const isGuidedWalk = ref(false)
  const cell = ref<CellPlus>()
  const cellData = ref<CellData>({})
  const recordingDate = ref<Date>()

  const refs = ref<{ [index: string]: Element | ComponentPublicInstance | null }>({})

  const expandedTraitGroups = ref<number[]>([])

  const canSave = computed(() => {
    return Object.values(cellData.value).some(cd => Object.values(cd).some(td => td !== undefined && td !== null))
  })

  const visibleTraits = computed(() => {
    if (compProps.trial) {
      return compProps.trial.traits.filter(t => !store.storeHiddenTraits.includes(t.id || ''))
    } else {
      return []
    }
  })

  const traitsByGroup = computed(() => {
    let groups: TraitGroup[] = []

    if (visibleTraits.value && cell.value) {
      const result: { [index: string]: TraitPlus[] } = {}

      visibleTraits.value.forEach(trait => {
        if (store.storeHiddenTraits.includes(trait.id || '')) {
          return
        }

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
          valid: undefined,
        }
      })
    }

    return groups
  })

  watch(traitsByGroup, async newValue => {
    expandedTraitGroups.value = newValue ? Object.keys(newValue).map((v, index) => index) : []
  }, { immediate: true })

  function confirmClose () {
    // TODO
  }
  function save () {
    // TODO
    const c = cell.value
    if (!compProps.trial.editable || !c) {
      hide()
      return
    }

    const now = new Date()
    const date = now

    // If we're not using today as the recording date, then adjust to this time of day
    if (recordingDate.value) {
      date.setDate(recordingDate.value.getDate())
      date.setMonth(recordingDate.value.getMonth())
      date.setFullYear(recordingDate.value.getFullYear())
      date.setUTCHours(now.getUTCHours())
      date.setUTCMinutes(now.getUTCMinutes())
      date.setUTCSeconds(now.getUTCSeconds())
      date.setUTCMilliseconds(now.getUTCMilliseconds())
    }

    const newValues: TraitMeasurement[] = []

    visibleTraits.value.forEach(t => {
      const traitValues = cellData.value[t.id || '']

      if (traitValues && Object.values(traitValues).length > 0) {
        const setValues = []

        for (let s = 0; s < t.setSize; s++) {
          setValues.push(traitValues[s + 1] === null ? undefined : traitValues[s + 1])
        }

        if (!setValues.every(sv => sv === undefined || sv === null)) {
          newValues.push({
            traitId: t.id || '',
            personId: store.storeSelectedTrialPerson,
            values: setValues,
            timestamp: date.toISOString(),
          })
        }
      }
    })

    if (newValues.length > 0) {
      const payload: DataModification = {}
      payload[`${c.row}|${c.column}`] = newValues

      changeTrialsData(compProps.trial.localId || '', payload, compProps.geolocation)
        .then(() => {
          // Take copies for the emitter later
          const row = c.row
          const column = c.column
          const trialId = compProps.trial.localId

          hide()

          nextTick(() => {
            emitter.emit('plot-data-changed', row, column, trialId)
            emit('data-changed')
          })
        })
    } else {
      hide()
    }
  }

  function traverse (trait: TraitPlus, traitIndex: number, traits: TraitPlus[], setIndex: number) {
    if (setIndex < trait.setSize) {
      // @ts-ignore
      refs.value[`${trait.id}`].focus(setIndex + 1)
    } else if (traitIndex < traits.length - 1) {
      // @ts-ignore
      refs.value[`${traits[traitIndex + 1].id}`]?.focus(1)
    } else {
      const traitGroupIndex = traitsByGroup.value.findIndex(tg => tg.traits.some(tt => tt.id === trait.id))

      if (traitGroupIndex < traitsByGroup.value.length) {
        // TODO: Expand trait group
        const nextGroup = traitsByGroup.value[traitGroupIndex + 1]
        if (nextGroup) {
          const expandedGroups = new Set<number>(expandedTraitGroups.value)
          expandedGroups.add(traitGroupIndex + 1)
          expandedTraitGroups.value = [...expandedGroups]

          nextTick(() => {
            // @ts-ignore
            refs.value[`${nextGroup?.traits[0]?.id}`]?.focus(1)
          })
        }
      }
    }
  }

  function show (row?: number, column?: number) {
    cellData.value = {}

    compProps.trial.traits.forEach(t => {
      cellData.value[t.id || ''] = {}
    })

    if (row !== undefined && column !== undefined) {
      getCell(store.storeSelectedTrial || '', row, column)
        .then(c => {
          cell.value = c
          dialog.value = true
        })
    } else {
      dialog.value = true
    }
  }
  function hide () {
    dialog.value = false
  }
  defineExpose({
    show,
    hide,
  })
</script>
