export class ScrollCamera {
  x = 0
  y = 0
  readonly vw: number
  readonly vh: number
  readonly worldW: number
  readonly worldH: number

  constructor(vw: number, vh: number, worldW: number, worldH: number) {
    this.vw = vw
    this.vh = vh
    this.worldW = worldW
    this.worldH = worldH
  }

  follow(targetX: number, targetY: number, targetW: number, targetH: number) {
    const desiredX = targetX + targetW / 2 - this.vw / 2
    const desiredY = targetY + targetH / 2 - this.vh / 2
    // Lerp for smooth follow
    this.x += (desiredX - this.x) * 0.1
    this.y += (desiredY - this.y) * 0.1
    // Clamp
    this.x = Math.max(0, Math.min(this.x, this.worldW - this.vw))
    this.y = Math.max(0, Math.min(this.y, this.worldH - this.vh))
  }

  begin(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(-Math.round(this.x), -Math.round(this.y))
  }

  end(ctx: CanvasRenderingContext2D) {
    ctx.restore()
  }

  isVisible(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w > this.x - 16 &&
      x < this.x + this.vw + 16 &&
      y + h > this.y - 16 &&
      y < this.y + this.vh + 16
    )
  }

  /** Parallax scroll offset for background layers */
  bgOffset(factor: number): number {
    return this.x * factor
  }
}
