export class Camera {
  x = 0
  y = 0

  constructor(
    readonly viewWidth: number,
    readonly viewHeight: number,
    readonly worldWidth: number,
    readonly worldHeight: number,
  ) {}

  follow(targetX: number, targetY: number, targetW: number, targetH: number): void {
    // Center camera on target
    this.x = targetX + targetW / 2 - this.viewWidth / 2
    this.y = targetY + targetH / 2 - this.viewHeight / 2
    // Clamp to world bounds
    this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewWidth))
    this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewHeight))
  }

  /** Convert world coords to screen coords */
  toScreen(worldX: number, worldY: number): { x: number; y: number } {
    return { x: worldX - this.x, y: worldY - this.y }
  }

  /** Apply camera transform to canvas context */
  begin(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(-Math.round(this.x), -Math.round(this.y))
  }

  end(ctx: CanvasRenderingContext2D): void {
    ctx.restore()
  }

  isVisible(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w > this.x &&
      x < this.x + this.viewWidth &&
      y + h > this.y &&
      y < this.y + this.viewHeight
    )
  }
}
