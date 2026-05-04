/**
 * All sprites drawn with ctx.fillRect() only — no image files.
 * NES Mario colour palette.
 */

type Ctx = CanvasRenderingContext2D

// Palette
const C = {
  sky:      '#5C94FC',
  ground:   '#C84C0C',
  brick:    '#E45C10',
  qYellow:  '#FAB005',
  qDark:    '#C88000',
  pipeG:    '#00A800',
  pipeDark: '#006400',
  mRed:     '#E40058',
  mSkin:    '#FCBCB0',
  mBlue:    '#0058F8',
  cloud:    '#FCFCFC',
  coin:     '#FAB005',
  white:    '#FCFCFC',
  black:    '#000000',
  goombaR:  '#A80000',
  goombaBr: '#7C5800',
  hillG:    '#00A800',
  empty:    '#7C7C7C',
  emptyDk:  '#5C5C5C',
  mushroomR:'#E40058',
  mushroomW:'#FCFCFC',
  starY:    '#FAB005',
  starW:    '#FCFCFC',
  fireball: '#FCFCFC',
  fireOr:   '#FAB005',
}

function px(ctx: Ctx, color: string, x: number, y: number, w = 4, h = 4) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

// 1 game unit = 4 canvas pixels
const U = 4

export function drawMario(
  ctx: Ctx,
  x: number,
  y: number,
  state: string,
  frame: number,
  dir: 'left' | 'right',
  powerUp: string,
) {
  ctx.save()
  if (dir === 'left') {
    ctx.translate(x + 16 * U, y)
    ctx.scale(-1, 1)
    x = 0; y = 0
  }

  const isSuper = powerUp !== 'none'
  const h = isSuper ? 32 : 16

  if (state === 'dead') {
    // Flat dead Mario
    px(ctx, C.mRed,  x + 2*U, y + 0*U, 4*U, 2*U)
    px(ctx, C.mSkin, x + 1*U, y + 2*U, 6*U, 2*U)
    px(ctx, C.mBlue, x + 0*U, y + 4*U, 8*U, 2*U)
    ctx.restore()
    return
  }

  if (state === 'jumping') {
    // Jump pose
    // Hat
    px(ctx, C.mRed,  x + 1*U, y + 0*U, 6*U, 1*U)
    px(ctx, C.mRed,  x + 0*U, y + 1*U, 8*U, 1*U)
    // Face
    px(ctx, C.mSkin, x + 1*U, y + 2*U, 6*U, 2*U)
    px(ctx, C.black, x + 4*U, y + 2*U, 1*U, 1*U) // eye
    px(ctx, C.mSkin, x + 5*U, y + 3*U, 2*U, 1*U) // nose
    // Body
    px(ctx, C.mBlue, x + 1*U, y + 4*U, 6*U, 2*U)
    px(ctx, C.mRed,  x + 2*U, y + 6*U, 4*U, 2*U)
    // Arms up
    px(ctx, C.mSkin, x + 0*U, y + 4*U, 1*U, 2*U)
    px(ctx, C.mSkin, x + 7*U, y + 4*U, 1*U, 2*U)
    // Legs bent
    px(ctx, C.mBlue, x + 1*U, y + 8*U, 2*U, 2*U)
    px(ctx, C.mBlue, x + 5*U, y + 8*U, 2*U, 2*U)
    px(ctx, C.ground,x + 0*U, y + 10*U, 3*U, 2*U)
    px(ctx, C.ground,x + 5*U, y + 10*U, 3*U, 2*U)
    ctx.restore()
    return
  }

  // Walk/run/idle frames
  const legFrames = [
    // frame 0: right leg forward
    () => {
      px(ctx, C.mBlue, x + 1*U, y + 8*U, 3*U, 2*U)
      px(ctx, C.mBlue, x + 4*U, y + 8*U, 3*U, 2*U)
      px(ctx, C.ground,x + 0*U, y + 10*U, 3*U, 2*U)
      px(ctx, C.ground,x + 5*U, y + 10*U, 3*U, 2*U)
    },
    // frame 1: stride
    () => {
      px(ctx, C.mBlue, x + 2*U, y + 8*U, 2*U, 2*U)
      px(ctx, C.mBlue, x + 4*U, y + 8*U, 2*U, 2*U)
      px(ctx, C.ground,x + 1*U, y + 10*U, 3*U, 2*U)
      px(ctx, C.ground,x + 4*U, y + 10*U, 3*U, 2*U)
    },
    // frame 2: left leg forward
    () => {
      px(ctx, C.mBlue, x + 1*U, y + 8*U, 3*U, 2*U)
      px(ctx, C.mBlue, x + 4*U, y + 8*U, 3*U, 2*U)
      px(ctx, C.ground,x + 1*U, y + 10*U, 3*U, 2*U)
      px(ctx, C.ground,x + 4*U, y + 10*U, 3*U, 2*U)
    },
  ]

  // Hat
  px(ctx, C.mRed,  x + 1*U, y + 0*U, 6*U, 1*U)
  px(ctx, C.mRed,  x + 0*U, y + 1*U, 8*U, 1*U)
  // Hair
  px(ctx, C.goombaBr, x + 1*U, y + 2*U, 1*U, 1*U)
  // Face
  px(ctx, C.mSkin, x + 1*U, y + 2*U, 6*U, 2*U)
  px(ctx, C.black, x + 4*U, y + 2*U, 1*U, 1*U) // eye
  px(ctx, C.mSkin, x + 5*U, y + 3*U, 2*U, 1*U) // nose
  px(ctx, C.goombaBr, x + 2*U, y + 3*U, 2*U, 1*U) // mustache
  // Body
  px(ctx, C.mBlue, x + 1*U, y + 4*U, 6*U, 2*U)
  px(ctx, C.mRed,  x + 2*U, y + 6*U, 4*U, 2*U)
  // Buttons
  px(ctx, C.mBlue, x + 3*U, y + 6*U, 1*U, 1*U)
  px(ctx, C.mBlue, x + 4*U, y + 6*U, 1*U, 1*U)
  // Arms
  px(ctx, C.mSkin, x + 0*U, y + 4*U, 1*U, 2*U)
  px(ctx, C.mSkin, x + 7*U, y + 4*U, 1*U, 2*U)

  // Legs
  legFrames[frame % 3]()

  if (isSuper) {
    // Extra body height for Super Mario
    px(ctx, C.mRed,  x + 1*U, y - 4*U, 6*U, 2*U)
    px(ctx, C.mBlue, x + 1*U, y - 2*U, 6*U, 2*U)
  }

  ctx.restore()
}

export function drawGoomba(ctx: Ctx, x: number, y: number, frame: number, squished: boolean) {
  if (squished) {
    px(ctx, C.goombaBr, x + 0*U, y + 2*U, 8*U, 2*U)
    px(ctx, C.goombaR,  x + 1*U, y + 1*U, 6*U, 2*U)
    px(ctx, C.white,    x + 1*U, y + 2*U, 1*U, 1*U)
    px(ctx, C.white,    x + 5*U, y + 2*U, 1*U, 1*U)
    return
  }
  const footOff = frame % 2 === 0 ? 0 : 1*U
  // Body
  px(ctx, C.goombaBr, x + 1*U, y + 1*U, 6*U, 6*U)
  px(ctx, C.goombaR,  x + 0*U, y + 2*U, 8*U, 4*U)
  // Eyes
  px(ctx, C.white,    x + 1*U, y + 2*U, 2*U, 2*U)
  px(ctx, C.white,    x + 5*U, y + 2*U, 2*U, 2*U)
  px(ctx, C.black,    x + 1*U, y + 3*U, 1*U, 1*U)
  px(ctx, C.black,    x + 6*U, y + 3*U, 1*U, 1*U)
  // Angry brows
  px(ctx, C.black,    x + 1*U, y + 1*U, 2*U, 1*U)
  px(ctx, C.black,    x + 5*U, y + 1*U, 2*U, 1*U)
  // Feet
  px(ctx, C.goombaBr, x + 0*U, y + 6*U + footOff, 3*U, 2*U)
  px(ctx, C.goombaBr, x + 5*U, y + 6*U - footOff, 3*U, 2*U)
}

export function drawKoopa(ctx: Ctx, x: number, y: number, frame: number, inShell: boolean) {
  if (inShell) {
    px(ctx, C.pipeG,  x + 1*U, y + 0*U, 6*U, 4*U)
    px(ctx, C.pipeDark, x + 2*U, y + 1*U, 4*U, 2*U)
    px(ctx, C.pipeG,  x + 0*U, y + 2*U, 8*U, 2*U)
    return
  }
  const footOff = frame % 2 === 0 ? 0 : 1*U
  // Shell
  px(ctx, C.pipeG,  x + 1*U, y + 0*U, 6*U, 6*U)
  px(ctx, C.pipeDark, x + 2*U, y + 1*U, 4*U, 4*U)
  // Head
  px(ctx, C.mSkin,  x + 2*U, y - 2*U, 4*U, 3*U)
  px(ctx, C.black,  x + 4*U, y - 2*U, 1*U, 1*U)
  // Feet
  px(ctx, C.mSkin,  x + 0*U, y + 5*U + footOff, 3*U, 2*U)
  px(ctx, C.mSkin,  x + 5*U, y + 5*U - footOff, 3*U, 2*U)
}

export function drawCoin(ctx: Ctx, x: number, y: number, frame: number) {
  const widths = [2*U, 1*U, 2*U, 1*U]
  const w = widths[frame % 4]
  const ox = (2*U - w) / 2
  px(ctx, C.coin, x + ox, y + 0*U, w, 2*U)
  px(ctx, C.qDark, x + ox + 1, y + 1, w - 2, 2*U - 2)
}

export function drawQuestionBlock(ctx: Ctx, x: number, y: number, bumped: boolean, offsetY = 0) {
  const by = y + offsetY
  if (bumped) {
    px(ctx, C.empty,  x + 0*U, by + 0*U, 4*U, 4*U)
    px(ctx, C.emptyDk,x + 1*U, by + 1*U, 2*U, 2*U)
    return
  }
  // Yellow block
  px(ctx, C.qYellow, x + 0*U, by + 0*U, 4*U, 4*U)
  // Border
  px(ctx, C.white,   x + 0*U, by + 0*U, 4*U, 1)
  px(ctx, C.white,   x + 0*U, by + 0*U, 1, 4*U)
  px(ctx, C.qDark,   x + 0*U, by + 4*U - 1, 4*U, 1)
  px(ctx, C.qDark,   x + 4*U - 1, by + 0*U, 1, 4*U)
  // ? mark
  px(ctx, C.white,   x + 1*U + 2, by + 1*U, 1*U, 1)
  px(ctx, C.white,   x + 1*U + 2, by + 1*U + 4, 1*U, 1)
  px(ctx, C.white,   x + 1*U + 2, by + 2*U + 2, 1*U, 1)
}

export function drawBrick(ctx: Ctx, x: number, y: number) {
  px(ctx, C.brick,  x + 0*U, y + 0*U, 4*U, 4*U)
  // Grout lines
  px(ctx, C.ground, x + 0*U, y + 0*U, 4*U, 1)
  px(ctx, C.ground, x + 0*U, y + 0*U, 1, 4*U)
  px(ctx, C.ground, x + 2*U, y + 2*U, 1, 2*U)
}

export function drawGround(ctx: Ctx, x: number, y: number) {
  px(ctx, C.ground, x + 0*U, y + 0*U, 4*U, 4*U)
  px(ctx, C.brick,  x + 0*U, y + 0*U, 4*U, 1)
  px(ctx, C.brick,  x + 0*U, y + 0*U, 1, 4*U)
}

export function drawPipe(ctx: Ctx, x: number, y: number, heightTiles: number) {
  const h = heightTiles * 4 * U
  // Rim
  px(ctx, C.pipeG,  x - 1*U, y + 0*U, 10*U, 2*U)
  px(ctx, C.pipeDark, x + 0*U, y + 0*U, 1*U, 2*U)
  px(ctx, C.pipeDark, x + 7*U, y + 0*U, 1*U, 2*U)
  // Body
  px(ctx, C.pipeG,  x + 0*U, y + 2*U, 8*U, h - 2*U)
  px(ctx, C.pipeDark, x + 0*U, y + 2*U, 1*U, h - 2*U)
  px(ctx, C.pipeDark, x + 6*U, y + 2*U, 1*U, h - 2*U)
}

export function drawCloud(ctx: Ctx, x: number, y: number, size: 1 | 2) {
  const s = size === 2 ? 1.5 : 1
  const w = Math.round(8*U*s)
  const h = Math.round(4*U*s)
  px(ctx, C.cloud, x + Math.round(2*U*s), y + 0, Math.round(4*U*s), Math.round(2*U*s))
  px(ctx, C.cloud, x + 0, y + Math.round(2*U*s), w, h - Math.round(2*U*s))
}

export function drawHill(ctx: Ctx, x: number, y: number) {
  // Stepped hill silhouette
  px(ctx, C.hillG, x + 4*U, y + 0*U, 4*U, 2*U)
  px(ctx, C.hillG, x + 2*U, y + 2*U, 8*U, 2*U)
  px(ctx, C.hillG, x + 0*U, y + 4*U, 12*U, 2*U)
  // Dots
  px(ctx, C.pipeG, x + 5*U, y + 1*U, 1, 1)
  px(ctx, C.pipeG, x + 3*U, y + 3*U, 1, 1)
  px(ctx, C.pipeG, x + 7*U, y + 3*U, 1, 1)
}

export function drawFlag(ctx: Ctx, x: number, y: number, poleHeight: number) {
  const h = poleHeight * U
  // Pole
  px(ctx, C.black, x + 0*U, y + 0*U, 1*U, h)
  // Flag
  px(ctx, C.pipeG, x + 1*U, y + 0*U, 3*U, 2*U)
  px(ctx, C.pipeG, x + 1*U, y + 2*U, 2*U, 2*U)
}

export function drawFireball(ctx: Ctx, x: number, y: number, frame: number) {
  const c = frame % 2 === 0 ? C.fireball : C.fireOr
  px(ctx, c, x + 1*U, y + 0*U, 2*U, 2*U)
  px(ctx, c, x + 0*U, y + 1*U, 4*U, 2*U)
  px(ctx, c, x + 1*U, y + 3*U, 2*U, 1*U)
}

export function drawMushroom(ctx: Ctx, x: number, y: number) {
  // Cap
  px(ctx, C.mushroomR, x + 1*U, y + 0*U, 6*U, 2*U)
  px(ctx, C.mushroomR, x + 0*U, y + 2*U, 8*U, 2*U)
  px(ctx, C.mushroomW, x + 1*U, y + 1*U, 2*U, 2*U)
  px(ctx, C.mushroomW, x + 5*U, y + 1*U, 2*U, 2*U)
  // Stem
  px(ctx, C.mushroomW, x + 1*U, y + 4*U, 6*U, 4*U)
  px(ctx, C.mushroomR, x + 0*U, y + 6*U, 8*U, 2*U)
}

export function drawStarman(ctx: Ctx, x: number, y: number, frame: number) {
  const colors = [C.starY, C.white, C.coin, C.mushroomR]
  const c = colors[frame % 4]
  px(ctx, c, x + 3*U, y + 0*U, 2*U, 1*U)
  px(ctx, c, x + 1*U, y + 1*U, 6*U, 2*U)
  px(ctx, c, x + 0*U, y + 3*U, 8*U, 2*U)
  px(ctx, c, x + 1*U, y + 5*U, 6*U, 2*U)
  px(ctx, c, x + 3*U, y + 7*U, 2*U, 1*U)
  // Eyes
  px(ctx, C.black, x + 2*U, y + 3*U, 1*U, 1*U)
  px(ctx, C.black, x + 5*U, y + 3*U, 1*U, 1*U)
}

export function drawToad(ctx: Ctx, x: number, y: number) {
  // Cap (white mushroom)
  px(ctx, C.white,    x + 1*U, y + 0*U, 6*U, 3*U)
  px(ctx, C.goombaR,  x + 2*U, y + 0*U, 2*U, 2*U)
  px(ctx, C.goombaR,  x + 5*U, y + 0*U, 2*U, 2*U)
  // Face
  px(ctx, C.mSkin,    x + 2*U, y + 3*U, 4*U, 3*U)
  px(ctx, C.black,    x + 3*U, y + 4*U, 1*U, 1*U)
  px(ctx, C.black,    x + 5*U, y + 4*U, 1*U, 1*U)
  // Vest
  px(ctx, C.mBlue,    x + 1*U, y + 6*U, 6*U, 4*U)
  px(ctx, C.white,    x + 3*U, y + 6*U, 2*U, 4*U)
}

export function drawCastle(ctx: Ctx, x: number, y: number) {
  // Battlements
  px(ctx, C.emptyDk, x + 0*U, y + 0*U, 2*U, 2*U)
  px(ctx, C.emptyDk, x + 3*U, y + 0*U, 2*U, 2*U)
  px(ctx, C.emptyDk, x + 6*U, y + 0*U, 2*U, 2*U)
  // Wall
  px(ctx, C.emptyDk, x + 0*U, y + 2*U, 8*U, 6*U)
  // Door
  px(ctx, C.black,   x + 3*U, y + 5*U, 2*U, 3*U)
  // Windows
  px(ctx, C.black,   x + 1*U, y + 3*U, 1*U, 1*U)
  px(ctx, C.black,   x + 6*U, y + 3*U, 1*U, 1*U)
}
