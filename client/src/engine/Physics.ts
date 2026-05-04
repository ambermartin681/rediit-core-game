// Mario-style physics constants
export const GRAVITY = 0.4
export const JUMP_FORCE = -9.0
export const MAX_FALL_SPEED = 8.0
export const WALK_SPEED = 2.5
export const RUN_SPEED = 4.0
export const FRICTION = 0.85
export const AIR_FRICTION = 0.95

export type PlayerState = 'idle' | 'walking' | 'running' | 'jumping' | 'falling' | 'dead'
export type PowerUp = 'none' | 'super' | 'fire' | 'star'

export interface PhysicsBody {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
  state: PlayerState
  dir: 'left' | 'right'
  frame: number
  frameTimer: number
  jumpHeld: boolean
  jumpFrames: number
  powerUp: PowerUp
  invincible: number // frames remaining
  dead: boolean
  deathTimer: number
}

export interface TileRect {
  x: number
  y: number
  w: number
  h: number
  type: number
}

export function createBody(x: number, y: number): PhysicsBody {
  return {
    x, y, vx: 0, vy: 0,
    width: 14, height: 16,
    onGround: false,
    state: 'idle',
    dir: 'right',
    frame: 0,
    frameTimer: 0,
    jumpHeld: false,
    jumpFrames: 0,
    powerUp: 'none',
    invincible: 0,
    dead: false,
    deathTimer: 0,
  }
}

export function stepPhysics(
  body: PhysicsBody,
  tiles: TileRect[],
  keys: Set<string>,
  dt: number, // seconds
): { hitBlockFromBelow: TileRect | null } {
  if (body.dead) {
    // Death arc: pop up then fall
    if (body.deathTimer < 10) {
      body.vy = -12
    }
    body.vy += GRAVITY
    body.y += body.vy
    body.deathTimer++
    return { hitBlockFromBelow: null }
  }

  const running = keys.has('ShiftLeft') || keys.has('ShiftRight')
  const left = keys.has('ArrowLeft')
  const right = keys.has('ArrowRight')
  const jump = keys.has('ArrowUp') || keys.has('Space') || keys.has('KeyZ')

  // Horizontal movement
  const targetSpeed = running ? RUN_SPEED : WALK_SPEED
  if (left) {
    body.vx -= targetSpeed * 0.3
    body.dir = 'left'
  } else if (right) {
    body.vx += targetSpeed * 0.3
    body.dir = 'right'
  }

  // Friction
  const friction = body.onGround ? FRICTION : AIR_FRICTION
  body.vx *= friction
  if (Math.abs(body.vx) < 0.1) body.vx = 0
  body.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, body.vx))

  // Jump
  if (jump && body.onGround) {
    body.vy = JUMP_FORCE
    body.onGround = false
    body.jumpHeld = true
    body.jumpFrames = 0
  }
  if (jump && body.jumpHeld && body.jumpFrames < 12) {
    body.vy -= 0.4 // variable height
    body.jumpFrames++
  }
  if (!jump) {
    body.jumpHeld = false
    body.jumpFrames = 0
  }

  // Gravity
  body.vy += GRAVITY
  body.vy = Math.min(body.vy, MAX_FALL_SPEED)

  // Move X
  body.x += body.vx
  // Resolve X collisions
  for (const tile of tiles) {
    if (aabb(body, tile)) {
      if (body.vx > 0) body.x = tile.x - body.width
      else if (body.vx < 0) body.x = tile.x + tile.w
      body.vx = 0
    }
  }

  // Move Y
  body.y += body.vy
  body.onGround = false
  let hitBlockFromBelow: TileRect | null = null

  for (const tile of tiles) {
    if (aabb(body, tile)) {
      if (body.vy > 0) {
        // Landing
        body.y = tile.y - body.height
        body.vy = 0
        body.onGround = true
      } else if (body.vy < 0) {
        // Hit from below
        body.y = tile.y + tile.h
        body.vy = 0
        hitBlockFromBelow = tile
      }
    }
  }

  // Update state
  if (body.dead) {
    body.state = 'dead'
  } else if (!body.onGround) {
    body.state = body.vy < 0 ? 'jumping' : 'falling'
  } else if (Math.abs(body.vx) > RUN_SPEED * 0.7) {
    body.state = 'running'
  } else if (Math.abs(body.vx) > 0.1) {
    body.state = 'walking'
  } else {
    body.state = 'idle'
  }

  // Frame animation
  body.frameTimer += dt
  if (body.state === 'walking' || body.state === 'running') {
    const speed = body.state === 'running' ? 0.08 : 0.12
    if (body.frameTimer > speed) {
      body.frame = (body.frame + 1) % 3
      body.frameTimer = 0
    }
  } else {
    body.frame = 0
    body.frameTimer = 0
  }

  if (body.invincible > 0) body.invincible--

  return { hitBlockFromBelow }
}

function aabb(a: PhysicsBody, b: TileRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.width > b.x &&
    a.y < b.y + b.h &&
    a.y + a.height > b.y
  )
}
