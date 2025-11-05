<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)" scrollable>
    <v-card :title="$t('modalTitleTraitDataHistory')">
      <v-list>
        <v-list-item><span v-html="$t('modalTextTraitDataHistory')" /></v-list-item>
        <template v-if="measurementsList && traitData">
          <template
            v-for="(measurements, mIndex) in measurementsList"
            :key="`measurement-${trait.id}-${mIndex}`"
          >
            <v-divider v-if="mIndex > 0" />
            <v-list-item
              class="mb-3"
              :active="measurements.delete === true"
              color="error"
            >
              <TraitInputSection
                v-model="traitData[mIndex]"
                :trait="trait"
                :measurements="undefined"
                :editable="editable && measurements.delete !== true"
              >
                <v-chip size="small" label :prepend-icon="mdiCalendar" :text="new Date(measurements.timestamp).toLocaleString()" />
              </TraitInputSection>

              <v-btn
                variant="tonal"
                class="mb-3"
                :disabled="editable === false"
                @click="measurements.delete = !measurements.delete"
                :prepend-icon="measurements.delete ? mdiDelete : mdiDeleteOffOutline"
                :text="measurements.delete ? $t('buttonUndeleteTimepointData') : $t('buttonDeleteTimepointData')"
              />
            </v-list-item>
          </template>
        </template>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn
          :text="$t('buttonCancel')"
          @click="hide"
          variant="text"
        />
        <v-btn
          :text="$t(editable ? 'buttonSave' : 'buttonClose')"
          @click="validate"
          color="primary"
          variant="tonal"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { CellPlus, HistoryMeasurement, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import TraitInputSection from '@/components/trait/TraitInputSection.vue'
  import type { TraitData } from '@/components/modals/DataEntryModal.vue'
  import type { TraitMeasurement } from '@/plugins/types/gridscore'

  import { coreStore } from '@/stores/app'
  import { changeTrialsData, type DataModification } from '@/plugins/idb'

  import emitter from 'tiny-emitter/instance'
  import { mdiCalendar, mdiDelete, mdiDeleteOffOutline } from '@mdi/js'

  const compProps = defineProps<{
    editable: boolean
    trial: TrialPlus
    cell: CellPlus
    trait: TraitPlus
  }>()

  const store = coreStore()

  const measurementsList = ref<HistoryMeasurement[]>([])
  const traitData = ref<TraitData[]>()
  const dialog = ref(false)

  function validate () {
    // TODO
    const changes: TraitMeasurement[] = []

    measurementsList.value.forEach((mv, mvi) => {
      let v = mv.values
      if (isProxy(v)) {
        v = toRaw(v)
      }

      let changed = false
      for (let s = 0; s < compProps.trait.setSize; s++) {
        const oldValue = v[s]
        const newValue = (traitData.value && traitData.value[mvi]) ? traitData.value[mvi][`${s + 1}`] : undefined

        if (oldValue !== newValue) {
          changed = true
          v[s] = newValue
        }
      }

      if (mv.delete) {
        changes.push({
          traitId: compProps.trait.id || '',
          values: v,
          timestamp: mv.timestamp,
          delete: true,
        })
      } else if (changed) {
        changes.push({
          traitId: compProps.trait.id || '',
          personId: store.storeSelectedTrialPerson,
          values: v,
          timestamp: mv.timestamp,
          delete: false,
        })
      }
    })

    if (changes.length > 0) {
      const payload: DataModification = {}
      payload[`${compProps.cell.row}|${compProps.cell.column}`] = changes
      changeTrialsData(compProps.trial.localId || '', payload)
        .then(() => {
          nextTick(() => {
            emitter.emit('plot-data-changed', compProps.cell.row, compProps.cell.column, compProps.trial.localId)
            emitter.emit('plot-clicked', compProps.cell.row, compProps.cell.column, false)
            emit('data-changed')
          })
          hide()
        })
    } else {
      hide()
    }
  }

  function show () {
    measurementsList.value = JSON.parse(JSON.stringify(compProps.cell.measurements[compProps.trait.id || ''] || []))
    traitData.value = measurementsList.value.map(m => {
      const td: TraitData = {}
      m.values.forEach((v, i) => {
        td[`${i + 1}`] = v || ''
      })
      return td
    })
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  const emit = defineEmits(['data-changed'])

  defineExpose({
    show,
    hide,
  })
</script>

<style>
</style>
