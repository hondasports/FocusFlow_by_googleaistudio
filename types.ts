export type SoundType = 'white' | 'pink' | 'brown' | 'rain' | 'wind' | 'fire' | 'stream' | 'waves';

export interface SoundChannel {
  id: SoundType;
  name: string;
  icon: string; // Lucide icon name
  volume: number; // 0 to 1
  isActive: boolean;
}

export interface MixerState {
  channels: Record<SoundType, SoundChannel>;
  isPlaying: boolean;
  masterVolume: number;
}

export interface AIPreset {
  name: string;
  description: string;
  volumes: Record<SoundType, number>;
  moodColor: string;
}

// Gemini Response Schema
export interface MixerConfigResponse {
  description: string;
  settings: {
    [key in SoundType]?: number;
  };
  moodHex: string;
}
