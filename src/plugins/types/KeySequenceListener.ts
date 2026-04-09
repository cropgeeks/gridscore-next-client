export class KeySequenceListener {
  enterSequence: string | undefined
  escapeSequence: string | undefined
  currentSequence = ''

  constructor (enterSequence: string | undefined, escapeSequence: string | undefined) {
    this.enterSequence = enterSequence
    this.escapeSequence = escapeSequence

    document.addEventListener('keyup', this.handleInput)
  }

  destroy () {
    document.removeEventListener('keyup', this.handleInput)
  }

  handleInput = (evt: KeyboardEvent) => {
    if (evt && evt.key && evt.key.length === 1) {
      this.currentSequence += evt.key

      let keepGoing = false

      if (this.enterSequence) {
        if (this.currentSequence === this.enterSequence) {
          // @ts-ignore
          if (document.activeElement && document.activeElement.blur) {
            // @ts-ignore
            document.activeElement.blur()
          }

          this.enter()
          this.currentSequence = ''
        } else if (this.enterSequence.startsWith(this.currentSequence)) {
          keepGoing = true
        }
      }

      if (this.escapeSequence) {
        if (this.currentSequence === this.escapeSequence) {
          this.escape()
          this.currentSequence = ''
        } else if (this.escapeSequence.startsWith(this.currentSequence)) {
          keepGoing = true
        }
      }

      if (!keepGoing) {
        this.currentSequence = ''
      }
    }
  }

  enter () {
    throw new Error('You have to implement the method `success`!')
  }

  escape () {
    throw new Error('You have to implement the method `success`!')
  }
}
