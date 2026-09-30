// High-Impact Web Audio Aerospace Telemetry Engine
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. Crisp UI Telemetry Chirp (Focus / Click)
  public playSelect() {
    if (!this.enabled) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 2. Camera Reset Sweep
  public playReset() {
    if (!this.enabled) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 3. HARD DUAL-BURST EMERGENCY KLAXON (TCAS Collision Warning)
  public playAlarm() {
    if (!this.enabled) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Helper to fire a sharp, piercing military pulse
    const triggerTonePulse = (startTime: number, duration: number, freq1: number, freq2: number) => {
      // Primary High-Cut Tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq1, startTime);

      gain1.gain.setValueAtTime(0.65, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Harmonized Secondary Staccato (Adds sharpness without muddying)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq2, startTime);

      gain2.gain.setValueAtTime(0.45, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    // Burst 1 (High alarm chirp)
    triggerTonePulse(now, 0.13, 1050, 1575);

    // Burst 2 (Echo staccato 140ms later - classic defense alert cadence)
    triggerTonePulse(now + 0.14, 0.16, 880, 1320);
  }
}

export const soundFX = new SoundController();