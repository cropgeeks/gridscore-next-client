<template>
  <v-container fluid v-if="trial">
    <h1 class="text-h4 mb-3">{{ $t(pageConfig.title) }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t(pageConfig.text) }}</p>

    <v-stepper
      v-model="stepperIndex"
    >
      <v-stepper-header class="bg-surface-variant">
        <template
          v-for="(step, stepIndex) in steps"
          :key="`step-${stepIndex}`"
        >
          <v-divider v-if="stepIndex > 0" />
          <v-stepper-item
            :title="step.title"
            :icon="step.icon"
            color="primary"
            :subtitle="step.subtitle"
            :value="stepIndex + 1"
            :complete="false"
          />
        </template>
      </v-stepper-header>

      <v-stepper-actions class="mt-4">
        <template #prev>
          <v-btn
            :text="$t('buttonPrevious')"
            @click="checkTableChanges(prev, false)"
            :prepend-icon="mdiArrowLeft"
            :disabled="prevDisabled"
          />
        </template>
        <template #next>
          <v-btn
            :text="$t(stepperIndex === 3 ? pageConfig.createButtonText : 'buttonNext')"
            @click="checkTableChanges(next, true)"
            :append-icon="mdiArrowRight"
            :color="stepperIndex === 3 ? 'primary' : undefined"
            :disabled="nextDisabled"
          />
        </template>
      </v-stepper-actions>

      <v-stepper-window>
        <v-stepper-window-item :value="1">
          <div class="d-flex justify-end">
            <v-btn :text="$t('dropdownOptionBrapiTrialImport')" class="mb-3" prepend-icon="$brapi" @click="trialCreationFromBrapiModal?.show()" />
          </div>
          <TrialDetails v-model="trial" :is-clone="isClone" :is-edit="isEdit" ref="trialDetails" />
        </v-stepper-window-item>
        <v-stepper-window-item :value="2">
          <TrialLayout v-model="trial" :is-clone="isClone" :is-edit="isEdit" ref="trialLayout" @next="stepperIndex++" />
        </v-stepper-window-item>
        <v-stepper-window-item :value="3">
          <TrialTraits v-model="trial.traits" :is-clone="isClone" :is-edit="isEdit" :is-trial-owner="isTrialOwner" ref="trialTraits" />
        </v-stepper-window-item>
      </v-stepper-window>

      <v-stepper-actions>
        <template #prev>
          <v-btn
            :text="$t('buttonPrevious')"
            @click="checkTableChanges(prev, false)"
            :prepend-icon="mdiArrowLeft"
            :disabled="prevDisabled"
          />
        </template>
        <template #next>
          <v-btn
            :text="$t(stepperIndex === 3 ? pageConfig.createButtonText : 'buttonNext')"
            @click="checkTableChanges(next, true)"
            :append-icon="mdiArrowRight"
            :color="stepperIndex === 3 ? 'primary' : undefined"
            :disabled="nextDisabled"
          />
        </template>
      </v-stepper-actions>
    </v-stepper>

    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
    >
      <v-card>
        <template #title>
          <div class="d-flex justify-space-between flex-wrap">
            <div>{{ $t('modalTitleTrialPreview') }}</div>
            <div>
              <v-btn :text="$t(pageConfig.createButtonText)" :prepend-icon="pageConfig.createButtonIcon" color="primary" @click="createTrial" />
            </div>
          </div>
        </template>
        <template #text>
          <p>{{ $t('modalTextTrialPreview') }}</p>

          <div v-if="isClone" class="mb-3">
            <v-checkbox
              class="mb-3"
              :label="$t('formLabelDuplicateTrialCopyData')"
              :hint="$t('formDescriptionDuplicateTrialCopyData')"
              persistent-hint
              :disabled="!canCopyData"
              v-model="copyData"
            >
              <template #message>
                <span v-html="$t('formDescriptionDuplicateTrialCopyData')" />
              </template>
            </v-checkbox>
            <p v-if="!canCopyData" class="text-error">{{ $t('formMessageDuplicateTrialCopyDataNotPossible') }}</p>
          </div>

          <TrialCard :trial="trial" :show-actions="false" />
        </template>
      </v-card>
    </v-bottom-sheet>
    <TrialCreationFromBrapiModal ref="trialCreationFromBrapiModal" />
  </v-container>
</template>

<script setup lang="ts">
  import TrialDetails from '@/components/setup/TrialDetails.vue'
  import TrialLayout from '@/components/setup/TrialLayout.vue'
  import TrialTraits from '@/components/setup/TrialTraits.vue'
  import { getId } from '@/plugins/id'
  import { isGeographyValid, trialLayoutToPlots } from '@/plugins/location'
  import { ShareStatus, type TraitPlus, type TrialPlus } from '@/plugins/types/client'
  import { DisplayOrder, TraitDataType, type Person } from '@/plugins/types/gridscore'
  import { useI18n } from 'vue-i18n'

  import emitter from 'tiny-emitter/instance'
  import { addTrial, getTrialData, updateTrialProperties } from '@/plugins/idb'
  import { coreStore } from '@/stores/app'
  import { mediaFilenameParts } from '@/plugins/constants'
  import { mdiArrowLeft, mdiArrowRight, mdiFileDocumentMultiple, mdiNotebookCheck, mdiNotebookMultiple, mdiNotebookPlus, mdiTagMultiple, mdiViewGridPlus } from '@mdi/js'

  export interface TrialCreationProps {
    source?: TrialPlus
    isEdit?: boolean
    isClone?: boolean
  }

  const compProps = withDefaults(defineProps<TrialCreationProps>(), {
    isEdit: false,
    isClone: false,
  })

  const store = coreStore()
  const router = useRouter()
  const { t } = useI18n()

  const stepperIndex = ref(1)
  const bottomSheetVisible = ref(false)
  const copyData = ref(false)
  const setupCompleted = ref(false)

  const trialDetails = useTemplateRef('trialDetails')
  const trialLayout = useTemplateRef('trialLayout')
  const trialTraits = useTemplateRef('trialTraits')
  const trialCreationFromBrapiModal = useTemplateRef('trialCreationFromBrapiModal')

  const trial = ref<TrialPlus>()

  const isTrialOwner = computed(() => {
    if (compProps.isEdit && trial.value) {
      return trial.value.shareStatus === ShareStatus.OWNER
    } else {
      return true
    }
  })

  interface StepperStep {
    title: string
    subtitle?: string
    icon: string
  }

  interface PageConfig {
    title: string
    text: string
    createButtonIcon: string
    createButtonText: string
  }

  const pageConfig: ComputedRef<PageConfig> = computed(() => {
    if (compProps.isEdit) {
      return {
        title: 'modalTitleTrialModification',
        text: 'modalTextTrialModification',
        createButtonText: 'buttonSave',
        createButtonIcon: mdiNotebookCheck,
      }
    } else if (compProps.isClone) {
      return {
        title: 'modalTitleTrialDuplicate',
        text: 'modalTextTrialDuplicate',
        createButtonText: 'buttonDuplicate',
        createButtonIcon: mdiNotebookMultiple,
      }
    } else {
      return {
        title: 'pageTrialSetupTitle',
        text: 'pageTrialSetupText',
        createButtonText: 'buttonCreateTrial',
        createButtonIcon: mdiNotebookPlus,
      }
    }
  })

  const steps: ComputedRef<StepperStep[]> = computed(() => {
    return [{
      title: t('pageSetupTrialInformationTitle'),
      icon: mdiFileDocumentMultiple,
    }, {
      title: t('pageTrialSetupCardLayoutTitle'),
      icon: mdiViewGridPlus,
    }, {
      title: t('pageTrialSetupCardTraitsTitle'),
      icon: mdiTagMultiple,
    }]
  })

  const nextDisabled = computed(() => {
    if (stepperIndex.value === 1 && !trialDetails.value?.isValid) {
      return true
    }

    if (stepperIndex.value === 2 && !trialLayout.value?.isValid) {
      return true
    }

    if (stepperIndex.value === 3 && !trialTraits.value?.isValid) {
      return true
    }

    return false
  })

  const prevDisabled = computed(() => {
    if (stepperIndex.value === 1) {
      return true
    }

    return false
  })

  const canCopyData = computed(() => {
    const s = compProps.source
    const t = trial.value

    if (t === undefined) {
      return false
    }

    if (s !== undefined && compProps.isClone === true) {
      if (s.layout.rows !== t.layout.rows || s.layout.columns !== t.layout.columns) {
        return false
      }
    } else {
      return false
    }

    return true
  })

  function next () {
    stepperIndex.value = Math.min(steps.value.length, stepperIndex.value + 1)

    if (stepperIndex.value === 2) {
      trialLayout.value?.refreshTable()
    }
  }

  function prev () {
    stepperIndex.value = Math.max(1, stepperIndex.value - 1)

    if (stepperIndex.value === 2) {
      trialLayout.value?.refreshTable()
    }
  }

  function checkTableChanges (callback: () => void, isNext: boolean) {
    if (stepperIndex.value === 2) {
      trialLayout.value?.checkLeave(callback)
    } else if (stepperIndex.value === 3 && isNext) {
      bottomSheetVisible.value = true
    } else {
      callback()
    }
  }

  async function createTrial () {
    const t = JSON.parse(JSON.stringify(trial.value)) as TrialPlus
    const source = compProps.source

    if (compProps.isEdit && source !== undefined) {
      // TODO: When editing, check for local changes and store in database

      let newPeople: Person[] = []

      if (t.people && t.people.length > 0) {
        let startIndex = 0

        if (source.people && source.people.length > 0) {
          startIndex = source.people.length
        }

        newPeople = t.people.slice(startIndex)
      }

      updateTrialProperties(t.localId || '', {
        name: t.name,
        description: t.description,
        group: t.group,
        markers: t.layout.markers,
        corners: t.layout.corners,
        traits: t.traits,
        people: newPeople,
      }).then(async () => {
        emitter.emit('trials-updated')
        emitter.emit('trial-selected')

        await store.setSelectedTrial(t.localId || '')
        router.push('/collect/grid')
      })
    } else {
      delete t.localId
      delete t.shareCodes

      let plotCorners = undefined

      if (t.layout.corners && isGeographyValid(t.layout.corners)) {
        plotCorners = trialLayoutToPlots(t.layout.corners, t.layout.rows, t.layout.columns)
      }

      for (let row = 0; row < t.layout.rows; row++) {
        for (let column = 0; column < t.layout.columns; column++) {
          if (t.data && t.data[`${row}|${column}`]) {
            // @ts-ignorex
            t.data[`${row}|${column}`].geography = {}

            // @ts-ignorex
            if (plotCorners && plotCorners[row] && plotCorners[row][column]) {
              // @ts-ignore
              t.data[`${row}|${column}`].geography.corners = plotCorners[row][column]
            }
          }
        }
      }

      const sourceData = (compProps.isClone && compProps.source) ? await getTrialData(compProps.source.localId || '') : {}

      const data = t.data

      if (data) {
        Object.keys(data).forEach(k => {
          const c = data[k]

          if (c) {
            c.measurements = {}

            const toCopy = sourceData[k]

            t.traits.forEach((tt: TraitPlus) => {
              if (toCopy && toCopy.measurements[tt.id || '']) {
                c.measurements[tt.id || ''] = JSON.parse(JSON.stringify(toCopy.measurements[tt.id || '']))
              } else {
                c.measurements[tt.id || ''] = []
              }

              if (tt.dataType === TraitDataType.boolean) {
                tt.dataType = TraitDataType.categorical
                tt.restrictions = Object.assign({
                  categories: ['true', 'false'],
                }, tt.restrictions)
              }
            })
            c.comments = []
          }
        })
      }

      const now = new Date().toISOString()

      t.updatedOn = now
      t.createdOn = now

      emitter.emit('plausible-event', {
        key: 'trial-created',
        props: {
          rows: t.layout.rows,
          columns: t.layout.columns,
          traits: t.traits.length,
          markers: t.layout.markers !== null,
          corners: t.layout.corners !== null,
        },
      })

      addTrial(t).then(async trialId => {
        setupCompleted.value = true

        await store.setSelectedTrial(trialId)
        nextTick(() => router.push('/collect/grid'))
      })
    }
  }

  onBeforeRouteLeave((to, from, next) => {
    if (!setupCompleted.value) {
      emitter.emit('show-confirm', {
        title: t('modalTitleLeaveSetup'),
        message: t('modalTextLeaveSetup'),
        okTitle: t('buttonYes'),
        cancelTitle: t('buttonNo'),
        okVariant: 'error',
        callback: (result: boolean) => {
          if (result) {
            next()
          }
        },
      })
    } else {
      next()
    }
  })

  onMounted(() => {
    if (compProps.source) {
      trial.value = JSON.parse(JSON.stringify(compProps.source)) as TrialPlus
      if (compProps.isClone) {
        trial.value.localId = getId()
      }

      if (!trial.value.mediaFilenameFormat) {
        trial.value.mediaFilenameFormat = mediaFilenameParts.concat().map(p => p.id)
      }
    } else {
      trial.value = {
        localId: getId(),
        name: '',
        traits: [],
        people: [],
        layout: {
          rows: 1,
          rowLabels: [1],
          rowOrder: DisplayOrder.TOP_TO_BOTTOM,
          columns: 1,
          columnLabels: [1],
          columnOrder: DisplayOrder.LEFT_TO_RIGHT,
          corners: undefined,
          markers: undefined,
        },
        data: {},
        mediaFilenameFormat: mediaFilenameParts.concat().map(p => p.id),
      }
    }
  })
</script>
