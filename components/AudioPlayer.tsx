import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioBase64: string | undefined;
  onPlayRequest: () => void;
  isLoading: boolean;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBase64, onPlayRequest, isLoading, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

  // Visualize effect
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
    } else {
      setBars(new Array(20).fill(10));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (audioBase64) {
      if (audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
        if (autoPlay) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    }
  }, [audioBase64, autoPlay]);

  const togglePlay = () => {
    if (!audioBase64 && !isLoading) {
      onPlayRequest();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-lg shadow-pink-100 flex items-center gap-4">
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg ${
          isLoading 
            ? 'bg-pink-100 cursor-wait' 
            : 'bg-gradient-to-br from-pink-500 to-rose-400 hover:scale-105 hover:shadow-pink-300'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6 text-white fill-current" />
        ) : (
          <Play className="w-6 h-6 text-white fill-current ml-1" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1">
         <div className="flex items-center gap-2 text-[10px] text-pink-400 uppercase tracking-wider font-extrabold">
            <Volume2 className="w-3 h-3" />
            <span>Vocal de présentation</span>
         </div>
         
         {/* Visualizer */}
         <div className="h-8 flex items-end gap-[3px] w-full overflow-hidden">
            {bars.map((height, i) => (
              <div
                key={i}
                className="w-full bg-gradient-to-t from-pink-400 to-rose-300 rounded-full transition-all duration-100 ease-linear"
                style={{ height: `${height}%`, opacity: isPlaying ? 1 : 0.4 }}
              ></div>
            ))}
         </div>
      </div>
      
      <audio 
        ref={audioRef} 
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  );
};

export default AudioPlayer;