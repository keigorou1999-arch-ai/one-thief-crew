// Every sound of the game, made on the spot with WebAudio oscillators and filtered noise:
// footsteps, the pickup chime, the alarm, the caught sting and the tape-rewind sweep. No audio
// files. The context starts on the first key press or click, as browsers require.

export function createSynthSounds() {
  let audio = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;

  function unlock() {
    if (audio) {
      if (audio.state === 'suspended') audio.resume();
      return;
    }
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;
    audio = new AudioContextClass();
    master = audio.createGain();
    master.gain.value = 0.5;
    master.connect(audio.destination);
    noiseBuffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < samples.length; i += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      samples[i] = seed / 0x3fffffff - 1;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    return muted;
  }

  /** One oscillator note sliding from `from` Hz to `to` Hz, fading out over `seconds`. */
  function tone(shape, from, to, seconds, volume, delay = 0) {
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  /** A burst of noise through a band-pass filter: steps, smoke, static. */
  function noise(frequency, seconds, volume, delay = 0) {
    if (!audio) return;
    const start = audio.currentTime + delay;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
    source.stop(start + seconds + 0.02);
  }

  let stepSide = 0;
  const sounds = {
    footstep() {
      stepSide = 1 - stepSide;
      noise(stepSide ? 240 : 190, 0.06, 0.25);
    },
    pickup() {
      tone('triangle', 880, 880, 0.09, 0.3);
      tone('triangle', 1320, 1320, 0.16, 0.3, 0.08);
    },
    banked() {
      [660, 880, 1100, 1320].forEach((pitch, i) => tone('square', pitch, pitch, 0.1, 0.14, i * 0.07));
    },
    vaultOpen() {
      tone('sawtooth', 90, 60, 0.5, 0.3);
      tone('triangle', 520, 1040, 0.35, 0.25, 0.25);
    },
    gate() {
      tone('square', 300, 600, 0.12, 0.12);
    },
    smoke() {
      noise(900, 0.9, 0.5);
    },
    emp() {
      tone('sawtooth', 1800, 40, 0.5, 0.3);
      noise(3000, 0.25, 0.3);
    },
    coin() {
      tone('sine', 2400, 2300, 0.25, 0.25);
      tone('sine', 3100, 3000, 0.3, 0.18, 0.09);
    },
    ghostCaught() {
      tone('square', 520, 390, 0.18, 0.2);
      tone('square', 520, 390, 0.18, 0.2, 0.22);
    },
    spotted() {
      tone('sawtooth', 220, 110, 0.7, 0.4);
      tone('square', 932, 880, 0.5, 0.2);
    },
    lockdown() {
      for (let wail = 0; wail < 4; wail += 1) tone('square', 700, 1000, 0.2, 0.22, wail * 0.22);
    },
    timeUp() {
      tone('triangle', 440, 220, 0.5, 0.3);
    },
    /** Tape running backwards: a falling whine with a flutter of static. */
    rewindSweep() {
      tone('sawtooth', 1500, 120, 1.0, 0.22);
      for (let flutter = 0; flutter < 8; flutter += 1) noise(1200 + flutter * 250, 0.06, 0.2, flutter * 0.12);
    },
    getaway() {
      tone('sawtooth', 60, 180, 1.2, 0.35);
      noise(400, 1.2, 0.3);
      [523, 659, 784, 1046].forEach((pitch, i) => tone('triangle', pitch, pitch, 0.25, 0.25, 1.0 + i * 0.12));
    },
    blown() {
      [392, 330, 262, 196].forEach((pitch, i) => tone('square', pitch, pitch, 0.3, 0.2, i * 0.25));
    },
    start() {
      tone('triangle', 330, 660, 0.2, 0.25);
    },
  };

  /** Play the sound named by a world event or a session cue, if there is one. */
  function play(name) {
    if (!muted && sounds[name]) sounds[name]();
  }

  return { unlock, toggleMute, play };
}
