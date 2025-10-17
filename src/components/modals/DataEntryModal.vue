<template>
  <v-dialog
    v-model="dialog"
    transition="dialog-bottom-transition"
    persistent
    scrollable
    fullscreen
    v-if="cell"
  >
    <v-card>
      <v-toolbar>
        <v-btn
          icon="mdi-close"
          @click="confirmClose"
        />

        <v-toolbar-title>{{ cell.displayName }}</v-toolbar-title>

        <v-toolbar-items>
          <ResponsiveButton
            :text="cancelConfig.title"
            :prepend-icon="cancelConfig.prependIcon"
            :append-icon="cancelConfig.appendIcon"
            :color="cancelConfig.color"
            :disabled="cancelConfig.disabled"
            variant="text"
            @click="onCancel"
          />
          <ResponsiveButton
            :text="okConfig.title"
            :prepend-icon="okConfig.prependIcon"
            :append-icon="okConfig.appendIcon"
            :color="okConfig.color"
            :disabled="okConfig.disabled"
            variant="text"
            @click="save"
          />
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text class="py-0">
        <v-container :fluid="isGuidedWalk">
          <v-row v-if="guidedWalk">
            <v-col cols="12" md="4" class="d-flex">
              <v-row v-if="guidedWalk.prevCells">
                <v-col :cols="12 / guidedWalk.prevCells.length" v-for="prev in guidedWalk.prevCells" :key="`prev-cell-${prev?.row}-${prev?.column}`">
                  <v-card class="text-center" title-tag="h5" :title="prev?.displayName" :subtitle="$t('widgetGuidedWalkPreviewColumnRow', { column: $n(prev?.displayColumn || 0), row: $n(prev?.displayRow || 0) })" />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="4" class="d-flex">
              <v-card class="text-center flex-grow-1">
                <v-card-title>
                  <v-icon icon="mdi-chevron-double-right" :class="(guidedWalk.prevCells && guidedWalk.prevCells.length > 0) ? null : 'text-muted'" />
                  <v-menu
                    open-on-hover
                    location="bottom center"
                  >
                    <template #activator="{ props }">
                      <a v-bind="props" href="#" @click.prevent><v-icon icon="mdi-map-marker" id="guided-walk-current" class="mx-2" /></a>
                    </template>
                    <v-sheet class="pa-3">
                      <TrialPreviewCanvas
                        :layout="trial.layout"
                        :column="cell.column || 0"
                        :row="cell.row || 0"
                        :cells="guidedWalk.currentCells.map(c => c ? { x: c.column || 0, y: c.row || 0 } : undefined)"
                        :path="guidedWalk.order"
                      />
                    </v-sheet>
                  </v-menu>
                  <v-icon icon="mdi-chevron-double-right" :class="(guidedWalk.nextCells && guidedWalk.nextCells.length > 0) ? null : 'text-muted'" />
                </v-card-title>

                <v-card-subtitle>
                  {{ $t('widgetGuidedWalkPreviewColumnRow', { column: $n(cell?.displayColumn || 0), row: $n(cell?.displayRow || 0) }) }}
                </v-card-subtitle>
              </v-card>
            </v-col>
            <v-col cols="12" md="4" class="d-flex">
              <v-row v-if="guidedWalk.nextCells">
                <v-col :cols="12 / guidedWalk.nextCells.length" v-for="next in guidedWalk.nextCells" :key="`next-cell-${next?.row}-${next?.column}`">
                  <v-card class="text-center" title-tag="h5" :title="next?.displayName" :subtitle="$t('widgetGuidedWalkPreviewColumnRow', { column: $n(next?.displayColumn || 0), row: $n(next?.displayRow || 0) })" />
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-row>
            <v-col :cols="dataInputColumns.cols" :md="dataInputColumns.md" :lg="dataInputColumns.lg" :order="cellIndex">
              <PlotInformation :cell="cell" />

              <v-expansion-panels eager multiple v-model="expandedTraitGroups">
                <v-expansion-panel
                  v-for="group in traitsByGroup"
                  :key="`trait-group-${group.name}`"
                  eager
                >
                  <template #title>
                    {{ group.name }} <v-badge inline :content="getNumberWithSuffix(group.traits.length, 1)" />
                  </template>
                  <template #text>
                    <template
                      v-for="(trait, traitIndex) in group.traits"
                      :key="`trait-group-${group.name}-trait-${trait.id}`"
                    >
                      <TraitInputSection
                        v-model="cellData[trait.id || '']"
                        v-if="cellData[trait.id || '']"
                        :trait="trait"
                        :trait-index="traitIndex"
                        :measurements="cell.measurements[trait.id || '']"
                        :people="trial.people"
                        @traverse="(setIndex: number) => traverse(trait, traitIndex, group.traits, setIndex)"
                        :ref="(el) => (refs[`${trait.id}`] = el)"
                      />
                    </template>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
            <v-col :cols="12" :md="12 - dataInputColumns.md" :lg="12 - dataInputColumns.lg" :order="1 - cellIndex" v-if="isGuidedWalk && guidedWalk && guidedWalk.scoreWidth > 1" :class="`d-flex ${cellIndex === 0 ? 'border-s' : 'border-e'}`">
              <v-card :title="guidedWalk.currentCells[1 - cellIndex]?.displayName" class="d-flex flex-column flex-grow-1" @click="save(0)">
                <template #subtitle>
                  <!-- @vue-ignore -->
                  <PlotInformation :cell="guidedWalk.currentCells[1 - cellIndex]" v-if="guidedWalk.currentCells[1 - cellIndex]" />
                </template>

                <v-card-text class="flex-grow-1 d-flex align-center justify-center">
                  <v-btn variant="tonal" :text="$t('buttonSwapGuidedWalkCells')" />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>

    <DataInputCloseModal
      ref="dataInputCloseModal"
      @close="hide()"
      @save="save()"
    />
  </v-dialog>
</template>

<script setup lang="ts">
  import { changeTrialsData, getCell, getTrialValidPlots, type DataModification } from '@/plugins/idb'
  import type { CellPlus, Geolocation, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import PlotInformation from '@/components/plot/PlotInformation.vue'
  import { useI18n } from 'vue-i18n'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import ResponsiveButton from '@/components/util/ResponsiveButton.vue'
  import TraitInputSection from '@/components/trait/TraitInputSection.vue'
  import type { TraitMeasurement } from '@/plugins/types/gridscore'

  import emitter from 'tiny-emitter/instance'
  import { getSequence, methods, type Step } from '@/plugins/guidedwalk'
  import TrialPreviewCanvas from '@/components/data/TrialPreviewCanvas.vue'
  import DataInputCloseModal from '@/components/modals/DataInputCloseModal.vue'

  interface TraitGroup {
    name: string
    traits: TraitPlus[]
    valid: boolean | undefined
  }

  interface GuidedWalk {
    prevCells?: (CellPlus | undefined)[]
    currentCells: (CellPlus | undefined)[]
    nextCells?: (CellPlus | undefined)[]
    scoreWidth: number
    order: Step[]
    index: number
  }

  interface GuidedWalkConfig {
    row: number
    column: number
    walkName: string
    scoreWidth: number
  }

  type CellData = { [key: string]: TraitData }
  export type TraitData = { [key: string]: string }

  const emit = defineEmits(['data-changed', 'hide'])

  const dataInputCloseModal = useTemplateRef('dataInputCloseModal')

  const compProps = defineProps<{
    trial: TrialPlus
    geolocation?: Geolocation
  }>()

  const { t } = useI18n()
  const store = coreStore()
  const router = useRouter()

  const dialog = ref(false)
  const cell = ref<CellPlus>()
  const cellData = ref<CellData>({})
  const recordingDate = ref<Date>()
  const cellIndex = ref<number>(0)
  const guidedWalk = ref<GuidedWalk>()

  const refs = ref<{ [index: string]: Element | ComponentPublicInstance | null }>({})

  const expandedTraitGroups = ref<number[]>([])

  const isGuidedWalk = computed(() => guidedWalk.value !== undefined)

  const cancelConfig = computed(() => {
    if (isGuidedWalk.value && guidedWalk.value) {
      return {
        title: t('buttonPrevious'),
        prependIcon: 'mdi-chevron-left',
        color: 'primary',
        appendIcon: undefined,
        disabled: guidedWalk.value.index === 0,
      }
    } else {
      return {
        title: t('buttonCancel'),
        prependIcon: 'mdi-cancel',
        color: undefined,
        appendIcon: undefined,
        disabled: false,
      }
    }
  })

  const okConfig = computed(() => {
    if (compProps.trial.editable) {
      if (isGuidedWalk.value && guidedWalk.value) {
        if (guidedWalk.value.index < guidedWalk.value.order.length - 1) {
          return {
            title: t('buttonNext'),
            prependIcon: undefined,
            color: 'primary',
            appendIcon: 'mdi-chevron-right',
            disabled: false,
          }
        } else {
          return {
            title: t('buttonFinish'),
            color: 'primary',
            prependIcon: 'mdi-notebook-check',
            appendIcon: undefined,
            disabled: false,
          }
        }
      } else {
        return {
          title: t('buttonSave'),
          color: 'primary',
          prependIcon: 'mdi-content-save',
          appendIcon: undefined,
          disabled: !canSave.value,
        }
      }
    } else {
      return {
        title: t('buttonClose'),
        color: undefined,
        prependIcon: 'mdi-cancel',
        appendIcon: undefined,
        disabled: !canSave.value,
      }
    }
  })

  const dataInputColumns = computed(() => {
    if (isGuidedWalk.value && guidedWalk.value && guidedWalk.value.scoreWidth > 1) {
      return {
        cols: 12,
        md: 9,
        lg: 10,
      }
    }

    return {
      cols: 12,
      md: 12,
      lg: 12,
    }
  })

  const canSave = computed(() => {
    return Object.values(cellData.value).some(cd => Object.values(cd).some(td => td !== undefined && td !== null))
  })

  const visibleTraits = computed(() => {
    if (compProps.trial) {
      return compProps.trial.traits.filter(t => !store.storeHiddenTraits.includes(t.id || ''))
    } else {
      return []
    }
  })

  const traitsByGroup = computed(() => {
    let groups: TraitGroup[] = []

    if (visibleTraits.value && cell.value) {
      const result: { [index: string]: TraitPlus[] } = {}

      visibleTraits.value.forEach(trait => {
        if (store.storeHiddenTraits.includes(trait.id || '')) {
          return
        }

        const group = (trait.group && trait.group.name) ? trait.group.name : t('dropdownOptionTraitNoGroup')

        const copy = JSON.parse(JSON.stringify(trait))

        let groupTraits = result[group]
        if (!groupTraits) {
          groupTraits = [copy]
        } else {
          groupTraits.push(copy)
        }
        result[group] = groupTraits
      })

      groups = Object.keys(result).map(k => {
        return {
          name: k,
          traits: result[k] || [],
          valid: undefined,
        }
      })
    }

    return groups
  })

  function onCancel () {
    if (isGuidedWalk.value) {
      save(-1)
    } else {
      hide()
    }
  }

  watch(traitsByGroup, async newValue => {
    expandedTraitGroups.value = newValue ? Object.keys(newValue).map((v, index) => index) : []
  }, { immediate: true })

  watch(() => guidedWalk.value?.index, async newValue => {
    if (guidedWalk.value && newValue !== undefined) {
      const nextCoords = newValue < guidedWalk.value.order.length - 1 ? guidedWalk.value.order[newValue + 1] : null
      const prevCoords = newValue > 0 ? guidedWalk.value.order[newValue - 1] : null

      // @ts-ignore
      guidedWalk.value.order[guidedWalk.value.index].cells.forEach((c, i) => {
        getCell(compProps.trial.localId || '', c.y, c.x)
          .then(cell => {
            // @ts-ignore
            guidedWalk.value.currentCells[i] = cell
          })
      })

      if (nextCoords !== null) {
        guidedWalk.value.nextCells = []
        // @ts-ignore
        guidedWalk.value.order[newValue + 1].cells.forEach((c, i) => {
          getCell(compProps.trial.localId || '', c.y, c.x)
            .then(next => {
              // @ts-ignore
              guidedWalk.value.nextCells[i] = next
            })
        })
      } else {
        guidedWalk.value.nextCells = []
      }
      if (prevCoords !== null) {
        guidedWalk.value.prevCells = []
        // @ts-ignore
        guidedWalk.value.order[newValue - 1].cells.forEach((c, i) => {
          getCell(compProps.trial.localId || '', c.y, c.x)
            .then(prev => {
              // @ts-ignore
              guidedWalk.value.prevCells[i] = prev
            })
        })
      } else {
        guidedWalk.value.prevCells = []
      }
    }
  })

  function confirmClose () {
    if (!compProps.trial.editable) {
      hide()
    } else {
      if (isGuidedWalk.value) {
        emitter.emit('show-confirm', {
          title: t('modalTitleStopGuidedWalk'),
          message: t('modalTextStopGuidedWalk'),
          okTitle: t('buttonYes'),
          cancelTitle: t('buttonNo'),
          okVariant: 'error',
          callback: (result: boolean) => {
            if (result) {
              router.push('/collect/grid')
            }
          },
        })
      } else {
        dataInputCloseModal.value?.show()
      }
    }
  }
  function save (delta = 1) {
    // TODO
    const c = cell.value
    if (!compProps.trial.editable || !c) {
      hide()
      return
    }

    const now = new Date()
    const date = now

    // If we're not using today as the recording date, then adjust to this time of day
    if (recordingDate.value) {
      date.setDate(recordingDate.value.getDate())
      date.setMonth(recordingDate.value.getMonth())
      date.setFullYear(recordingDate.value.getFullYear())
      date.setUTCHours(now.getUTCHours())
      date.setUTCMinutes(now.getUTCMinutes())
      date.setUTCSeconds(now.getUTCSeconds())
      date.setUTCMilliseconds(now.getUTCMilliseconds())
    }

    const newValues: TraitMeasurement[] = []

    visibleTraits.value.forEach(t => {
      const traitValues = cellData.value[t.id || '']

      if (traitValues && Object.values(traitValues).length > 0) {
        const setValues = []

        for (let s = 0; s < t.setSize; s++) {
          setValues.push(traitValues[s + 1] === null ? undefined : traitValues[s + 1])
        }

        if (!setValues.every(sv => sv === undefined || sv === null)) {
          newValues.push({
            traitId: t.id || '',
            personId: store.storeSelectedTrialPerson,
            values: setValues,
            timestamp: date.toISOString(),
          })
        }
      }
    })

    if (newValues.length > 0) {
      const payload: DataModification = {}
      payload[`${c.row}|${c.column}`] = newValues

      changeTrialsData(compProps.trial.localId || '', payload, compProps.geolocation)
        .then(() => {
          // Take copies for the emitter later
          const row = c.row
          const column = c.column
          const trialId = compProps.trial.localId

          if (guidedWalk.value) {
            handleGuidedWalkStep(delta)
          } else {
            hide()
          }

          nextTick(() => {
            emitter.emit('plot-data-changed', row, column, trialId)
            emit('data-changed')
          })
        })
    } else {
      if (isGuidedWalk.value) {
        handleGuidedWalkStep(delta)
      } else {
        hide()
      }
    }
  }

  function handleGuidedWalkStep (delta: number) {
    if (guidedWalk.value) {
      if (delta === 0) {
        cellIndex.value = 1 - cellIndex.value

        // @ts-ignore
        show(guidedWalk.value.currentCells[cellIndex.value].row, guidedWalk.value.currentCells[cellIndex.value].column)
      } else {
        const index = guidedWalk.value.index + delta
        if (index > -1 && index < guidedWalk.value.order.length) {
          guidedWalk.value.index = index
          const next = guidedWalk.value.order[guidedWalk.value.index]
          cellIndex.value = 0
          if (next && next.cells && next.cells.length > 0 && next.cells[0]) {
            show(next.cells[0].y, next.cells[0].x)
          } else {
            hide()
          }
        } else {
          hide()
        }
      }
    }
  }

  function traverse (trait: TraitPlus, traitIndex: number, traits: TraitPlus[], setIndex: number) {
    if (!store.storeAutoProgressInputs) {
      return
    }

    if (setIndex < trait.setSize) {
      // @ts-ignore
      refs.value[`${trait.id}`].focus(setIndex + 1)
    } else if (traitIndex < traits.length - 1) {
      // @ts-ignore
      refs.value[`${traits[traitIndex + 1].id}`]?.focus(1)
    } else {
      const traitGroupIndex = traitsByGroup.value.findIndex(tg => tg.traits.some(tt => tt.id === trait.id))

      if (traitGroupIndex < traitsByGroup.value.length) {
        // TODO: Expand trait group
        const nextGroup = traitsByGroup.value[traitGroupIndex + 1]
        if (nextGroup) {
          const expandedGroups = new Set<number>(expandedTraitGroups.value)
          expandedGroups.add(traitGroupIndex + 1)
          expandedTraitGroups.value = [...expandedGroups]

          nextTick(() => {
            // @ts-ignore
            refs.value[`${nextGroup?.traits[0]?.id}`]?.focus(1)
          })
        }
      }
    }
  }

  function onSelectGuidedWalk (config: GuidedWalkConfig) {
    const match = methods.find(g => g.name === config.walkName)

    if (match) {
      getTrialValidPlots(compProps.trial.localId || '').then(validCells => {
        const order = getSequence(config.column, config.row, match.initialDirection, match, compProps.trial.layout, config.scoreWidth).steps.filter(c => {
          return c.cells?.some(cc => validCells.includes(`${cc.y}|${cc.x}`))
        })

        const cells = (order && order.length > 0 && order[0]) ? (order[0].cells || []) : []

        guidedWalk.value = {
          prevCells: undefined,
          currentCells: cells.map(() => undefined),
          nextCells: undefined,
          scoreWidth: config.scoreWidth,
          order,
          index: 0,
        }

        show(cells[cellIndex.value]?.y, cells[cellIndex.value]?.x)
      })
    }
  }

  function show (row?: number, column?: number) {
    cellData.value = {}

    compProps.trial.traits.forEach(t => {
      cellData.value[t.id || ''] = {}
    })

    if (row !== undefined && column !== undefined) {
      getCell(store.storeSelectedTrial || '', row, column)
        .then(c => {
          cell.value = c
          dialog.value = true
        })
    } else {
      dialog.value = true
    }
  }
  function hide () {
    dialog.value = false
    emit('hide')
  }

  function updateCellComments (row: number, column: number, trialId: string, c: CellPlus) {
    if (compProps.trial && cell.value && store.storeSelectedTrial === trialId && cell.value.row === row && cell.value.column === column) {
      cell.value.comments = c.comments
    }
  }

  onMounted(() => {
    emitter.on('plot-clicked', show)
    emitter.on('plot-cache-changed', updateCellComments)
    emitter.on('force-guided-walk', onSelectGuidedWalk)
  })

  onBeforeUnmount(() => {
    emitter.off('plot-clicked', show)
    emitter.off('plot-cache-changed', updateCellComments)
    emitter.off('force-guided-walk', onSelectGuidedWalk)
  })

  defineExpose({
    show,
    hide,
  })
</script>
