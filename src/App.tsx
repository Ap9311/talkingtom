import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar3D } from './components/Avatar3D';
import { EnvironmentView } from './components/EnvironmentView';
import { InteractionBar } from './components/InteractionBar';
import { audioEngine } from './utils/audioEngine';
import { EmotionType, VoiceSettings, EnvironmentTheme } from './types';
import { Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');

  // Lightweight conversation history for AI context memory without any text chat display
  const conversationHistoryRef = useRef<{ sender: string; text: string }[]>([]);

  const [voiceSettings] = useState<VoiceSettings>({
    pitch: 1.12,
    rate: 1.02,
    voiceName: '',
    tone: 'warm',
    autoSpeak: true,
  });

  const [environmentTheme] = useState<EnvironmentTheme>('negs-official');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isEmotionBusy, setIsEmotionBusy] = useState<boolean>(false);

  // Play voice speech helper - strictly suppresses speech if avatar is in blushing/angry emotional state
  const speakText = useCallback(
    (text: string) => {
      if (soundMuted || !voiceSettings.autoSpeak || isEmotionBusy) return;
      audioEngine.speak(text, voiceSettings, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [soundMuted, voiceSettings, isEmotionBusy]
  );

  // Callback when avatar enters/leaves busy emotion state (blush / angry)
  const handleEmotionBusy = useCallback((busy: boolean) => {
    setIsEmotionBusy(busy);
    if (busy) {
      audioEngine.stopSpeaking();
      audioEngine.stopSpeechRecognition();
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, []);

  // Submit chat message to server-side Gemini API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isThinking || isSpeaking || isEmotionBusy) return;

    audioEngine.initAudioContext();
    setInputText('');

    conversationHistoryRef.current.push({ sender: 'user', text: textToSend });
    if (conversationHistoryRef.current.length > 6) {
      conversationHistoryRef.current = conversationHistoryRef.current.slice(-6);
    }

    setIsThinking(true);
    setEmotion('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: conversationHistoryRef.current,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await res.json();
      const replyText = data.cleanReply || data.fallbackReply || "I'm right here with you, my friend.";
      const newEmotion: EmotionType = (data.emotion as EmotionType) || 'happy';

      setEmotion(newEmotion);
      conversationHistoryRef.current.push({ sender: 'tom', text: replyText });

      // Speak with modulated voice
      speakText(replyText);
    } catch (err) {
      console.warn('Chat error:', err);
      const fallback = "I'm right here beside you. Whenever you want to chat, I'm all ears!";
      setEmotion('comforting');
      speakText(fallback);
    } finally {
      setIsThinking(false);
    }
  };

  // Toggle voice recognition (Speech-to-Text)
  const handleToggleMic = () => {
    if (isEmotionBusy) return;
    audioEngine.initAudioContext();
    if (isListening) {
      audioEngine.stopSpeechRecognition();
      setIsListening(false);
      setEmotion('idle');
    } else {
      audioEngine.stopSpeaking();
      setIsSpeaking(false);
      setEmotion('listening');

      audioEngine.startSpeechRecognition(
        (transcript) => {
          if (transcript) {
            handleSendMessage(transcript);
          }
        },
        (listening) => {
          setIsListening(listening);
          if (!listening && !isThinking) {
            setEmotion('idle');
          }
        },
        (err) => {
          console.warn('Speech err:', err);
          setIsListening(false);
          setEmotion('idle');
        }
      );
    }
  };

  // Direct 3D touch on canvas - audio purring handled natively without speaking
  const handlePetOnAvatar = (_zone: 'head' | 'chin') => {
    // No verbal speech on touch
  };

  // Stop speech when unmounting or switching
  useEffect(() => {
    return () => {
      audioEngine.stopSpeaking();
      audioEngine.stopPurring();
      audioEngine.stopSpeechRecognition();
    };
  }, []);

  return (
    <main className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-100 flex flex-col justify-between font-sans select-none">
      {/* 1. Background Environment */}
      <EnvironmentView theme={environmentTheme} blur={false} />

      {/* 2. Top Header with School Logo & Sound Toggle */}
      <header className="relative z-20 w-full pt-2 sm:pt-3 px-2 sm:px-4 flex items-center justify-between shrink-0">
        <div className="w-full max-w-xl mx-auto flex items-center justify-between px-1">
          {/* Brand Logo Emblem */}
          <div className="flex items-center bg-white/90 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl shadow-2xs border border-slate-200/80">
            <img
              src="/negs-logo.svg"
              alt="Logo"
              className="h-8 sm:h-9 md:h-10 w-auto aspect-square object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick Sound Mute Toggle */}
          <div className="flex items-center bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-2xs border border-slate-200/80">
            <button
              onClick={() => {
                if (!soundMuted) audioEngine.stopSpeaking();
                setSoundMuted(!soundMuted);
              }}
              title={soundMuted ? 'Unmute sound' : 'Mute sound'}
              aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}
              className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Central 3D Interactive Talking Avatar Stage */}
      <section className="relative flex-1 w-full min-h-0 flex items-center justify-center z-10 overflow-hidden">
        <Avatar3D
          emotion={emotion}
          isSpeaking={isSpeaking}
          isListening={isListening}
          isThinking={isThinking}
          onPet={handlePetOnAvatar}
          onEmotionBusy={handleEmotionBusy}
          className="w-full h-full"
        />
      </section>

      {/* 4. Bottom Chatting Bar */}
      <footer className="relative z-30 w-full shrink-0">
        <InteractionBar
          isListening={isListening}
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          inputText={inputText}
          onInputChange={setInputText}
          onSubmitMessage={handleSendMessage}
          onToggleMic={handleToggleMic}
          disabled={isThinking}
        />
      </footer>
    </main>
  );
}
