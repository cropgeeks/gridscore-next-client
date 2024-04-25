<template>
  <span>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi b-icon bi-person-fill-exclamation" viewBox="0 0 16 16" v-if="personType === PERSON_TYPE_CORRESPONDING_AUTHOR">
      <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
      <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V11a.5.5 0 0 0-.5-.5m0 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
    </svg>
    <BIconPersonLinesFill v-else-if="personType === PERSON_TYPE_DATA_COLLECTOR"/>
    <BIconPersonCheckFill v-else-if="personType === PERSON_TYPE_QUALITY_CHECKER" />
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi b-icon bi-person-fill-up" viewBox="0 0 16 16" v-else-if="personType === PERSON_TYPE_DATA_SUBMITTER">
      <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.854 1.5 1.5a.5.5 0 0 1-.708.708L13 11.707V14.5a.5.5 0 0 1-1 0v-2.793l-.646.647a.5.5 0 0 1-.708-.708l1.5-1.5a.5.5 0 0 1 .708 0M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
      <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
    </svg>
  </span>
</template>

<script>
import { PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_QUALITY_CHECKER, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'
import { BIconPersonLinesFill, BIconPersonCheckFill } from 'bootstrap-vue'

export default {
  props: {
    personType: {
      type: String,
      default: PERSON_TYPE_DATA_COLLECTOR
    }
  },
  components: {
    BIconPersonLinesFill,
    BIconPersonCheckFill
  },
  data: function () {
    return {
      PERSON_TYPE_CORRESPONDING_AUTHOR,
      PERSON_TYPE_DATA_COLLECTOR,
      PERSON_TYPE_QUALITY_CHECKER,
      PERSON_TYPE_DATA_SUBMITTER
    }
  }
}
</script>

<style>

</style>
