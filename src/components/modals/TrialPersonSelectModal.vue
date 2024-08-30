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
      <b-list-group-item :active="storeSelectedTrialPerson === person.id" v-for="person in trial.people" :key="`person-${person.id}`" href="#" @click.prevent="selectPerson(person)">
        <div class="d-flex justify-content-between flex-wrap align-items-center">
          <div class="d-flex flex-row align-items-center">
            <b-avatar rounded="circle" class="me-2"><IBiPersonFill /></b-avatar>
            <div>
              <h5 class="mb-0">{{ person.name }}</h5>
              <p class="my-0" v-if="person.email">
                <a :href="`mailto:${person.email}`" @click.stop class="text-muted">{{ person.email }}</a>
              </p>
            </div>
          </div>
          <small>
            <PersonTypeIcon class="me-1" :personType="type" v-for="type in person.types" :key="`person-${person.id}-type-${type}`" :style="{ color: personStyle[type] }" />
          </small>
        </div>
      </b-list-group-item>
    </b-list-group>

    <b-button @click="$emit('addPersonClicked')"><IBiPersonPlusFill /> {{ $t('buttonAddPerson') }}</b-button>
  </b-modal>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import PersonTypeIcon from '@/components/icons/PersonTypeIcon.vue'
import { PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_QUALITY_CHECKER, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'

export default {
  components: {
    PersonTypeIcon
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    shouldShow: {
      type: Boolean,
      default: () => false
    }
  },
  data: function () {
    return {
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeTraitColors',
      'storeSelectedTrialPerson'
    ]),
    personStyle: function () {
      const result = {}
      result[PERSON_TYPE_CORRESPONDING_AUTHOR] = this.storeTraitColors[0 % this.storeTraitColors.length]
      result[PERSON_TYPE_DATA_COLLECTOR] = this.storeTraitColors[1 % this.storeTraitColors.length]
      result[PERSON_TYPE_QUALITY_CHECKER] = this.storeTraitColors[2 % this.storeTraitColors.length]
      result[PERSON_TYPE_DATA_SUBMITTER] = this.storeTraitColors[3 % this.storeTraitColors.length]

      return result
    }
  },
  watch: {
    shouldShow: {
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
      this.coreStore.setSelectedTrialPerson(person.id)
    }
  },
  mounted: function () {
    if (this.shouldShow) {
      this.show()
    }
  }
}
</script>

<style>

</style>
