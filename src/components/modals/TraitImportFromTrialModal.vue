<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleTraitImportTrial')">
      <template #text>
        <p>{{ $t('modalTextTraitImportTrial') }}</p>

        <v-form @submit.prevent>
          <v-autocomplete
            :items="trials"
            item-value="localId"
            item-title="name"
            return-object
            autocomplete="off"
            :label="$t('formLabelTraitImportTrial')"
            v-model="selectedTrial"
          />

          <TraitTreeSelect v-model="selectedTraits" :traits="selectedTrial.traits" v-if="selectedTrial" />
        </v-form>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonImport')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { getTrials } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import type { Trait } from '@/plugins/types/gridscore'

  const dialog = ref(false)
  const trials = ref<TrialPlus[]>([])
  const selectedTrial = ref<TrialPlus>()
  const selectedTraits = ref<Trait[]>([])
  const canContinue = computed(() => (selectedTraits.value || []).length > 0)

  const emit = defineEmits(['traits-selected'])

  watch(selectedTrial, async () => {
    selectedTraits.value = []
  })

  function show () {
    dialog.value = true
    selectedTrial.value = undefined

    if (trials.value.length === 0) {
      getTrials(false)
        .then(result => {
          trials.value = result || []
          trials.value.sort((a, b) => a.name.localeCompare(b.name))
        })
    }
  }
  function hide () {
    dialog.value = false
  }
  function save () {
    emit('traits-selected', selectedTraits.value)

    hide()
  }

  defineExpose({
    show,
    hide,
  })
</script>
