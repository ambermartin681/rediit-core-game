/**
 * All sprites drawn programmatically with ctx.fillRect().
 * Colour palette: bg=#0a0a0f, primary=#7000FF, accent=#00CFFF,
 * success=#00FF94, danger=#FF3B6F, surface=#13131f
 */

type Ctx = CanvasRenderingContext2D

function px(ctx: Ctx, color: string, x: number, y: number, w = 2, h = 2): void {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

/**
 * Draw a 32×32 pixel astronaut/warrior.
 * frame: 0-3 walk, 4-5 idle
 * direction: 'left' | 'right'
 */
export function drawPlayer(
  ctx: Ctx,
  x: number,
  y: number,
  frame: number,
  direction: 'left' | 'right',
): void {
  ctx.save()
  if (direction === 'left') {
    ctx.translate(x + 32, y)
    ctx.scale(-1, 1)
    x = 0
    y = 0
  }

  const isIdle = frame >= 4
  const legOffset = isIdle ? 0 : [0, 2, 0, -2][frame % 4]

  // Helmet (visor)
  px(ctx, '#7000ff', x + 10, y + 2, 12, 2)
  px(ctx, '#7000ff', x + 8,  y + 4, 16, 2)
  px(ctx, '#00cfff', x + 10, y + 4, 12, 6) // visor
  px(ctx, '#7000ff', x + 8,  y + 10, 16, 2)
  px(ctx, '#7000ff', x + 10, y + 12, 12, 2)

  // Visor shine
  px(ctx, 'rgba(255,255,255,0.4)', x + 11, y + 5, 4, 2)

  // Body / suit
  px(ctx, '#3a0080', x + 8,  y + 14, 16, 10)
  px(ctx, '#7000ff', x + 10, y + 14, 12, 2)  // collar
  px(ctx, '#00cfff', x + 12, y + 17, 8,  4)  // chest panel
  px(ctx, '#00ff94', x + 14, y + 18, 4,  2)  // status light

  // Left arm
  px(ctx, '#3a0080', x + 4,  y + 14 + (isIdle ? 0 : legOffset), 4, 8)
  px(ctx, '#7000ff', x + 4,  y + 22 + (isIdle ? 0 : legOffset), 4, 2) // glove

  // Right arm
  px(ctx, '#3a0080', x + 24, y + 14 - (isIdle ? 0 : legOffset), 4, 8)
  px(ctx, '#7000ff', x + 24, y + 22 - (isIdle ? 0 : legOffset), 4, 2)

  // Legs
  const ll = isIdle ? 0 : [2, -2, -2, 2][frame % 4]
  const rl = isIdle ? 0 : [-2, 2, 2, -2][frame % 4]
  px(ctx, '#1a0040', x + 10, y + 24, 5, 8)
  px(ctx, '#1a0040', x + 17, y + 24, 5, 8)
  // Boots
  px(ctx, '#7000ff', x + 9,  y + 28 + ll, 6, 4)
  px(ctx, '#7000ff', x + 17, y + 28 + rl, 6, 4)

  // Jetpack
  px(ctx, '#2a2a3f', x + 8,  y + 15, 3, 7)
  px(ctx, '#00cfff', x + 8,  y + 20, 3, 2)

  ctx.restore()
}

export function drawEnemy(ctx: Ctx, x: number, y: number, frame: number): void {
  const bob = Math.sin(frame * 0.1) * 2
  // Body
  px(ctx, '#ff3b6f', x + 2, y + 2 + bob, 12, 12)
  // Eyes
  px(ctx, '#fff',    x + 4, y + 5 + bob, 2, 2)
  px(ctx, '#fff',    x + 10, y + 5 + bob, 2, 2)
  px(ctx, '#0a0a0f', x + 5, y + 6 + bob, 1, 1)
  px(ctx, '#0a0a0f', x + 11, y + 6 + bob, 1, 1)
  // Spikes
  px(ctx, '#ff3b6f', x + 4, y + bob, 2, 3)
  px(ctx, '#ff3b6f', x + 10, y + bob, 2, 3)
  // Feet
  px(ctx, '#cc2255', x + 2, y + 13 + bob, 4, 2)
  px(ctx, '#cc2255', x + 10, y + 13 + bob, 4, 2)
}

export function drawOrb(ctx: Ctx, x: number, y: number, pulse: number): void {
  const r = 6 + Math.sin(pulse) * 1.5
  const cx = x + 8
  const cy = y + 8
  // Glow
  ctx.fillStyle = 'rgba(0,207,255,0.15)'
  ctx.beginPath()
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2)
  ctx.fill()
  // Core
  ctx.fillStyle = '#00cfff'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.beginPath()
  ctx.arc(cx - 2, cy - 2, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

export function drawParticle(ctx: Ctx, x: number, y: number, size: number, color: string, alpha: number): void {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size)
  ctx.globalAlpha = 1
}
