export type EmotionType =
  | 'idle'
  | 'happy'
  | 'empathetic'
  | 'curious'
  | 'playful'
  | 'thinking'
  | 'comforting'
  | 'excited'
  | 'listening'
  | 'speaking';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tom';
  text: string;
  emotion?: EmotionType;
  timestamp: number;
}

export type VoiceTone = 'warm' | 'playful' | 'mentor' | 'natural';

export type VoiceMode = 'cartoon_tom' | 'gemini_ai' | 'cute_kitten';

export interface VoiceSettings {
  pitch: number;
  rate: number;
  voiceName: string;
  tone: VoiceTone;
  mode: VoiceMode;
  autoSpeak: boolean;
}

export type EnvironmentTheme = 'negs-official' | 'negs-room' | 'clean-studio';

export type CharacterAction =
  | 'pet_head'
  | 'scratch_chin'
  | 'give_treat'
  | 'high_five'
  | 'sing_song';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email?: string;
  provider?: string;
}
