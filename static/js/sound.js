// Web Audio API Synthesizer for Mechanical Keyboard Sound Effects
// Zero external files, ultra-low latency, custom switches

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.soundType = localStorage.getItem('typepulse_sound') || 'clicky'; // clicky, thock, tactile, mute
    this.volume = parseFloat(localStorage.getItem('typepulse_volume') || '0.7');
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setSoundType(type) {
    this.soundType = type;
    localStorage.setItem('typepulse_sound', type);
    if (type !== 'mute') {
      this.playKeySound('default');
    }
  }

  getSoundType() {
    return this.soundType;
  }

  playKeySound(key = 'default') {
    if (this.soundType === 'mute') return;
    if (!this.initialized) this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;

    if (this.soundType === 'clicky') {
      // Cherry MX Blue style (High-pitch mechanical snap + spring)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const isSpace = (key === ' ' || key === 'Space');
      const baseFreq = isSpace ? 800 : 1600 + Math.random() * 300;

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, t);
      osc1.frequency.exponentialRampToValueAtTime(120, t + 0.04);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc2.frequency.exponentialRampToValueAtTime(300, t + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.05);
      osc2.stop(t + 0.05);

    } else if (this.soundType === 'thock') {
      // Lubed Linear / Box Navy deep thock
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const isSpace = (key === ' ' || key === 'Space');
      const baseFreq = isSpace ? 180 : 320 + Math.random() * 50;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.07);

    } else if (this.soundType === 'tactile') {
      // Subtle tactile bump
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 + Math.random() * 100, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

      gain.gain.setValueAtTime(this.volume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  playErrorSound() {
    if (this.soundType === 'mute') return;
    if (!this.initialized) this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playVictoryChord() {
    if (this.soundType === 'mute') return;
    if (!this.initialized) this.init();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const t = this.audioCtx.currentTime + (index * 0.08);
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}

window.soundManager = new SoundManager();
