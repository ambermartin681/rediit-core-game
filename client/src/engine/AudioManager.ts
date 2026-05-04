/**
 * Procedural audio via Web Audio API — no audio files.
 */
export class AudioManager {
  private ctx: AudioContext | null = null
  private muted = false

  resume() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setMuted(m: boolean) { this.muted = m }

  private get ac(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainVal = 0.15,
    startTime?: number,
  ) {
    if (this.muted) return
    const ac = this.ac
    const t = startTime ?? ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(gainVal, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(t)
    osc.stop(t + duration)
  }

  private sweep(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    gainVal = 0.15,
  ) {
    if (this.muted) return
    const ac = this.ac
    const t = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, t)
    osc.frequency.linearRampToValueAtTime(freqEnd, t + duration)
    gain.gain.setValueAtTime(gainVal, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(t)
    osc.stop(t + duration)
  }

  coinCollect() {
    const ac = this.ac
    const t = ac.currentTime
    this.tone(987, 0.08, 'square', 0.15, t)
    this.tone(1319, 0.08, 'square', 0.15, t + 0.08)
  }

  jumpSound() {
    this.sweep(200, 600, 0.1, 'square', 0.12)
  }

  blockBump() {
    this.tone(150, 0.06, 'square', 0.2)
  }

  enemySquish() {
    this.sweep(200, 80, 0.1, 'square', 0.2)
  }

  powerUp() {
    // C4-E4-G4-C5 arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]
    const ac = this.ac
    const t = ac.currentTime
    notes.forEach((freq, i) => this.tone(freq, 0.08, 'square', 0.15, t + i * 0.08))
  }

  playerDead() {
    // B4-F4-E4-Eb4-D4-C#4
    const notes = [493.88, 349.23, 329.63, 311.13, 293.66, 277.18]
    const ac = this.ac
    const t = ac.currentTime
    notes.forEach((freq, i) => this.tone(freq, 0.15, 'square', 0.15, t + i * 0.15))
  }

  stageClear() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]
    const ac = this.ac
    const t = ac.currentTime
    notes.forEach((freq, i) => this.tone(freq, 0.1, 'square', 0.15, t + i * 0.1))
  }

  gameOver() {
    const notes = [392.00, 349.23, 329.63, 261.63]
    const ac = this.ac
    const t = ac.currentTime
    notes.forEach((freq, i) => this.tone(freq, 0.3, 'square', 0.15, t + i * 0.35))
  }

  pipeEnter() {
    this.sweep(400, 100, 0.3, 'square', 0.1)
  }

  flagpole() {
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const ac = this.ac
    const t = ac.currentTime
    notes.forEach((freq, i) => this.tone(freq, 0.12, 'square', 0.15, t + i * 0.12))
  }
}
