import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  isPlaying: boolean;
  primaryColor: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyserRef, isPlaying, primaryColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = 128; // Lower resolution for smoother bars
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Idle animation data
         for(let i=0; i<bufferLength; i++) dataArray[i] = 2;
      }

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down

        // Make it mirrored
        const distanceFromCenter = Math.abs((bufferLength / 2) - i) / (bufferLength / 2);
        const opacity = 1 - distanceFromCenter * 0.5;

        ctx.fillStyle = primaryColor; 
        ctx.globalAlpha = opacity * 0.6;
        
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, 5);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [analyserRef, isPlaying, primaryColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={60} 
      className="w-full h-[60px] opacity-80"
    />
  );
};