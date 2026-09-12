import { VoiceSettings } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isRecognizing: boolean = false;
  private purrOsc: OscillatorNode | null = null;
  private purrGain: GainNode | null = null;

  public initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
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

  // Cute chirp / greeting meow synth
  public playGreetingMeow(): void {
    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Pitch slide up and then down slightly (characteristic feline chirp)
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Meow audio error:', e);
    }
  }

  // Voice speech synthesis with pitch/modulation control and syllable/lip-sync triggers
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
    if (!('speechSynthesis' in window)) {
      callbacks.onEnd?.();
      return;
    }

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

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Apply voice modulation parameters based on tone
    let calculatedPitch = settings.pitch;
    if (settings.tone === 'warm') {
      calculatedPitch = 1.12; // warm, friendly companion
    } else if (settings.tone === 'playful') {
      calculatedPitch = 1.28; // animated, bright, cute
    } else if (settings.tone === 'mentor') {
      calculatedPitch = 0.98; // gentle, reassuring, thoughtful
    } else if (settings.tone === 'natural') {
      calculatedPitch = 1.05; // natural balanced tone
    }

    utterance.pitch = Math.max(0.7, Math.min(1.8, calculatedPitch));
    utterance.rate = Math.max(0.8, Math.min(1.4, settings.rate));

    // Choose preferred voice if available
    const voices = window.speechSynthesis.getVoices();
    if (settings.voiceName) {
      const selected = voices.find((v) => v.name === settings.voiceName);
      if (selected) utterance.voice = selected;
    } else if (voices.length > 0) {
      // Pick a friendly English voice by default
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Alex') ||
            v.name.includes('Karen'))
      );
      if (preferred) utterance.voice = preferred;
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
      console.warn('TTS error:', e);
      this.currentUtterance = null;
      callbacks.onError?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
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

      this.recognition.onstart = () => {
        this.isRecognizing = true;
        onStateChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
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
