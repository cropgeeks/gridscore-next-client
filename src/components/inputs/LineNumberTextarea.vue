<template>
  <div :id="id" class="d-flex flex-row">
    <div ref="lineNumbers" class="container__lines border-e bg-muted" />
    <v-textarea
      ref="textarea"
      wrap="off"
      :label="label"
      :hint="hint"
      persistent-hint
      persistent-placeholder
      class="pa-0 container__textarea"
      :placeholder="placeholder"
      v-model="model"
      :rows="15"
      @keydown.tab.prevent="tabber($event)"
    />
  </div>
</template>

<script setup lang="ts">
  import { getId } from '@/plugins/id'

  const model = defineModel<string>()

  const compProps = defineProps<{
    placeholder: string
    label: string
    hint: string
  }>()

  const id = ref(`line-number-input-${getId()}`)

  const styleProps = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'padding',
  ]

  function tabber (event: Event) {
    const text = model.value || ''
    // @ts-ignore
    const originalSelectionStart = event.target.selectionStart
    const textStart = text.slice(0, originalSelectionStart)
    const textEnd = text.slice(originalSelectionStart)

    model.value = `${textStart}\t${textEnd}`
    // @ts-ignore
    event.target.value = model.value // required to make the cursor stay in place.

    nextTick(() => {
      // @ts-ignore
      event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + 1
    })
  }

  onMounted(() => {
    const ta = document.querySelector(`#${id.value} .container__textarea textarea`) as HTMLTextAreaElement
    const lineNumbersEle = document.querySelector(`#${id.value} .container__lines`) as HTMLDivElement

    if (!ta || !lineNumbersEle) {
      return
    }

    const textareaStyles = window.getComputedStyle(ta)
    styleProps.forEach((property: string) => {
      lineNumbersEle.style.setProperty(property, textareaStyles.getPropertyValue(property))
    })

    const font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    // @ts-ignore
    context.font = font

    const calculateLineNumbers = () => {
      const lines = (ta.value || '').split(/\r?\n/)
      const numLines = lines.concat()

      const lineNumbers = []
      let i = 1
      while (numLines.length > 0) {
        const numLinesOfSentence = +(numLines.shift() || '0')
        lineNumbers.push(i)
        if (numLinesOfSentence > 1) {
          new Array(numLinesOfSentence - 1).fill('').forEach(() => lineNumbers.push(''))
        }
        i++
      }

      return lineNumbers
    }

    const displayLineNumbers = () => {
      const lineNumbers = calculateLineNumbers()
      lineNumbersEle.innerHTML = Array.from({ length: lineNumbers.length }, (_, i) => `<div>${lineNumbers[i] || '&nbsp;'}</div>`).join('')
    }

    ta.addEventListener('input', () => displayLineNumbers())

    displayLineNumbers()

    const ro = new ResizeObserver(() => {
      const rect = ta.getBoundingClientRect()
      lineNumbersEle.style.height = `${rect.height}px`
      displayLineNumbers()
    })
    ro.observe(ta)

    ta.addEventListener('scroll', () => {
      lineNumbersEle.scrollTop = ta.scrollTop
    })
  })
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
  white-space: nowrap;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>
