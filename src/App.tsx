import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar3D } from './components/Avatar3D';
import { EnvironmentView } from './components/EnvironmentView';
import { InteractionBar } from './components/InteractionBar';
import { MicPermissionModal } from './components/MicPermissionModal';
import { AuthScreen } from './components/AuthScreen';
import { ProfileDrawer } from './components/ProfileDrawer';
import { audioEngine } from './utils/audioEngine';
import { EmotionType, VoiceSettings, EnvironmentTheme, UserProfile } from './types';
import { auth, loadUserProfileFromFirestore, saveUserProfileToFirestore } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Volume2, VolumeX, Clock, AlertCircle } from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AdminPage } from './components/AdminPage';
import { recordVisitorDevicePresence } from './utils/deviceFingerprint';
import { isAdminUser } from './utils/adminData';

// Helper to restore cached profile on frame 0 (zero load delay)
const getInitialCachedProfile = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem('tom_cached_auth_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.uid) return parsed;
    }
  } catch {}
  return null;
};

export default function App() {
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [showMicPrompt, setShowMicPrompt] = useState<boolean>(false);

  // Authentication & Profile states initialized from local storage for zero flash
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getInitialCachedProfile());
  const [authLoading, setAuthLoading] = useState<boolean>(() => !getInitialCachedProfile());
  const [guestMode, setGuestMode] = useState<boolean>(false);
  const [guestSecondsLeft, setGuestSecondsLeft] = useState<number>(120);
  const [guestExpiredNotice, setGuestExpiredNotice] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Administrative route state: /admin or #admin
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isTarget =
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.startsWith('#admin');
    if (!isTarget) return false;
    
    // Check if initial cached profile is authorized admin
    const cached = getInitialCachedProfile();
    if (cached?.email && isAdminUser(cached.email)) {
      return true;
    }

    // Immediately redirect non-admin visitors to main screen
    try {
      window.history.replaceState({}, '', '/');
    } catch {}
    return false;
  });

  // Track browser history changes for route switching with strict admin guard
  useEffect(() => {
    const handleLocationChange = () => {
      const isTarget =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.startsWith('#admin');

      if (isTarget) {
        // If current user is not the verified admin, silently redirect to /
        if (!isAdminUser(userProfile?.email)) {
          window.history.replaceState({}, '', '/');
          setIsAdminRoute(false);
          return;
        }
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [userProfile]);

  // Guard against any unauthorized access when user state resolves
  useEffect(() => {
    if (isAdminRoute && !authLoading) {
      if (!isAdminUser(userProfile?.email)) {
        window.history.replaceState({}, '', '/');
        setIsAdminRoute(false);
      }
    }
  }, [isAdminRoute, authLoading, userProfile]);

  // Record visitor presence quietly in background for real total user counts
  useEffect(() => {
    recordVisitorDevicePresence();
  }, []);

  // Lightweight conversation history for AI context memory without any text chat display
  const conversationHistoryRef = useRef<{ sender: string; text: string }[]>([]);

  const [voiceSettings] = useState<VoiceSettings>({
    pitch: 1.62,
    rate: 1.12,
    voiceName: '',
    tone: 'playful',
    mode: 'cute_kitten',
    autoSpeak: true,
  });

  const [environmentTheme] = useState<EnvironmentTheme>('negs-official');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isEmotionBusy, setIsEmotionBusy] = useState<boolean>(false);

  // Listen to Firebase Auth state without blocking the UI
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const fallbackPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          firebaseUser.uid
        )}`;
        const immediateProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Friend',
          photoURL: firebaseUser.photoURL || fallbackPhoto,
          email: firebaseUser.email || undefined,
          provider:
            firebaseUser.providerData[0]?.providerId === 'google.com'
              ? 'google'
              : 'password',
        };
        setUserProfile((prev) => prev || immediateProfile);
        setGuestMode(false);
        setAuthLoading(false);

        // Sync verified email and profile to Firestore for real admin metrics
        saveUserProfileToFirestore(firebaseUser.uid, {
          displayName: firebaseUser.displayName || 'Friend',
          photoURL: firebaseUser.photoURL || fallbackPhoto,
          email: firebaseUser.email || '',
        }).catch(() => {});

        // Background sync for any custom saved profile without blocking the UI
        loadUserProfileFromFirestore(firebaseUser.uid)
          .then((saved) => {
            if (saved && (saved.displayName || saved.photoURL)) {
              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      displayName: saved.displayName || prev.displayName,
                      photoURL: saved.photoURL || prev.photoURL,
                    }
                  : prev
              );
            }
          })
          .catch(() => {});
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2-minute Guest Mode Strict Countdown (120 seconds limit)
  useEffect(() => {
    if (!guestMode) return;

    const timer = setInterval(() => {
      setGuestSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          audioEngine.stopSpeaking();
          audioEngine.stopSpeechRecognition();
          setIsSpeaking(false);
          setIsListening(false);
          setGuestMode(false);
          setUserProfile(null);
          setGuestExpiredNotice(
            'Your 2-minute guest preview has ended! Please sign in with Google to continue playing with Tom.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [guestMode]);

  // Play voice speech helper - strictly suppresses speech if avatar is in blushing/angry emotional state
  const speakText = useCallback(
    (text: string, onSpeechFinished?: () => void) => {
      if (soundMuted || !voiceSettings.autoSpeak || isEmotionBusy) {
        onSpeechFinished?.();
        return;
      }
      audioEngine.speak(text, voiceSettings, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          onSpeechFinished?.();
        },
        onError: () => {
          setIsSpeaking(false);
          onSpeechFinished?.();
        },
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

  // Dedicated function to start speech recognition
  const startListening = useCallback(() => {
    if (isEmotionBusy || isSpeaking || isThinking) return;
    audioEngine.initAudioContext();
    audioEngine.stopSpeaking();
    setIsSpeaking(false);
    setEmotion('listening');

    const started = audioEngine.startSpeechRecognition(
      (transcript) => {
        if (transcript) {
          handleSendMessage(transcript, true);
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
    if (started) {
      setIsListening(true);
    }
  }, [isEmotionBusy, isSpeaking, isThinking]);

  // Submit chat message to server-side Gemini API
  const handleSendMessage = async (customText?: string, fromVoice = false) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isThinking || isSpeaking || isEmotionBusy) return;

    audioEngine.initAudioContext();
    setInputText('');

    conversationHistoryRef.current.push({ sender: 'user', text: textToSend });
    if (conversationHistoryRef.current.length > 8) {
      conversationHistoryRef.current = conversationHistoryRef.current.slice(-8);
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
          userName: userProfile?.displayName || undefined,
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
      speakText(replyText, () => {
        // If the question came through voice, seamlessly re-open the mic so the user can continue talking!
        if (fromVoice && !isEmotionBusy) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      });
    } catch (err) {
      console.warn('Chat error:', err);
      const fallback = "I'm right here with you! Could you ask that one more time? I'm listening closely.";
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
      startListening();
    }
  };

  // Handle Enable Mic from the startup prompt modal
  const handleEnableMicFromModal = async (): Promise<boolean> => {
    audioEngine.initAudioContext();
    const granted = await audioEngine.requestMicrophonePermission();
    if (granted) {
      setShowMicPrompt(false);
      audioEngine.playGreetingMeow();
      setEmotion('happy');
      const friendName = userProfile?.displayName ? `, ${userProfile.displayName}` : '';
      const welcome = `Hi${friendName}! I'm Tom! Ask me any question, or tell me what's on your mind—I'm ready!`;
      conversationHistoryRef.current.push({ sender: 'tom', text: welcome });
      speakText(welcome, () => {
        startListening();
      });
      return true;
    }
    return false;
  };

  // Handle Dismiss / keyboard option from the startup prompt modal
  const handleDismissMicModal = () => {
    audioEngine.initAudioContext();
    setShowMicPrompt(false);
    setEmotion('happy');
    const friendName = userProfile?.displayName ? ` ${userProfile.displayName}` : ' my friend';
    const welcome = `Hello${friendName}! I'm Tom. Ask me any question anytime—you can type or tap the microphone whenever you're ready!`;
    conversationHistoryRef.current.push({ sender: 'tom', text: welcome });
    speakText(welcome);
  };

  // Direct 3D touch on canvas
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

  if (isAdminRoute && isAdminUser(userProfile?.email)) {
    return (
      <AdminPage
        onBackToApp={() => {
          window.history.replaceState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  return (
    <main className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-100 flex flex-col justify-between font-sans select-none">
      {/* 1. Background Environment */}
      <EnvironmentView theme={environmentTheme} blur={false} />

      {/* 2. Top Header with School Logo, PWA Download, Guest Timer, Sound & Profile */}
      <header className="relative z-20 w-full pt-2 sm:pt-3 px-2 sm:px-4 flex items-center justify-between shrink-0">
        <div className="w-full max-w-xl mx-auto flex items-center justify-between px-1 gap-2">
          {/* School Brand Logo Emblem (Preserved on Main Screen) */}
          <div className="flex items-center bg-white/90 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl shadow-2xs border border-slate-200/80">
            <img
              src="/negs-logo.svg"
              alt="School Logo"
              className="h-8 sm:h-9 md:h-10 w-auto aspect-square object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center: Guest Mode 2-Minute Countdown Indicator */}
          {guestMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-400/50 text-amber-900 rounded-xl text-[11px] sm:text-xs font-bold shadow-2xs backdrop-blur-md animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Guest: {Math.floor(guestSecondsLeft / 60)}:
                {String(guestSecondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Quick Controls: PWA Download + Sound Mute + Profile */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-2xs border border-slate-200/80">
            {/* PWA Download / Install Button */}
            <PWAInstallButton />

            {/* Speaker Sound Mute Toggle */}
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

            {/* Profile Button right next to speaker button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              title={userProfile?.displayName ? `${userProfile.displayName}'s Profile` : 'Profile'}
              aria-label="User Profile"
              className="relative w-7 h-7 rounded-lg overflow-hidden border border-amber-400 hover:border-amber-500 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center bg-amber-50 shadow-2xs"
            >
              <img
                src={
                  userProfile?.photoURL ||
                  'https://api.dicebear.com/7.x/bottts/svg?seed=TomFriend'
                }
                alt={userProfile?.displayName || 'User Profile'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://api.dicebear.com/7.x/bottts/svg?seed=TomFriend';
                }}
              />
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

      {/* 5. Starting Microphone Permission Modal (Shown when signed in / ready) */}
      <MicPermissionModal
        isOpen={showMicPrompt && (!!userProfile || guestMode)}
        onEnableMic={handleEnableMicFromModal}
        onDismiss={handleDismissMicModal}
      />

      {/* 6. First Sign In Screen (if not signed in and not in guest mode) */}
      {!authLoading && !userProfile && !guestMode && (
        <div className="relative z-50">
          {guestExpiredNotice && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-11/12 max-w-md bg-amber-500 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-bounce">
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
              <span className="flex-1">{guestExpiredNotice}</span>
              <button
                onClick={() => setGuestExpiredNotice(null)}
                className="text-amber-100 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          <AuthScreen
            onAuthSuccess={(profile) => {
              setGuestExpiredNotice(null);
              setUserProfile(profile);
              setShowMicPrompt(false);
              audioEngine.initAudioContext();
              setEmotion('happy');
              const welcome = `Hello ${profile.displayName}! I'm Tom. Ready to chat!`;
              conversationHistoryRef.current = [{ sender: 'tom', text: welcome }];
              speakText(welcome);
            }}
            onContinueAsGuest={() => {
              setGuestExpiredNotice(null);
              setGuestSecondsLeft(120);
              setGuestMode(true);
              setShowMicPrompt(false);
              const guestProf: UserProfile = {
                uid: 'guest',
                displayName: 'Friend',
                photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Friend',
                provider: 'guest',
              };
              setUserProfile(guestProf);
              audioEngine.initAudioContext();
              setEmotion('happy');
              const welcome = "Hello my friend! I'm Tom! You can type or tap the microphone to chat with me!";
              conversationHistoryRef.current = [{ sender: 'tom', text: welcome }];
              speakText(welcome);
            }}
          />
        </div>
      )}

      {/* 7. Right-Side Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => {
          setUserProfile(updated);
        }}
        onSignOut={() => {
          setUserProfile(null);
          setGuestMode(false);
        }}
      />
    </main>
  );
}
