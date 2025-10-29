<template>
  <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleBrapiTrialImport')">
      <template #text>
        <p>{{ $t('modalTextBrapiTrialImport') }}</p>
        <v-form @submit.prevent>
          <BrapiConfig @brapi-config-updated="getPrograms" />

          <BrapiStudySelect
            class="mt-3"
            ref="brapiStudySelect"
          />
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
  import BrapiConfig from '@/components/util/BrapiConfig.vue'
  import BrapiStudySelect from '@/components/util/BrapiStudySelect.vue'

  const dialog = ref(false)
  const canContinue = computed(() => false)

  const brapiStudySelect = useTemplateRef('brapiStudySelect')

  function getPrograms () {
    brapiStudySelect.value?.updatePrograms()
  }

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }
  function save () {
    hide()
  }

  defineExpose({
    show,
    hide,
  })
</script>
