<template>
  <span>
    <IBiPersonFillExclamation v-if="personType === PERSON_TYPE_CORRESPONDING_AUTHOR" />
    <IBiPersonLinesFill v-else-if="personType === PERSON_TYPE_DATA_COLLECTOR"/>
    <IBiPersonCheckFill v-else-if="personType === PERSON_TYPE_QUALITY_CHECKER" />
    <IBiPersonFillUp v-else-if="personType === PERSON_TYPE_DATA_SUBMITTER" />
  </span>
</template>

<script>
import { PERSON_TYPE_CORRESPONDING_AUTHOR, PERSON_TYPE_DATA_COLLECTOR, PERSON_TYPE_QUALITY_CHECKER, PERSON_TYPE_DATA_SUBMITTER } from '@/plugins/constants'

export default {
  props: {
    personType: {
      type: String,
      default: PERSON_TYPE_DATA_COLLECTOR
    }
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
