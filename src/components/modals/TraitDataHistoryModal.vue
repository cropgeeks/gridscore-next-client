<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)" scrollable>
    <v-card :title="$t('modalTitleTraitDataHistory')">
      <v-card-text class="modal-text-no-scroll">
        <p v-html="$t('modalTextTraitDataHistory')" />
      </v-card-text>

      <v-list v-if="measurementsList">
        <v-list-item
          v-for="(measurements, mIndex) in measurementsList"
          :key="`measurement-${trait.id}-${mIndex}`"
        >
          <TraitInputSection
            v-model="traitData"
            :trait="trait"
            :measurements="undefined"
          />
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t(editable ? 'buttonSave' : 'buttonClose')" @click="validate" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import TraitInputSection from '@/components/trait/TraitInputSection.vue'
  import type { Measurement } from '@/plugins/types/gridscore'
  import type { TraitData } from '@/components/modals/DataEntryModal.vue'

  const compProps = defineProps<{
    editable: boolean
    trial: TrialPlus
    cell: CellPlus
    trait: TraitPlus
  }>()

  const measurementsList = ref<Measurement[]>([])
  const traitData = ref<TraitData>({})
  const dialog = ref(false)

  function validate () {
    // TODO
  }

  function show () {
    measurementsList.value = compProps.cell.measurements[compProps.trait.id || ''] || []
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

<style>
</style>

<style scoped>
.modal-text-no-scroll {
  overflow-y: hidden;
  height: auto;
}
</style>
