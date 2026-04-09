<template>
  <v-dialog v-model="dialog" persistent scrollable fullscreen>
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
          :existing-traits="existingTraits || []"
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
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import TrialTraits from '@/components/setup/TrialTraits.vue'
  import { mdiClose } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const compProps = defineProps<{
    trials: TrialPlus[]
  }>()

  const dialog = ref(false)
  const traits = ref<TraitPlus[]>([])

  const emit = defineEmits(['traits-added'])

  const canContinue = computed(() => traits.value.length > 0)

  const existingTraits = computed(() => {
    const result: TraitPlus[] = []

    compProps.trials.forEach(t => {
      result.push(...t.traits)
    })

    return result
  })

  function show () {
    traits.value = []
    dialog.value = true
  }
  function hide () {
    if (traits.value && traits.value.length > 0) {
      emitter.emit('show-confirm', {
        title: t('modalTitleConfirmCloseAddTrait'),
        message: t('modalTextConfirmCloseAddTrait'),
        okTitle: t('genericYes'),
        cancelTitle: t('genericNo'),
        okVariant: 'error',
        callback: (result: boolean) => {
          if (result === true) {
            traits.value = []
            dialog.value = false
          }
        },
      })
    } else {
      traits.value = []
      dialog.value = false
    }
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
