import React from 'react';
import { Volume2, VolumeX, CloudRain, Wind, Flame, Waves, Droplets, Zap, Monitor } from 'lucide-react';
import { SoundType } from '../types';

interface SoundCardProps {
  id: SoundType;
  name: string;
  volume: number;
  isActive: boolean;
  onVolumeChange: (vol: number) => void;
  onToggle: () => void;
}

const Icons: Record<SoundType, React.ElementType> = {
  white: Monitor,
  pink: Zap,
  brown: Zap,
  rain: CloudRain,
  wind: Wind,
  fire: Flame,
  stream: Droplets,
  waves: Waves,
};

export const SoundCard: React.FC<SoundCardProps> = ({ id, name, volume, isActive, onVolumeChange, onToggle }) => {
  const Icon = Icons[id];

  const presets = [
    { label: 'Low', val: 0.2 },
    { label: 'Med', val: 0.5 },
    { label: 'High', val: 0.8 },
  ];

  return (
    <div className={`p-4 rounded-xl transition-all duration-300 border backdrop-blur-md flex flex-col items-center gap-3
      ${isActive && volume > 0 ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60'}
    `}>
      <button 
        onClick={onToggle}
        className={`p-3 rounded-full transition-all duration-300 ${isActive && volume > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
      >
        <Icon size={24} />
      </button>
      
      <span className="text-sm font-medium tracking-wide text-slate-300">{name}</span>
      
      <div className="w-full flex items-center gap-2 mt-1">
        <VolumeX size={14} className="text-slate-500" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isActive ? volume : 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onVolumeChange(val);
          }}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <Volume2 size={14} className="text-slate-500" />
      </div>

      <div className="flex gap-2 w-full mt-1">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={(e) => {
              e.stopPropagation();
              onVolumeChange(preset.val);
            }}
            className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-colors
              ${isActive && Math.abs(volume - preset.val) < 0.05 
                ? 'bg-indigo-500/80 text-white' 
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};