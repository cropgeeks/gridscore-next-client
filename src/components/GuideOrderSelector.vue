<template>
  <b-form-radio-group
        id="radio-slots"
        v-model="selectedOrder"
        name="radio-options-order"
        v-if="visible">
    <b-tabs v-model="tabIndex" v-if="trialLayout" class="mt-3">
      <b-tab>
        <template #title>
          <b-img class="tab-icon" fluid :src="snakeIcon" />
          {{ $t('widgetGuideOrderTabSnake') }}
        </template>

        <b-row class="guide-order mt-3">
          <b-col v-for="option in precomputedOrders['snake']" :key="`guide-option-${option.type.name}`" cols=6 lg=3 class="mb-3">
            <div class="rounded p-3 bg-light h-100 border">
              <b-form-radio :value="option.type.name" :disabled="!option.valid">
                <div class="guide-text-label">{{ $t(option.type.text) }}</div>
                <b-img class="guide-image" fluid :src="option.type.image" />
              </b-form-radio>
            </div>
          </b-col>
        </b-row>
      </b-tab>
      <b-tab>
        <template #title>
          <b-img class="tab-icon" fluid :src="zigzagIcon" />
          {{ $t('widgetGuideOrderTabZigzag') }}
        </template>

        <b-row class="guide-order mt-3">
          <b-col v-for="option in precomputedOrders['zigzag']" :key="`guide-option-${option.type.name}`" cols=6 lg=3 class="mb-3">
            <div class="rounded p-3 bg-light h-100 border">
              <b-form-radio :value="option.type.name" :disabled="!option.valid">
                <div class="guide-text-label">{{ $t(option.type.text) }}</div>
                <b-img class="guide-image" fluid :src="option.type.image" />
              </b-form-radio>
            </div>
          </b-col>
        </b-row>
      </b-tab>
    </b-tabs>
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
      const result = {
        zigzag: [],
        snake: []
      }

      guideOrderTypes.forEach(o => {
        result[o.type].push({
          type: o,
          valid: o.valid(this.column, this.row, this.trialLayout)
        })
      })

      return result
    }
  },
  data: function () {
    return {
      selectedOrder: null,
      tabIndex: 0,
      tabs: ['snake', 'zigzag'],
      zigzagIcon: 'img/guided-walk/scoring-order-u-l-b.svg',
      snakeIcon: 'img/guided-walk/scoring-order-u-l.svg'
    }
  },
  watch: {
    tabIndex: function () {
      this.selectedOrder = null
    },
    selectedOrder: function (newValue) {
      this.$emit('order-selected', newValue)
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
.tab-icon {
  width: 16px;
  height: 16px;
}
</style>
