<template>
  <div>
    <b-row>
      <b-col cols=12 lg=6 class="mb-3">
        <b-form @submit.prevent="addTrait">
          <b-form-group :description="$t('formDescriptionTraitName')" label-for="trait-name" :state="formState.name">
            <template #label>
              <BIconTextarea /> {{ $t('formLabelTraitName') }}
            </template>
            <b-form-input v-model="newTrait.name" trim id="trait-name" autofocus required :state="formState.name" ref="traitName" v-on:keyup.enter="newTrait.id ? updateTrait() : addTrait()" />
            <b-form-invalid-feedback>
              {{ $t('formFeedbackTraitNameInvalidOrDuplicate') }}
            </b-form-invalid-feedback>
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitDescription')" label-for="trait-description">
            <template #label>
              <BIconCardText /> {{ $t('formLabelTraitDescription') }}
            </template>
            <b-form-textarea rows=3 trim v-model="newTrait.description" id="trait-description" />
          </b-form-group>
          <b-row>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitDataType')" label-for="trait-data-type">
                <template #label>
                  <BIconRulers /> {{ $t('formLabelTraitDataType') }}
                </template>
                <b-form-select :options="dataTypeOptions" required v-model="newTrait.dataType" id="trait-data-type" />
              </b-form-group>
            </b-col>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitGroup')" label-for="trait-group">
                <template #label>
                  <BIconCollection /> {{ $t('formLabelTraitGroup') }}
                </template>
                <b-form-input list="trait-groups" trim v-model="newTrait.group" id="trait-group" />

                <datalist id="trait-groups">
                  <option v-for="group in traitGroups" :key="`trait-group-${group}`">{{ group }}</option>
                </datalist>
              </b-form-group>
            </b-col>
          </b-row>
          <b-form-group :description="$t('formDescriptionTraitRestrictionsCategories')" label-for="trait-categories" v-if="newTrait.dataType === 'categorical'" :state="formState.categories">
            <template #label>
              <BIconTags /> {{ $t('formLabelTraitRestrictionsCategories') }}
            </template>
            <b-form-textarea v-model="newTrait.restrictions.categories" :rows="4" :placeholder="$t('formPlaceholderTraitRestrictionsCategories')" required id="trait-categories" :state="formState.categories" />
          </b-form-group>
          <b-row v-if="newTrait.dataType === 'int' || newTrait.dataType === 'float'">
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitRestrictionsMin')" label-for="trait-min">
                <template #label>
                  <BIconChevronBarDown /> {{ $t('formLabelTraitRestrictionsMin') }}
                </template>
                <b-input type="number" :step="1" number v-model="newTrait.restrictions.min" id="trait-min" />
              </b-form-group>
            </b-col>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitRestrictionsMax')" label-for="trait-max">
                <template #label>
                  <BIconChevronBarUp /> {{ $t('formLabelTraitRestrictionsMax') }}
                </template>
                <b-input type="number" :step="1" number v-model="newTrait.restrictions.max" id="trait-max" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-form-group :description="$t('formDescriptionTraitSetSize')" label-for="trait-set-size" :state="formState.setSize">
            <template #label>
              <BIconSegmentedNav :rotate="90" /> {{ $t('formLabelTraitSetSize') }}
            </template>
            <b-input type="number" :step="1" number :min="1" required v-model="newTrait.setSize" id="trait-set-size" :state="formState.setSize" />
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitAllowRepeats')" label-for="trait-allow-repeats">
            <template #label>
              <BIconArrowRepeat /> {{ $t('formLabelTraitAllowRepeats') }}
            </template>
            <b-form-checkbox switch v-model="newTrait.allowRepeats" required id="trait-allow-repeats" />
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitTimeframe')" label-for="trait-timeframe">
            <template #label>
              <BIconCalendarRange /> {{ $t('formLabelTraitTimeframe') }}
            </template>
            <b-form-checkbox switch :checked="newTrait.timeframe !== null" @change="toggleTimeframe" required id="trait-timeframe" />
          </b-form-group>
          <b-collapse :visible="timeframeCollapseVisible">
            <b-card class="mb-3" v-if="timeframeCollapseVisible">
              <b-form-group :description="$t('formDescriptionTraitTimeframeType')" label-for="trait-timeframe-type">
                <template #label>
                  <BIconCalendarRange /> {{ $t('formLabelTraitTimeframeType') }}
                </template>
                <b-button-group>
                  <b-button variant="outline-secondary" :pressed="newTrait.timeframe.type === TRAIT_TIMEFRAME_TYPE_SUGGEST" @click="newTrait.timeframe.type = TRAIT_TIMEFRAME_TYPE_SUGGEST"><BIconTriangle :rotate="180" /> {{ $t('formSelectOptionTraitTimeframeSuggest') }}</b-button>
                  <b-button variant="outline-secondary" :pressed="newTrait.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE" @click="newTrait.timeframe.type = TRAIT_TIMEFRAME_TYPE_ENFORCE"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sign-stop" viewBox="0 0 16 16"><path d="M3.16 10.08c-.931 0-1.447-.493-1.494-1.132h.653c.065.346.396.583.891.583.524 0 .83-.246.83-.62 0-.303-.203-.467-.637-.572l-.656-.164c-.61-.147-.978-.51-.978-1.078 0-.706.597-1.184 1.444-1.184.853 0 1.386.475 1.436 1.087h-.645c-.064-.32-.352-.542-.797-.542-.472 0-.77.246-.77.6 0 .261.196.437.553.522l.654.161c.673.164 1.06.487 1.06 1.11 0 .736-.574 1.228-1.544 1.228Zm3.427-3.51V10h-.665V6.57H4.753V6h3.006v.568H6.587Z"/><path fill-rule="evenodd" d="M11.045 7.73v.544c0 1.131-.636 1.805-1.661 1.805-1.026 0-1.664-.674-1.664-1.805V7.73c0-1.136.638-1.807 1.664-1.807 1.025 0 1.66.674 1.66 1.807Zm-.674.547v-.553c0-.827-.422-1.234-.987-1.234-.572 0-.99.407-.99 1.234v.553c0 .83.418 1.237.99 1.237.565 0 .987-.408.987-1.237Zm1.15-2.276h1.535c.82 0 1.316.55 1.316 1.292 0 .747-.501 1.289-1.321 1.289h-.865V10h-.665V6.001Zm1.436 2.036c.463 0 .735-.272.735-.744s-.272-.741-.735-.741h-.774v1.485h.774Z"/><path fill-rule="evenodd" d="M4.893 0a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146A.5.5 0 0 0 11.107 0H4.893ZM1 5.1 5.1 1h5.8L15 5.1v5.8L10.9 15H5.1L1 10.9V5.1Z"/></svg> {{ $t('formSelectOptionTraitTimeframeEnforce') }}</b-button>
                </b-button-group>
              </b-form-group>

              <b-row>
                <b-col cols=6>
                  <b-form-group :description="$t('formDescriptionTraitTimeframeStart')" label-for="trait-timeframe-start">
                    <template #label>
                      <BIconstack><BIconCalendar stacked /><BIconChevronBarLeft stacked :scale="0.6" :shift-v="-2" /></BIconstack> {{ $t('formLabelTraitTimeframeStart') }}
                    </template>
                    <b-form-datepicker :max="newTrait.timeframe.end || null" v-model="newTrait.timeframe.start" id="trait-timeframe-start" />
                  </b-form-group>
                </b-col>
                <b-col cols=6>
                  <b-form-group :description="$t('formDescriptionTraitTimeframeEnd')" label-for="trait-timeframe-end">
                    <template #label>
                      <BIconstack><BIconCalendar stacked /><BIconChevronBarRight stacked :scale="0.6" :shift-v="-2" /></BIconstack> {{ $t('formLabelTraitTimeframeEnd') }}
                    </template>
                    <b-form-datepicker :min="newTrait.timeframe.start || null" v-model="newTrait.timeframe.end" id="trait-timeframe-end" />
                  </b-form-group>
                </b-col>
              </b-row>
            </b-card>
          </b-collapse>
        </b-form>

        <b-button v-if="newTrait.id" @click="updateTrait" variant="primary" :disabled="!newTrait.name"><BIconPencilSquare /> {{ $t('buttonUpdate') }}</b-button>
        <b-button v-else @click="addTrait" variant="primary" :disabled="!newTrait.name"><BIconPlusSquareFill /> {{ $t('buttonAdd') }}</b-button>
      </b-col>
      <b-col cols=12 lg=6 class="mb-3">
        <div class="d-flex align-items-center justify-content-between">
          <h2>{{ $t('pageTrialTraitListTitle') }} <b-button :disabled="!traits || traits.length < 1" @click="clearTraits" v-b-tooltip="$t('buttonClear')"><BIconTrashFill /></b-button></h2>
          <b-dropdown :text="$t('dropdownImportExportTraits')">
            <b-dropdown-group id="import-group" :header="$t('dropdownSectionImportTraits')">
              <b-dropdown-item-button @click="importExportJson(false)">{{ $t('dropdownOptionImportTraitsJson') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="importExportGerminate(false)">{{ $t('dropdownOptionImportTraitsGerminate') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="importOtherTrial">{{ $t('dropdownOptionImportTraitsOtherTrial') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="$refs.brapiTraitImportModal.show()">{{ $t('dropdownOptionImportTraitsBrapi') }}</b-dropdown-item-button>
            </b-dropdown-group>
            <b-dropdown-group id="export-group" :header="$t('dropdownSectionExportTraits')">
              <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportJson(true)">{{ $t('dropdownOptionExportTraitsJson') }}</b-dropdown-item-button>
              <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportGerminate(true)">{{ $t('dropdownOptionExportTraitsGerminate') }}</b-dropdown-item-button>
            </b-dropdown-group>
          </b-dropdown>
        </div>
        <p>{{ $t('pageTrialTraitListText') }}</p>
        <draggable v-model="traits" tag="b-list-group" v-if="traits && traits.length > 0" handle=".drag-handle" class="trait-list">
          <b-list-group-item :active="newTrait.id === trait.id" href="#" @click.prevent="toggleTrait(index)" class="flex-column align-items-start" v-for="(trait, index) in traits" :key="`trait-list-${trait.id}`">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">{{ trait.name }}</h5>
              <span>
                <small><b-badge variant="info">{{ getTraitTypeText(trait, true) }}</b-badge></small>
                <BIconGripVertical class="drag-handle ml-2" />
              </span>
            </div>
            <div>
              <span class="mr-2"><BIconArrowRepeat /> {{ trait.allowRepeats ? $t('formFeedbackTraitAllowRepeats') : $t('formFeedbackTraitNoAllowRepeats') }}</span>
              <span class="mr-2"><BIconSegmentedNav :rotate="90" /> {{ $t('formFeedbackTraitSetSize', { count: trait.setSize }) }}</span>
              <span class="mr-2" v-if="trait.group"><BIconCollection /> {{ trait.group }}</span>
            </div>
            <div v-if="trait.timeframe">
              <span class="mr-2" v-if="trait.timeframe.type === TRAIT_TIMEFRAME_TYPE_SUGGEST"><BIconTriangle :rotate="180" /> {{ $t('formSelectOptionTraitTimeframeSuggest') }}</span>
              <span class="mr-2" v-else-if="trait.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sign-stop" viewBox="0 0 16 16"><path d="M3.16 10.08c-.931 0-1.447-.493-1.494-1.132h.653c.065.346.396.583.891.583.524 0 .83-.246.83-.62 0-.303-.203-.467-.637-.572l-.656-.164c-.61-.147-.978-.51-.978-1.078 0-.706.597-1.184 1.444-1.184.853 0 1.386.475 1.436 1.087h-.645c-.064-.32-.352-.542-.797-.542-.472 0-.77.246-.77.6 0 .261.196.437.553.522l.654.161c.673.164 1.06.487 1.06 1.11 0 .736-.574 1.228-1.544 1.228Zm3.427-3.51V10h-.665V6.57H4.753V6h3.006v.568H6.587Z"/><path fill-rule="evenodd" d="M11.045 7.73v.544c0 1.131-.636 1.805-1.661 1.805-1.026 0-1.664-.674-1.664-1.805V7.73c0-1.136.638-1.807 1.664-1.807 1.025 0 1.66.674 1.66 1.807Zm-.674.547v-.553c0-.827-.422-1.234-.987-1.234-.572 0-.99.407-.99 1.234v.553c0 .83.418 1.237.99 1.237.565 0 .987-.408.987-1.237Zm1.15-2.276h1.535c.82 0 1.316.55 1.316 1.292 0 .747-.501 1.289-1.321 1.289h-.865V10h-.665V6.001Zm1.436 2.036c.463 0 .735-.272.735-.744s-.272-.741-.735-.741h-.774v1.485h.774Z"/><path fill-rule="evenodd" d="M4.893 0a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146A.5.5 0 0 0 11.107 0H4.893ZM1 5.1 5.1 1h5.8L15 5.1v5.8L10.9 15H5.1L1 10.9V5.1Z"/></svg> {{ $t('formSelectOptionTraitTimeframeEnforce') }}</span>
              <span class="mr-2" v-if="trait.timeframe.start"><BIconstack><BIconCalendar stacked /><BIconChevronBarLeft stacked :scale="0.6" :shift-v="-2" /></BIconstack> {{ trait.timeframe.start }}</span>
              <span class="mr-2" v-if="trait.timeframe.end"><BIconstack><BIconCalendar stacked /><BIconChevronBarRight stacked :scale="0.6" :shift-v="-2" /></BIconstack> {{ trait.timeframe.end }}</span>
            </div>

            <p class="mb-1 trait-description" v-if="trait.description" :title="trait.description">{{ trait.description }}</p>

            <small v-if="trait.restrictions">
              <b-badge class="mr-2" v-if="trait.restrictions.min !== undefined && trait.restrictions.min !== null"><BIconChevronBarDown /> {{ trait.restrictions.min }}</b-badge>
              <b-badge class="mr-2" v-if="trait.restrictions.max !== undefined && trait.restrictions.max !== null"><BIconChevronBarUp /> {{ trait.restrictions.max }}</b-badge>
              <b-badge class="mr-2" v-if="trait.restrictions.categories !== undefined && trait.restrictions.categories !== null && trait.restrictions.categories.length > 0"><BIconTags /> {{ trait.restrictions.categories.join(', ') }}</b-badge>
            </small>

            <b-button-group class="d-block mt-2">
              <b-button variant="outline-secondary" @click.prevent.stop="duplicateTrait(index)"><BIconBack /> {{ $t('buttonDuplicate') }}</b-button>
              <b-button variant="outline-danger" @click.prevent.stop="deleteTrait(index)"><BIconTrash /> {{ $t('buttonDelete') }}</b-button>
            </b-button-group>
          </b-list-group-item>
        </draggable>
        <p v-else>{{ $t('pageTrialTraitListEmpty') }}</p>
      </b-col>
    </b-row>

    <TraitImportExportGridScoreModal :traits="traitsToExport" ref="traitImportExportGridScoreModal" @change="importTraits" />
    <TraitImportExportGerminateModal :traits="traitsToExport" ref="traitImportExportGerminateModal" @change="importTraits" />
    <TraitImportTrialModal ref="traitImportTrialModal" @change="importTraits" />
    <BrapiTraitImportModal ref="brapiTraitImportModal" @traits-selected="importBrapiTraits" />
  </div>
</template>

<script>
import Vue from 'vue'
import TraitImportExportGridScoreModal from '@/components/modals/TraitImportExportGridScoreModal'
import TraitImportTrialModal from '@/components/modals/TraitImportTrialModal'
import TraitImportExportGerminateModal from '@/components/modals/TraitImportExportGerminateModal'
import BrapiTraitImportModal from '@/components/modals/BrapiTraitImportModal'
import { getTraitTypeText } from '@/plugins/misc'
import { BIconstack, BIconPlusSquareFill, BIconArrowRepeat, BIconChevronBarRight, BIconChevronBarLeft, BIconCalendar, BIconCalendarRange, BIconTriangle, BIconSegmentedNav, BIconCollection, BIconBack, BIconTrashFill, BIconTrash, BIconGripVertical, BIconTags, BIconPencilSquare, BIconTextarea, BIconCardText, BIconRulers, BIconChevronBarDown, BIconChevronBarUp } from 'bootstrap-vue'
import draggable from 'vuedraggable'
import { getId } from '@/plugins/id'
import { TRAIT_TIMEFRAME_TYPE_SUGGEST, TRAIT_TIMEFRAME_TYPE_ENFORCE } from '@/plugins/constants'

export default {
  components: {
    draggable,
    BIconstack,
    BIconCalendar,
    BIconChevronBarRight,
    BIconChevronBarLeft,
    BIconCollection,
    BIconPlusSquareFill,
    BIconArrowRepeat,
    BIconSegmentedNav,
    BIconTriangle,
    BIconCalendarRange,
    BIconBack,
    BIconTrash,
    BIconTrashFill,
    BIconGripVertical,
    BIconPencilSquare,
    BIconTextarea,
    BIconCardText,
    BIconRulers,
    BIconChevronBarDown,
    BIconChevronBarUp,
    BIconTags,
    TraitImportExportGridScoreModal,
    TraitImportExportGerminateModal,
    TraitImportTrialModal,
    BrapiTraitImportModal
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    initialTraits: {
      type: Array,
      default: () => null
    }
  },
  data: function () {
    return {
      TRAIT_TIMEFRAME_TYPE_SUGGEST,
      TRAIT_TIMEFRAME_TYPE_ENFORCE,
      traits: [],
      newTrait: {
        name: null,
        description: null,
        dataType: 'int',
        restrictions: {
          categories: null,
          min: null,
          max: null
        },
        allowRepeats: false,
        setSize: 1,
        group: null,
        timeframe: null
      },
      formValidated: null,
      formState: {
        name: null,
        categories: null,
        setSize: null
      },
      traitsToExport: null
    }
  },
  watch: {
    traits: function (newValue) {
      this.$emit('change', newValue)
    },
    initialTraits: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.traits = JSON.parse(JSON.stringify(newValue)).map(t => {
            delete t.editable
            delete t.color
            delete t.progress
            t.timeframe = null
            return t
          })
        } else {
          this.traits = []
        }
      }
    }
  },
  computed: {
    timeframeCollapseVisible: function () {
      return this.newTrait.timeframe !== null
    },
    traitGroups: function () {
      const set = new Set()

      if (this.trial && this.trial.traits && this.trial.traits.length > 0) {
        this.trial.traits.forEach(t => {
          if (t.group && t.group.name && t.group.name !== '') {
            set.add(t.group.name)
          }
        })
      }

      this.traits.forEach(t => {
        if (t.group && t.group !== '') {
          set.add(t.group)
        }
      })

      if (set.size > 0) {
        return [...set].sort((a, b) => a.localeCompare(b))
      } else {
        return []
      }
    },
    dataTypeOptions: function () {
      return [{
        text: this.$t('traitTypeInt'),
        value: 'int'
      }, {
        text: this.$t('traitTypeFloat'),
        value: 'float'
      }, {
        text: this.$t('traitTypePercentage'),
        value: 'percentage'
      }, {
        text: this.$t('traitTypeCategorical'),
        value: 'categorical'
      }, {
        text: this.$t('traitTypeBoolean'),
        value: 'boolean'
      }, {
        text: this.$t('traitTypeDate'),
        value: 'date'
      }, {
        text: this.$t('traitTypeText'),
        value: 'text'
      }]
    }
  },
  methods: {
    getTraitTypeText,
    clearTraits: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteTraits'), {
        title: this.$t('modalTitleDeleteTraits'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.traits = []
          }
        })
    },
    importBrapiTraits: function (newTraits) {
      if (newTraits && newTraits.length > 0) {
        newTraits.forEach(t => {
          let type = 'text'
          const restrictions = {}

          // Map the BrAPI data type to the internal data type
          if (t.scale && t.scale.dataType) {
            switch (t.scale.dataType) {
              case 'Date':
                type = 'date'
                break
              case 'Text':
                type = 'text'
                break
              case 'Numeric':
                type = 'float'
                break
              case 'Duration':
                type = 'int'
                break
              case 'Ordinal':
                type = 'categorical'
                break
              default:
                type = 'text'
                break
            }
          }

          // Check if there are any value restrictions on the trait
          if (t.scale && t.scale.validValues) {
            if (t.scale.validValues.minimumValue !== undefined && t.scale.validValues.minimumValue !== null) {
              restrictions.min = +t.scale.validValues.minimumValue
            }
            if (t.scale.validValues.maximumValue !== undefined && t.scale.validValues.maximumValue !== null) {
              restrictions.max = +t.scale.validValues.maximumValue
            }
            if (t.scale.validValues.categories && t.scale.validValues.categories.length > 0) {
              restrictions.categories = t.scale.validValues.categories.map(c => c.value)
            }
          }

          this.traits.push({
            id: getId(),
            brapiId: t.observationVariableDbId,
            name: t.observationVariableName,
            description: null,
            dataType: type,
            allowRepeats: false,
            setSize: 1,
            restrictions: Object.keys(restrictions).length < 1 ? null : restrictions,
            group: null,
            timeframe: null
          })
        })
      }
    },
    importTraits: function (newTraits) {
      newTraits.forEach(t => {
        t.id = getId()
        this.traits.push(t)
      })
    },
    importOtherTrial: function () {
      this.$refs.traitImportTrialModal.show()
    },
    importExportGerminate: function (xport) {
      if (xport && this.traits && this.traits.length > 0) {
        const temp = JSON.parse(JSON.stringify(this.traits))
        temp.forEach(t => {
          delete t.id
        })
        this.traitsToExport = temp
      } else {
        this.traitsToExport = null
      }

      this.$nextTick(() => this.$refs.traitImportExportGerminateModal.show())
    },
    importExportJson: function (xport) {
      if (xport && this.traits && this.traits.length > 0) {
        const temp = JSON.parse(JSON.stringify(this.traits))
        temp.forEach(t => {
          delete t.id
        })
        this.traitsToExport = temp
      } else {
        this.traitsToExport = null
      }

      this.$nextTick(() => this.$refs.traitImportExportGridScoreModal.show())
    },
    toggleTimeframe: function () {
      if (this.newTrait.timeframe) {
        this.newTrait.timeframe = null
      } else {
        this.newTrait.timeframe = {
          start: null,
          end: null,
          type: TRAIT_TIMEFRAME_TYPE_SUGGEST
        }
      }
    },
    copyTraitFixRestrictions: function () {
      const copy = JSON.parse(JSON.stringify(this.newTrait))

      if (copy.dataType === 'boolean') {
        copy.dataType = 'categorical'
        copy.restrictions.categories = 'true\nfalse'
      } else if (copy.dataType === 'percentage') {
        copy.dataType = 'int'
        copy.restrictions.min = 0
        copy.restrictions.max = 100
      }

      if (copy.restrictions.min === undefined || copy.restrictions.min === null || copy.restrictions.min === '') {
        delete copy.restrictions.min
      }
      if (copy.restrictions.max === undefined || copy.restrictions.max === null || copy.restrictions.max === '') {
        delete copy.restrictions.max
      }
      if (copy.restrictions.categories === undefined || copy.restrictions.categories === null || copy.restrictions.categories === '') {
        delete copy.restrictions.categories
      }

      if (copy.restrictions.min === undefined && copy.restrictions.max === undefined && copy.restrictions.categories === undefined) {
        delete copy.restrictions
      } else if (copy.restrictions.categories) {
        copy.restrictions.categories = copy.restrictions.categories.split(/\r?\n/).filter(c => c !== undefined && c !== null && c !== '').map(c => c.trim())
      }

      // If neither start or end has been defined, remove the timeframe
      if (copy.timeframe) {
        if ((!copy.timeframe.start || copy.timeframe.start === '') && (!copy.timeframe.end || copy.timeframe.end === '')) {
          delete copy.timeframe
        }
      }

      return copy
    },
    checkTrait: function (checkForDuplicate) {
      this.formValidated = true

      const hasDuplicate = checkForDuplicate ? this.traits.some(t => t.name === this.newTrait.name) : false

      if (!this.newTrait.name || this.newTrait.name === '' || hasDuplicate) {
        this.formState.name = false
      } else {
        this.formState.name = true
      }

      if (this.newTrait.dataType === 'categorical' && (!this.newTrait.restrictions.categories || this.newTrait.restrictions.categories === '')) {
        this.formState.categories = false
      } else {
        this.formState.categories = true
      }

      if (this.newTrait.setSize === undefined || this.newTrait.setSize === null || this.newTrait.setSize === '' || this.newTrait.setSize < 1) {
        this.formState.setSize = false
      } else {
        this.formState.setSize = true
      }

      return !Object.values(this.formState).some(v => v === false)
    },
    updateTrait: function () {
      const valid = this.checkTrait(false)

      if (!valid) {
        return
      }

      const copy = this.copyTraitFixRestrictions()

      Vue.set(this.traits, this.traits.findIndex(t => t.id === copy.id), copy)

      this.reset()
    },
    addTrait: function () {
      const valid = this.checkTrait(true)

      if (!valid) {
        return
      }

      const copy = this.copyTraitFixRestrictions()

      copy.id = getId()

      this.traits.push(copy)

      this.reset()
    },
    reset: function () {
      this.newTrait = {
        name: null,
        description: null,
        dataType: 'int',
        restrictions: {
          categories: null,
          min: null,
          max: null
        },
        allowRepeats: false,
        setSize: 1,
        group: null,
        timeframe: null
      }

      // Reset the form validation
      this.formValidated = false
      this.formState = {
        name: null,
        categories: null,
        setSize: null
      }

      this.$refs.traitName.focus()
    },
    toggleTrait: function (index) {
      const copy = JSON.parse(JSON.stringify(this.traits[index]))

      if (this.newTrait.id === copy.id) {
        this.reset()
        return
      }

      const restrictions = Object.assign({
        min: null,
        max: null,
        categories: null
      }, copy.restrictions)
      if (restrictions && restrictions.categories) {
        restrictions.categories = restrictions.categories.join('\n')
      }
      copy.restrictions = restrictions
      this.newTrait = copy
    },
    duplicateTrait: function (index) {
      this.reset()

      const copy = JSON.parse(JSON.stringify(this.traits[index]))
      delete copy.id
      const restrictions = Object.assign({
        min: null,
        max: null,
        categories: null
      }, copy.restrictions)
      if (restrictions && restrictions.categories) {
        restrictions.categories = restrictions.categories.join('\n')
      }
      copy.restrictions = restrictions
      this.newTrait = copy
    },
    deleteTrait: function (index) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteTrait'), {
        title: this.$t('modalTitleDeleteTrait'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.traits.splice(index, 1)
          }
        })
    },
    emitData: function () {
      this.$emit('finished', this.traits)
    }
  }
}
</script>

<style scoped>
.trait-description {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
  max-width: 100%;
}
.drag-handle:hover {
  cursor: move;
}
.trait-list {
  max-height: 100vh;
  overflow-y: auto;
}
</style>
