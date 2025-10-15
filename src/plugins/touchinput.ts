function getTouchPosition (e: any) {
  if (e.touches) {
    if (e.touches.length === 1) {
      // const rect = this.$refs.dataCanvas.getBoundingClientRect()
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    } else {
      return null
    }
  } else {
    return {
      x: e.offsetX,
      y: e.offsetY,
    }
  }
}

export {
  getTouchPosition,
}
