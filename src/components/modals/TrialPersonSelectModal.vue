<template>
  <v-dialog persistent :model-value="dialog || forced" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleSelectTrialPerson')">
      <v-card-text>
        <p>{{ $t('modalTextSelectTrialPerson') }}</p>
      </v-card-text>

      <v-list color="primary">
        <template
          v-for="(person, personIndex) in trial.people"
          :key="`person-${person.id}`"
        >
          <v-divider v-if="personIndex > 0" />
          <v-list-item
            :title="person.name"
            :subtitle="person.email"
            :active="person.id === store.storeSelectedTrialPerson"
            @click="selectPerson(person)"
          >
            <template #prepend>
              <v-avatar variant="tonal" :color="getTraitColor(personIndex)" :text="getAvatarContent(person)" />
            </template>
            <template #append>
              <v-icon v-for="type in person.types" :key="`person-${person.id}-${type}`" :icon="personTypes[type]?.icon" :color="getTraitColor(personTypes[type]?.colorIndex || 0)" />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { TrialPlus } from '@/plugins/types/client'
  import type { Person } from '@/plugins/types/gridscore'
  import { personTypes } from '@/plugins/types/types'
  import { getTraitColor } from '@/plugins/util'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const store = coreStore()

  const forced = ref(false)
  const dialog = computed(() => {
    return compProps.trial.people && compProps.trial.people.length > 0 && (!store.storeSelectedTrialPerson || !compProps.trial.people.some(p => p.id === store.storeSelectedTrialPerson))
  })

  function selectPerson (person: Person) {
    store.setSelectedTrialPerson(person.id)
    forced.value = false
  }

  function getAvatarContent (person: Person) {
    if (person && person.name) {
      const parts = person.name.split(/\s+/)
      return parts.slice(0, 2).map(s => s.slice(0, 1).toUpperCase()).join('')
    }
  }

  function show () {
    forced.value = true
  }

  onMounted(() => {
    emitter.on('show-trial-person-selector', show)
  })

  onBeforeUnmount(() => {
    emitter.off('show-trial-person-selector', show)
  })

  defineExpose({
    show,
  })
</script>
