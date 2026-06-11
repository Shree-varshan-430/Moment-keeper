// ─── Web Audio API Dynamic Sound Synthesizer Service ──────────

class AudioService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported in this environment');
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSatinBell() {
    this.initCtx();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 Crystal note

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now); // E6 Harmonic chime

    gainNode.gain.setValueAtTime(0.65, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }

  playLuxuryChime() {
    this.initCtx();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5 Warm note
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // Slide up to E5

    gainNode.gain.setValueAtTime(0.75, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  playDigitalAlert() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    const playBeep = (time: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, time); // B5 double beep

      gainNode.gain.setValueAtTime(0.45, time);
      gainNode.gain.setValueAtTime(0.45, time + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.12);
    };

    playBeep(now);
    playBeep(now + 0.15);
  }

  private playSequence(melody: Array<{ freq: number; time: number; dur: number; type?: OscillatorType }>) {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    melody.forEach((note) => {
      if (!this.ctx) return;
      const playTime = now + note.time;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, playTime);

      gainNode.gain.setValueAtTime(0.001, playTime);
      gainNode.gain.linearRampToValueAtTime(0.45, playTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + note.dur);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(playTime);
      osc.stop(playTime + note.dur);
    });
  }

  playBirthdaySong() {
    // Happy Birthday to You: G4, G4, A4, G4, C5, B4 (first phrase) -> G4, G4, A4, G4, D5, C5 (second phrase)
    const melody = [
      { freq: 392.00, time: 0.0, dur: 0.25 },  // G4
      { freq: 392.00, time: 0.22, dur: 0.25 }, // G4
      { freq: 440.00, time: 0.44, dur: 0.4 },  // A4
      { freq: 392.00, time: 0.88, dur: 0.4 },  // G4
      { freq: 523.25, time: 1.32, dur: 0.4 },  // C5
      { freq: 493.88, time: 1.76, dur: 0.8 },  // B4

      { freq: 392.00, time: 2.70, dur: 0.25 }, // G4
      { freq: 392.00, time: 2.92, dur: 0.25 }, // G4
      { freq: 440.00, time: 3.14, dur: 0.4 },  // A4
      { freq: 392.00, time: 3.58, dur: 0.4 },  // G4
      { freq: 587.33, time: 4.02, dur: 0.4 },  // D5
      { freq: 523.25, time: 4.46, dur: 0.8 },  // C5
    ];
    this.playSequence(melody.map(m => ({ ...m, type: 'triangle' })));
  }

  playWeddingMarch() {
    // Triumphant Wedding/Anniversary theme
    const melody = [
      { freq: 261.63, time: 0.0, dur: 0.4 },   // C4
      { freq: 349.23, time: 0.45, dur: 0.4 },  // F4
      { freq: 349.23, time: 0.9, dur: 0.25 },  // F4
      { freq: 349.23, time: 1.15, dur: 0.6 },  // F4

      { freq: 261.63, time: 1.9, dur: 0.4 },   // C4
      { freq: 392.00, time: 2.35, dur: 0.4 },  // G4
      { freq: 329.63, time: 2.8, dur: 0.25 },  // E4
      { freq: 349.23, time: 3.05, dur: 0.8 },  // F4
    ];
    this.playSequence(melody.map(m => ({ ...m, type: 'sine' })));
  }

  playFestiveTheme() {
    // Upbeat Holiday / Family gathering chime
    const melody = [
      { freq: 659.25, time: 0.0, dur: 0.2 },   // E5
      { freq: 659.25, time: 0.25, dur: 0.2 },  // E5
      { freq: 659.25, time: 0.5, dur: 0.4 },   // E5

      { freq: 659.25, time: 1.0, dur: 0.2 },   // E5
      { freq: 659.25, time: 1.25, dur: 0.2 },  // E5
      { freq: 659.25, time: 1.5, dur: 0.4 },   // E5

      { freq: 659.25, time: 2.0, dur: 0.22 },  // E5
      { freq: 783.99, time: 2.22, dur: 0.22 },  // G5
      { freq: 523.25, time: 2.44, dur: 0.3 },   // C5
      { freq: 587.33, time: 2.74, dur: 0.18 },  // D5
      { freq: 659.25, time: 2.92, dur: 0.8 },   // E5
    ];
    this.playSequence(melody.map(m => ({ ...m, type: 'triangle' })));
  }

  playCelebrationFanfare() {
    const melody = [
      { freq: 523.25, time: 0.0, dur: 0.3 },   // C5
      { freq: 659.25, time: 0.08, dur: 0.3 },  // E5
      { freq: 783.99, time: 0.16, dur: 0.3 },  // G5
      { freq: 1046.50, time: 0.24, dur: 0.35 }, // C6
      { freq: 1318.51, time: 0.32, dur: 0.4 },  // E6
      { freq: 1567.98, time: 0.40, dur: 0.5 },  // G6
      { freq: 2093.00, time: 0.48, dur: 1.0 },  // C7
    ];
    this.playSequence(melody);
  }

  playCategorySound(category: string) {
    switch (category) {
      case 'birthday':
        this.playBirthdaySong();
        break;
      case 'anniversary':
      case 'wedding':
        this.playWeddingMarch();
        break;
      case 'holiday':
      case 'family':
      case 'personal':
        this.playFestiveTheme();
        break;
      default:
        this.playCelebrationFanfare();
        break;
    }
  }

  playSound(type: 'bell' | 'chime' | 'digital' | 'celebration') {
    switch (type) {
      case 'bell':
        this.playSatinBell();
        break;
      case 'chime':
        this.playLuxuryChime();
        break;
      case 'digital':
        this.playDigitalAlert();
        break;
      case 'celebration':
        this.playCelebrationFanfare();
        break;
    }
  }
}

export const audioService = new AudioService();
export default audioService;
