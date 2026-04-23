<template>
  <v-container>
    <h1 class="text-headline-large mt-0 mb-3">{{ $t('pageLoadExampleTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageLoadExampleText') }}</p>

    <v-chip-group
      v-model="selectedTag"
      filter
      column
      variant="tonal"
      color="primary"
      class="mb-3"
    >
      <v-chip
        v-for="(tag, key) in categoryMap"
        :key="`tag-${key}`"
        label
        :value="key"
        :prepend-icon="tag.icon"
        :text="tag.text"
      />
    </v-chip-group>

    <v-row>
      <v-col
        v-for="trial in visibleExamples"
        :key="`example-${trial.id}`"
        class="d-flex"
      >
        <TrialCard :trial="trial.trial" :wrap-description="true" :interactive="false" :can-share="false" force-show-details class="example-card">
          <template #prepend>
            <v-icon class="me-" size="60" :color="trial.color" :icon="trial.icon" />
          </template>
          <template #actions>
            <v-spacer />
            <v-btn color="primary" variant="tonal" :text="$t('buttonLoad')" :prepend-icon="mdiCellphoneArrowDownVariant" @click="loadExample(trial)" />
          </template>
          <template #chips v-if="trial.tags && trial.tags.length > 0">
            <v-chip label v-for="tag in trial.tags" :key="`example-${trial.id}-${tag?.icon}`" :text="tag?.text" :prepend-icon="tag?.icon" />
          </template>
        </TrialCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { addTrial } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import { DisplayOrder, EventType, PersonType, TraitDataType, type Event, type Person, type Trait } from '@/plugins/types/gridscore'
  import { getThemeColor } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiAccountMultiple, mdiCalendar, mdiCalendarMultiselect, mdiCellphoneArrowDownVariant, mdiChartTimeline, mdiCow, mdiFormatListNumbered, mdiSchool, mdiSetSplit, mdiSprinkler, mdiSprinklerFire, mdiSprout, mdiViewGrid, mdiViewList } from '@mdi/js'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const store = coreStore()
  const router = useRouter()

  const selectedTag = ref<string>()

  interface ExampleTrial {
    trial: TrialPlus
    id: string
    icon: string
    color: string
    source: string
    image: string
    tags: (Category | undefined)[]
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
  const event: Event = {
    content: '',
    timestamp: '',
    type: EventType.OTHER,
    impact: 1,
  }

  interface Category {
    key: string
    text: string
    icon: string
  }

  const categories: ComputedRef<Category[]> = computed(() => {
    return [
      { key: 'grid', text: t('trialTagLayoutGrid'), icon: mdiViewGrid },
      { key: 'list', text: t('trialTagLayoutList'), icon: mdiViewList },
      { key: 'single', text: t('trialTagSingleMeasurement'), icon: mdiCalendar },
      { key: 'timeseries', text: t('trialTagMultiMeasurement'), icon: mdiCalendarMultiselect },
      { key: 'reps', text: t('trialTagReps'), icon: mdiFormatListNumbered },
      { key: 'treatments', text: t('trialTagTreatments'), icon: mdiSprinklerFire },
      { key: 'people', text: t('trialTagPeople'), icon: mdiAccountMultiple },
      { key: 'setsize', text: t('trialTagSetSize'), icon: mdiSetSplit },
    ]
  })

  const categoryMap: ComputedRef<{ [index: string]: Category }> = computed(() => {
    const result: { [index: string]: Category } = {}

    categories.value.forEach(v => {
      result[v.key] = v
    })

    return result
  })

  const visibleExamples = computed(() => {
    const st = selectedTag.value
    if (st) {
      return examples.value.filter(e => {
        const eTags = new Set(e.tags.filter(t => t?.key).map(t => t?.key || ''))

        return eTags.has(st)
      })
    } else {
      return examples.value
    }
  })

  const examples: ComputedRef<ExampleTrial[]> = computed(() => {
    return [{
      id: 'barley',
      icon: mdiSprout,
      color: getThemeColor(0),
      trial: {
        localId: 'barley',
        name: t('pageLoadExampleBarleyTrialName'),
        description: t('pageLoadExampleBarleyTrialDescription'),
        group: { name: 'Example trials' },
        comments: [{ content: '', timestamp: '' }],
        events: [event, event],
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
      tags: [categoryMap.value.grid, categoryMap.value.single, categoryMap.value.reps, categoryMap.value.people],
    }, {
      id: 'multi',
      icon: mdiChartTimeline,
      color: getThemeColor(1),
      trial: {
        localId: 'multi',
        name: t('pageLoadExampleTimelineName'),
        description: t('pageLoadExampleTimelineDescription'),
        group: { name: 'Example trials' },
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
        traits: [trait, trait, trait],
      },
      source: 'timeline.json',
      image: 'timeline-trial.svg',
      tags: [categoryMap.value.grid, categoryMap.value.timeseries, categoryMap.value.treatments],
    }, {
      id: 'measurementset',
      icon: mdiSetSplit,
      color: getThemeColor(2),
      trial: {
        localId: 'measurementset',
        name: t('pageLoadExampleMeasurementSetName'),
        description: t('pageLoadExampleMeasurementSetDescription'),
        group: { name: 'Example trials' },
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
      tags: [categoryMap.value.grid, categoryMap.value.timeseries, categoryMap.value.setsize],
    }, {
      id: 'cows',
      icon: mdiCow,
      color: getThemeColor(3),
      trial: {
        localId: 'cows',
        name: t('pageLoadExampleCowName'),
        description: t('pageLoadExampleCowDescription'),
        group: { name: 'Example trials' },
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
      tags: [categoryMap.value.list, categoryMap.value.timeseries],
    }, {
      id: 'training',
      icon: mdiSchool,
      color: getThemeColor(4),
      trial: {
        localId: 'training',
        name: t('pageLoadExampleTrainingName'),
        description: t('pageLoadExampleTrainingDescription'),
        group: { name: 'Example trials' },
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
      tags: [categoryMap.value.grid],
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
          router.push(store.storeDefaultDataEntryViewRoute)
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
