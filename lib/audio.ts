"use client";

// Motor de audio 100% procedural (Web Audio API) — sin ficheros de sonido que descargar.
// Genera SFX cortos por síntesis y un zumbido ambiente submarino con ruido filtrado.

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private started = false;
  public muted = false;

  private ensureCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  resume() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    if (!this.started) {
      this.started = true;
      this.startAmbient();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.55;
  }

  private startAmbient() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.16;

    noise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.master);
    noise.start();
  }

  setAmbientIntensity(t: number) {
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(0.1 + t * 0.18, this.ctx!.currentTime, 0.4);
    }
  }

  private blip(freq: number, duration: number, type: OscillatorType, glideTo?: number, vol = 0.3) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  pearl() {
    this.blip(880, 0.12, "sine", 1500, 0.22);
  }
  oxygen() {
    this.blip(300, 0.25, "sine", 700, 0.3);
  }
  powerup() {
    this.blip(400, 0.35, "triangle", 1100, 0.3);
  }
  hit() {
    this.blip(180, 0.3, "sawtooth", 60, 0.35);
  }
  boost() {
    this.blip(220, 0.4, "square", 900, 0.2);
  }
  surface() {
    this.blip(500, 0.6, "sine", 1800, 0.35);
  }
  click() {
    this.blip(600, 0.08, "sine", 900, 0.2);
  }
}

export const gameAudio = new GameAudio();
