/**
 * Tile types:
 * 0 = sky
 * 1 = ground
 * 2 = brick
 * 3 = question block (active)
 * 4 = question block (used)
 * 5 = pipe bottom
 * 6 = pipe top
 * 7 = staircase block
 * 8 = coin
 * 9 = mushroom spawn (invisible)
 */

export const TILE = {
  SKY: 0,
  GROUND: 1,
  BRICK: 2,
  QBLOCK: 3,
  QUSED: 4,
  PIPE_BOT: 5,
  PIPE_TOP: 6,
  STAIR: 7,
  COIN: 8,
  MUSHROOM: 9,
} as const

export const TILE_SIZE = 16 // game units (1 unit = 4px on canvas)
export const MAP_COLS = 200
export const MAP_ROWS = 25
export const CANVAS_W = 800
export const CANVAS_H = 400

// Stellar interaction triggers (col index)
export const STELLAR_BLOCKS = {
  MINT_COL: 72,    // question block → Token Mint Modal
  LEADERBOARD_COL: 135, // question block → Leaderboard
  SHOP_PIPE_COL: 65,    // pipe → Item Shop
}

export interface GoombaSpawn {
  x: number
  y: number
}

export interface KoopaSpawn {
  x: number
  y: number
}

export const GOOMBA_SPAWNS: GoombaSpawn[] = [
  { x: 900,  y: 352 },
  { x: 1100, y: 352 },
  { x: 1400, y: 352 },
  { x: 1650, y: 352 },
  { x: 1800, y: 352 },
  { x: 2200, y: 352 },
]

export const KOOPA_SPAWNS: KoopaSpawn[] = [
  { x: 1300, y: 344 },
]

function makeMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(TILE.SKY),
  )

  const ground = MAP_ROWS - 1

  // Full ground row
  for (let c = 0; c < MAP_COLS; c++) {
    map[ground][c] = TILE.GROUND
    map[ground - 1][c] = TILE.GROUND
  }

  // Gap at cols 108-110
  for (let c = 108; c <= 110; c++) {
    map[ground][c] = TILE.SKY
    map[ground - 1][c] = TILE.SKY
  }

  // Zone 1: floating bricks + question blocks
  for (const c of [16, 17, 18]) map[17][c] = TILE.BRICK
  map[17][20] = TILE.QBLOCK  // mushroom
  map[17][19] = TILE.MUSHROOM
  for (const c of [22, 23, 24]) map[17][c] = TILE.QBLOCK // coins

  // Zone 2: pipes
  // Pipe at col 57 (2 wide, 3 tall)
  for (let r = ground - 3; r < ground; r++) {
    map[r][57] = TILE.PIPE_BOT
    map[r][58] = TILE.PIPE_BOT
  }
  map[ground - 3][57] = TILE.PIPE_TOP
  map[ground - 3][58] = TILE.PIPE_TOP

  // Pipe at col 65 (2 wide, 4 tall) — shop pipe
  for (let r = ground - 4; r < ground; r++) {
    map[r][65] = TILE.PIPE_BOT
    map[r][66] = TILE.PIPE_BOT
  }
  map[ground - 4][65] = TILE.PIPE_TOP
  map[ground - 4][66] = TILE.PIPE_TOP

  // Floating bricks + coins above
  for (let c = 72; c <= 76; c++) {
    map[14][c] = TILE.BRICK
    map[13][c] = TILE.COIN
  }
  // Stellar mint block
  map[14][STELLAR_BLOCKS.MINT_COL] = TILE.QBLOCK

  // Zone 3: staircase ascent cols 125-130
  for (let i = 0; i < 6; i++) {
    for (let r = ground - 1 - i; r < ground; r++) {
      map[r][125 + i] = TILE.STAIR
    }
  }

  // Question block tower at col 135
  map[20][135] = TILE.QBLOCK
  map[17][135] = TILE.QBLOCK
  map[14][135] = TILE.QBLOCK  // leaderboard trigger
  // Mark leaderboard block
  map[14][STELLAR_BLOCKS.LEADERBOARD_COL] = TILE.QBLOCK

  // Zone 4: staircase descent into castle cols 185-190
  for (let i = 0; i < 6; i++) {
    for (let r = ground - 6 + i; r < ground; r++) {
      map[r][185 + i] = TILE.STAIR
    }
  }

  // Flag pole area col 193
  // (rendered separately as flag entity)

  return map
}

export const LEVEL_MAP = makeMap()

/** Get solid tile rects in a column range for physics */
export function getTileRects(
  map: number[][],
  colMin: number,
  colMax: number,
): Array<{ x: number; y: number; w: number; h: number; type: number; col: number; row: number }> {
  const rects = []
  const cMin = Math.max(0, colMin)
  const cMax = Math.min(MAP_COLS - 1, colMax)
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const t = map[r][c]
      if (t === TILE.SKY || t === TILE.COIN || t === TILE.MUSHROOM) continue
      rects.push({
        x: c * TILE_SIZE,
        y: r * TILE_SIZE,
        w: TILE_SIZE,
        h: TILE_SIZE,
        type: t,
        col: c,
        row: r,
      })
    }
  }
  return rects
}
