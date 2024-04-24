<template>
  <b-modal :title="$t('modalTitleEditPeople')"
           :ok-title="$t('buttonAdd')"
           :cancel-title="$t('buttonCancel')"
           no-fade
           size="lg"
           @ok.prevent="onSubmit"
           @shown="$refs.name.focus()"
           ref="editPeopleModal">
    <p>{{ $t('modalTextEditPeople') }}</p>
    <b-form @submit.prevent="onSubmit">
      <!-- Person name -->
      <b-form-group :label="$t('formLabelPersonName')" label-for="person-name" :description="$t('formDescriptionPersonName')">
        <b-form-input id="person-name" v-model="name" required :state="state.name" ref="name" />
      </b-form-group>
      <!-- Person email -->
      <b-form-group :label="$t('formLabelPersonEmail')" label-for="person-email" :description="$t('formDescriptionPersonEmail')">
        <b-form-input id="person-email" type="email" v-model="email" :state="state.email" ref="email" />
      </b-form-group>
      <!-- Person role -->
      <b-form-group :label="$t('formLabelPersonRole')" label-for="person-role" :description="$t('formDescriptionPersonRole')">
        <b-row>
          <b-col :cols=12 :md=3>
            <b-button :variant="isCorrespondingAuthor ? 'dark' : 'outline-dark'" @click="toggle(PERSON_TYPE_CORRESPONDING_AUTHOR)" class="w-100 person-type-button d-flex flex-column align-items-center">
              <h2 :style="{ color: storeTraitColors[0] }"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi b-icon bi-person-fill-exclamation" viewBox="0 0 16 16">
                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
                <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
              </svg></h2> <span>{{ $t('personTypeCorrespondingAuthor') }}</span>
            </b-button>
          </b-col>
          <b-col :cols=12 :md=3>
            <b-button :variant="isDataCollector ? 'dark' : 'outline-dark'" @click="toggle(PERSON_TYPE_DATA_COLLECTOR)" class="w-100 person-type-button d-flex flex-column align-items-center">
              <h2 :style="{ color: storeTraitColors[1] }"><BIconPersonLinesFill /></h2> <span>{{ $t('personTypeDataCollector') }}</span>
            </b-button>
          </b-col>
          <b-col :cols=12 :md=3>
            <b-button :variant="isQualityChecker ? 'dark' : 'outline-dark'" @click="toggle(PERSON_TYPE_QUALITY_CHECKER)" class="w-100 person-type-button d-flex flex-column align-items-center">
              <h2 :style="{ color: storeTraitColors[2] }"><BIconPersonCheckFill /></h2> <span>{{ $t('personTypeQualityChecker') }}</span>
            </b-button>
          </b-col>
          <b-col :cols=12 :md=3>
            <b-button :variant="isSubmitter ? 'dark' : 'outline-dark'" @click="toggle(PERSON_TYPE_DATA_SUBMITTER)" class="w-100 person-type-button d-flex flex-column align-items-center">
              <h2 :style="{ color: storeTraitColors[3] }"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi b-icon bi-person-fill-up" viewBox="0 0 16 16">
                <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.854 1.5 1.5a.5.5 0 0 1-.708.708L13 11.707V14.5a.5.5 0 0 1-1 0v-2.793l-.646.647a.5.5 0 0 1-.708-.708l1.5-1.5a.5.5 0 0 1 .708 0M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
              </svg></h2> <span>{{ $t('personTypeDataSubmitter') }}</span>
            </b-button>
          </b-col>
        </b-row>
      </b-form-group>
    </b-form>

    <p class="text-danger my-3" v-if="error">{{ $t(error) }}</p>
  </b-modal>
</template>

<script>
import { PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_QUALITY_CHECKER, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'
import { BIconPersonLinesFill, BIconPersonCheckFill } from 'bootstrap-vue'
import { getId } from '@/plugins/id'
import { mapGetters } from 'vuex'
import { addTrialPeople } from '@/plugins/idb'

export default {
  components: {
    BIconPersonLinesFill,
    BIconPersonCheckFill
  },
  props: {
    trialId: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      name: null,
      email: null,
      types: [PERSON_TYPE_DATA_COLLECTOR],
      state: {
        name: null
      },
      error: null,
      PERSON_TYPE_CORRESPONDING_AUTHOR,
      PERSON_TYPE_DATA_COLLECTOR,
      PERSON_TYPE_QUALITY_CHECKER,
      PERSON_TYPE_DATA_SUBMITTER
    }
  },
  computed: {
    ...mapGetters([
      'storeTraitColors'
    ]),
    isCorrespondingAuthor: function () {
      return this.types.includes(PERSON_TYPE_CORRESPONDING_AUTHOR)
    },
    isDataCollector: function () {
      return this.types.includes(PERSON_TYPE_DATA_COLLECTOR)
    },
    isQualityChecker: function () {
      return this.types.includes(PERSON_TYPE_QUALITY_CHECKER)
    },
    isSubmitter: function () {
      return this.types.includes(PERSON_TYPE_DATA_SUBMITTER)
    },
    personTypeOptions: function () {
      return [{
        value: PERSON_TYPE_CORRESPONDING_AUTHOR,
        text: this.$t('personTypeCorrespondingAuthor')
      }, {
        value: PERSON_TYPE_DATA_COLLECTOR,
        text: this.$t('personTypeDataCollector')
      }, {
        value: PERSON_TYPE_QUALITY_CHECKER,
        text: this.$t('personTypeQualityChecker')
      }, {
        value: PERSON_TYPE_DATA_SUBMITTER,
        text: this.$t('personTypeDataSubmitter')
      }]
    }
  },
  watch: {
    types: function () {
      if (this.$refs.name) {
        this.$refs.name.focus()
      }
    }
  },
  methods: {
    toggle: function (toggleType) {
      const s = new Set()
      this.types.forEach(t => s.add(t))

      if (s.has(toggleType)) {
        s.delete(toggleType)
      } else {
        s.add(toggleType)
      }

      this.types = [...s]
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.name = null
      this.email = null
      this.error = null
      this.types = [PERSON_TYPE_DATA_COLLECTOR]
      this.state = {
        name: null
      }

      this.$nextTick(() => this.$refs.editPeopleModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.editPeopleModal.hide())
    },
    onSubmit: function () {
      if (!this.name) {
        this.state.name = false
        return
      }
      if (this.types.length < 1) {
        this.error = 'errorMessagePersonTypeMissing'
        return
      }

      if (this.trialId) {
        addTrialPeople(this.trialId, [{ id: getId(), name: this.name, email: this.email, types: this.types }])
          .then(() => this.hide())
      } else {
        this.$emit('person-added', { id: getId(), name: this.name, email: this.email, types: this.types })
        this.hide()
      }
    }
  }
}
</script>

<style scoped>
.person-type-button {
  overflow-wrap: anywhere;
}
</style>
