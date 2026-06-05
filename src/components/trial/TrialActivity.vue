<template>
  <div ref="parent" class="heatmap-container" />
</template>

<script setup lang="ts">
  import { createColorGradient } from '@/plugins/color'

  const compProps = defineProps<{
    data: number[]
  }>()

  const parent = useTemplateRef('parent')
  const width = ref(0)
  const gap = shallowRef(2)
  const indicatorWidth = shallowRef(8)
  const indicatorHeight = shallowRef(4)

  const visibleData = computed(() => {
    const maxItemsThatFit = Math.floor((width.value + gap.value) / (indicatorWidth.value + gap.value))

    return compProps.data.slice(-maxItemsThatFit)
  })

  const colorGradient = computed(() => {
    const max = Math.max.apply(null, visibleData.value || [])

    return createColorGradient('#cccccc', '#00acef', max)
  })

  watch(colorGradient, async () => {
    const p = parent.value

    if (p) {
      p.innerHTML = ''

      visibleData.value.forEach(dp => {
        const bar = document.createElement('div')
        bar.classList.add('heatmap-bar')

        // Set heatmap color dynamically via CSS Variable
        // const color = getColorForValue(item.value, min, max)
        bar.style.setProperty('--bg-color', colorGradient.value[dp] || '#00acef')

        // Add data for the CSS tooltip
        // bar.setAttribute('data-tooltip', `${item.date}: ${item.value}`)
        bar.setAttribute('data-tooltip', `${dp}`)
        bar.style.setProperty('height', `${indicatorHeight.value}px`)

        p.appendChild(bar)
      })
    }
  }, { immediate: true })

  onMounted(() => {
    width.value = parent.value?.offsetWidth || 100
  })
</script>

<style>
  .heatmap-container {
    display: flex;
    gap: 2px;            /* Spacing between blocks */
    width: 100%;         /* Full width of parent */
    box-sizing: border-box;

    overflow: visible !important;
  }

  .heatmap-bar {
    flex: 1;             /* Dynamic width: stretches to fill available space */
    border-radius: 4px;
    position: relative;
    cursor: pointer;
  }

  /* Heatmap Color Scale (Using CSS Variables for clean JS injection) */
  .heatmap-bar {
    /* Default background, overridden by JS */
    background-color: var(--bg-color, #e0e0e0);
  }

  /* Simple Tooltip on Hover */
  .heatmap-bar::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 10;
  }

  .heatmap-bar:hover::after {
    opacity: 1;
  }
</style>
