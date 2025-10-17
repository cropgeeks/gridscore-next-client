<template>
  <v-container>
    <h1 class="text-h4 mb-3">{{ $t('pageLoadExampleTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageLoadExampleText') }}</p>

    <v-row>
      <v-col
        v-for="trial in examples"
        :key="`example-${trial.id}`"
        class="d-flex"
      >
        <TrialCard :trial="trial.trial" :wrap-description="true" :shareable="false" class="example-card">
          <template #prepend>
            <v-avatar :image="`img/example/${trial.image}`" size="80" rounded="0" />
          </template>
          <template #actions>
            <v-spacer />
            <v-btn color="primary" variant="tonal" :text="$t('buttonLoad')" prepend-icon="mdi-cellphone-arrow-down-variant" @click="loadExample(trial)" />
          </template>
          <template #chips v-if="trial.tags && trial.tags.length > 0">
            <v-chip label v-for="tag in trial.tags" :key="`example-${trial.id}-${tag.icon}`" :text="tag.text" :prepend-icon="tag.icon" />
          </template>
        </TrialCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { addTrial } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import { DisplayOrder, PersonType, TraitDataType, type Person, type Trait } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const store = coreStore()
  const router = useRouter()

  interface TrialTag {
    text: string
    icon: string
  }

  interface ExampleTrial {
    trial: TrialPlus
    id: string
    source: string
    image: string
    tags: TrialTag[]
  }

  const trait: Trait = {
    id: 'id',
    name: 'trait',
    dataType: TraitDataType.int,
    allowRepeats: true,
    setSize: 1,
  }
  const person: Person = {
    name: 'Person',
    types: [PersonType.DATA_COLLECTOR],
  }

  const examples: ComputedRef<ExampleTrial[]> = computed(() => {
    return [{
      id: 'barley',
      trial: {
        localId: 'barley',
        name: t('pageLoadExampleBarleyTrialName'),
        description: t('pageLoadExampleBarleyTrialDescription'),
        people: [person, person],
        layout: {
          rows: 28,
          columns: 8,
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          rowLabels: [],
          columnLabels: [],
        },
        data: {},
        traits: [trait, trait, trait, trait, trait],
      },
      source: 'barley.json',
      image: 'barley-trial.svg',
      tags: [{ text: t('trialTagLayoutGrid'), icon: 'mdi-view-grid' }, { text: t('trialTagSingleMeasurement'), icon: 'mdi-calendar' }, { text: t('trialTagPeople'), icon: 'mdi-account-multiple' }],
    }, {
      id: 'multi',
      trial: {
        localId: 'multi',
        name: t('pageLoadExampleTimelineName'),
        description: t('pageLoadExampleTimelineDescription'),
        people: [],
        layout: {
          rows: 5,
          columns: 8,
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          rowLabels: [],
          columnLabels: [],
        },
        data: {},
        traits: [trait, trait],
      },
      source: 'timeline.json',
      image: 'timeline-trial.svg',
      tags: [{ text: t('trialTagLayoutGrid'), icon: 'mdi-view-grid' }, { text: t('trialTagMultiMeasurement'), icon: 'mdi-calendar-multiselect' }],
    }, {
      id: 'measurementset',
      trial: {
        localId: 'measurementset',
        name: t('pageLoadExampleMeasurementSetName'),
        description: t('pageLoadExampleMeasurementSetDescription'),
        people: [],
        layout: {
          rows: 3,
          columns: 3,
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          rowLabels: [],
          columnLabels: [],
        },
        data: {},
        traits: [trait, trait, trait],
      },
      source: 'measurementset.json',
      image: 'measurementset-trial.svg',
      tags: [{ text: t('trialTagLayoutGrid'), icon: 'mdi-view-grid' }, { text: t('trialTagMultiMeasurement'), icon: 'mdi-calendar-multiselect' }, { text: t('trialTagSetSize'), icon: 'mdi-set-split' }],
    }, {
      id: 'cows',
      trial: {
        localId: 'cows',
        name: t('pageLoadExampleCowName'),
        description: t('pageLoadExampleCowDescription'),
        people: [],
        layout: {
          rows: 20,
          columns: 1,
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          rowLabels: [],
          columnLabels: [],
        },
        data: {},
        traits: [trait, trait, trait, trait],
      },
      source: 'cows.json',
      image: 'cow-trial.svg',
      tags: [{ text: t('trialTagLayoutList'), icon: 'mdi-view-list' }, { text: t('trialTagMultiMeasurement'), icon: 'mdi-calendar-multiselect' }],
    }, {
      id: 'training',
      trial: {
        localId: 'training',
        name: t('pageLoadExampleTrainingName'),
        description: t('pageLoadExampleTrainingDescription'),
        people: [],
        layout: {
          rows: 2,
          columns: 2,
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          rowLabels: [],
          columnLabels: [],
        },
        data: {},
        traits: [trait, trait, trait, trait, trait],
      },
      source: 'training.json',
      image: 'training-trial.svg',
      tags: [{ text: t('trialTagLayoutGrid'), icon: 'mdi-view-grid' }],
    }]
  })

  async function loadExample (example: ExampleTrial) {
    const response = await fetch(`./data/${example.source}`)
    const json = await response.json()

    if (json.name) {
      json.createdOn = new Date().toISOString()
      json.updatedOn = new Date().toISOString()

      addTrial(json)
        .then(trialId => {
          if (trialId) {
            return store.setSelectedTrial(trialId)
          } else {
            return new Promise((resolve, reject) => reject())
          }
        })
        .then(() => {
          router.push('/collect/grid')
        })
    }
  }
</script>

<style scoped>
.example-card {
  min-width: 300px;
  flex-grow: 1;
}
</style>
