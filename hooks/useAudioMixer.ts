import { useEffect, useRef, useState, useCallback } from 'react';
import { SoundType } from '../types';

// Helper to create noise buffer
const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

// Helper to create Pink Noise (approximation)
const createPinkNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11; // compensate for gain
    b6 = white * 0.115926;
  }
  return buffer;
};

// Helper for Brown Noise
const createBrownNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Compensate for gain
  }
  return buffer;
};

export const useAudioMixer = (
  channels: Record<SoundType, { volume: number }>,
  isPlaying: boolean
) => {
  const contextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Record<SoundType, GainNode | null>>({
    white: null, pink: null, brown: null, rain: null, wind: null, fire: null, stream: null, waves: null
  });
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (contextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    contextRef.current = ctx;

    const mainOutput = ctx.createGain();
    mainOutput.connect(ctx.destination);

    // Analyser for visualizer
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    mainOutput.connect(analyser);
    analyserRef.current = analyser;

    const noiseBuffer = createNoiseBuffer(ctx);
    const pinkBuffer = createPinkNoiseBuffer(ctx);
    const brownBuffer = createBrownNoiseBuffer(ctx);

    const setupSource = (type: SoundType) => {
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(mainOutput);
      gainNodesRef.current[type] = gainNode;

      let source: AudioBufferSourceNode;

      // PROCEDURAL AUDIO GENERATION LOGIC
      if (type === 'white') {
        source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        source.connect(gainNode);
      } else if (type === 'pink') {
        source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;
        source.connect(gainNode);
      } else if (type === 'brown') {
        source = ctx.createBufferSource();
        source.buffer = brownBuffer;
        source.loop = true;
        source.connect(gainNode);
      } else if (type === 'rain') {
        // Rain: Pink noise + Lowpass Filter
        source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        source.connect(filter);
        filter.connect(gainNode);
      } else if (type === 'wind') {
         // Wind: Pink noise + Bandpass Filter + LFO
         source = ctx.createBufferSource();
         source.buffer = pinkBuffer;
         source.loop = true;

         const filter = ctx.createBiquadFilter();
         filter.type = 'bandpass';
         filter.frequency.value = 400;
         filter.Q.value = 1; // Wide band

         // LFO for wind swishing
         const lfo = ctx.createOscillator();
         lfo.type = 'sine';
         lfo.frequency.value = 0.1; // Slow sweep
         
         const lfoGain = ctx.createGain();
         lfoGain.gain.value = 200; // Sweep range

         lfo.connect(lfoGain);
         lfoGain.connect(filter.frequency);
         lfo.start();

         source.connect(filter);
         filter.connect(gainNode);

      } else if (type === 'fire') {
         // Fire: Brown noise + Crackle
         source = ctx.createBufferSource();
         source.buffer = brownBuffer;
         source.loop = true;

         const hpFilter = ctx.createBiquadFilter();
         hpFilter.type = 'highpass';
         hpFilter.frequency.value = 200; // Remove deep rumble

         // Crackle effect using random modulation (approximated with rapid gain changes)
         // Since we can't do complex granular synthesis easily here, we stick to a textured rumble
         // We can modulate the gain slightly to make it flicker
         
         const lfo = ctx.createOscillator();
         lfo.type = 'triangle';
         lfo.frequency.value = 15; // Fast flicker
         
         const lfoGain = ctx.createGain();
         lfoGain.gain.value = 0.1; // Subtle modulation
         
         lfo.connect(lfoGain);
         lfoGain.connect(gainNode.gain); 
         lfo.start();

         source.connect(hpFilter);
         hpFilter.connect(gainNode);

      } else if (type === 'stream') {
        // Stream: Pink Noise + Static Highpass + Dynamic Lowpass
         source = ctx.createBufferSource();
         source.buffer = pinkBuffer;
         source.loop = true;

         const hp = ctx.createBiquadFilter();
         hp.type = 'highpass';
         hp.frequency.value = 400;

         const lp = ctx.createBiquadFilter();
         lp.type = 'lowpass';
         lp.frequency.value = 1200;

         // Gentle LFO for water movement
         const lfo = ctx.createOscillator();
         lfo.frequency.value = 0.4;
         const lfoGain = ctx.createGain();
         lfoGain.gain.value = 100;
         lfo.connect(lfoGain);
         lfoGain.connect(lp.frequency);
         lfo.start();

         source.connect(hp);
         hp.connect(lp);
         lp.connect(gainNode);

      } else if (type === 'waves') {
        // Ocean: Pink Noise + Very Slow LFO on Lowpass + Gain
        source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1; // 10 second wave cycle
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5; // Modulate volume significantly
        
        // Use a gain node to be modulated by LFO before the main channel gain
        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.5;

        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);
        lfo.start();

        source.connect(lp);
        lp.connect(waveGain);
        waveGain.connect(gainNode);

      } else {
         // Fallback
         source = ctx.createBufferSource();
         source.buffer = noiseBuffer;
         source.loop = true;
         source.connect(gainNode);
      }

      source.start();
    };

    const types: SoundType[] = ['white', 'pink', 'brown', 'rain', 'wind', 'fire', 'stream', 'waves'];
    types.forEach(setupSource);

    setIsReady(true);
  }, []);

  // Update Volumes
  useEffect(() => {
    if (!contextRef.current) return;

    const currentTime = contextRef.current.currentTime;
    Object.entries(channels).forEach(([id, channel]) => {
      const node = gainNodesRef.current[id as SoundType];
      if (node) {
        // Smooth transition
        const targetVol = isPlaying ? channel.volume : 0;
        node.gain.setTargetAtTime(targetVol, currentTime, 0.1);
      }
    });
    
    if (isPlaying && contextRef.current.state === 'suspended') {
        contextRef.current.resume();
    } else if (!isPlaying && contextRef.current.state === 'running') {
        // We keep it running but volumes at 0 to avoid "pop" on resume, 
        // or we could suspend. Suspending saves CPU.
        // Let's rely on volume 0 for now for instant interaction.
    }

  }, [channels, isPlaying]);

  return { initAudio, isReady, analyserRef };
};
