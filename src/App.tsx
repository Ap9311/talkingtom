import React, { useState, useEffect, useCallback } from 'react';
import { Avatar3D } from './components/Avatar3D';
import { EnvironmentView } from './components/EnvironmentView';
import { InteractionBar } from './components/InteractionBar';
import { SpeechBubble } from './components/SpeechBubble';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { audioEngine } from './utils/audioEngine';
import { EmotionType, ChatMessage, VoiceSettings, EnvironmentTheme, CharacterAction } from './types';

export default function App() {
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [currentDialogue, setCurrentDialogue] = useState<string>(
    "Hi there! I'm Tom, your companion from New Era Global School. How are you feeling today? Share whatever is on your mind—I'm here to listen and learn with you!"
  );
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      sender: 'tom',
      text: "Hi there! I'm Tom, your companion from New Era Global School. How are you feeling today? Share whatever is on your mind—I'm here to listen and learn with you!",
      emotion: 'happy',
      timestamp: Date.now(),
    },
  ]);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    pitch: 1.12,
    rate: 1.02,
    voiceName: '',
    tone: 'warm',
    autoSpeak: true,
  });

  const [environmentTheme, setEnvironmentTheme] = useState<EnvironmentTheme>('negs-official');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Play voice speech helper
  const speakText = useCallback(
    (text: string) => {
      if (soundMuted || !voiceSettings.autoSpeak) return;
      audioEngine.speak(text, voiceSettings, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [soundMuted, voiceSettings]
  );

  // Submit chat message to server-side Gemini API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isThinking || isSpeaking) return;

    audioEngine.initAudioContext();
    setInputText('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setEmotion('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await res.json();
      const replyText = data.cleanReply || data.fallbackReply || "I'm right here with you, my friend.";
      const newEmotion: EmotionType = (data.emotion as EmotionType) || 'empathetic';

      setCurrentDialogue(replyText);
      setEmotion(newEmotion);

      const tomMsg: ChatMessage = {
        id: `msg-${Date.now()}-tom`,
        sender: 'tom',
        text: replyText,
        emotion: newEmotion,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tomMsg]);

      // Speak with modulated voice
      speakText(replyText);
    } catch (err) {
      console.warn('Chat error:', err);
      const fallback = "I'm right here beside you. Whenever you want to chat, I'm all ears!";
      setCurrentDialogue(fallback);
      setEmotion('comforting');
      speakText(fallback);
    } finally {
      setIsThinking(false);
    }
  };

  // Toggle voice recognition (Speech-to-Text)
  const handleToggleMic = () => {
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

  // Handle character care actions (Pet, Scratch, Treat, High Five, Sing)
  const handleTriggerAction = async (action: CharacterAction) => {
    audioEngine.initAudioContext();
    audioEngine.stopSpeaking();

    // Sound effect
    if (action === 'pet_head' || action === 'scratch_chin') {
      audioEngine.startPurring();
      setTimeout(() => audioEngine.stopPurring(), 2500);
    } else if (action === 'give_treat') {
      audioEngine.playChime('treat');
    } else if (action === 'high_five') {
      audioEngine.playChime('high_five');
    } else if (action === 'sing_song') {
      audioEngine.playGreetingMeow();
    }

    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      const dialogue = data.cleanReply;
      const actEmotion = (data.emotion as EmotionType) || 'happy';

      setCurrentDialogue(dialogue);
      setEmotion(actEmotion);

      const tomMsg: ChatMessage = {
        id: `msg-${Date.now()}-action`,
        sender: 'tom',
        text: dialogue,
        emotion: actEmotion,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tomMsg]);

      speakText(dialogue);
    } catch (e) {
      console.warn('Action err:', e);
    }
  };

  // Direct 3D pet on canvas
  const handlePetOnAvatar = (zone: 'head' | 'chin') => {
    if (isSpeaking || isThinking) return;
    setEmotion(zone === 'chin' ? 'comforting' : 'happy');
    setCurrentDialogue(
      zone === 'chin'
        ? "*Purrrr*... Ahhh, you found my favorite scratching spot! That brings so much peace."
        : "*Purrrr*... That feels so comforting! Thank you for being such a kind friend."
    );
  };

  // Test voice sample
  const handleTestVoice = () => {
    speakText("Hello! This is my modulated companion voice. I'm ready to learn, laugh, and explore with you!");
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
    <main className="relative w-screen h-screen overflow-hidden bg-slate-100 flex flex-col justify-between font-sans">
      {/* 1. Background Environment (NEGS Official, Campus Lounge, or Studio) */}
      <EnvironmentView theme={environmentTheme} blur={false} />

      {/* 2. Top Header with Centered Facial Expression / Speech Cloud */}
      <header className="relative z-20 w-full pt-3 sm:pt-4 px-4 flex flex-col items-center">
        <SpeechBubble
          text={currentDialogue}
          emotion={emotion}
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          isListening={isListening}
          onReplay={() => speakText(currentDialogue)}
        />
      </header>

      {/* 3. Central 3D Interactive Avatar Stage */}
      <section className="relative flex-1 w-full flex items-center justify-center min-h-0 z-10">
        <Avatar3D
          emotion={emotion}
          isSpeaking={isSpeaking}
          isListening={isListening}
          isThinking={isThinking}
          onPet={handlePetOnAvatar}
          className="w-full h-full max-w-4xl"
        />
      </section>

      {/* 4. Bottom Modern Floating Interaction Bar */}
      <footer className="relative z-30 w-full">
        <InteractionBar
          emotion={emotion}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          inputText={inputText}
          onInputChange={setInputText}
          onSubmitMessage={handleSendMessage}
          onToggleMic={handleToggleMic}
          onTriggerAction={handleTriggerAction}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          soundMuted={soundMuted}
          onToggleMute={() => {
            if (!soundMuted) audioEngine.stopSpeaking();
            setSoundMuted(!soundMuted);
          }}
          disabled={isThinking}
        />
      </footer>

      {/* 5. Voice & Backdrop Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onUpdateSettings={(newSettings) => setVoiceSettings((prev) => ({ ...prev, ...newSettings }))}
        currentTheme={environmentTheme}
        onChangeTheme={setEnvironmentTheme}
        onTestVoice={handleTestVoice}
      />

      {/* 6. Conversation Log / History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        messages={messages}
        onClear={() => setMessages([])}
        onReplay={(text) => speakText(text)}
      />
    </main>
  );
}
