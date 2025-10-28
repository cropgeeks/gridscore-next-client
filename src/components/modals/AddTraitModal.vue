<template>
  <v-dialog v-model="dialog" scrollable fullscreen>
    <v-card>
      <template #title>
        <div class="d-flex justify-space-between">
          <span>{{ $t('modalTitleAddTrait') }}</span>
          <v-btn
            size="small"
            variant="flat"
            :icon="mdiClose"
            @click="hide"
          />
        </div>
      </template>
      <template #text>
        <p>{{ $t('modalTextAddTrait') }}</p>

        <TrialTraits
          v-model="traits"
        />
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonAdd')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'
  import TrialTraits from '@/components/setup/TrialTraits.vue'
  import { mdiClose } from '@mdi/js'

  const dialog = ref(false)
  const traits = ref<TraitPlus[]>([])

  const emit = defineEmits(['traits-added'])

  const canContinue = computed(() => traits.value.length > 0)

  function show () {
    dialog.value = true
  }
  function hide () {
    traits.value = []
    dialog.value = false
  }
  function save () {
    if (traits.value.length > 0) {
      emit('traits-added', traits.value)
    }

    hide()
  }

  defineExpose({
    show,
    hide,
  })
</script>
