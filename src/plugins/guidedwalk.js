const guideCellSequence = (startX, startY, startDirection, nextMethod, layout) => {
  const cells = []

  cells.push({ x: startX, y: startY, direction: startDirection })

  let x = startX
  let y = startY
  let direction = startDirection

  let canContinue = true
  while (canContinue) {
    // Get the next cell according to the nextMethod
    const next = nextMethod({ x, y, direction }, layout)

    if (next.finished) {
      // Stop iterating
      canContinue = false
      delete next.finished
    } else {
      // Go to next cell
      x = next.x
      y = next.y
      direction = next.direction
      cells.push(next)
    }
  }

  return cells
}

const guideOrderNextRightUp = (current, layout) => {
  delete current.speak
  if (current.direction === 'r') {
    if (current.x < layout.columns - 1) {
      current.x++
    } else if (current.y > 0) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'l'
      current.y--
    } else {
      current.finished = true
    }
  } else {
    if (current.x > 0) {
      current.x--
    } else if (current.y > 0) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'r'
      current.y--
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextRightDown = (current, layout) => {
  delete current.speak
  if (current.direction === 'r') {
    if (current.x < layout.columns - 1) {
      current.x++
    } else if (current.y < layout.rows - 1) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'l'
      current.y++
    } else {
      current.finished = true
    }
  } else {
    if (current.x > 0) {
      current.x--
    } else if (current.y < layout.rows - 1) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'r'
      current.y++
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextLeftDown = (current, layout) => {
  delete current.speak
  if (current.direction === 'l') {
    if (current.x > 0) {
      current.x--
    } else if (current.y < layout.rows - 1) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'r'
      current.y++
    } else {
      current.finished = true
    }
  } else {
    if (current.x < layout.columns - 1) {
      current.x++
    } else if (current.y < layout.rows - 1) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'l'
      current.y++
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextLeftUp = (current, layout) => {
  delete current.speak
  if (current.direction === 'l') {
    if (current.x > 0) {
      current.x--
    } else if (current.y > 0) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'r'
      current.y--
    } else {
      current.finished = true
    }
  } else {
    if (current.x < layout.columns - 1) {
      current.x++
    } else if (current.y > 0) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'l'
      current.y--
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextDownRight = (current, layout) => {
  delete current.speak
  if (current.direction === 'd') {
    if (current.y < layout.rows - 1) {
      current.y++
    } else if (current.x < layout.columns - 1) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'u'
      current.x++
    } else {
      current.finished = true
    }
  } else {
    if (current.y > 0) {
      current.y--
    } else if (current.x < layout.columns - 1) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'd'
      current.x++
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextDownLeft = (current, layout) => {
  delete current.speak
  if (current.direction === 'd') {
    if (current.y < layout.rows - 1) {
      current.y++
    } else if (current.x > 0) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'u'
      current.x--
    } else {
      current.finished = true
    }
  } else {
    if (current.y > 0) {
      current.y--
    } else if (current.x > 0) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'd'
      current.x--
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextUpRight = (current, layout) => {
  delete current.speak
  if (current.direction === 'u') {
    if (current.y > 0) {
      current.y--
    } else if (current.x < layout.columns - 1) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'd'
      current.x++
    } else {
      current.finished = true
    }
  } else {
    if (current.y < layout.rows - 1) {
      current.y++
    } else if (current.x < layout.columns - 1) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'u'
      current.x++
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderNextUpLeft = (current, layout) => {
  delete current.speak
  if (current.direction === 'u') {
    if (current.y > 0) {
      current.y--
    } else if (current.x > 0) {
      current.speak = 'widgetGuideOrderUturnLeft'
      current.direction = 'd'
      current.x--
    } else {
      current.finished = true
    }
  } else {
    if (current.y < layout.rows - 1) {
      current.y++
    } else if (current.x > 0) {
      current.speak = 'widgetGuideOrderUturnRight'
      current.direction = 'u'
      current.x--
    } else {
      current.finished = true
    }
  }

  return current
}

const guideOrderTypes = [{
  name: 'up-left',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpLeft',
  valid: (x, y, layout) => !guideOrderNextUpLeft({ x: x, y: y, direction: 'u' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpLeft, layout),
  image: require('@/assets/img/guided-walk/scoring-order-u-l.svg')
}, {
  name: 'up-right',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpRight',
  valid: (x, y, layout) => !guideOrderNextUpRight({ x: x, y: y, direction: 'u' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpRight, layout),
  image: require('@/assets/img/guided-walk/scoring-order-u-r.svg')
}, {
  name: 'down-left',
  initialDirection: 'd',
  text: 'widgetGuideOrderDownLeft',
  valid: (x, y, layout) => !guideOrderNextDownLeft({ x: x, y: y, direction: 'd' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownLeft, layout),
  image: require('@/assets/img/guided-walk/scoring-order-d-l.svg')
}, {
  name: 'down-right',
  initialDirection: 'd',
  text: 'widgetGuideOrderDownRight',
  valid: (x, y, layout) => !guideOrderNextDownRight({ x: x, y: y, direction: 'd' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownRight, layout),
  image: require('@/assets/img/guided-walk/scoring-order-d-r.svg')
}, {
  name: 'left-up',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftUp',
  valid: (x, y, layout) => !guideOrderNextLeftUp({ x: x, y: y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftUp, layout),
  image: require('@/assets/img/guided-walk/scoring-order-l-u.svg')
}, {
  name: 'left-down',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftDown',
  valid: (x, y, layout) => !guideOrderNextLeftDown({ x: x, y: y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftDown, layout),
  image: require('@/assets/img/guided-walk/scoring-order-l-d.svg')
}, {
  name: 'right-down',
  initialDirection: 'r',
  text: 'widgetGuideOrderRightDown',
  valid: (x, y, layout) => !guideOrderNextRightDown({ x: x, y: y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightDown, layout),
  image: require('@/assets/img/guided-walk/scoring-order-r-d.svg')
}, {
  name: 'right-up',
  initialDirection: 'r',
  text: 'widgetGuideOrderRightUp',
  valid: (x, y, layout) => !guideOrderNextRightUp({ x: x, y: y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightUp, layout),
  image: require('@/assets/img/guided-walk/scoring-order-r-u.svg')
}]

export {
  guideCellSequence,
  guideOrderNextRightUp,
  guideOrderNextRightDown,
  guideOrderNextLeftDown,
  guideOrderNextLeftUp,
  guideOrderNextDownRight,
  guideOrderNextDownLeft,
  guideOrderNextUpRight,
  guideOrderNextUpLeft,
  guideOrderTypes
}
