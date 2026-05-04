export interface Entity {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export interface PlayerEntity extends Entity {
  vx: number
  vy: number
  frame: number
  frameTimer: number
  direction: 'left' | 'right'
  isMoving: boolean
  invincibleTimer: number
}

export interface EnemyEntity extends Entity {
  dx: number
  patrolMin: number
  patrolMax: number
  speed: number
}

export interface OrbEntity extends Entity {
  collected: boolean
  pulseTimer: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export class EntityManager {
  player: PlayerEntity
  enemies: EnemyEntity[]
  orbs: OrbEntity[]
  particles: Particle[] = []

  constructor(
    playerX: number,
    playerY: number,
    enemies: Array<{ id: number; x: number; y: number; dx: number; patrolMin: number; patrolMax: number }>,
    orbs: Array<{ id: number; x: number; y: number; collected: boolean }>,
  ) {
    this.player = {
      id: 0, x: playerX, y: playerY,
      width: 32, height: 32,
      vx: 0, vy: 0,
      frame: 0, frameTimer: 0,
      direction: 'right', isMoving: false,
      invincibleTimer: 0,
    }
    this.enemies = enemies.map((e) => ({
      ...e, width: 16, height: 16, speed: 60,
    }))
    this.orbs = orbs.map((o) => ({
      ...o, width: 16, height: 16, pulseTimer: Math.random() * Math.PI * 2,
    }))
  }

  spawnParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * (40 + Math.random() * 60),
        vy: Math.sin(angle) * (40 + Math.random() * 60),
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      p.vx *= 0.92
      p.vy *= 0.92
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }
}
