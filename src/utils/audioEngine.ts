/**
 * Web Audio API Synth & Spatialization Engine
 * BLE MIDI support + Procedural Neural Modulation Scripts
 */

interface LocalMidiAccess {
  inputs: {
    values: () => IterableIterator<{
      onmidimessage: ((event: { data: Uint8Array }) => void) | null;
    }>;
  };
}

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pannerNodes: Map<string, PannerNode> = new Map();
  private activeVoices: Map<number, { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode }> = new Map();
  private midiAccess: LocalMidiAccess | null = null;
  private isMidiListening = false;
  private midiListeners: ((note: number, velocity: number, isDown: boolean) => void)[] = [];
  private proximityListener: ((intensity: number, beaconId: string) => void) | null = null;

  // Neural modulation script state
  public neuralScriptEnabled = true;
  public modulationRate = 1.2; // Hz
  public modulationDepth = 250; // Filter cutoff swing
  public baseFilterCutoff = 1200; // Hz
  public synthType: OscillatorType = 'sawtooth';
  public currentLightingHue = 180; // 0-360 degrees for environmental sync

  // Spatial Audio Synthesis & Stereo Width settings
  public spatialAudioEnabled = true;
  public emergencyAlertsSpatialAudio = true;
  public trailCamFeedsSpatialAudio = true;
  public stereoWidth = 1.0; // 0.0 (Mono) to 2.0 (Ultra-Wide Surround)

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Updates 3D audio listener position in space
   */
  public updateListenerPosition(x: number, y: number, z: number, forwardX = 0, forwardY = 0, forwardZ = -1) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(x, this.ctx.currentTime, 0.05);
      listener.positionY.setTargetAtTime(y, this.ctx.currentTime, 0.05);
      listener.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.05);
      listener.forwardX.setTargetAtTime(forwardX, this.ctx.currentTime, 0.05);
      listener.forwardY.setTargetAtTime(forwardY, this.ctx.currentTime, 0.05);
      listener.forwardZ.setTargetAtTime(forwardZ, this.ctx.currentTime, 0.05);
    } else {
      listener.setOrientation(forwardX, forwardY, forwardZ, 0, 1, 0);
      listener.setPosition(x, y, z);
    }
  }

  /**
   * Plays a polyphonic synthesized note with 3D spatial panning
   */
  public playNote(noteNumber: number, velocity: number = 0.8, panX = 0, panY = 0, panZ = 0) {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    // Convert MIDI note number to frequency (A4 = 69 = 440Hz)
    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);

    // Stop existing note if already playing
    this.stopNote(noteNumber);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Calculate spatial coordinates respecting master toggle and stereo width
    const effectivePanX = this.spatialAudioEnabled ? panX * this.stereoWidth : 0;
    const effectivePanY = this.spatialAudioEnabled ? panY : 0;
    const effectivePanZ = this.spatialAudioEnabled ? panZ : 0;

    // HRTF Spatial Panner
    let panner: PannerNode;
    try {
      panner = new PannerNode(this.ctx, {
        panningModel: 'HRTF',
        distanceModel: 'inverse',
        refDistance: 1,
        maxDistance: 100,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        positionX: effectivePanX,
        positionY: effectivePanY,
        positionZ: effectivePanZ,
      });
    } catch {
      panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.setPosition(effectivePanX, effectivePanY, effectivePanZ);
    }

    osc.type = this.synthType;
    osc.frequency.setValueAtTime(freq, now);

    // Filter configuration
    filter.type = 'lowpass';
    const computedCutoff = this.neuralScriptEnabled
      ? this.baseFilterCutoff + Math.sin(now * this.modulationRate * Math.PI * 2) * this.modulationDepth
      : this.baseFilterCutoff;
    filter.frequency.setValueAtTime(Math.max(100, computedCutoff), now);
    filter.Q.setValueAtTime(4.0, now);

    // ADSR Envelope
    const attack = 0.03;
    const decay = 0.15;
    const sustain = velocity * 0.6;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(velocity, now + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustain), now + attack + decay);

    // Patch network: Osc -> Filter -> Gain -> Panner -> Master
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    osc.start(now);
    this.activeVoices.set(noteNumber, { osc, gain, filter });

    // Broadcast note trigger
    this.notifyMidiListeners(noteNumber, velocity, true);
  }

  /**
   * Releases a note with smooth release curve
   */
  public stopNote(noteNumber: number) {
    const voice = this.activeVoices.get(noteNumber);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const releaseTime = 0.35;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    voice.osc.stop(now + releaseTime);
    setTimeout(() => {
      try {
        voice.osc.disconnect();
        voice.gain.disconnect();
        voice.filter.disconnect();
      } catch {
        // Ignored
      }
    }, (releaseTime + 0.1) * 1000);

    this.activeVoices.delete(noteNumber);
    this.notifyMidiListeners(noteNumber, 0, false);
  }

  /**
   * Neural script modulation based on telemetry (latency or wind/pressure)
   */
  public modulateFromTelemetry(latencyMs: number, windSpeed: number) {
    this.modulationRate = 0.5 + Math.min(6, latencyMs / 50);
    this.modulationDepth = 150 + Math.min(800, windSpeed * 15);
    this.currentLightingHue = (180 + latencyMs * 2) % 360;
  }

  /**
   * Trigger proximity audio chime & environmental lighting sync
   */
  public triggerBeaconProximity(beaconId: string, distanceMeters: number) {
    if (!this.ctx) return;
    const intensity = Math.max(0, Math.min(1, 1 - distanceMeters / 30));
    if (this.proximityListener) {
      this.proximityListener(intensity, beaconId);
    }
  }

  public setProximityListener(fn: (intensity: number, beaconId: string) => void) {
    this.proximityListener = fn;
  }

  /**
   * Spatial Audio synthesis for Emergency Alerts
   */
  public playEmergencySpatialBeacon(alertType: string = 'warning', angleDeg: number = 35) {
    if (!this.spatialAudioEnabled || !this.emergencyAlertsSpatialAudio) {
      this.playNote(74, 0.75, 0, 0, 0);
      return;
    }
    const rad = (angleDeg * Math.PI) / 180;
    const panX = Math.sin(rad) * 12;
    const panZ = -Math.cos(rad) * 12;

    // Rich dual-tone spatial siren beacon
    this.playNote(70, 0.8, panX, 2, panZ);
    setTimeout(() => {
      this.playNote(77, 0.9, panX, 2.5, panZ);
    }, 120);
    setTimeout(() => {
      this.playNote(82, 0.7, panX, 3, panZ);
    }, 240);
  }

  /**
   * Spatial Audio synthesis for Trail Cam Environmental Feeds
   */
  public playTrailCamSpatialAmbience(camName: string = 'Sierra Sentinel', angleDeg: number = -55) {
    if (!this.spatialAudioEnabled || !this.trailCamFeedsSpatialAudio) {
      this.playNote(64, 0.5, 0, 0, 0);
      return;
    }
    const rad = (angleDeg * Math.PI) / 180;
    const panX = Math.sin(rad) * 16;
    const panZ = -Math.cos(rad) * 16;

    // Organic forest/highland ambient acoustic chime with spatial dispersion
    this.playNote(64, 0.5, panX * 0.8, 1, panZ);
    setTimeout(() => {
      this.playNote(69, 0.6, panX, 1.5, panZ);
    }, 160);
    setTimeout(() => {
      this.playNote(76, 0.55, panX * 1.2, 2, panZ);
    }, 320);
  }

  /**
   * BLE MIDI connection setup
   */
  public async requestMidi(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      try {
        this.midiAccess = await (navigator as unknown as { requestMIDIAccess: (opts?: { sysex?: boolean }) => Promise<LocalMidiAccess> }).requestMIDIAccess({ sysex: false });
        this.isMidiListening = true;
        this.setupMidiInputs();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  private setupMidiInputs() {
    if (!this.midiAccess) return;
    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      input.onmidimessage = (event: { data: Uint8Array }) => {
        const [status, note, velocity] = event.data;
        const command = status >> 4;
        if (command === 9) {
          if (velocity > 0) {
            this.playNote(note, velocity / 127);
          } else {
            this.stopNote(note);
          }
        } else if (command === 8) {
          this.stopNote(note);
        }
      };
    }
  }

  public onMidi(fn: (note: number, velocity: number, isDown: boolean) => void) {
    this.midiListeners.push(fn);
    return () => {
      this.midiListeners = this.midiListeners.filter((l) => l !== fn);
    };
  }

  private notifyMidiListeners(note: number, velocity: number, isDown: boolean) {
    for (const fn of this.midiListeners) {
      fn(note, velocity, isDown);
    }
  }
}

export const audioEngine = new SpatialAudioEngine();
