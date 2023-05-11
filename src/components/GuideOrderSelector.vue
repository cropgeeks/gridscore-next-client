<template>
  <b-form-radio-group
        id="radio-slots"
        v-model="selectedOrder"
        name="radio-options-order"
        v-if="visible">
    <b-row class="guide-order" v-if="trialLayout">
      <b-col v-for="option in precomputedOrders" :key="`guide-option-${option.type.name}`" cols=6 lg=3 class="mb-3">
        <div class="rounded p-3 bg-light h-100 border">
          <b-form-radio :value="option.type.name" :disabled="!option.valid" class="h-100">
            <div class="guide-text-label">{{ $t(option.type.text) }}</div>
            <b-img class="guide-image" fluid :src="option.type.image" />
          </b-form-radio>
        </div>
      </b-col>
    </b-row>
  </b-form-radio-group>
</template>

<script>
import { guideOrderTypes } from '@/plugins/guidedwalk'

export default {
  props: {
    row: {
      type: Number,
      default: 0
    },
    column: {
      type: Number,
      default: 0
    },
    visible: {
      type: Boolean,
      default: false
    },
    trialLayout: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    precomputedOrders: function () {
      return guideOrderTypes.map(o => {
        return {
          type: o,
          valid: o.valid(this.column, this.row, this.trialLayout)
        }
      })
    }
  },
  data: function () {
    return {
      selectedOrder: null
    }
  },
  methods: {
    getOrder: function () {
      return this.selectedOrder
    }
  }
}
</script>

<style>
img.guide-image {
  max-height: 50px;
}
.guide-order input[type="radio"][disabled] + label img {
  opacity: 0.5;
}
.guide-order label {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
</style>
<style scoped>
.guide-order > div{
  text-align: center;
}
.guide-text-label {
  word-break: break-word;
}
</style>
