import { SoundChannel, SoundType } from './types';

export const INITIAL_CHANNELS: Record<SoundType, SoundChannel> = {
  white: { id: 'white', name: 'White Noise', icon: 'Monitor', volume: 0, isActive: true },
  pink: { id: 'pink', name: 'Pink Noise', icon: 'Zap', volume: 0, isActive: true },
  brown: { id: 'brown', name: 'Brown Noise', icon: 'Zap', volume: 0, isActive: true },
  rain: { id: 'rain', name: 'Heavy Rain', icon: 'CloudRain', volume: 0, isActive: true },
  wind: { id: 'wind', name: 'Windy', icon: 'Wind', volume: 0, isActive: true },
  fire: { id: 'fire', name: 'Campfire', icon: 'Flame', volume: 0, isActive: true },
  stream: { id: 'stream', name: 'Brook', icon: 'Droplets', volume: 0, isActive: true },
  waves: { id: 'waves', name: 'Ocean', icon: 'Waves', volume: 0, isActive: true },
};