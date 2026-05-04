export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function aabbDistance(a: AABB, b: AABB): number {
  const ax = a.x + a.width / 2
  const ay = a.y + a.height / 2
  const bx = b.x + b.width / 2
  const by = b.y + b.height / 2
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

/** Returns true if entity is within `range` pixels of target center */
export function withinRange(entity: AABB, target: AABB, range: number): boolean {
  return aabbDistance(entity, target) <= range
}

/** Resolve AABB collision against a static rect, returns corrected {x, y} */
export function resolveStatic(
  moving: AABB,
  nx: number,
  ny: number,
  staticRect: AABB,
): { x: number; y: number } {
  const overlapX = Math.min(nx + moving.width, staticRect.x + staticRect.width) - Math.max(nx, staticRect.x)
  const overlapY = Math.min(ny + moving.height, staticRect.y + staticRect.height) - Math.max(ny, staticRect.y)

  if (overlapX < overlapY) {
    // Push out horizontally
    if (nx < staticRect.x) return { x: staticRect.x - moving.width, y: ny }
    return { x: staticRect.x + staticRect.width, y: ny }
  } else {
    // Push out vertically
    if (ny < staticRect.y) return { x: nx, y: staticRect.y - moving.height }
    return { x: nx, y: staticRect.y + staticRect.height }
  }
}
