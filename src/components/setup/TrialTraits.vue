<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <v-alert
          v-if="isDisabledDueToEdit"
          class="mb-5"
          color="warning"
          :icon="mdiTagPlus"
          :text="$t('widgetBannerTraitsAddViaCardWarning')"
          variant="tonal"
          border="start"
        />

        <form @submit.prevent>
          <v-text-field
            class="mb-3"
            v-model="currentTrait.name"
            :prepend-inner-icon="mdiTextShort"
            :label="$t('formLabelTraitName')"
            :hint="$t('formDescriptionTraitName')"
            :error-messages="formState.name ? [$t(formState.name)] : undefined"
            :disabled="isDisabledDueToEdit"
            persistent-hint
            required
            @keyup.exact.enter="addTrait"
          />

          <v-textarea
            class="mb-3"
            v-model="currentTrait.description"
            :prepend-inner-icon="mdiTextLong"
            :disabled="isDisabledDueToEdit"
            :label="$t('formLabelTraitDescription')"
            :hint="$t('formDescriptionTraitDescription')"
            persistent-hint
          />

          <v-row>
            <v-col cols="6">
              <v-select
                class="mb-3"
                v-model="currentTrait.dataType"
                :items="dts"
                :disabled="isDisabledDueToEdit || !canEdit"
                :hint="$t('formDescriptionTraitDataType')"
                :prepend-inner-icon="dts.find(dt => dt.value === currentTrait.dataType)?.icon"
                persistent-hint
              >
                <template #item="{ props, internalItem: item }">
                  <v-list-item v-bind="props" :prepend-icon="item.raw.icon" :title="item.raw.title" />
                </template>
              </v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field
                class="mb-3"
                v-model="group.name"
                list="trait-groups"
                :disabled="isDisabledDueToEdit"
                :prepend-inner-icon="mdiTagText"
                :label="$t('formLabelTraitGroup')"
                :hint="$t('formDescriptionTraitGroup')"
                persistent-hint
                autocomplete="off"
              />
              <datalist id="trait-groups" v-if="traitGroups && traitGroups.length > 0">
                <option v-for="g in traitGroups" :key="`trial-group-${g}`">{{ g }}</option>
              </datalist>
            </v-col>
          </v-row>

          <TraitInput
            :label="$t('formLabelTraitExample')"
            :hint="$t('formDescriptionTraitExample')"
            :trait="exampleTrait"
            bg-color="warning"
            :cell="{ row: -1, column: -1, germplasm: '', categories: [] }"
            editable
            :measurements="[]"
            v-model="exampleTraitValue"
          />

          <v-combobox
            v-show="TraitDataType.isCategorical(currentTrait.dataType)"
            class="mb-3"
            v-model="restrictions.categories"
            clearable
            chips
            multiple
            counter
            :disabled="isDisabledDueToEdit || !canEdit"
            :delimiters="['\n']"
            :messages="formState.categories ? undefined : ['f']"
            :prepend-inner-icon="mdiTagMultiple"
            :label="$t('formLabelTraitRestrictionsCategories')"
            :error-messages="formState.categories ? [$t(formState.categories)] : undefined"
            persistent-hint
            ref="categoryInput"
          >
            <template #message>
              <span v-if="formState.categories">{{ $t(formState.categories) }}</span>
              <span v-html="$t('formDescriptionTraitRestrictionsCategories')" v-else />
            </template>
          </v-combobox>

          <v-row v-if="TraitDataType.isNumeric(currentTrait.dataType)">
            <v-col cols="12" :lg="currentTrait.dataType === TraitDataType.range ? 4 : 6">
              <v-number-input
                v-model="restrictions.min"
                class="mb-3"
                control-variant="stacked"
                :disabled="isDisabledDueToEdit || !canEdit"
                :prepend-inner-icon="mdiFormatVerticalAlignBottom"
                :label="$t('formLabelTraitRestrictionsMin')"
                :hint="$t('formDescriptionTraitRestrictionsMin')"
                :error-messages="formState.min ? [$t(formState.min)] : undefined"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" :lg="currentTrait.dataType === TraitDataType.range ? 4 : 6">
              <v-number-input
                v-model="restrictions.max"
                class="mb-3"
                control-variant="stacked"
                :disabled="isDisabledDueToEdit || !canEdit"
                :prepend-inner-icon="mdiFormatVerticalAlignTop"
                :label="$t('formLabelTraitRestrictionsMax')"
                :hint="$t('formDescriptionTraitRestrictionsMax')"
                :error-messages="formState.max ? [$t(formState.max)] : undefined"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" lg="4" v-if="currentTrait.dataType === TraitDataType.range">
              <v-number-input
                v-model="restrictions.step"
                class="mb-3"
                control-variant="stacked"
                :precision="null"
                :disabled="isDisabledDueToEdit || !canEdit"
                :prepend-inner-icon="mdiDebugStepOver"
                :label="$t('formLabelTraitRestrictionsStep')"
                :hint="$t('formDescriptionTraitRestrictionsStep')"
                :error-messages="formState.step ? [$t(formState.step)] : undefined"
                persistent-hint
              />
            </v-col>
          </v-row>

          <v-number-input
            v-model="currentTrait.setSize"
            class="mb-3"
            :min="1"
            :disabled="isDisabledDueToEdit || !canEdit"
            :prepend-inner-icon="mdiSetSplit"
            :label="$t('formLabelTraitSetSize')"
            :hint="$t('formDescriptionTraitSetSize')"
            persistent-hint
          />

          <v-switch
            v-model="currentTrait.allowRepeats"
            color="primary"
            class="mb-3"
            :disabled="isDisabledDueToEdit || !canEdit"
            :prepend-icon="mdiTimelinePlus"
            :label="$t('formLabelTraitAllowRepeats')"
            :hint="$t('formDescriptionTraitAllowRepeats')"
            persistent-hint
          />

          <v-switch
            v-model="timeframeSet"
            color="primary"
            class="mb-3"
            :disabled="isDisabledDueToEdit || !canEdit"
            :prepend-icon="mdiCalendarExpandHorizontal"
            :label="$t('formLabelTraitTimeframe')"
            :hint="$t('formDescriptionTraitTimeframe')"
            persistent-hint
          />

          <v-card
            :title="$t('formLabelTraitTimeframeType')"
            :prepend-icon="mdiCalendarExpandHorizontal"
            variant="tonal"

            v-if="timeframeSet && timeframe"
          >
            <template #subtitle>
              <span class="text-wrap">{{ $t('formDescriptionTraitTimeframeType') }}</span>
            </template>

            <template #text>
              <v-btn-toggle v-model="timeframe.type" mandatory :disabled="isDisabledDueToEdit || !canEdit" variant="tonal" class="mb-3">
                <v-btn :value="TimeframeType.SUGGEST" color="warning" :text="$t('formSelectOptionTraitTimeframeSuggest')" :prepend-icon="mdiAlert" />
                <v-btn :value="TimeframeType.ENFORCE" color="error" :text="$t('formSelectOptionTraitTimeframeEnforce')" :prepend-icon="mdiMinusCircle" />
              </v-btn-toggle>

              <v-row>
                <v-col cols="6">
                  <v-date-input
                    :label="$t('formLabelTraitTimeframeStart')"
                    :hint="$t('formDescriptionTraitTimeframeStart')"
                    persistent-hint
                    prepend-icon=""
                    :disabled="isDisabledDueToEdit || !canEdit"
                    :max="timeframe.end"
                    :prepend-inner-icon="mdiCalendarStart"
                    clearable
                    :model-value="timeframe.start ? date.toJsDate(timeframe.start) : undefined"
                    @update:model-value="setStartDate"
                  />
                </v-col>
                <v-col cols="6">
                  <v-date-input
                    :label="$t('formLabelTraitTimeframeEnd')"
                    :hint="$t('formDescriptionTraitTimeframeEnd')"
                    persistent-hint
                    prepend-icon=""
                    :disabled="isDisabledDueToEdit || !canEdit"
                    :min="timeframe.start"
                    :prepend-inner-icon="mdiCalendarEnd"
                    clearable
                    :model-value="timeframe.end ? date.toJsDate(timeframe.end) : undefined"
                    @update:model-value="setEndDate"
                  />
                </v-col>
              </v-row>
            </template>
          </v-card>

          <v-btn class="my-5" @click="addTrait" color="primary" :disabled="isDisabledDueToEdit || !currentTrait || !currentTrait.name || currentTrait.name.trim().length === 0" :prepend-icon="currentTrait.id ? mdiTagEdit : mdiTagPlus" :text="$t(currentTrait.id ? 'buttonUpdate' : 'buttonAdd')" />
        </form>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="mb-3" :subtitle="$t('pageTrialTraitListText')">
          <template #title>
            <div class="d-flex justify-space-between align-center">
              <span>{{ $t('pageTrialTraitListTitle') }}</span>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn class="my-1" v-bind="props" :text="$t('dropdownImportExportTraits')" />
                </template>

                <v-list>
                  <v-list-subheader>{{ $t('dropdownSectionImportTraits') }}</v-list-subheader>
                  <v-list-item :disabled="isEdit" @click="importExportStart(false, 'json')">{{ $t('dropdownOptionImportTraitsJson') }}</v-list-item>
                  <v-list-item :disabled="isEdit" @click="importExportStart(false, 'germinate')">{{ $t('dropdownOptionImportTraitsGerminate') }}</v-list-item>
                  <v-list-item :disabled="isEdit" @click="importExportStart(false, 'tabular')">{{ $t('dropdownOptionImportTraitsTabular') }}</v-list-item>
                  <v-list-item :disabled="isEdit" @click="traitImportFromTrialModal?.show()">{{ $t('dropdownOptionImportTraitsOtherTrial') }}</v-list-item>
                  <v-list-item :disabled="isEdit" @click="traitImportFromBrapiModal?.show()">{{ $t('dropdownOptionImportTraitsBrapi') }}</v-list-item>

                  <v-list-subheader>{{ $t('dropdownSectionExportTraits') }}</v-list-subheader>
                  <v-list-item :disabled="!model || model.length === 0" @click="importExportStart(true, 'json')">{{ $t('dropdownOptionExportTraitsJson') }}</v-list-item>
                  <v-list-item :disabled="!model || model.length === 0" @click="importExportStart(true, 'germinate')">{{ $t('dropdownOptionExportTraitsGerminate') }}</v-list-item>
                  <v-list-item :disabled="!model || model.length === 0" @click="importExportStart(true, 'tabular')">{{ $t('dropdownOptionExportTraitsTabular') }}</v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
          <template #actions v-if="model && model.length > 0">
            <v-btn :prepend-icon="mdiDelete" :text="$t('buttonClear')" :disabled="isEdit === true" @click="clearTraits" variant="tonal" color="error" />
          </template>
        </v-card>
        <template v-if="model && model.length > 0">
          <div
            ref="traitListRef"
          >
            <v-card
              v-for="(element, index) in model"
              :key="`trait-${element.id}`"
              class="mb-3"
              variant="tonal"
              :color="element.id === currentTrait?.id ? 'primary' : undefined"
              @click="setTrait(element)"
            >
              <template #title>
                <div class="d-flex justify-space-between align-center">
                  <span>{{ element.name }}</span>
                  <div>
                    <v-chip label size="small" color="primary" :prepend-icon="dts.find(dt => dt.value === element.dataType)?.icon" :text="dts.find(dt => dt.value === element.dataType)?.shortTitle" />
                  </div>
                </div>
              </template>
              <template #subtitle>
                <span class="text-wrap" v-if="element.description">{{ element.description }}</span>
              </template>

              <template #text>
                <div class="d-flex justify-space-between">
                  <div>
                    <div class="mb-2">
                      <v-chip
                        label
                        class="me-2 mb-1"
                        size="small"
                        :text="$t(element.allowRepeats ? 'formFeedbackTraitAllowRepeats' : 'formFeedbackTraitNoAllowRepeats')"
                        :prepend-icon="element.allowRepeats ? mdiTimelinePlus : mdiTimelineRemove"
                      />

                      <v-chip
                        label
                        class="me-2 mb-1"
                        size="small"
                        :text="$t('formFeedbackTraitSetSize', { count: element.setSize })"
                        :prepend-icon="mdiSetSplit"
                      />

                      <v-chip
                        v-if="element.group && element.group.name"
                        label
                        class="me-2 mb-1"
                        size="small"
                        :text="element.group.name"
                        :prepend-icon="mdiTagText"
                      />
                    </div>
                    <div v-if="element.timeframe" class="mb-2">
                      <v-chip
                        label
                        size="small"
                        class="me-2 mb-1"
                        :text="$t(element.timeframe.type === TimeframeType.SUGGEST ? 'formSelectOptionTraitTimeframeSuggest' : 'formSelectOptionTraitTimeframeEnforce')"
                        :prepend-icon="element.timeframe.type === TimeframeType.SUGGEST ? mdiAlert : mdiMinusCircle"
                      />
                      <v-chip
                        v-if="element.timeframe.start"
                        label
                        size="small"
                        class="me-2 mb-1"
                        :text="element.timeframe.start"
                        :prepend-icon="mdiCalendarStart"
                      />
                      <v-chip
                        v-if="element.timeframe.end"
                        label
                        size="small"
                        class="me-2 mb-1"
                        :text="element.timeframe.end"
                        :prepend-icon="mdiCalendarEnd"
                      />
                    </div>
                  </div>
                  <div class="d-flex flex-column ga-1">
                    <v-btn variant="outlined" @click.prevent.stop="moveTrait(index, -1)" :disabled="index === 0">
                      <v-icon :icon="mdiChevronUp" />
                    </v-btn>
                    <v-btn variant="outlined" @click.prevent.stop="moveTrait(index, 1)" :disabled="index === model.length - 1">
                      <v-icon :icon="mdiChevronDown" />
                    </v-btn>
                  </div>
                </div>
              </template>
              <template #actions>
                <v-btn variant="tonal" :text="$t('buttonDuplicate')" color="info" :disabled="isEdit" :prepend-icon="mdiContentDuplicate" @click.stop="duplicateTrait(element)" />
                <v-spacer />
                <v-btn variant="tonal" :text="$t('buttonDelete')" color="error" :prepend-icon="mdiDelete" @click.stop="deleteTrait(index)" />
              </template>
            </v-card>
          </div>
        </template>
        <p v-else>{{ $t('pageTrialTraitListEmpty') }}</p>

        <v-card
          v-show="traitGroupOrder && traitGroupOrder.length > 1"
          class="mb-5"
          :title="$t('pageTrialTraitGroupListTitle')"
          :subtitle="$t('pageTrialTraitGroupListText')"
          :prepend-icon="mdiFormatListNumbered"
        >
          <v-card-text
            ref="traitGroupListRef"
          >
            <v-chip
              v-for="groupName in traitGroupOrder"
              :key="`group-${groupName}`"
              :text="groupName"
              :prepend-icon="mdiTagText"
              label
              class="drag-handle me-2 my-1"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <TraitImportFromBrapiModal ref="traitImportFromBrapiModal" @traits-selected="addTraitsFromOtherTrial" />
    <TraitImportFromTrialModal ref="traitImportFromTrialModal" @traits-selected="addTraitsFromOtherTrial" />
    <GenericAddEditFormModal :ok-title="formContent.okTitle" :title="formContent.title" :fields="formFields" :item="formContent" :notify="importExport" ref="formModal" />

    <!-- @vue-ignore -->
    <MediaModal :trial="{ localId: 'setup', name: 'setup', traits: [] }" />
  </div>
</template>

<script setup lang="ts">
  import { dataTypes, type DataType } from '@/plugins/constants'
  import { getId } from '@/plugins/id'
  import { getTrials } from '@/plugins/idb'
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { type Restrictions, TraitDataType, type Group, type Trait, type Timeframe, TimeframeType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'
  import { useDate } from 'vuetify'
  import GenericAddEditFormModal from '@/components/modals/GenericAddEditFormModal.vue'
  import TraitImportFromTrialModal from '@/components/modals/TraitImportFromTrialModal.vue'
  import TraitImportFromBrapiModal from '@/components/modals/TraitImportFromBrapiModal.vue'

  import emitter from 'tiny-emitter/instance'
  import { germinateToTraits, intersection, jsonToTraits, tabularToTraits } from '@/plugins/util'
  import { mdiAlert, mdiCalendarEnd, mdiCalendarExpandHorizontal, mdiCalendarStart, mdiContentDuplicate, mdiDelete, mdiDrag, mdiFormatListNumbered, mdiFormatVerticalAlignBottom, mdiFormatVerticalAlignTop, mdiTagText, mdiMinusCircle, mdiSetSplit, mdiTagEdit, mdiTagMultiple, mdiTagPlus, mdiTextLong, mdiTextShort, mdiTimelinePlus, mdiTimelineRemove, mdiDebugStepOver, mdiChevronUp, mdiChevronDown } from '@mdi/js'
  import { traitsToGerminate, traitsToTabular } from '@/plugins/dataexport'
  import TraitInput from '@/components/inputs/TraitInput.vue'
  import { dragAndDrop } from '@formkit/drag-and-drop/vue'

  const { t } = useI18n()
  const store = coreStore()
  const date = useDate()

  interface FormState {
    name?: string
    categories?: string
    min?: string
    max?: string
    step?: string
  }
  interface ImportExportFormContent {
    content: string
    type: 'json' | 'germinate' | 'tabular'
    isImport: boolean
    title: string
    okTitle: string
  }

  const model = defineModel<TraitPlus[]>({
    default: [],
  })
  const traitGroupOrder = defineModel<string[]>('traitGroupOrder', { default: [] })

  export interface TrialTraitsProps {
    trialIdsForTraitGroups?: string[]
    isEdit?: boolean
    isClone?: boolean
    isTrialOwner?: boolean
    existingTraits?: TraitPlus[]
  }

  const compProps = withDefaults(defineProps<TrialTraitsProps>(), {
    isEdit: false,
    isClone: false,
    isTrialOwner: false,
    existingTraits: () => [],
  })

  const traitImportFromBrapiModal = useTemplateRef('traitImportFromBrapiModal')
  const traitImportFromTrialModal = useTemplateRef('traitImportFromTrialModal')
  const categoryInput = useTemplateRef('categoryInput')
  const formModal = useTemplateRef('formModal')
  const traitGroupListRef = ref()

  dragAndDrop<string>({
    parent: traitGroupListRef,
    values: traitGroupOrder,
  })

  const exampleTraitValue = ref<string>()
  const initialTraitIds = ref<Set<string>>(new Set())
  const formState = ref<FormState>({})
  const trials = ref<TrialPlus[]>([])
  const currentTrait = ref<Trait>({
    name: '',
    description: undefined,
    dataType: TraitDataType.int,
    allowRepeats: true,
    setSize: 1,
  })
  // Nested temp fields because of potentially missing information
  const timeframeSet = ref<boolean>(false)
  const timeframe = ref<Timeframe | undefined>({
    type: TimeframeType.SUGGEST,
    start: undefined,
    end: undefined,
  })
  const group = ref<Group>({
    name: undefined,
  })
  const restrictions = ref<Restrictions>({
    min: undefined,
    max: undefined,
    step: undefined,
    categories: undefined,
  })

  // Stuff for the import/export form
  const formContent = ref<ImportExportFormContent>({
    content: '',
    title: '',
    type: 'json',
    isImport: true,
    okTitle: '',
  })
  const formFields = computed(() => {
    let title
    let label
    let description
    const isImport = formContent.value.content.length === 0
    const okTitle = isImport ? 'buttonImport' : 'buttonClose'

    switch (formContent.value.type) {
      case 'germinate':
        if (isImport) {
          title = 'modalTitleTraitImportGerminate'
        } else {
          title = 'modalTitleTraitExportGerminate'
        }
        label = 'formLabelTraitImportExportGerminate'
        description = 'formDescriptionTraitImportExportGerminate'
        break
      case 'json':
        if (isImport) {
          title = 'modalTitleTraitImportJson'
        } else {
          title = 'modalTitleTraitExportJson'
        }
        label = 'formLabelTraitImportExportJson'
        description = 'formDescriptionTraitImportExportJson'
        break
      case 'tabular':
        if (isImport) {
          title = 'modalTitleTraitImportTabular'
        } else {
          title = 'modalTitleTraitExportTabular'
        }
        label = 'formLabelTraitImportExportTabular'
        description = 'formDescriptionTraitImportExportTabular'
        break
    }

    formContent.value.title = title
    formContent.value.okTitle = okTitle
    formContent.value.isImport = isImport

    return [{
      key: 'content',
      type: 'textarea' as const,
      required: true,
      width: 2,
      autofocus: true,
      title: label,
      hint: description,
      inputAutoSelectAll: true,
    }]
  })

  const exampleTrait: ComputedRef<TraitPlus> = computed(() => {
    const result: TraitPlus = {
      name: 'Example',
      dataType: currentTrait.value.dataType,
      allowRepeats: false,
      setSize: 1,
      editable: true,
    }

    switch (currentTrait.value.dataType) {
      case TraitDataType.categorical:
      case TraitDataType.multicat:
        result.restrictions = {
          categories: (restrictions.value.categories && restrictions.value.categories.length > 0) ? restrictions.value.categories : [t('widgetExampleTraitCatValueOne'), t('widgetExampleTraitCatValueTwo'), t('widgetExampleTraitCatValueThree')],
        }
        break
      case TraitDataType.boolean:
        result.dataType = TraitDataType.categorical
        result.restrictions = {
          categories: ['true', 'false'],
        }
        break
      case TraitDataType.int:
      case TraitDataType.float:
      case TraitDataType.range:
        result.restrictions = {
          min: restrictions.value.min || 0,
          max: restrictions.value.max || 10,
          step: restrictions.value.step || 1,
        }

        break
    }

    return result
  })

  const isDisabledDueToEdit = computed(() => compProps.isEdit === true && (currentTrait.value === undefined || currentTrait.value.id === undefined))

  const canEdit = computed(() => compProps.isEdit === false || currentTrait.value.id === undefined || !initialTraitIds.value.has(currentTrait.value.id || ''))

  const existingTraitNames = computed(() => {
    const names = new Set<string>()

    if (model.value) {
      model.value.filter(t => t.id !== currentTrait.value.id).forEach(t => names.add(t.name.trim().toLocaleLowerCase()))
    }
    if (compProps.existingTraits) {
      compProps.existingTraits.forEach(t => names.add(t.name.trim().toLocaleLowerCase()))
    }

    return [...names]
  })

  const dts: ComputedRef<DataType[]> = computed(() => {
    return dataTypes.map(dt => {
      return {
        title: t(dt.title),
        shortTitle: t(dt.shortTitle),
        icon: dt.icon,
        value: dt.value,
      }
    })
  })

  const traitGroups = computed(() => {
    const set = new Set<string>()

    if (trials.value && trials.value.length > 0) {
      trials.value.forEach(trial => {
        if (trial.traits && trial.traits.length > 0) {
          trial.traits.forEach(t => {
            if (t.group && t.group.name && t.group.name !== '') {
              set.add(t.group.name)
            }
          })
        }
      })
    }

    model.value?.forEach(t => {
      if (t.group && t.group.name && t.group.name !== '') {
        set.add(t.group.name)
      }
    })

    if (set.size > 0) {
      return [...set].sort((a, b) => a.localeCompare(b, store.storeLocale || 'en', { numeric: true, sensitivity: 'base' }))
    } else {
      return []
    }
  })

  watch(group, async newValue => {
    if (newValue && newValue.name && newValue.name.length > 0) {
      currentTrait.value.group = {
        name: newValue.name,
      }
    } else {
      currentTrait.value.group = undefined
    }
  })

  watch(timeframeSet, async newValue => {
    if (newValue) {
      timeframe.value = {
        type: TimeframeType.SUGGEST,
        start: undefined,
        end: undefined,
      }
    } else {
      timeframe.value = undefined
    }
  })

  watch(() => currentTrait.value.dataType, async newValue => {
    if (!TraitDataType.isCategorical(newValue)) {
      restrictions.value.categories = undefined
    }
    if (!TraitDataType.isNumeric(newValue)) {
      restrictions.value.min = undefined
      restrictions.value.max = undefined
      restrictions.value.step = undefined
    }
  })

  watch(model, async newValue => {
    const oldTgs = new Set<string>(traitGroupOrder.value)
    const newTgs = new Set<string>()

    newValue.forEach(t => {
      if (t.group && t.group.name) {
        newTgs.add(t.group.name)
      }
    })

    const is = intersection<string>(oldTgs, newTgs)

    if (is.size !== newTgs.size || is.size !== oldTgs.size) {
      // Different groups => update
      traitGroupOrder.value = [...newTgs]
    }
  }, { deep: true, immediate: true })

  function duplicateTrait (trait: Trait) {
    reset()

    const copy = JSON.parse(JSON.stringify(trait))
    delete copy.id

    setTrait(copy)
  }

  function moveTrait (currentIndex: number, delta: number) {
    const toIndex = currentIndex + delta
    const element = model.value[currentIndex]
    if (element) {
      model.value.splice(currentIndex, 1)
      model.value.splice(toIndex, 0, element)
    }
  }

  function clearTraits () {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteTraits'),
      message: t('modalTextDeleteTraits'),
      okTitle: t('genericYes'),
      cancelTitle: t('genericNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result === true) {
          model.value = []
        }
      },
    })
  }

  function deleteTrait (index: number) {
    if (compProps.isEdit) {
      if (compProps.isTrialOwner) {
        emitter.emit('show-confirm', {
          title: t('modalTitleDeleteTrait'),
          message: t('modalTextDeleteTraitFromSharedTrial'),
          needsConfirmation: true,
          okTitle: t('genericYes'),
          cancelTitle: t('genericNo'),
          okVariant: 'error',
          callback: (result: boolean) => {
            if (result === true) {
              model.value?.splice(index, 1)
              reset()
            }
          },
        })
      } else {
        return
      }
    } else {
      emitter.emit('show-confirm', {
        title: t('modalTitleDeleteTrait'),
        message: t('modalTextDeleteTrait'),
        okTitle: t('genericYes'),
        cancelTitle: t('genericNo'),
        okVariant: 'error',
        callback: (result: boolean) => {
          if (result === true) {
            model.value?.splice(index, 1)
            reset()
          }
        },
      })
    }
  }

  function setTrait (trait: Trait) {
    if (currentTrait.value && trait.id && currentTrait.value.id === trait.id) {
      reset()
      return
    } else {
      reset()
    }

    currentTrait.value = JSON.parse(JSON.stringify(trait))

    if (trait.group) {
      group.value = JSON.parse(JSON.stringify(trait.group))
    }

    if (trait.timeframe) {
      timeframeSet.value = true
      nextTick(() => {
        timeframe.value = JSON.parse(JSON.stringify(trait.timeframe))
      })
    }

    if (trait.restrictions) {
      restrictions.value = JSON.parse(JSON.stringify(trait.restrictions))
    }
  }

  function addTraitsFromOtherTrial (newTraits: TraitPlus[]) {
    newTraits.forEach(t => {
      if (!existingTraitNames.value.includes(t.name.trim().toLowerCase())) {
        const trait = JSON.parse(JSON.stringify(t))
        delete trait.color
        delete trait.editable
        delete trait.progress
        delete trait.visible
        trait.id = getId()
        model.value?.push(trait)
      }
    })
  }

  function addTrait () {
    if (!model.value) {
      return
    }

    const state: FormState = {
      name: undefined,
      categories: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
    }

    if (!currentTrait.value.name || currentTrait.value.name.trim().length === 0) {
      state.name = 'formFeedbackTraitNameMissing'
    }
    if (existingTraitNames.value.includes(currentTrait.value.name.trim().toLocaleLowerCase())) {
      state.name = 'formFeedbackTraitNameInvalidOrDuplicate'
    }
    if (currentTrait.value.dataType === TraitDataType.range) {
      if (!restrictions.value || restrictions.value.min === undefined) {
        state.min = 'formFeedbackTraitRangeMissingBoundaries'
      }
      if (!restrictions.value || restrictions.value.max === undefined) {
        state.max = 'formFeedbackTraitRangeMissingBoundaries'
      }
      if (!restrictions.value || (restrictions.value.step || 0) < 0 || (restrictions.value.step || 0) > (((restrictions.value.max || 0) - (restrictions.value.min || 0)) / 2)) {
        state.step = 'formFeedbackTraitRangeInvalidStep'
      }
    }

    if (restrictions.value && restrictions.value.min !== undefined && restrictions.value.max !== undefined && restrictions.value.min >= restrictions.value.max) {
      state.min = 'formFeedbackTraitInvalidMinMax'
      state.max = 'formFeedbackTraitInvalidMinMax'
    }

    if (restrictions.value && restrictions.value.categories && restrictions.value.categories.length < 2) {
      state.categories = 'formFeedbackTraitCategoryOnlyOne'
    }

    formState.value = state

    if (Object.values(state).some(v => v !== undefined)) {
      return
    }

    // Set restrictions
    if (restrictions.value.categories || restrictions.value.min !== undefined || restrictions.value.max !== undefined || restrictions.value.step !== undefined) {
      currentTrait.value.restrictions = restrictions.value
    }

    // Set group
    if (group.value && group.value.name && group.value.name.trim().length > 0) {
      currentTrait.value.group = {
        name: group.value.name.trim(),
      }
    }

    // Set timeframe
    if (timeframeSet.value === true) {
      currentTrait.value.timeframe = timeframe.value
    } else {
      currentTrait.value.timeframe = undefined
    }

    if (currentTrait.value.id) {
      // Update the trait
      const index = model.value.findIndex(t => t.id === currentTrait.value.id)
      model.value[index] = JSON.parse(JSON.stringify(currentTrait.value))
    } else {
      // Finally, set an id
      currentTrait.value.id = getId()
      model.value.push(JSON.parse(JSON.stringify(currentTrait.value)))
    }

    nextTick(() => reset())
  }

  function reset () {
    formState.value = {
      name: undefined,
      categories: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
    }

    currentTrait.value = {
      name: '',
      description: undefined,
      dataType: TraitDataType.int,
      allowRepeats: true,
      setSize: 1,
    }

    // RESET
    timeframeSet.value = false
    timeframe.value = {
      type: TimeframeType.SUGGEST,
      start: undefined,
      end: undefined,
    }
    group.value = {
      name: undefined,
    }
    restrictions.value = {
      min: undefined,
      max: undefined,
      step: undefined,
      categories: undefined,
    }
  }

  function setStartDate (d: Date) {
    if (timeframe.value) {
      if (d) {
        timeframe.value.start = date.toISO(d)
      } else {
        timeframe.value.start = undefined
      }
    }
  }

  function setEndDate (d: Date) {
    if (timeframe.value) {
      if (d) {
        timeframe.value.end = date.toISO(d)
      } else {
        timeframe.value.end = undefined
      }
    }
  }

  function importExportStart (xport: boolean, format: 'germinate' | 'json' | 'tabular') {
    if (xport && model.value && model.value.length > 0) {
      const temp: Trait[] = JSON.parse(JSON.stringify(model.value))
      temp.forEach(t => {
        delete t.id
      })
      switch (format) {
        case 'json':
          formContent.value.content = JSON.stringify(temp, null, 2)
          break
        case 'germinate':
          formContent.value.content = traitsToGerminate(model.value)
          break
        case 'tabular':
          formContent.value.content = traitsToTabular(model.value)
          break
      }
    } else {
      formContent.value.content = ''
    }
    formContent.value.type = format

    nextTick(() => formModal.value?.show())
  }

  function importExport (item: ImportExportFormContent) {
    return new Promise<boolean>((resolve, reject) => {
      if (item.isImport) {
        let ts: Trait[] = []
        switch (formContent.value.type) {
          case 'germinate':
            try {
              ts = germinateToTraits(item.content)
              resolve(true)
            } catch (e) {
              reject(e)
            }
            break
          case 'json':
            try {
              ts = jsonToTraits(item.content)
              resolve(true)
            } catch (e) {
              reject(e)
            }
            break
          case 'tabular':
            try {
              ts = tabularToTraits(item.content)
              resolve(true)
            } catch (e) {
              reject(e)
            }
            break
        }

        ts.forEach(t => {
          t.id = getId()
        })

        model.value = ts
      } else {
        resolve(true)
      }
    })
  }

  const isValid = computed(() => model.value && model.value.length > 0)

  onMounted(() => {
    if (compProps.trialIdsForTraitGroups) {
      getTrials(false, compProps.trialIdsForTraitGroups)
        .then(result => {
          trials.value = result
        })
    }

    if (model.value && model.value.length > 0) {
      model.value.forEach(t => initialTraitIds.value.add(t.id || ''))
    }

    // Listen for paste events on the categories
    categoryInput.value?.addEventListener('paste', (event: ClipboardEvent) => {
      if (event.clipboardData?.getData('text')?.includes('\n')) {
        event.preventDefault()

        if (!restrictions.value.categories) {
          restrictions.value.categories = []
        }

        restrictions.value.categories.push(...(event.clipboardData!.getData('text')!.split('\n').map(x => x.trim()).filter(x => x.length > 0) || []))
      }
    })
  })

  watch(() => currentTrait.value.dataType, async () => {
    exampleTraitValue.value = undefined
  })

  watch(restrictions, async () => {
    exampleTraitValue.value = undefined
  }, { deep: true })

  defineExpose({
    isValid,
  })
</script>

<style scoped>
.drag-handle:hover {
  cursor: move;
}
</style>
