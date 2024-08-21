<template>
  <div class="d-flex flex-row border">
    <div ref="lineNumbers" class="container__lines border-end" />
    <b-form-textarea :id="id" ref="textarea" wrap="off" class="container__textarea" :placeholder="placeholder" :state="state" :value="modelValue" :rows="15" @input="$emit('update:modelValue', $event.target.value)" />
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: String
    },
    id: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    state: {
      type: Boolean,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data: function () {
    return {
      text: '',
      styleProps: [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'letterSpacing',
        'lineHeight',
        'padding'
      ]
    }
  },
  mounted: function () {
    const textarea = this.$refs.textarea.$el
    const lineNumbersEle = this.$refs.lineNumbers

    const textareaStyles = window.getComputedStyle(textarea)
    this.styleProps.forEach((property) => {
      lineNumbersEle.style[property] = textareaStyles[property]
    })

    const font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    context.font = font

    const calculateLineNumbers = () => {
      const lines = textarea.value.split(/\r?\n/)
      const numLines = lines.concat()

      const lineNumbers = []
      let i = 1
      while (numLines.length > 0) {
        const numLinesOfSentence = numLines.shift()
        lineNumbers.push(i)
        if (numLinesOfSentence > 1) {
          Array(numLinesOfSentence - 1).fill('').forEach(() => lineNumbers.push(''))
        }
        i++
      }

      return lineNumbers
    }

    const displayLineNumbers = () => {
      const lineNumbers = calculateLineNumbers()
      lineNumbersEle.innerHTML = Array.from({ length: lineNumbers.length }, (_, i) => `<div>${lineNumbers[i] || '&nbsp;'}</div>`).join('')
    }

    textarea.addEventListener('input', () => displayLineNumbers())

    displayLineNumbers()

    const ro = new ResizeObserver(() => {
      const rect = textarea.getBoundingClientRect()
      lineNumbersEle.style.height = `${rect.height}px`
      displayLineNumbers()
    })
    ro.observe(textarea)

    textarea.addEventListener('scroll', () => {
      lineNumbersEle.scrollTop = textarea.scrollTop
    })
  }
}
</script>

<style scoped>
.container__textarea {
  border: none;
  outline: none;
  padding: 0.5rem;
  width: 100%;
}
.container__lines {
  padding: 0.5rem;
  text-align: right;
  overflow: hidden;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>
