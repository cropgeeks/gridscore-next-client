<template>
  <div>
    <b-row>
      <b-col cols=12 lg=6 class="mb-3">
        <b-form @submit.prevent="addTrait">
          <b-form-group :description="$t('formDescriptionTraitName')" label-for="trait-name" :state="formState.name">
            <template #label>
              <IBiTextarea /> {{ $t('formLabelTraitName') }}
            </template>
            <b-form-input v-model.trim="newTrait.name" id="trait-name" autofocus required :state="formState.name" ref="traitName" v-on:keyup.enter="newTrait.id ? updateTrait() : addTrait()" />
            <b-form-invalid-feedback>
              {{ $t('formFeedbackTraitNameInvalidOrDuplicate') }}
            </b-form-invalid-feedback>
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitDescription')" label-for="trait-description">
            <template #label>
              <IBiCardText /> {{ $t('formLabelTraitDescription') }}
            </template>
            <b-form-textarea rows=3 trim v-model.trim="newTrait.description" id="trait-description" />
          </b-form-group>
          <b-row>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitDataType')" label-for="trait-data-type">
                <template #label>
                  <IBiRulers /> {{ $t('formLabelTraitDataType') }}
                </template>
                <b-form-select :options="dataTypeOptions" required v-model="newTrait.dataType" id="trait-data-type" />
              </b-form-group>
            </b-col>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitGroup')" label-for="trait-group">
                <template #label>
                  <IBiCollection /> {{ $t('formLabelTraitGroup') }}
                </template>
                <b-form-input list="trait-groups" v-model.trim="newTrait.group" id="trait-group" />

                <datalist id="trait-groups">
                  <option v-for="group in traitGroups" :key="`trait-group-${group}`">{{ group }}</option>
                </datalist>
              </b-form-group>
            </b-col>
          </b-row>
          <b-form-group :description="$t('formDescriptionTraitRestrictionsCategories')" label-for="trait-categories" v-if="newTrait.dataType === 'categorical'" :state="formState.categories">
            <template #label>
              <IBiTags /> {{ $t('formLabelTraitRestrictionsCategories') }}
            </template>
            <b-form-textarea v-model="newTrait.restrictions.categories" :rows="4" :placeholder="$t('formPlaceholderTraitRestrictionsCategories')" required id="trait-categories" :state="formState.categories" />
          </b-form-group>
          <b-row v-if="newTrait.dataType === 'int' || newTrait.dataType === 'float' || newTrait.dataType === 'range'">
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitRestrictionsMin')" label-for="trait-min">
                <template #label>
                  <IBiChevronBarDown /> {{ $t('formLabelTraitRestrictionsMin') }}
                </template>
                <b-form-input type="number" :step="1" number v-model.number="newTrait.restrictions.min" id="trait-min" :state="formState.min" />
              </b-form-group>
            </b-col>
            <b-col cols=6>
              <b-form-group :description="$t('formDescriptionTraitRestrictionsMax')" label-for="trait-max">
                <template #label>
                  <IBiChevronBarUp /> {{ $t('formLabelTraitRestrictionsMax') }}
                </template>
                <b-form-input type="number" :step="1" number v-model.number="newTrait.restrictions.max" id="trait-max" :state="formState.max" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-form-group :description="$t('formDescriptionTraitSetSize')" label-for="trait-set-size" :state="formState.setSize">
            <template #label>
              <IBiSegmentedNav :style="{ transform: 'rotate(90deg)' }" /> {{ $t('formLabelTraitSetSize') }}
            </template>
            <b-form-input type="number" :step="1" number :min="1" required v-model.number="newTrait.setSize" id="trait-set-size" :state="formState.setSize" />
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitAllowRepeats')" label-for="trait-allow-repeats">
            <template #label>
              <IBiArrowRepeat /> {{ $t('formLabelTraitAllowRepeats') }}
            </template>
            <b-form-checkbox switch v-model="newTrait.allowRepeats" required id="trait-allow-repeats" />
          </b-form-group>
          <b-form-group :description="$t('formDescriptionTraitTimeframe')" label-for="trait-timeframe">
            <template #label>
              <IBiCalendarRange /> {{ $t('formLabelTraitTimeframe') }}
            </template>
            <b-form-checkbox switch :checked="newTrait.timeframe !== null" @change="toggleTimeframe" required id="trait-timeframe" />
          </b-form-group>
          <b-collapse :visible="timeframeCollapseVisible">
            <b-card class="mb-3" v-if="timeframeCollapseVisible">
              <b-form-group :description="$t('formDescriptionTraitTimeframeType')" label-for="trait-timeframe-type">
                <template #label>
                  <IBiCalendarRange /> {{ $t('formLabelTraitTimeframeType') }}
                </template>
                <b-button-group class="d-block">
                  <b-button variant="outline-secondary" :pressed="newTrait.timeframe.type === TRAIT_TIMEFRAME_TYPE_SUGGEST" @click="newTrait.timeframe.type = TRAIT_TIMEFRAME_TYPE_SUGGEST"><IBiExclamationTriangle /> {{ $t('formSelectOptionTraitTimeframeSuggest') }}</b-button>
                  <b-button variant="outline-secondary" :pressed="newTrait.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE" @click="newTrait.timeframe.type = TRAIT_TIMEFRAME_TYPE_ENFORCE"><IBiSignStop /> {{ $t('formSelectOptionTraitTimeframeEnforce') }}</b-button>
                </b-button-group>
              </b-form-group>

              <b-row>
                <b-col cols=6>
                  <b-form-group :description="$t('formDescriptionTraitTimeframeStart')" label-for="trait-timeframe-start">
                    <template #label>
                      <IBiCalendarMinus /> {{ $t('formLabelTraitTimeframeStart') }}
                    </template>
                    <b-form-input type="date" :max="newTrait.timeframe.end || null" v-model="newTrait.timeframe.start" id="trait-timeframe-start" />
                  </b-form-group>
                </b-col>
                <b-col cols=6>
                  <b-form-group :description="$t('formDescriptionTraitTimeframeEnd')" label-for="trait-timeframe-end">
                    <template #label>
                      <IBiCalendarPlus /> {{ $t('formLabelTraitTimeframeEnd') }}
                    </template>
                    <b-form-input type="date" :min="newTrait.timeframe.start || null" v-model="newTrait.timeframe.end" id="trait-timeframe-end" />
                  </b-form-group>
                </b-col>
              </b-row>
            </b-card>
          </b-collapse>
        </b-form>

        <b-button v-if="newTrait.id" @click="updateTrait" variant="primary" :disabled="!newTrait.name"><IBiPencilSquare /> {{ $t('buttonUpdate') }}</b-button>
        <b-button v-else @click="addTrait" variant="primary" :disabled="!newTrait.name"><IBiPlusSquareFill /> {{ $t('buttonAdd') }}</b-button>
      </b-col>
      <b-col cols=12 lg=6 class="mb-3">
        <div class="d-flex align-items-center justify-content-between">
          <h2>{{ $t('pageTrialTraitListTitle') }} <b-button :disabled="!traits || traits.length < 1" @click="clearTraits" v-b-tooltip="$t('buttonClear')"><IBiTrashFill /></b-button></h2>
          <b-dropdown :text="$t('dropdownImportExportTraits')">
            <b-dropdown-group id="import-group" :header="$t('dropdownSectionImportTraits')">
              <b-dropdown-item-button @click="importExportJson(false)">{{ $t('dropdownOptionImportTraitsJson') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="importExportGerminate(false)">{{ $t('dropdownOptionImportTraitsGerminate') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="importExportTabular(false)">{{ $t('dropdownOptionImportTraitsTabular') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="importOtherTrial">{{ $t('dropdownOptionImportTraitsOtherTrial') }}</b-dropdown-item-button>
              <b-dropdown-item-button @click="$refs.brapiTraitImportModal.show()">{{ $t('dropdownOptionImportTraitsBrapi') }}</b-dropdown-item-button>
            </b-dropdown-group>
            <b-dropdown-group id="export-group" :header="$t('dropdownSectionExportTraits')">
              <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportJson(true)">{{ $t('dropdownOptionExportTraitsJson') }}</b-dropdown-item-button>
              <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportGerminate(true)">{{ $t('dropdownOptionExportTraitsGerminate') }}</b-dropdown-item-button>
              <b-dropdown-item-button :disabled="!traits || traits.length < 1" @click="importExportTabular(true)">{{ $t('dropdownOptionExportTraitsTabular') }}</b-dropdown-item-button>
            </b-dropdown-group>
          </b-dropdown>
        </div>
        <p>{{ $t('pageTrialTraitListText') }}</p>
        <draggable :list="traits" item-key="id" tag="b-list-group" v-if="traits && traits.length > 0" handle=".drag-handle" class="trait-list list-group">
          <template #item="{ element, index }">
            <b-list-group-item :active="newTrait.id === element.id" href="#" @click.prevent="toggleTrait(index)" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">{{ element.name }}</h5>
                <span>
                  <small><b-badge variant="info">{{ getTraitTypeText(element, true) }}</b-badge></small>
                  <IBiGripVertical class="drag-handle ms-2" />
                </span>
              </div>
              <div>
                <span class="me-2"><IBiArrowRepeat /> {{ element.allowRepeats ? $t('formFeedbackTraitAllowRepeats') : $t('formFeedbackTraitNoAllowRepeats') }}</span>
                <span class="me-2"><IBiSegmentedNav :style="{ transform: 'rotate(90deg)' }" /> {{ $t('formFeedbackTraitSetSize', { count: element.setSize }) }}</span>
                <span class="me-2" v-if="element.group"><IBiCollection /> {{ element.group }}</span>
              </div>
              <div v-if="element.timeframe">
                <span class="me-2" v-if="element.timeframe.type === TRAIT_TIMEFRAME_TYPE_SUGGEST"><IBiExclamationTriangle /> {{ $t('formSelectOptionTraitTimeframeSuggest') }}</span>
                <span class="me-2" v-else-if="element.timeframe.type === TRAIT_TIMEFRAME_TYPE_ENFORCE"><IBiSignStop /> {{ $t('formSelectOptionTraitTimeframeEnforce') }}</span>
                <span class="me-2" v-if="element.timeframe.start"><IBiCalendarMinus /> {{ element.timeframe.start }}</span>
                <span class="me-2" v-if="element.timeframe.end"><IBiCalendarPlus /> {{ element.timeframe.end }}</span>
              </div>

              <p class="mb-1 trait-description" v-if="element.description" :title="element.description">{{ element.description }}</p>

              <small v-if="element.restrictions">
                <b-badge class="me-2" v-if="element.restrictions.min !== undefined && element.restrictions.min !== null"><IBiChevronBarDown /> {{ element.restrictions.min }}</b-badge>
                <b-badge class="me-2" v-if="element.restrictions.max !== undefined && element.restrictions.max !== null"><IBiChevronBarUp /> {{ element.restrictions.max }}</b-badge>
                <b-badge class="me-2" v-if="element.restrictions.categories !== undefined && element.restrictions.categories !== null && element.restrictions.categories.length > 0"><IBiTags /> {{ element.restrictions.categories.join(', ') }}</b-badge>
              </small>

              <b-button-group class="d-block mt-2">
                <b-button variant="outline-secondary" @click.prevent.stop="duplicateTrait(index)"><IBiBack /> {{ $t('buttonDuplicate') }}</b-button>
                <b-button variant="outline-danger" @click.prevent.stop="deleteTrait(index)"><IBiTrash /> {{ $t('buttonDelete') }}</b-button>
              </b-button-group>
            </b-list-group-item>
          </template>
        </draggable>
        <p v-else>{{ $t('pageTrialTraitListEmpty') }}</p>
      </b-col>
    </b-row>

    <TraitImportExportGridScoreModal :traits="traitsToExport" ref="traitImportExportGridScoreModal" @data-changed="importTraits" />
    <TraitImportExportGerminateModal :traits="traitsToExport" ref="traitImportExportGerminateModal" @data-changed="importTraits" />
    <TraitImportExportTabularModal :traits="traitsToExport" ref="traitImportExportTabularModal" @data-changed="importTraits" />
    <TraitImportTrialModal ref="traitImportTrialModal" @data-changed="importTraits" />
    <BrapiTraitImportModal ref="brapiTraitImportModal" @traits-selected="importBrapiTraits" />
  </div>
</template>

<script>
import TraitImportExportGridScoreModal from '@/components/modals/TraitImportExportGridScoreModal.vue'
import TraitImportTrialModal from '@/components/modals/TraitImportTrialModal.vue'
import TraitImportExportGerminateModal from '@/components/modals/TraitImportExportGerminateModal.vue'
import TraitImportExportTabularModal from '@/components/modals/TraitImportExportTabularModal.vue'
import BrapiTraitImportModal from '@/components/modals/BrapiTraitImportModal.vue'
import { getTraitTypeText } from '@/plugins/misc'
import draggable from 'vuedraggable'
import { getId } from '@/plugins/id'
import { TRAIT_TIMEFRAME_TYPE_SUGGEST, TRAIT_TIMEFRAME_TYPE_ENFORCE } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    draggable,
    TraitImportExportGridScoreModal,
    TraitImportExportGerminateModal,
    TraitImportExportTabularModal,
    TraitImportTrialModal,
    BrapiTraitImportModal
  },
  props: {
    trials: {
      type: Array,
      default: () => []
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
        min: null,
        max: null,
        setSize: null
      },
      traitsToExport: null
    }
  },
  watch: {
    traits: {
      deep: true,
      handler: function (newValue) {
        this.$emit('data-changed', newValue)
      }
    },
    initialTraits: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.traits = JSON.parse(JSON.stringify(newValue)).map(t => {
            delete t.editable
            delete t.color
            delete t.progress
            if (!t.timeframe) {
              t.timeframe = null
            }
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

      if (this.trials && this.trials.length > 0) {
        this.trials.forEach(trial => {
          if (trial.traits && trial.traits.length > 0) {
            trial.traits.forEach(t => {
              if (t.group && t.group.name && t.group.name !== '') {
                set.add(t.group.name)
              }
            })
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
        text: this.$t('traitTypeRange'),
        value: 'range'
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
        text: this.$t('traitTypeGps'),
        value: 'gps'
      }, {
        text: this.$t('traitTypeImage'),
        value: 'image'
      }, {
        text: this.$t('traitTypeText'),
        value: 'text'
      }]
    }
  },
  methods: {
    getTraitTypeText,
    clearTraits: function () {
      emitter.emit('show-confirm', {
        title: 'modalTitleDeleteTraits',
        message: 'modalTextDeleteTraits',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.traits = []
          }
        }
      })
    },
    clearTraitsNoConfirm: function () {
      this.traits = []
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
              case 'Numerical':
                type = 'float'
                break
              case 'Duration':
                type = 'int'
                break
              case 'Nominal':
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
              restrictions.categories = t.scale.validValues.categories.map(c => c.label)
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
    importExportTabular: function (xport) {
      if (xport && this.traits && this.traits.length > 0) {
        const temp = JSON.parse(JSON.stringify(this.traits))
        temp.forEach(t => {
          delete t.id
          delete t.progress
          delete t.editable
          delete t.color
        })
        this.traitsToExport = temp
      } else {
        this.traitsToExport = null
      }

      this.$nextTick(() => this.$refs.traitImportExportTabularModal.show())
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
      }
      if (copy.dataType === 'range') {
        if (copy.restrictions.min === undefined || copy.restrictions.min === null || copy.restrictions.min === '') {
          copy.restrictions.min = 0
        }
        if (copy.restrictions.max === undefined || copy.restrictions.max === null || copy.restrictions.max === '') {
          copy.restrictions.max = 100
        }
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

      if (this.newTrait.dataType === 'range') {
        if (this.newTrait.restrictions.min === undefined || this.newTrait.restrictions.min === null || this.newTrait.restrictions.min === '') {
          this.formState.min = false
        } else {
          this.formState.min = true
        }
        if (this.newTrait.restrictions.max === undefined || this.newTrait.restrictions.max === null || this.newTrait.restrictions.max === '') {
          this.formState.max = false
        } else {
          this.formState.max = true
        }
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

      this.traits[this.traits.findIndex(t => t.id === copy.id)] = copy

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
        min: null,
        max: null,
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
      emitter.emit('show-confirm', {
        title: 'modalTitleDeleteTrait',
        message: 'modalTextDeleteTrait',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.traits.splice(index, 1)
          }
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
