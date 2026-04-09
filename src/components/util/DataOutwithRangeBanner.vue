<template>
  <v-banner class="pa-2" sticky style="z-index: 100;" :color="accepted ? 'success' : 'error'" :lines="lines" :bg-color="accepted ? 'success' : 'error'" density="compact" :icon="accepted ? mdiCheckboxMarkedCircle : mdiAlert" @click="toggleVisibility">
    <template #text>{{ $t('widgetDataInputOutOfBoundsDataWarning') }}</template>

    <template #actions>
      <v-btn-toggle density="compact" v-model="accepted">
        <v-btn :value="true" :text="$t('genericConfirm')" :prepend-icon="accepted ? mdiCheckboxMarked : mdiCheckboxBlankOutline" @click.stop.prevent />
      </v-btn-toggle>
    </template>
  </v-banner>
</template>

<script setup lang="ts">
  import { mdiAlert, mdiCheckboxBlankOutline, mdiCheckboxMarked, mdiCheckboxMarkedCircle } from '@mdi/js'

  const accepted = defineModel<boolean>('accepted')
  const lines = ref<'one' | undefined>('one')

  function toggleVisibility () {
    lines.value = lines.value ? undefined : 'one'
  }
</script>
