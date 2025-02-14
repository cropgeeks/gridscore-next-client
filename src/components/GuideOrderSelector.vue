<template>
  <div id="guided-walk-selector">
    <b-row>
      <b-col :cols=12 :md=6 class="mb-3">
        <b-button :variant="scoreWidth === 1 ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="setScoreWidth(1)">
          <h1 class="score-width-heading">
            <svg viewBox="0 0 135.467 135.467" height="1em" width="1em" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path style="fill:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:20" d="M43.61 75.234a3.97 3.97 0 0 0-3.97 3.969v21.793a3.97 3.97 0 0 0 3.97 3.969h17.154v-7.938H47.578V83.172h13.186v-7.938H43.61zm31.092 0v7.938h13.187v13.855H74.702v7.938h17.155a3.97 3.97 0 0 0 3.97-3.97V79.204a3.97 3.97 0 0 0-3.97-3.969H74.702z"/><path style="fill:currentColor;stroke:none;stroke-width:3.96875;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" d="M67.733 19.754a3.969 3.969 0 0 0-3.969 3.969v91.414a3.969 3.969 0 0 0 3.969 3.968 3.969 3.969 0 0 0 3.968-3.968V23.723a3.969 3.969 0 0 0-3.968-3.97z"/><circle r="12.171" cy="67.734" cx="20.681" style="fill:currentColor;fill-opacity:1;stroke:none;stroke-width:3.96875;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1" transform="matrix(0 1 1 0 0 0)"/><path d="m67.734 125.191-12.171-12.17h24.341z" style="fill:currentColor;fill-opacity:1;"/><path style="fill:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:20" d="M43.61 38.194a3.97 3.97 0 0 0-3.97 3.968v21.793a3.97 3.97 0 0 0 3.97 3.969h17.154v-7.937H47.578V46.13h13.186v-7.937H43.61zm31.092 0v7.937h13.187v13.856H74.702v7.937h17.155a3.97 3.97 0 0 0 3.97-3.969V42.162a3.97 3.97 0 0 0-3.97-3.968H74.702z"/></svg>
          </h1>
          <span>{{ $t('widgetGuideWidth', 1) }}</span>
        </b-button>
      </b-col>

      <b-col :cols=12 :md=6 class="mb-3">
        <b-button :variant="scoreWidth === 2 ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="setScoreWidth(2)">
          <h1 class="score-width-heading">
            <svg viewBox="0 0 135.467 135.467" height="1em" width="1em" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path style="fill:currentColor" d="M67.731 20.637a3.969 3.969 0 0 0-3.968 3.968v91.415a3.969 3.969 0 0 0 3.968 3.968 3.969 3.969 0 0 0 3.97-3.968V24.605a3.969 3.969 0 0 0-3.97-3.968z"/><circle r="12.171" cy="67.732" cx="21.564" style="fill:currentColor;fill-opacity:1" transform="matrix(0 1 1 0 0 0)"/><path d="m67.732 126.074-12.17-12.17h24.341z" style="fill:currentColor;fill-opacity:1"/><path style="fill:currentColor;" d="M33.023 36.992a3.97 3.97 0 0 0-3.968 3.969v21.793a3.97 3.97 0 0 0 3.968 3.969h21.793a3.97 3.97 0 0 0 3.97-3.97V40.962a3.97 3.97 0 0 0-3.97-3.969zm47.625 0a3.97 3.97 0 0 0-3.968 3.969v21.793a3.97 3.97 0 0 0 3.968 3.969h21.793a3.97 3.97 0 0 0 3.97-3.97V40.962a3.97 3.97 0 0 0-3.97-3.969zM36.992 44.93h13.856v13.855H36.992Zm47.625 0h13.856v13.855H84.617ZM33.023 74.035a3.97 3.97 0 0 0-3.968 3.969v21.793a3.97 3.97 0 0 0 3.968 3.969h21.793a3.97 3.97 0 0 0 3.97-3.97V78.005a3.97 3.97 0 0 0-3.97-3.969zm47.625 0a3.97 3.97 0 0 0-3.968 3.969v21.793a3.97 3.97 0 0 0 3.968 3.969h21.793a3.97 3.97 0 0 0 3.97-3.97V78.005a3.97 3.97 0 0 0-3.97-3.969zm-43.656 7.938h13.856v13.855H36.992Zm47.625 0h13.856v13.855H84.617Z"/></svg>
          </h1>
          <span>{{ $t('widgetGuideWidth', 2) }}</span>
        </b-button>
      </b-col>
    </b-row>

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
              <div class="p-3 h-100 border">
                <b-form-radio :value="option.type.name" :disabled="!option.valid">
                  <div class="guide-text-label">{{ $t(option.type.i18n) }}</div>
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
              <div class="p-3 h-100 border">
                <b-form-radio :value="option.type.name" :disabled="!option.valid">
                  <div class="guide-text-label">{{ $t(option.type.i18n) }}</div>
                  <b-img class="guide-image" fluid :src="option.type.image" />
                </b-form-radio>
              </div>
            </b-col>
          </b-row>
        </b-tab>
      </b-tabs>
    </b-form-radio-group>

    <div v-if="neighborOptions.length > 0">
      <h3>{{ $t('widgetGuideWidthNeighborSelectorTitle') }}</h3>
      <p>{{ $t('widgetGuideWidthNeighborSelectorText') }}</p>
      <b-row>
        <b-col :cols=12 :md=6 class="mb-3" v-for="(option, index) in neighborOptions" :key="`neighbor-option-${option.value.x}-${option.value.y}`">
          <b-button :variant="(selectedNeighbor && (selectedNeighbor.key === option.key)) ? 'primary' : 'outline-dark'" class="w-100 d-flex flex-column align-items-center" @click="setNeighbor(option)">
            <h3>{{ option.name }}</h3>
            <span class="text-center">{{ $t('widgetGuidedWalkPreviewColumnRow', { row: option.displayRow, column: option.displayColumn }) }}</span>
          </b-button>
        </b-col>
      </b-row>
    </div>

    <TrialPreviewCanvas :layout="trialLayout" :column="column" :row="row" :cells="guidedWalkCells" :path="guidedWalkPath" :width="guidedWalkDimensions[0]" :height="guidedWalkDimensions[1] * 0.75" v-if="guidedWalkPath" />
  </div>
</template>

<script>
import TrialPreviewCanvas from '@/components/canvas/TrialPreviewCanvas.vue'

import { getTrialDataCached } from '@/plugins/datastore'
import { Direction, getSequence, methods } from '@/plugins/guidedwalkv2'
import { getColumnLabel, getRowLabel } from '@/plugins/misc'

export default {
  components: {
    TrialPreviewCanvas
  },
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
    guidedWalkDimensions: function () {
      const wrapper = document.getElementById('guided-walk-selector')

      return [wrapper.offsetWidth, wrapper.offsetHeight]
    },
    guidedWalkPath: function () {
      if (this.selectedOrder) {
        if (this.scoreWidth === 1 || this.selectedNeighbor) {
          const order = methods.find(m => m.name === this.selectedOrder)

          let x = this.column
          let y = this.row

          if (this.selectedNeighbor) {
            x = (x + this.selectedNeighbor.value.x) / 2
            y = (y + this.selectedNeighbor.value.y) / 2
          }

          const path = getSequence(x, y, order.initialDirection, order, this.trialLayout, this.scoreWidth).steps

          return path
        }
      }

      return null
    },
    guidedWalkCells: function () {
      const result = [{ row: this.row, column: this.column }]

      if (this.selectedNeighbor) {
        result.push({
          row: this.selectedNeighbor.value.y,
          column: this.selectedNeighbor.value.x
        })
      }

      return result
    },
    neighborOptions: function () {
      if (this.scoreWidth > 1 && this.selectedOrder) {
        const trialData = getTrialDataCached()
        const order = methods.find(m => m.name === this.selectedOrder)

        const currentCell = trialData[`${this.row}|${this.column}`]
        const result = []
        
        if (order.initialDirection === Direction.d || order.initialDirection === Direction.u) {
          if (this.column > 0) {
            const n = trialData[`${this.row}|${this.column - 1}`]

            if (n) {
              result.push({
                key: `${this.row}|${this.column - 1}`,
                name: n.displayName,
                value: { x: this.column - 1, y: this.row },
                displayRow: getRowLabel(this.trialLayout, this.row),
                displayColumn: getColumnLabel(this.trialLayout, this.column - 1)
              })
            }
          }
          if (this.column < this.trialLayout.columns - 1) {
            const n = trialData[`${this.row}|${this.column + 1}`]

            if (n) {
              result.push({
                key: `${this.row}|${this.column + 1}`,
                name: n.displayName,
                value: { x: this.column + 1, y: this.row },
                displayRow: getRowLabel(this.trialLayout, this.row),
                displayColumn: getColumnLabel(this.trialLayout, this.column + 1)
              })
            }
          }
        } else {
          if (this.row > 0) {
            const n = trialData[`${this.row - 1}|${this.column}`]

            if (n) {
              result.push({
                key: `${this.row - 1}|${this.column}`,
                name: n.displayName,
                value: { x: this.column, y: this.row - 1 },
                displayRow: getRowLabel(this.trialLayout, this.row - 1),
                displayColumn: getColumnLabel(this.trialLayout, this.column)
              })
            }
          }
          if (this.row < this.trialLayout.rows - 1) {
            const n = trialData[`${this.row + 1}|${this.column}`]

            if (n) {
              result.push({
                key: `${this.row + 1}|${this.column}`,
                name: n.displayName,
                value: { x: this.column, y: this.row + 1 },
                displayRow: getRowLabel(this.trialLayout, this.row + 1),
                displayColumn: getColumnLabel(this.trialLayout, this.column)
              })
            }
          }
        }

        return result
      } else {
        return []
      }
    },
    precomputedOrders: function () {
      const result = {
        zigzag: [],
        snake: []
      }

      methods.forEach(m => {
        result[m.type].push({
          type: m,
          valid: m.valid({ x: this.column, y: this.row, direction: m.initialDirection }, this.trialLayout, this.scoreWidth)
        })
      })

      return result
    }
  },
  data: function () {
    return {
      selectedOrder: null,
      selectedNeighbor: null,
      tabIndex: 0,
      scoreWidth: 1,
      neighbor: null,
      tabs: ['snake', 'zigzag'],
      zigzagIcon: 'img/guided-walk/scoring-order-u-l-b.svg',
      snakeIcon: 'img/guided-walk/scoring-order-u-l.svg'
    }
  },
  watch: {
    scoreWidth: function () {
      this.selectedNeighbor = null
      this.selectedOrder = null
      this.$emit('order-selected', null)
    },
    tabIndex: function () {
      this.selectedOrder = null
      this.selectedNeighbor = null
      this.$emit('order-selected', null)
    },
    selectedOrder: function (newValue) {
      this.selectedNeighbor = null
      if (newValue) {
        this.$emit('order-selected', {
          order: newValue,
          scoreWidth: this.scoreWidth,
          neighbor: this.selectedNeighbor
        })
      } else {
        this.$emit('order-selected', null)
      }
    },
    selectedNeighbor: function (newValue) {
      this.$emit('order-selected', {
        order: this.selectedOrder,
        scoreWidth: this.scoreWidth,
        neighbor: newValue
      })
    }
  },
  methods: {
    setNeighbor: function (neighbor) {
      this.selectedNeighbor = neighbor
    },
    setScoreWidth: function (scoreWidth) {
      this.scoreWidth = scoreWidth
    }
  }
}
</script>

<style>
img.guide-image {
  max-height: 50px;
}
.score-width-heading svg {
  height: 70px;
  width: auto;
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
