export class InputManager {
  private keys: Map<string, boolean> = new Map()
  private justPressed: Set<string> = new Set()
  private justReleased: Set<string> = new Set()

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.keys.get(e.code)) {
      this.justPressed.add(e.code)
    }
    this.keys.set(e.code, true)
    // Prevent arrow key page scroll
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.set(e.code, false)
    this.justReleased.add(e.code)
  }

  isDown(code: string): boolean {
    return this.keys.get(code) === true
  }

  wasJustPressed(code: string): boolean {
    return this.justPressed.has(code)
  }

  wasJustReleased(code: string): boolean {
    return this.justReleased.has(code)
  }

  /** Call at end of each frame to clear per-frame sets */
  flush(): void {
    this.justPressed.clear()
    this.justReleased.clear()
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }
}
