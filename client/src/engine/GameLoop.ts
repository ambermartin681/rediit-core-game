export type UpdateFn = (dt: number) => void
export type DrawFn = () => void

export class GameLoop {
  private rafId = 0
  private lastTime = 0
  private _fps = 0
  private frameCount = 0
  private fpsTimer = 0

  get fps(): number { return this._fps }

  constructor(
    private readonly update: UpdateFn,
    private readonly draw: DrawFn,
  ) {}

  start(): void {
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  private tick = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05) // cap at 50ms
    this.lastTime = now

    this.frameCount++
    this.fpsTimer += dt
    if (this.fpsTimer >= 1) {
      this._fps = this.frameCount
      this.frameCount = 0
      this.fpsTimer = 0
    }

    this.update(dt)
    this.draw()
    this.rafId = requestAnimationFrame(this.tick)
  }
}
