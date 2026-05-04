export class AudioManager {
  private ctx: AudioContext | null = null
  private volume = 0.5

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
  }

  private beep(freq: number, duration: number, type: OscillatorType = 'square', vol = 1): void {
    try {
      const ctx = this.getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(this.volume * vol * 0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {
      // AudioContext may be blocked before user interaction
    }
  }

  playCollect(): void {
    this.beep(880, 0.08)
    setTimeout(() => this.beep(1320, 0.1), 60)
  }

  playDamage(): void {
    this.beep(110, 0.2, 'sawtooth', 0.8)
  }

  playInteract(): void {
    this.beep(440, 0.05)
    setTimeout(() => this.beep(660, 0.08), 40)
  }

  playUIClick(): void {
    this.beep(660, 0.05, 'square', 0.5)
  }

  playSuccess(): void {
    [440, 550, 660, 880].forEach((f, i) => setTimeout(() => this.beep(f, 0.1), i * 80))
  }

  playError(): void {
    this.beep(220, 0.15, 'sawtooth')
    setTimeout(() => this.beep(165, 0.2, 'sawtooth'), 100)
  }

  resume(): void {
    this.ctx?.resume()
  }
}
