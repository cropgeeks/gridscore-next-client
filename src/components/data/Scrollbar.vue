<template>
  <canvas
    class="d-block"
    ref="scrollEl"
    :width="scaledWidth"
    :height="scaledHeight"
    v-if="dimensions"
    :style="{ cursor: isDragging ? 'grabbing' : 'pointer', touchAction: 'none' }"
    @pointerdown="onPointerDown"
  />
</template>

<script setup lang="ts">
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { coreStore } from '@/stores/app'

  const compProps = defineProps<{
    orientation: 'vertical' | 'horizontal'
    dimensions: Dimensions
    offset: number
    count: number
  }>()

  // Emits the new offset in the same domain as `offset` (a <= 0 translate value),
  // so it can be plugged straight back in.
  const emit = defineEmits<{
    scroll: [offset: number]
  }>()

  const store = coreStore()

  const scaledWidth = ref(5)
  const scaledHeight = ref(10)
  const isDragging = ref(false)

  const scrollEl = useTemplateRef('scrollEl')

  let ctx: CanvasRenderingContext2D | null = null
  let dragOffset = 0
  let holdInterval: number | undefined
  let holdTargetPos = 0

  const isVertical = computed(() => compProps.orientation === 'vertical')

  const dpr = computed(() => window.devicePixelRatio)

  // --- Axis-agnostic accessors -------------------------------------------
  // primarySize: the length of the track along the scroll direction
  // crossSize:   the thickness of the scrollbar
  // cellSize:    the size of one row/col along the primary axis
  function dims () {
    const d = compProps.dimensions as any

    return isVertical.value
      ? { primarySize: d.canvasHeight, crossSize: d.vScrollWidth, cellSize: d.cellHeight }
      : { primarySize: d.canvasWidth, crossSize: d.hScrollHeight, cellSize: d.cellWidth }
  }

  function pointerPrimaryPos (e: PointerEvent): number {
    const rect = scrollEl.value!.getBoundingClientRect()
    return isVertical.value ? e.clientY - rect.top : e.clientX - rect.left
  }

  // Draws a rect spanning the full cross-axis, from `start` to `start + length`
  // along the primary axis.
  function fillPrimaryRect (start: number, length: number) {
    const { crossSize } = dims()

    if (isVertical.value) {
      ctx!.fillRect(0, start * dpr.value, crossSize * dpr.value, length * dpr.value)
    } else {
      ctx!.fillRect(start * dpr.value, 0, length * dpr.value, crossSize * dpr.value)
    }
  }

  // --- Geometry -------------------------------------------------------------
  // Single source of truth for the handle's size/position so drawing and
  // hit-testing/dragging math can never drift apart.
  function getGeometry () {
    const { primarySize, cellSize } = dims()
    const totalContentSize = Math.max(1, compProps.count * cellSize)

    const h = Math.max(10, Math.min(primarySize, Math.round(primarySize / totalContentSize * primarySize)))
    const maxHandlePos = Math.max(0, primarySize - h)
    const maxScroll = Math.max(0, totalContentSize - primarySize)

    const handlePos = maxScroll === 0
      ? 0
      : Math.min(maxHandlePos, Math.round((Math.abs(compProps.offset) / maxScroll) * maxHandlePos))

    return { primarySize, totalContentSize, h, maxHandlePos, maxScroll, handlePos }
  }

  function draw () {
    if (!ctx) {
      return
    }

    const { h, handlePos } = getGeometry()
    const { primarySize, crossSize } = dims()

    ctx.clearRect(0, 0, compProps.dimensions.vScrollWidth ?? crossSize, primarySize)
    if (isVertical.value) {
      ctx.clearRect(0, 0, crossSize * dpr.value, primarySize * dpr.value)
    } else {
      ctx.clearRect(0, 0, primarySize * dpr.value, crossSize * dpr.value)
    }

    ctx.fillStyle = store.storeIsDarkMode ? '#8e8c84' : '#f2f2f2'
    if (isVertical.value) {
      ctx.fillRect(0, 0, crossSize * dpr.value, primarySize * dpr.value)
    } else {
      ctx.fillRect(0, 0, primarySize * dpr.value, crossSize * dpr.value)
    }

    ctx.fillStyle = store.storeIsDarkMode ? '#f2f2f2' : '#8e8c84'
    fillPrimaryRect(handlePos, h)
  }

  function reset () {
    const scale = dpr.value
    const el = scrollEl.value
    const { primarySize, crossSize } = dims()

    if (!el) {
      return
    }

    el.width = scaledWidth.value
    el.height = scaledHeight.value

    const cssWidth = isVertical.value ? crossSize : primarySize
    const cssHeight = isVertical.value ? primarySize : crossSize

    scaledWidth.value = cssWidth * dpr.value
    scaledHeight.value = cssHeight * dpr.value

    el.style.width = cssWidth + 'px'
    el.style.height = cssHeight + 'px'

    ctx = el.getContext('2d')
    ctx?.scale(scale, scale)

    nextTick(() => draw())
  }

  function emitScrollForHandlePos (handlePos: number) {
    const { maxHandlePos, maxScroll } = getGeometry()
    const clamped = Math.min(Math.max(0, handlePos), maxHandlePos)
    const fraction = maxHandlePos === 0 ? 0 : clamped / maxHandlePos
    emit('scroll', -Math.round(fraction * maxScroll))
  }

  // Clicking/holding on the track pages toward the pointer, one viewport
  // at a time, same as a native scrollbar track click-and-hold.
  function pageTowards (pos: number) {
    const { h, handlePos, maxScroll, primarySize } = getGeometry()
    const direction = pos < handlePos ? -1 : (pos > handlePos + h ? 1 : 0)

    if (direction === 0) {
      stopHold()
      return
    }

    const currentScroll = Math.abs(compProps.offset)
    const newScroll = Math.min(maxScroll, Math.max(0, currentScroll + direction * primarySize))
    emit('scroll', -newScroll)
  }

  function stopHold () {
    if (holdInterval !== undefined) {
      clearInterval(holdInterval)
      holdInterval = undefined
    }
  }

  function onPointerDown (e: PointerEvent) {
    const pos = pointerPrimaryPos(e)
    const { h, handlePos } = getGeometry()

    if (pos >= handlePos && pos <= handlePos + h) {
      // Grabbed the handle itself -> drag.
      isDragging.value = true
      dragOffset = pos - handlePos

      scrollEl.value?.setPointerCapture(e.pointerId)
      scrollEl.value?.addEventListener('pointermove', onHandlePointerMove)
      scrollEl.value?.addEventListener('pointerup', onHandlePointerUp)
      scrollEl.value?.addEventListener('pointercancel', onHandlePointerUp)
    } else {
      // Clicked the track -> page toward the click, repeating while held.
      holdTargetPos = pos
      pageTowards(holdTargetPos)
      holdInterval = window.setInterval(() => pageTowards(holdTargetPos), 350)

      scrollEl.value?.setPointerCapture(e.pointerId)
      scrollEl.value?.addEventListener('pointerup', onTrackPointerUp)
      scrollEl.value?.addEventListener('pointercancel', onTrackPointerUp)
    }
  }

  function onHandlePointerMove (e: PointerEvent) {
    if (!isDragging.value) {
      return
    }
    emitScrollForHandlePos(pointerPrimaryPos(e) - dragOffset)
  }

  function onHandlePointerUp (e: PointerEvent) {
    isDragging.value = false
    scrollEl.value?.releasePointerCapture(e.pointerId)
    scrollEl.value?.removeEventListener('pointermove', onHandlePointerMove)
    scrollEl.value?.removeEventListener('pointerup', onHandlePointerUp)
    scrollEl.value?.removeEventListener('pointercancel', onHandlePointerUp)
  }

  function onTrackPointerUp (e: PointerEvent) {
    stopHold()
    scrollEl.value?.releasePointerCapture(e.pointerId)
    scrollEl.value?.removeEventListener('pointerup', onTrackPointerUp)
    scrollEl.value?.removeEventListener('pointercancel', onTrackPointerUp)
  }

  onUnmounted(() => stopHold())

  watch(() => compProps.offset, async () => draw())
  watch(() => compProps.dimensions, async () => reset())
  watch(() => compProps.count, async () => draw())
  watch(() => store.storeIsDarkMode, async () => draw())
  watch(() => compProps.orientation, async () => reset())

  defineExpose({
    reset,
  })
</script>
