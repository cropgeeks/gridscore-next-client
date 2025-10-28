<template>
  <div>
    <v-row v-if="model">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="model.name"
          :prepend-inner-icon="mdiTextShort"
          :label="$t('formLabelTrialSetupTrialName')"
          :hint="$t('formDescriptionTrialSetupTrialName')"
          persistent-hint
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-textarea
          v-model="model.description"
          :prepend-inner-icon="mdiTextLong"
          :label="$t('formLabelTrialSetupTrialDescription')"
          :hint="$t('formDescriptionTrialSetupTrialDescription')"
          persistent-hint
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-combobox
          v-model="group"
          :items="trialGroups"
          :prepend-inner-icon="mdiFolderTable"
          :label="$t('formLabelTrialSetupTrialGroup')"
          :hint="$t('formDescriptionTrialSetupTrialGroup')"
          persistent-hint
          autocomplete="off"
        />
      </v-col>

      <v-col cols="12" md="6">
        <div class="text-subtitle-2">{{ $t('formLabelTrialSetupTrialPeople') }}</div>
        <p>{{ $t('formDescriptionTrialSetupTrialPeople') }}</p>

        <v-btn @click="addPersonModal?.show()" :prepend-icon="mdiAccountPlus" :text="$t('buttonAdd')" />

        <div class="mt-5">
          <v-chip
            v-for="(person, personIndex) in model.people"
            :key="`person-${personIndex}-${person.name}`"
            :text="person.name"
            class="me-2"
            label
            :closable="personIndex >= peopleCutoffIndex"
            @click:close="deletePerson(personIndex)"
          >
            <template #prepend>
              <v-icon v-for="type in person.types" :key="`person-${personIndex}-${type}`" :icon="personTypes[type]?.icon" :color="getTraitColor(personTypes[type]?.colorIndex || 0)" />
            </template>
          </v-chip>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="no-select">
        <v-row class="filename-chips">
          <v-col class="d-flex flex-column" cols="6">
            <v-card class="flex-grow-1 d-flex flex-column" :title="$t('pageSetupMediaFilenameUsedTitle')" :subtitle="$t('pageSetupMediaFilenameUsedSubtitle')">
              <template #append>
                <v-btn @click="resetFilenameChips" color="info" :icon="mdiUndoVariant" v-tooltip:top="$t('buttonReset')" />
              </template>
              <v-card-text class="flex-grow-1 d-flex flex-column">
                <draggable
                  class="flex-grow-1"
                  v-model="usedMediaFilenameChips"
                  group="mediaTypeChips"
                  item-key="id"
                >
                  <template #item="{ element }">
                    <v-chip label class="me-2 mb-2" :text="$t(element.title)" :prepend-icon="element.icon" />
                  </template>
                </draggable>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col class="d-flex flex-column" cols="6">
            <v-card class="flex-grow-1 d-flex flex-column" :title="$t('pageSetupMediaFilenameUnusedTitle')" :subtitle="$t('pageSetupMediaFilenameUnusedSubtitle')">
              <v-card-text class="flex-grow-1 d-flex flex-column">
                <draggable
                  class="flex-grow-1"
                  v-model="unusedMediaFilenameChips"
                  group="mediaTypeChips"
                  item-key="id"
                >
                  <template #item="{ element }">
                    <v-chip label class="me-2 mb-2" :text="$t(element.title)" :prepend-icon="element.icon" />
                  </template>
                </draggable>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <div class="v-input__details">
          <div class="v-messages">
            <span class="v-messages__message">{{ $t('formDescriptionTrialSetupMediaFilenameText') }}</span>
          </div>
        </div>

        <v-text-field
          class="mt-3"
          readonly
          :model-value="exampleFilename"
          :label="$t('formLabelTrialSetupMediaFilenameExample')"
        />
      </v-col>
    </v-row>

    <AddPersonModal ref="addPersonModal" @person-added="p => { model?.people.push(p) }" />
  </div>
</template>

<script setup lang="ts">
  import { mediaFilenameParts } from '@/plugins/constants'
  import { getTrialGroups } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import { personTypes } from '@/plugins/types/types'
  import { getTraitColor } from '@/plugins/util'
  import { mdiAccountPlus, mdiFolderTable, mdiTextLong, mdiTextShort, mdiUndoVariant } from '@mdi/js'
  import draggable from 'vuedraggable'

  export interface FilenameChip {
    id: string
    title: string
    icon: string
    example: string
  }

  export interface TrialDetailsProps {
    isEdit?: boolean
    isClone?: boolean
  }

  const compProps = withDefaults(defineProps<TrialDetailsProps>(), {
    isClone: false,
    isEdit: false,
  })

  const addPersonModal = useTemplateRef('addPersonModal')
  const peopleCutoffIndex = ref(0)

  const model = defineModel<TrialPlus>()

  const group = ref<string>()
  const trialGroups = ref<string[]>([])
  const usedMediaFilenameChips = ref<FilenameChip[]>([])
  const unusedMediaFilenameChips = ref<FilenameChip[]>([])

  const exampleFilename = computed(() => {
    return `${usedMediaFilenameChips.value.map(c => c.example).join('_')}.jpg`
  })

  const isValid = computed(() => model.value && model.value.name && model.value.name.trim().length > 0)

  function resetFilenameChips () {
    usedMediaFilenameChips.value = mediaFilenameParts.concat()
    unusedMediaFilenameChips.value = []
  }

  function deletePerson (index: number) {
    model.value?.people.splice(index, 1)
  }

  onMounted(() => {
    getTrialGroups().then(groups => {
      trialGroups.value = groups || []
    })

    if (model.value) {
      usedMediaFilenameChips.value = (model.value.mediaFilenameFormat || []).map(p => mediaFilenameParts.find(op => op.id === p)).filter(p => p !== undefined)
      unusedMediaFilenameChips.value = mediaFilenameParts.filter(p => !usedMediaFilenameChips.value.some(op => op.id === p.id))
      group.value = model.value.group?.name
      peopleCutoffIndex.value = (model.value.people || []).length
    }
  })

  watch(usedMediaFilenameChips, async newValue => {
    if (model.value) {
      model.value.mediaFilenameFormat = newValue.map(p => p.id)
    }
  })

  watch(group, async newValue => {
    if (model.value) {
      if (newValue) {
        model.value.group = {
          name: newValue,
        }
      } else {
        model.value.group = undefined
      }
    }
  })

  defineExpose({
    isValid,
  })
</script>

<style>
.filename-chips .v-chip:hover {
  cursor: move;
}
</style>
