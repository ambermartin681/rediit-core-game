export class Renderer {
  readonly ctx: CanvasRenderingContext2D
  readonly width: number
  readonly height: number

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height
    ctx.imageSmoothingEnabled = false
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0a0f'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }

  drawTile(tx: number, ty: number, tileType: number, tileSize: number): void {
    const x = tx * tileSize
    const y = ty * tileSize
    switch (tileType) {
      case 0: // floor
        this.ctx.fillStyle = '#111118'
        this.ctx.fillRect(x, y, tileSize, tileSize)
        this.ctx.fillStyle = '#1a1a28'
        this.ctx.fillRect(x, y, 1, tileSize)
        this.ctx.fillRect(x, y, tileSize, 1)
        break
      case 1: // wall
        this.ctx.fillStyle = '#1a0a3a'
        this.ctx.fillRect(x, y, tileSize, tileSize)
        this.ctx.fillStyle = '#7000ff'
        this.ctx.fillRect(x, y, tileSize, 1)
        this.ctx.fillRect(x, y, 1, tileSize)
        this.ctx.fillStyle = '#3a0080'
        this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        break
      case 2: // vault (special cyan)
        this.ctx.fillStyle = '#001a2a'
        this.ctx.fillRect(x, y, tileSize, tileSize)
        this.ctx.fillStyle = '#00cfff'
        this.ctx.fillRect(x, y, tileSize, 2)
        this.ctx.fillRect(x, y + tileSize - 2, tileSize, 2)
        this.ctx.fillRect(x, y, 2, tileSize)
        this.ctx.fillRect(x + tileSize - 2, y, 2, tileSize)
        this.ctx.fillStyle = 'rgba(0,207,255,0.1)'
        this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        break
      case 3: // shrine (purple)
        this.ctx.fillStyle = '#0d0020'
        this.ctx.fillRect(x, y, tileSize, tileSize)
        this.ctx.fillStyle = '#7000ff'
        this.ctx.fillRect(x, y, tileSize, 2)
        this.ctx.fillRect(x, y + tileSize - 2, tileSize, 2)
        this.ctx.fillRect(x, y, 2, tileSize)
        this.ctx.fillRect(x + tileSize - 2, y, 2, tileSize)
        this.ctx.fillStyle = 'rgba(112,0,255,0.15)'
        this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        break
      case 4: // shop (green)
        this.ctx.fillStyle = '#001a0d'
        this.ctx.fillRect(x, y, tileSize, tileSize)
        this.ctx.fillStyle = '#00ff94'
        this.ctx.fillRect(x, y, tileSize, 2)
        this.ctx.fillRect(x, y + tileSize - 2, tileSize, 2)
        this.ctx.fillRect(x, y, 2, tileSize)
        this.ctx.fillRect(x + tileSize - 2, y, 2, tileSize)
        this.ctx.fillStyle = 'rgba(0,255,148,0.1)'
        this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        break
    }
  }

  drawText(text: string, x: number, y: number, color = '#fff', size = 8): void {
    this.ctx.fillStyle = color
    this.ctx.font = `${size}px "Press Start 2P", monospace`
    this.ctx.fillText(text, Math.round(x), Math.round(y))
  }

  flashScreen(color: string, alpha: number): void {
    this.ctx.fillStyle = color
    this.ctx.globalAlpha = alpha
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.globalAlpha = 1
  }
}
