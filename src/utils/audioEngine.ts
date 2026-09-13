import { VoiceSettings } from '../types';
import {
  REAL_CAT_MEOW_BASE64,
  REAL_HIT_SOUND_BASE64,
  REAL_STOMACH_LOVE_BASE64,
} from './catSoundData';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentPcmSource: AudioBufferSourceNode | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private recognition: any = null;
  private isRecognizing: boolean = false;
  private purrOsc: OscillatorNode | null = null;
  private purrGain: GainNode | null = null;
  private realMeowBuffer: AudioBuffer | null = null;
  private realHitBuffer: AudioBuffer | null = null;
  private realStomachLoveBuffer: AudioBuffer | null = null;
  private isDecodingMeow: boolean = false;
  private isDecodingHit: boolean = false;
  private isDecodingStomach: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      // Preload real sound audio buffers into memory
      this.loadRealMeowAudio().catch(() => {});
      this.loadRealHitAudio().catch(() => {});
      this.loadRealStomachLoveAudio().catch(() => {});
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pre-decodes audio buffer from base64 data URI or fallback URL
  private async decodeBase64Audio(
    base64DataUri: string,
    fallbackUrl?: string
  ): Promise<AudioBuffer | null> {
    try {
      const ctx = this.initAudioContext();
      let arrayBuffer: ArrayBuffer | null = null;

      if (base64DataUri) {
        try {
          const parts = base64DataUri.split(',');
          const base64Str = parts[1] || parts[0];
          const binaryStr = atob(base64Str);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } catch (e) {
          console.warn('Base64 decode fallback:', e);
        }
      }

      if (!arrayBuffer && fallbackUrl && typeof window !== 'undefined') {
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          arrayBuffer = await res.arrayBuffer();
        }
      }

      if (arrayBuffer && ctx) {
        return await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(
            arrayBuffer!,
            (buf) => resolve(buf),
            (err) => reject(err)
          );
        });
      }
      return null;
    } catch (e) {
      console.warn('decodeBase64Audio error:', e);
      return null;
    }
  }

  // Pre-decodes the real domestic cat meow audio (embedded base64 + /sounds/meow.mp3)
  public async loadRealMeowAudio(): Promise<AudioBuffer | null> {
    if (this.realMeowBuffer) return this.realMeowBuffer;
    if (this.isDecodingMeow) return null;
    this.isDecodingMeow = true;
    try {
      this.realMeowBuffer = await this.decodeBase64Audio(REAL_CAT_MEOW_BASE64, '/sounds/meow.mp3');
      return this.realMeowBuffer;
    } finally {
      this.isDecodingMeow = false;
    }
  }

  // Pre-decodes the user's hit sound (embedded base64 + /sounds/hit.mp3)
  public async loadRealHitAudio(): Promise<AudioBuffer | null> {
    if (this.realHitBuffer) return this.realHitBuffer;
    if (this.isDecodingHit) return null;
    this.isDecodingHit = true;
    try {
      this.realHitBuffer = await this.decodeBase64Audio(REAL_HIT_SOUND_BASE64, '/sounds/hit.mp3');
      return this.realHitBuffer;
    } finally {
      this.isDecodingHit = false;
    }
  }

  // Pre-decodes the user's stomach love sound (embedded base64 + /sounds/stomach_love.mp3)
  public async loadRealStomachLoveAudio(): Promise<AudioBuffer | null> {
    if (this.realStomachLoveBuffer) return this.realStomachLoveBuffer;
    if (this.isDecodingStomach) return null;
    this.isDecodingStomach = true;
    try {
      this.realStomachLoveBuffer = await this.decodeBase64Audio(
        REAL_STOMACH_LOVE_BASE64,
        '/sounds/stomach_love.mp3'
      );
      return this.realStomachLoveBuffer;
    } finally {
      this.isDecodingStomach = false;
    }
  }

  // Realistic cat purring synthesizer using Web Audio API
  public startPurring(): void {
    try {
      const ctx = this.initAudioContext();
      if (this.purrGain) return; // already purring

      // Base low-frequency purr drone (~26Hz vibratory feel)
      const carrier = ctx.createOscillator();
      carrier.type = 'triangle';
      carrier.frequency.setValueAtTime(26, ctx.currentTime);

      // Lowpass filter to muffle it like a soft feline throat vibration
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      // Tremolo / rhythmic modulation
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(24, ctx.currentTime);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(0.4, ctx.currentTime);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.001, ctx.currentTime);
      mainGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.3);

      mod.connect(modGain);
      modGain.connect(mainGain.gain);

      carrier.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      carrier.start();
      mod.start();

      this.purrOsc = carrier;
      this.purrGain = mainGain;
    } catch (e) {
      console.warn('Purr audio not available:', e);
    }
  }

  public stopPurring(): void {
    if (this.purrGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.purrGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => {
          if (this.purrOsc) {
            this.purrOsc.stop();
            this.purrOsc.disconnect();
            this.purrOsc = null;
          }
          if (this.purrGain) {
            this.purrGain.disconnect();
            this.purrGain = null;
          }
        }, 350);
      } catch (e) {
        this.purrGain = null;
        this.purrOsc = null;
      }
    }
  }

  // Playful chime sound for high-fives and treats
  public playChime(type: 'high_five' | 'treat' | 'sparkle' = 'sparkle'): void {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      const notes =
        type === 'high_five'
          ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
          : type === 'treat'
          ? [440, 554.37, 659.25, 880]       // A4, C#5, E5, A5
          : [587.33, 739.99, 880, 1174.66];  // D5, F#5, A5, D6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Authentic feline meow vocalization for ambient idle actions using the real cat audio recording
  public async playKittenMeowMeow(onMouthProgress?: (mouthOpen: number) => void): Promise<void> {
    try {
      if (this.isSpeaking()) return;

      const meowDurationSec = 1.05;

      // 1. Animate mouth opening in sync with the authentic cat meow envelope
      if (onMouthProgress) {
        const startMs = performance.now();
        const animStep = () => {
          const elapsedSec = (performance.now() - startMs) / 1000;
          let mouthVal = 0;
          if (elapsedSec >= 0 && elapsedSec < meowDurationSec) {
            // Smooth natural opening during vowel peak and gentle close
            const p = elapsedSec / meowDurationSec;
            mouthVal = Math.sin(p * Math.PI) * 0.38;
          }

          onMouthProgress(mouthVal);

          if (elapsedSec < meowDurationSec + 0.08) {
            requestAnimationFrame(animStep);
          } else {
            onMouthProgress(0);
          }
        };
        requestAnimationFrame(animStep);
      }

      // 2. Play the exact real cat meow recording
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      let played = false;
      const buffer = await this.loadRealMeowAudio();
      if (buffer && ctx) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        played = true;
      }

      // Fallback to HTMLAudioElement if WebAudio decode failed
      if (!played && typeof window !== 'undefined') {
        try {
          const audio = new Audio(REAL_CAT_MEOW_BASE64);
          audio.volume = 1.0;
          await audio.play();
          played = true;
        } catch {
          this.playAcousticCatMeow();
        }
      }
    } catch (e) {
      console.warn('Real cat meow audio playback error:', e);
    }
  }

  // Play user-specified hit sound when Tom gets hit (double tap on face)
  public async playHitSound(): Promise<void> {
    try {
      this.stopSpeaking();
      this.stopSpeechRecognition();

      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      let played = false;
      const buffer = await this.loadRealHitAudio();
      if (buffer && ctx) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        played = true;
      }

      if (!played && typeof window !== 'undefined') {
        try {
          const audio = new Audio(REAL_HIT_SOUND_BASE64);
          audio.volume = 1.0;
          await audio.play();
          played = true;
        } catch {
          this.playHiss();
        }
      }
    } catch (e) {
      console.warn('Hit audio playback error:', e);
      this.playHiss();
    }
  }

  // Play user-specified sound when user loves Tom by double-tapping his stomach
  public async playStomachLoveSound(): Promise<void> {
    try {
      this.stopSpeaking();
      this.stopSpeechRecognition();

      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      let played = false;
      const buffer = await this.loadRealStomachLoveAudio();
      if (buffer && ctx) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        played = true;
      }

      if (!played && typeof window !== 'undefined') {
        try {
          const audio = new Audio(REAL_STOMACH_LOVE_BASE64);
          audio.volume = 1.0;
          await audio.play();
          played = true;
        } catch {
          this.playChime('sparkle');
        }
      }
    } catch (e) {
      console.warn('Stomach love audio playback error:', e);
      this.playChime('sparkle');
    }
  }

  // Authentic procedural multi-formant feline acoustic meow
  public playAcousticCatMeow(): void {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // Harmonic glottal pulse wave simulating feline vocal cords
      const numHarmonics = 14;
      const real = new Float32Array(numHarmonics);
      const imag = new Float32Array(numHarmonics);
      for (let i = 1; i < numHarmonics; i++) {
        imag[i] = (1 / Math.pow(i, 1.15)) * (i % 2 === 1 ? 1.0 : 0.72);
      }
      const glottalWave = ctx.createPeriodicWave(real, imag);

      const playSingleFelineMeow = (
        startTime: number,
        basePitch: number,
        peakPitch: number,
        endPitch: number,
        duration: number
      ) => {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(glottalWave);

        // Pitch contour: starts with soft nasal /m/ (0.08s) -> wide open /ja/ (0.24s) -> rounded /u/ (0.16s)
        osc.frequency.setValueAtTime(basePitch, startTime);
        osc.frequency.exponentialRampToValueAtTime(peakPitch, startTime + duration * 0.38);
        osc.frequency.exponentialRampToValueAtTime(endPitch, startTime + duration);

        // Formant 1: Mouth cavity expansion (sweeps 320Hz -> 860Hz -> 440Hz)
        const f1 = ctx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.Q.setValueAtTime(3.8, startTime);
        f1.frequency.setValueAtTime(320, startTime);
        f1.frequency.exponentialRampToValueAtTime(860, startTime + duration * 0.38);
        f1.frequency.exponentialRampToValueAtTime(440, startTime + duration);

        // Formant 2: Oral tract vowel resonance (sweeps 1100Hz -> 2200Hz -> 920Hz)
        const f2 = ctx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.Q.setValueAtTime(4.6, startTime);
        f2.frequency.setValueAtTime(1100, startTime);
        f2.frequency.exponentialRampToValueAtTime(2200, startTime + duration * 0.38);
        f2.frequency.exponentialRampToValueAtTime(920, startTime + duration);

        // Formant 3: Resonant kitten head/nasal presence (3200Hz)
        const f3 = ctx.createBiquadFilter();
        f3.type = 'bandpass';
        f3.Q.setValueAtTime(5.2, startTime);
        f3.frequency.setValueAtTime(3200, startTime);

        // 26 Hz LFO for feline larynx purr tremolo flutter
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(26, startTime);
        lfoGain.gain.setValueAtTime(0.18, startTime);

        // Amplitude envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.24, startTime + duration * 0.16);
        gain.gain.setValueAtTime(0.22, startTime + duration * 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        // Mix formants
        osc.connect(f1);
        osc.connect(f2);
        osc.connect(f3);

        const formantMix = ctx.createGain();
        f1.connect(formantMix);
        f2.connect(formantMix);
        f3.connect(formantMix);

        // Apply LFO flutter to tremolo gain
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 1.0;
        lfo.connect(lfoGain);
        lfoGain.connect(tremoloGain.gain);

        formantMix.connect(tremoloGain);
        tremoloGain.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        lfo.start(startTime);
        osc.stop(startTime + duration + 0.05);
        lfo.stop(startTime + duration + 0.05);
      };

      // First meow: "Mee-ooww"
      playSingleFelineMeow(now, 380, 720, 480, 0.46);
      // Second answering cute kitten meow: "Meooww~"
      playSingleFelineMeow(now + 0.56, 440, 830, 540, 0.42);
    } catch (e) {
      console.warn('Acoustic cat meow error:', e);
    }
  }

  // Cute greeting meow using real cat audio
  public playGreetingMeow(): void {
    try {
      this.playKittenMeowMeow();
    } catch (e) {
      console.warn('Greeting meow error:', e);
    }
  }

  // Cute kitten grumpy hiss / puff sound
  public playHiss(): void {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // Soft filtered breath noise
      const bufferSize = Math.floor(ctx.sampleRate * 0.32);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.32);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.33);

      // Low grumpy purr undertone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.32);

      const oscFilter = ctx.createBiquadFilter();
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(180, now);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.33);
    } catch (e) {
      console.warn('Hiss audio error:', e);
    }
  }

  // Retrieve the best non-robotic, natural human-like voice available in the browser
  public getBestNaturalVoice(customVoiceName?: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    if (customVoiceName) {
      const match = voices.find((v) => v.name.toLowerCase() === customVoiceName.toLowerCase());
      if (match) return match;
    }

    // Filter out robotic, dry or synthetic engines
    const isHumanLike = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      return (
        !name.includes('espeak') &&
        !name.includes('mbrola') &&
        !name.includes('klatt') &&
        !name.includes('robot') &&
        !name.includes('whisper') &&
        !name.includes('croak')
      );
    };

    const englishVoices = voices.filter((v) => v.lang.startsWith('en') && isHumanLike(v));

    // Priority hierarchy for cute, melodic, expressive kitten timbre
    const priorityKeywords = [
      'google uk english female',
      'google us english',
      'samantha',
      'victoria',
      'jenny',
      'tessa',
      'fiona',
      'karen',
      'aria',
      'natural',
      'daniel',
    ];

    for (const keyword of priorityKeywords) {
      const found = englishVoices.find((v) => v.name.toLowerCase().includes(keyword));
      if (found) return found;
    }

    return englishVoices[0] || voices.find(isHumanLike) || voices[0] || null;
  }

  // Play studio-quality PCM 24kHz audio from Gemini AI TTS
  public playPcmAudio(
    base64Data: string,
    options?: {
      sampleRate?: number;
      playbackRate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): void {
    try {
      this.stopSpeaking();
      const ctx = this.initAudioContext();

      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const sampleRate = options?.sampleRate || 24000;
      const audioBuffer = ctx.createBuffer(1, int16.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Slight pitch boost (1.10x) for youthful Talking Tom character tone
      source.playbackRate.value = options?.playbackRate ?? 1.10;

      // Subtle vocal formant EQ filter for crisp, vibrant cartoon feline presence
      const eqFilter = ctx.createBiquadFilter();
      eqFilter.type = 'peaking';
      eqFilter.frequency.value = 3200;
      eqFilter.gain.value = 2.0;

      source.connect(eqFilter);
      eqFilter.connect(ctx.destination);

      this.currentPcmSource = source;

      source.onended = () => {
        if (this.currentPcmSource === source) {
          this.currentPcmSource = null;
        }
        options?.onEnd?.();
      };

      source.start(0);
      options?.onStart?.();
    } catch (err) {
      console.warn('Failed to play PCM audio:', err);
      this.currentPcmSource = null;
      options?.onError?.();
    }
  }

  // Voice speech synthesis with cute kitten pitch modulation and syllable/lip-sync triggers
  public speak(
    text: string,
    settings: VoiceSettings,
    callbacks: {
      onStart?: () => void;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): void {
    this.stopSpeaking();

    // Clean text of emotion tags or asterisks
    const cleanText = text
      .replace(/\[EMOTION:[^\]]+\]/gi, '')
      .replace(/\*[^*]+\*/g, '')
      .trim();

    if (!cleanText) {
      callbacks.onEnd?.();
      return;
    }

    this.speakViaSpeechSynthesis(cleanText, settings, callbacks);
  }

  // SpeechSynthesis implementation with sweet, non-robotic cute kitten acoustics
  private speakViaSpeechSynthesis(
    cleanText: string,
    settings: VoiceSettings,
    callbacks: {
      onStart?: () => void;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): void {
    if (!('speechSynthesis' in window)) {
      callbacks.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Sweet, playful cute kitten voice tuning (high-pitched, charming, non-robotic)
    utterance.pitch = 1.62;
    utterance.rate = 1.12;

    // Intelligently select high-fidelity natural voice, avoiding robotic defaults
    const bestVoice = this.getBestNaturalVoice(settings.voiceName);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      callbacks.onStart?.();
    };

    utterance.onboundary = (event) => {
      callbacks.onBoundary?.(event.charIndex);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('TTS utterance error:', e);
      this.currentUtterance = null;
      callbacks.onError?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.currentPcmSource) {
      try {
        this.currentPcmSource.stop();
        this.currentPcmSource.disconnect();
      } catch (e) {}
      this.currentPcmSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    const isPcmPlaying = this.currentPcmSource !== null;
    const isSynthSpeaking = 'speechSynthesis' in window && window.speechSynthesis.speaking;
    return isPcmPlaying || isSynthSpeaking;
  }

  // Request microphone permission explicitly via getUserMedia
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return true;
    } catch (err) {
      console.warn('Microphone permission request rejected:', err);
      return false;
    }
  }

  // Voice recognition (Speech-to-Text)
  public startSpeechRecognition(
    onResult: (transcript: string) => void,
    onStateChange: (listening: boolean) => void,
    onError: (err: string) => void
  ): boolean {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      onError('Speech recognition is not supported in this browser.');
      return false;
    }

    if (this.isRecognizing) {
      this.stopSpeechRecognition();
      return false;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      let latestTranscript = '';
      let hasSubmitted = false;

      this.recognition.onstart = () => {
        this.isRecognizing = true;
        latestTranscript = '';
        hasSubmitted = false;
        onStateChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const text = (finalTranscript || interimTranscript).trim();
        if (text) {
          latestTranscript = text;
        }
        if (finalTranscript && !hasSubmitted) {
          hasSubmitted = true;
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isRecognizing = false;
        onStateChange(false);
        if (event.error !== 'no-speech') {
          onError(event.error);
        }
      };

      this.recognition.onend = () => {
        if (!hasSubmitted && latestTranscript) {
          hasSubmitted = true;
          onResult(latestTranscript);
        }
        this.isRecognizing = false;
        onStateChange(false);
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('Failed to start recognition:', err);
      this.isRecognizing = false;
      onStateChange(false);
      onError(err?.message || 'Failed to start microphone');
      return false;
    }
  }

  public stopSpeechRecognition(): void {
    if (this.recognition && this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isRecognizing = false;
    }
  }
}

export const audioEngine = new AudioEngine();
