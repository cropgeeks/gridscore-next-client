<template>
  <div>
    <div>{{ pattern }}</div>
    <svg :class="`patternlock ${success === true ? 'success' : (success === false ? 'error' : '')}`" ref="svg" id="lock" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g ref="lockActives" class="lock-actives"></g>
      <g ref="lockLines" class="lock-lines"></g>
      <g class="lock-dots">
        <circle cx="20" cy="20" r="2"/>
        <circle cx="50" cy="20" r="2"/>
        <circle cx="80" cy="20" r="2"/>

        <circle cx="20" cy="50" r="2"/>
        <circle cx="50" cy="50" r="2"/>
        <circle cx="80" cy="50" r="2"/>

        <circle cx="20" cy="80" r="2"/>
        <circle cx="50" cy="80" r="2"/>
        <circle cx="80" cy="80" r="2"/>
      </g>
    </svg>
  </div>
</template>

<script lang="ts" setup>
  // Props
  const props = defineProps<{
    correctPattern: number[]
  }>()

  const svgns = 'http://www.w3.org/2000/svg'
  const moveEvent = ['touchmove', 'mousemove']
  const start = ['touchstart', 'mousedown']

  const success = ref<boolean | undefined>()
  const code = ref<SVGCircleElement[]>([])
  const svg = useTemplateRef('svg')
  const lines = useTemplateRef('lockLines')
  const actives = useTemplateRef('lockActives')

  let dots: SVGCircleElement[] = []
  let pt: DOMPoint
  let currentLine: SVGLineElement | undefined
  let currentHandler: EventListener | undefined

  const pattern: ComputedRef<number[]> = computed(() => {
    if (code.value) {
      return code.value.map(i => dots.indexOf(i) + 1)
    } else {
      return []
    }
  })

  function vibrate() {
    // @ts-ignore
    if (navigator.vibrate) {
      window.navigator.vibrate(25)
    }
  }

  function clear() {
    code.value = []
    currentLine = undefined
    currentHandler = undefined
    success.value = undefined
    if (lines.value) {
      lines.value.innerHTML = ''
    }
    if (actives.value) {
      actives.value.innerHTML = ''
    }
  }

  function end() {
    stopTrack(currentLine)
    if (currentLine) {
      currentLine.remove()
    }
    moveEvent.forEach(ev => svg.value?.removeEventListener(ev, discoverDot))
    
    if (props.correctPattern && props.correctPattern.length > 0) {
      success.value = props.correctPattern.join(',') === pattern.value.join(',')
    }
  }

  function stopTrack(line: SVGLineElement | undefined, target?: SVGCircleElement) {
    if (line === undefined) {
      return
    }
    moveEvent.forEach(ev => {
      if (currentHandler) {
        svg.value?.removeEventListener(ev, currentHandler)
      }
    })
    if (target === undefined) {
      return
    }
    const x = target.getAttribute('cx')
    const y = target.getAttribute('cy')
    line.setAttribute('x2', `${x}`)
    line.setAttribute('y2', `${y}`)
  }

  function beginTrack(target: SVGCircleElement) {
    code.value.push(target)
    const x = target.getAttribute('cx')
    const y = target.getAttribute('cy')
    if (x && y) {
      const line = createNewLine(x, y)
      const marker = createNewMarker(x, y)
      actives.value?.appendChild(marker)
      currentHandler = updateLine(line)
      moveEvent.forEach(ev => {
        if (currentHandler) {
          svg.value?.addEventListener(ev, currentHandler)
        }
      })
      lines.value?.appendChild(line)
      vibrate()
      return line
    } else {
      return undefined
    }
  }

  function createNewMarker(x: string, y: string) {
    const marker = document.createElementNS(svgns, 'circle')
    marker.setAttribute('cx', x)
    marker.setAttribute('cy', y)
    marker.setAttribute('r', '6')
    return marker
  }

  function createNewLine(x1: string, y1: string, x2?: string, y2?: string) {
    const line = document.createElementNS(svgns, 'line')
    line.setAttribute('x1', x1)
    line.setAttribute('y1', y1)
    if (x2 === undefined || y2 == undefined) {
      line.setAttribute('x2', x1)
      line.setAttribute('y2', y1)
    } else {
      line.setAttribute('x2', x2)
      line.setAttribute('y2', y2)
    }
    return line
  }

  function isUsed(target: SVGCircleElement) {
    for (let i = 0; i < code.value.length; i++) {
      if (code.value[i] === target) {
        return true
      }
    }
    return false
  }

  function isAvailable(target: SVGCircleElement) {
    for (let i = 0; i < dots.length; i++) {
      if (dots[i] === target) {
        return true
      }
    }
    return false
  }

  function updateLine(line: SVGLineElement) {
    return (e: Event) => {
      e.preventDefault()
      if (currentLine !== line) {
        return
      }
      let pos = svgPosition(e.target as SVGGraphicsElement, e)
      line.setAttribute('x2', `${pos.x}`)
      line.setAttribute('y2', `${pos.y}`)
      return false
    }
  }

  function getMousePos(e: any) {
    return {
      x: e.clientX || e.originalEvent.touches[0].clientX,
      y :e.clientY || e.originalEvent.touches[0].clientY
    }
  }

  function discoverDot(e: Event, target?: SVGCircleElement) {
    if (!target) {
      const { x, y } = getMousePos(e)
      target = document.elementFromPoint(x, y) as SVGCircleElement
    }
    if (target) {
      if (isAvailable(target) && !isUsed(target)) {
        stopTrack(currentLine, target)
        currentLine = beginTrack(target)
      }
    }
  }

  function svgPosition(element: SVGGraphicsElement | null, e: Event) {
    let { x, y } = getMousePos(e)
    pt.x = x
    pt.y = y
    return pt.matrixTransform(element?.getScreenCTM()?.inverse())
  }

  onMounted(() => {
    if (svg.value) {
      dots = Array.from(svg.value.querySelectorAll('circle'))
      pt = svg.value.createSVGPoint()

      start.forEach(ev => svg.value?.addEventListener(ev, e => {
        clear()
        e.preventDefault()

        moveEvent.forEach(eev => svg.value?.addEventListener(eev, discoverDot))
        const endEvent = e.type == 'touchstart' ? 'touchend' : 'mouseup'
        document.addEventListener(endEvent, () => end(), { once: true })
      }))
    }
  })
</script>

<style>
#lock {
  width: 100%;
  height: calc(100% - 15vh);
  padding-bottom: 12vh;
  min-height: 120px;
}

svg.patternlock g.lock-lines line {
  stroke-width: 1.5;
  stroke: black;
  opacity: 0.5;
}

svg.patternlock g.lock-dots circle {
  stroke: transparent;
  fill: black;
  stroke-width: 13.5;
}

svg.patternlock g.lock-actives circle {
  fill: black;
  opacity: .4;
  animation: lock-activate-dot .15s 0s ease 1;
  transform-origin: center;
}

svg.patternlock g.lock-lines line {
  stroke-width: 1.5;
  stroke-linecap: round;
}

svg.patternlock.success g.lock-actives circle {
  fill: var(--bs-success);
}

svg.patternlock.error g.lock-actives circle {
  fill: var(--bs-danger);
}

@keyframes lock-activate-dot {
  0% {
    transform: scale(0);
  }
  75% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.0);
  }
}
</style>
