<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleTabbedInputToGrid')">
      <template #text>
        <p>{{ $t('modalTextTabbedInputToGrid') }}</p>

        <v-form @submit.prevent>
          <v-textarea
            v-model="content"
            :label="$t(label)"
            :placeholder="$t(placeholder)"
          />

          <v-file-input v-model="file" accept="text/plain" :label="$t('buttonOpenFile')" :placeholder="$t('buttonOpenFile')" />
        </v-form>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonLoad')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  const dialog = ref(false)
  const content = ref<string>('')
  const file = ref<File>()

  const emit = defineEmits(['content-loaded'])

  defineProps<{
    label: string
    placeholder: string
  }>()

  const canContinue = computed(() => content.value && content.value.trim().length > 0)

  function show () {
    dialog.value = true
  }
  function hide () {
    content.value = ''
    dialog.value = false
  }
  function save () {
    emit('content-loaded', content.value)

    hide()
  }

  watch(file, async newValue => {
    if (newValue) {
      content.value = await newValue?.text() || ''
    }
    file.value = undefined
  })

  defineExpose({
    show,
    hide,
  })
</script>
