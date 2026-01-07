import React, { useState, useEffect } from 'react';
import { Play, Pause, Sparkles, AlertCircle, Headphones } from 'lucide-react';
import { INITIAL_CHANNELS } from './constants';
import { SoundType, SoundChannel } from './types';
import { useAudioMixer } from './hooks/useAudioMixer';
import { generateMixerConfig } from './services/geminiService';
import { SoundCard } from './components/SoundCard';
import { Visualizer } from './components/Visualizer';

const App: React.FC = () => {
  const [channels, setChannels] = useState<Record<SoundType, SoundChannel>>(INITIAL_CHANNELS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVibe, setCurrentVibe] = useState("Custom Mix");
  const [moodColor, setMoodColor] = useState("#6366f1"); // Indigo-500 default
  const [error, setError] = useState<string | null>(null);

  const { initAudio, isReady, analyserRef } = useAudioMixer(channels, isPlaying);

  // Toggle playback and ensure audio context is ready
  const togglePlay = () => {
    if (!isReady) {
      initAudio();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (id: SoundType, volume: number) => {
    setChannels(prev => ({
      ...prev,
      [id]: { ...prev[id], volume, isActive: volume > 0 }
    }));
  };

  const handleToggleChannel = (id: SoundType) => {
    setChannels(prev => {
      const channel = prev[id];
      const newActive = !channel.isActive;
      // If turning on and volume is 0, set to default 0.5
      const newVolume = newActive && channel.volume === 0 ? 0.5 : channel.volume;
      
      return {
        ...prev,
        [id]: { ...channel, isActive: newActive, volume: newActive ? newVolume : 0 }
      };
    });
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Auto-start audio if not already
    if (!isReady) initAudio();
    setIsPlaying(true);

    setIsGenerating(true);
    setError(null);

    try {
      const config = await generateMixerConfig(prompt);
      
      // Apply new settings
      const newChannels = { ...channels };
      
      // Reset all first (optional, or mix into existing? Let's reset for clarity)
      (Object.keys(newChannels) as SoundType[]).forEach(key => {
        newChannels[key].volume = 0;
        newChannels[key].isActive = false;
      });

      // Apply new volumes
      Object.entries(config.settings).forEach(([key, vol]) => {
        const soundKey = key as SoundType;
        if (newChannels[soundKey] && vol !== undefined) {
          newChannels[soundKey].volume = vol;
          newChannels[soundKey].isActive = vol > 0;
        }
      });

      setChannels(newChannels);
      setCurrentVibe(config.description);
      setMoodColor(config.moodHex || "#6366f1");
    } catch (err) {
      setError("AI Generation failed. Check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 font-sans transition-colors duration-1000 ease-in-out"
         style={{ background: `linear-gradient(to bottom right, #0f172a, ${moodColor}22)` }}>
      
      {/* Background Ambience Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[40%] right-[0%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl glass-panel rounded-3xl shadow-2xl p-6 md:p-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
               <Headphones className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                FocusFlow
              </h1>
              <p className="text-slate-400 text-sm">{currentVibe}</p>
            </div>
          </div>

          {/* Master Controls */}
          <div className="flex items-center gap-4">
             <button
              onClick={togglePlay}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg
                ${isPlaying 
                  ? 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/30'
                }`}
            >
              {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start Focus</>}
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <div className="w-full h-[60px] flex items-end justify-center overflow-hidden">
           <Visualizer analyserRef={analyserRef} isPlaying={isPlaying} primaryColor={moodColor} />
        </div>

        {/* AI Input Section */}
        <div className="w-full bg-slate-900/50 rounded-2xl p-1 border border-white/5">
          <form onSubmit={handleAISubmit} className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your perfect environment (e.g., 'Writing code in a rainy cafe')..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 px-4 py-3 outline-none focus:bg-white/5 rounded-xl transition-colors"
            />
            <button 
              type="submit" 
              disabled={isGenerating || !prompt}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
            >
              {isGenerating ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              <span>Generate Mix</span>
            </button>
          </form>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Grid of Sounds */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(Object.values(channels) as SoundChannel[]).map((channel) => (
            <SoundCard
              key={channel.id}
              {...channel}
              onVolumeChange={(vol) => handleVolumeChange(channel.id, vol)}
              onToggle={() => handleToggleChannel(channel.id)}
            />
          ))}
        </div>
      </div>
      
      <footer className="mt-8 text-slate-500 text-sm">
        <p>Powered by Google Gemini 3.0 & Web Audio API</p>
      </footer>
    </div>
  );
};

export default App;