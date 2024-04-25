<template>
  <b-modal :title="$t('modalTitleSelectTrialPerson')"
           :ok-title="$t('buttonAdd')"
           :cancel-title="$t('buttonCancel')"
           no-fade
           hide-footer
           hide-header-close
           no-close-on-backdrop
           no-close-on-esc
           ref="selectTrialPersonModal">
    <p>{{ $t('modalTextSelectTrialPerson') }}</p>

    <b-list-group>
      <b-list-group-item :active="storeSelectedTrialPerson === person.id" v-for="person in trial.people" :key="`person-${person.id}`" href="#" @click="selectPerson(person)">
        <b-row class="align-items-center">
          <b-col cols=2>
            <b-avatar />
          </b-col>
          <b-col cols=10 class="flex-column align-items-start">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-0">{{ person.name }}</h5>
              <small>
                <PersonTypeIcon class="mr-1" :personType="type" v-for="type in person.types" :key="`person-${person.id}-type-${type}`" :style="{ color: personStyle[type] }" />
              </small>
            </div>

            <p class="my-1" v-if="person.email">
              <a :href="`mailto:${person.email}`" />
            </p>
          </b-col>
        </b-row>
      </b-list-group-item>
    </b-list-group>

    <b-button @click="$emit('addPersonClicked')"><BIconPersonPlusFill /> {{ $t('buttonAddPerson') }}</b-button>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import PersonTypeIcon from '@/components/icons/PersonTypeIcon'
import { BIconPersonPlusFill } from 'bootstrap-vue'
import { PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_QUALITY_CHECKER, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'

export default {
  components: {
    BIconPersonPlusFill,
    PersonTypeIcon
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    shown: {
      type: Boolean,
      default: () => false
    }
  },
  data: function () {
    return {
    }
  },
  computed: {
    ...mapGetters([
      'storeTraitColors',
      'storeSelectedTrialPerson'
    ]),
    personStyle: function () {
      const result = {}
      result[PERSON_TYPE_CORRESPONDING_AUTHOR] = this.storeTraitColors[0]
      result[PERSON_TYPE_DATA_COLLECTOR] = this.storeTraitColors[1]
      result[PERSON_TYPE_QUALITY_CHECKER] = this.storeTraitColors[2]
      result[PERSON_TYPE_DATA_SUBMITTER] = this.storeTraitColors[3]

      return result
    }
  },
  watch: {
    shown: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.show()
        } else {
          this.hide()
        }
      }
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      if (this.$refs.selectTrialPersonModal) {
        this.$refs.selectTrialPersonModal.show()
      }
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.selectTrialPersonModal.hide())
    },
    selectPerson: function (person) {
      this.$emit('personSelected', person)
      this.$store.dispatch('setSelectedTrialPerson', person.id)
    }
  },
  mounted: function () {
    if (this.shown) {
      this.show()
    }
  }
}
</script>

<style>

</style>
