<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleEditPeople')">
      <template #text>
        <v-form @submit.prevent>
          <v-text-field
            v-model="name"
            :label="$t('formLabelPersonName')"
            :hint="$t('formDescriptionPersonName')"
            persistent-hint
            required
          />

          <v-text-field
            v-model="email"
            :label="$t('formLabelPersonEmail')"
            :hint="$t('formDescriptionPersonEmail')"
            persistent-hint
            type="email"
          />

          <h4 class="mt-5 mb-2">{{ $t('formLabelPersonRole') }}</h4>

          <v-btn-toggle v-model="selectedTypes" multiple color="primary" variant="tonal">
            <v-btn
              v-for="(type, key) in personTypes"
              :key="`type-${key}`"
              :value="key"
              :prepend-icon="type.icon"
              :text="$t(type.text)"
            />
          </v-btn-toggle>

          <p class="text-caption">{{ $t('formDescriptionPersonRole') }}</p>
        </v-form>
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
  import { getId } from '@/plugins/id'
  import { PersonType, type Person } from '@/plugins/types/gridscore'
  import { personTypes } from '@/plugins/types/types'

  const dialog = ref(false)
  const name = ref<string>('')
  const email = ref<string>('')
  const selectedTypes = ref<string[]>([PersonType.DATA_COLLECTOR])

  const emit = defineEmits(['person-added'])

  const canContinue = computed(() => name.value && name.value.trim().length > 0 && selectedTypes.value.length > 0)

  function show () {
    dialog.value = true
  }
  function hide () {
    name.value = ''
    email.value = ''
    selectedTypes.value = [PersonType.DATA_COLLECTOR]
    dialog.value = false
  }
  function save () {
    const person: Person = {
      id: getId(),
      name: name.value,
      email: email.value,
      types: selectedTypes.value.map(t => t as PersonType),
    }
    emit('person-added', person)

    hide()
  }

  defineExpose({
    show,
    hide,
  })
</script>
