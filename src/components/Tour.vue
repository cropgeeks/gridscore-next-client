<template>
  <div v-if="popoverShow">
    <!-- The backdrop prevents input on the background -->
    <div class="backdrop" />
    <!-- The popover appears next to the element -->
    <b-popover :target="popoverTarget" :placement="steps[currentIndex].position" ref="popover" v-model="popoverShow" no-flip teleport-to="body" >
      <template v-slot:title>
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ steps[currentIndex].title() }}</span>
          <b-button @click="popoverShow = false" size="sm" class="ms-auto btn-close" aria-label="Close"></b-button>
        </div>
      </template>
      <div>
        <!-- Step content text -->
        <p v-html="steps[currentIndex].text()" />

        <!-- Buttons -->
        <b-button-group class="d-flex">
          <!-- Back button -->
          <b-button variant="secondary" @click="prev" :disabled="currentIndex < 1" v-if="!hideBackButton && (steps.length > 1)"><IBiChevronLeft /> {{ $t('buttonBack') }}</b-button>
          <!-- Next button -->
          <b-button variant="success" @click="next" v-if="currentIndex < steps.length - 1">{{ $t('buttonNext') }} <IBiChevronRight /></b-button>
          <!-- Finish button -->
          <b-button variant="success" @click="resetPopover" v-else>{{ $t('buttonClose') }} <IBiCheck /></b-button>
        </b-button-group>
      </div>
    </b-popover>
  </div>
</template>

<script>
import emitter from 'tiny-emitter/instance'

export default {
  props: {
    steps: {
      type: Array,
      default: () => []
    },
    resetOnRouterNav: {
      type: Boolean,
      default: true
    },
    hideBackButton: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      currentIndex: 0,
      popoverShow: false,
      popoverTarget: null
    }
  },
  watch: {
    currentIndex: function () {
      if (this.popoverShow) {
        this.updatePopover()
      } else {
        this.resetPopover()
      }
    },
    popoverShow: function (newValue) {
      if (newValue === true) {
        document.body.classList.add('overflow-hidden')
      } else {
        document.body.classList.remove('overflow-hidden')
      }
    }
  },
  methods: {
    handlePageNavigation: function () {
      if (this.resetOnRouterNav) {
        // Hide on page navigation
        this.resetPopover()
        document.body.classList.remove('overflow-hidden')
      }
    },
    prev: function () {
      const currStep = this.steps[this.currentIndex]

      if (currStep.afterShow) {
        currStep.afterShow().then(() => {
          this.prevInternal()
        })
      } else {
        this.prevInternal()
      }
    },
    prevInternal: function () {
      const prevStep = this.steps[this.currentIndex - 1]

      if (prevStep.beforeShow) {
        prevStep.beforeShow().then(() => {
          this.currentIndex = this.currentIndex - 1
        })
      } else {
        this.currentIndex = this.currentIndex - 1
      }
    },
    next: function () {
      const currStep = this.steps[this.currentIndex]

      if (currStep.afterShow) {
        currStep.afterShow().then(() => {
          this.nextInternal()
        })
      } else {
        this.nextInternal()
      }
    },
    nextInternal: function () {
      const nextStep = this.steps[this.currentIndex + 1]

      if (nextStep.beforeShow) {
        nextStep.beforeShow().then(() => {
          this.currentIndex = this.currentIndex + 1
        })
      } else {
        this.currentIndex = this.currentIndex + 1
      }
    },
    updatePopover: function () {
      this.popoverShow = false
      this.$nextTick(() => {
        if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
          this.popoverTarget = document.querySelector(this.steps[this.currentIndex].target())

          if (this.popoverTarget) {
            this.popoverShow = true

            const rect = this.popoverTarget.getBoundingClientRect()
            const absoluteElementTop = rect.top + window.pageYOffset
            const middle = absoluteElementTop - (window.innerHeight / 2)
            window.scrollTo({
              left: 0,
              top: middle,
              behavior: 'smooth'
            })
          } else {
            this.popoverShow = false
            this.currentIndex++
          }
        } else {
          this.popoverShow = false
        }
      })
    },
    resetPopover: function () {
      if (this.currentIndex === this.steps.length - 1) {
        const step = this.steps[this.currentIndex]

        if (step.afterShow) {
          step.afterShow()
        }
      }

      this.currentIndex = 0
      this.popoverTarget = null
      this.popoverShow = false
    },
    start: function () {
      this.resetPopover()
      if (this.currentIndex === 0 && this.steps[this.currentIndex].beforeShow) {
        this.steps[this.currentIndex].beforeShow().then(this.updatePopover)
      } else {
        this.updatePopover()
      }
    },
    handleKeys: function (e) {
      if (this.popoverShow) {
        if (e.keyCode === 39) {
          // Right
          if (this.currentIndex < this.steps.length - 1) {
            this.next()
          }
        } else if (e.keyCode === 37) {
          // Left
          if (!this.hideBackButton && this.currentIndex > 0) {
            this.prev()
          }
        } else if (e.keyCode === 27) {
          // Escape
          this.resetPopover()
        }
      }
    }
  },
  mounted: function () {
    document.addEventListener('keyup', this.handleKeys)
    emitter.on('page-navigation', this.handlePageNavigation)
  },
  destroyed: function () {
    document.removeEventListener('keyup', this.handleKeys)
    emitter.off('page-navigation', this.handlePageNavigation)
  }
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1059;
}
</style>
