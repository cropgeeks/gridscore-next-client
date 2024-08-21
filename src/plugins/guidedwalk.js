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

const guideOrderNextUpLeftBack = (current, layout) => {
  delete current.speak
  if (current.y > 0) {
    current.y--
  } else if (current.x > 0) {
    current.x--
    current.y = layout.rows - 1
    current.speak = 'widgetGuideOrderBackLeft'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextUpRightBack = (current, layout) => {
  delete current.speak
  if (current.y > 0) {
    current.y--
  } else if (current.x < layout.columns - 1) {
    current.x++
    current.y = layout.rows - 1
    current.speak = 'widgetGuideOrderBackRight'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextDownLeftBack = (current, layout) => {
  delete current.speak
  if (current.y < layout.rows - 1) {
    current.y++
  } else if (current.x < layout.columns - 1) {
    current.x++
    current.y = 0
    current.speak = 'widgetGuideOrderBackLeft'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextDownRightBack = (current, layout) => {
  delete current.speak
  if (current.y < layout.rows - 1) {
    current.y++
  } else if (current.x > 0) {
    current.x--
    current.y = 0
    current.speak = 'widgetGuideOrderBackRight'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextLeftUpBack = (current, layout) => {
  delete current.speak
  if (current.x > 0) {
    current.x--
  } else if (current.y > 0) {
    current.y--
    current.x = layout.columns - 1
    current.speak = 'widgetGuideOrderBackRight'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextLeftDownBack = (current, layout) => {
  delete current.speak
  if (current.x > 0) {
    current.x--
  } else if (current.y < layout.rows - 1) {
    current.y++
    current.x = layout.columns - 1
    current.speak = 'widgetGuideOrderBackLeft'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextRightDownBack = (current, layout) => {
  delete current.speak
  if (current.x < layout.columns - 1) {
    current.x++
  } else if (current.y < layout.rows - 1) {
    current.y++
    current.x = 0
    current.speak = 'widgetGuideOrderBackRight'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderNextRightUpBack = (current, layout) => {
  delete current.speak
  if (current.x < layout.columns - 1) {
    current.x++
  } else if (current.y > 0) {
    current.y--
    current.x = 0
    current.speak = 'widgetGuideOrderBackLeft'
  } else {
    current.finished = true
  }

  return current
}

const guideOrderTypes = [{
  name: 'up-left',
  type: 'snake',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpLeft',
  valid: (x, y, layout) => !guideOrderNextUpLeft({ x, y, direction: 'u' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpLeft, layout),
  image: 'img/guided-walk/scoring-order-u-l.svg'
}, {
  name: 'up-right',
  type: 'snake',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpRight',
  valid: (x, y, layout) => !guideOrderNextUpRight({ x, y, direction: 'u' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpRight, layout),
  image: 'img/guided-walk/scoring-order-u-r.svg'
}, {
  name: 'down-left',
  type: 'snake',
  initialDirection: 'd',
  text: 'widgetGuideOrderDownLeft',
  valid: (x, y, layout) => !guideOrderNextDownLeft({ x, y, direction: 'd' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownLeft, layout),
  image: 'img/guided-walk/scoring-order-d-l.svg'
}, {
  name: 'down-right',
  type: 'snake',
  initialDirection: 'd',
  text: 'widgetGuideOrderDownRight',
  valid: (x, y, layout) => !guideOrderNextDownRight({ x, y, direction: 'd' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownRight, layout),
  image: 'img/guided-walk/scoring-order-d-r.svg'
}, {
  name: 'left-up',
  type: 'snake',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftUp',
  valid: (x, y, layout) => !guideOrderNextLeftUp({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftUp, layout),
  image: 'img/guided-walk/scoring-order-l-u.svg'
}, {
  name: 'left-down',
  type: 'snake',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftDown',
  valid: (x, y, layout) => !guideOrderNextLeftDown({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftDown, layout),
  image: 'img/guided-walk/scoring-order-l-d.svg'
}, {
  name: 'right-down',
  type: 'snake',
  initialDirection: 'r',
  text: 'widgetGuideOrderRightDown',
  valid: (x, y, layout) => !guideOrderNextRightDown({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightDown, layout),
  image: 'img/guided-walk/scoring-order-r-d.svg'
}, {
  name: 'right-up',
  type: 'snake',
  initialDirection: 'r',
  text: 'widgetGuideOrderRightUp',
  valid: (x, y, layout) => !guideOrderNextRightUp({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightUp, layout),
  image: 'img/guided-walk/scoring-order-r-u.svg'
}, {
  name: 'up-left-back',
  type: 'zigzag',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpLeftBack',
  valid: (x, y, layout) => !guideOrderNextUpLeftBack({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpLeftBack, layout),
  image: 'img/guided-walk/scoring-order-u-l-b.svg'
}, {
  name: 'up-right-back',
  type: 'zigzag',
  initialDirection: 'u',
  text: 'widgetGuideOrderUpRightBack',
  valid: (x, y, layout) => !guideOrderNextUpRightBack({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextUpRightBack, layout),
  image: 'img/guided-walk/scoring-order-u-r-b.svg'
}, {
  name: 'down-right-back',
  type: 'zigzag',
  initialDirection: 'u',
  text: 'widgetGuideOrderDownRightBack',
  valid: (x, y, layout) => !guideOrderNextDownRightBack({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownRightBack, layout),
  image: 'img/guided-walk/scoring-order-d-r-b.svg'
}, {
  name: 'down-left-back',
  type: 'zigzag',
  initialDirection: 'u',
  text: 'widgetGuideOrderDownLeftBack',
  valid: (x, y, layout) => !guideOrderNextDownLeftBack({ x, y, direction: 'r' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextDownLeftBack, layout),
  image: 'img/guided-walk/scoring-order-d-l-b.svg'
}, {
  name: 'left-up-back',
  type: 'zigzag',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftUpBack',
  valid: (x, y, layout) => !guideOrderNextLeftUpBack({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftUpBack, layout),
  image: 'img/guided-walk/scoring-order-l-u-b.svg'
}, {
  name: 'left-down-back',
  type: 'zigzag',
  initialDirection: 'l',
  text: 'widgetGuideOrderLeftDownBack',
  valid: (x, y, layout) => !guideOrderNextLeftDownBack({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextLeftDownBack, layout),
  image: 'img/guided-walk/scoring-order-l-d-b.svg'
}, {
  name: 'right-down-back',
  type: 'zigzag',
  initialDirection: 'l',
  text: 'widgetGuideOrderRightDownBack',
  valid: (x, y, layout) => !guideOrderNextRightDownBack({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightDownBack, layout),
  image: 'img/guided-walk/scoring-order-r-d-b.svg'
}, {
  name: 'right-up-back',
  type: 'zigzag',
  initialDirection: 'l',
  text: 'widgetGuideOrderRightUpBack',
  valid: (x, y, layout) => !guideOrderNextRightUpBack({ x, y, direction: 'l' }, layout).finished,
  cellSequence: (start, layout) => guideCellSequence(start.x, start.y, start.direction, guideOrderNextRightUpBack, layout),
  image: 'img/guided-walk/scoring-order-r-u-b.svg'
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
  guideOrderNextUpLeftBack,
  guideOrderNextUpRightBack,
  guideOrderNextDownLeftBack,
  guideOrderNextDownRightBack,
  guideOrderNextLeftUpBack,
  guideOrderNextLeftDownBack,
  guideOrderNextRightDownBack,
  guideOrderNextRightUpBack,
  guideOrderTypes
}
