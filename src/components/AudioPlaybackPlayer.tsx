import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Headphones } from 'lucide-react';
import { speechSynthesizer } from '../utils/speech';

interface AudioPlaybackPlayerProps {
  audioUrl: string;
  modelText?: string;
  className?: string;
}

export const AudioPlaybackPlayer: React.FC<AudioPlaybackPlayerProps> = ({
  audioUrl,
  modelText,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlayingModel, setIsPlayingModel] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlayUser = () => {
    if (!audioRef.current) return;

    // If model TTS is speaking, stop it
    if (isPlayingModel) {
      speechSynthesizer.stop();
      setIsPlayingModel(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
        setIsPlaying(false);
      });
    }
  };

  const handlePlayModel = () => {
    if (!modelText) return;

    // If user audio is playing, pause it
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    setIsPlayingModel(true);
    speechSynthesizer.speak(modelText, {
      rate: 0.9,
      onEnd: () => setIsPlayingModel(false),
    });
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`w-full rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FFF6ED] border border-[#FCD8C1] p-3 sm:p-3.5 shadow-2xs space-y-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#FFF0E2] text-[#EA580C] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#6E4B3E]">
            Play Back Your Voice
          </span>
        </div>

        {/* Listen to Model Comparison button */}
        {modelText && (
          <button
            onClick={handlePlayModel}
            disabled={isPlayingModel}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs ${
              isPlayingModel
                ? 'bg-[#FED7AA] text-[#7C2D12] ring-2 ring-[#FDBA74]'
                : 'bg-white hover:bg-[#FFF3E8] text-[#9A3412] border border-[#FCD5BA]'
            }`}
            title="Listen to barista's model pronunciation"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>{isPlayingModel ? 'Model playing…' : 'Compare with Model'}</span>
          </button>
        )}
      </div>

      {/* Main playback control bar */}
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlayUser}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 active:scale-95 text-white flex items-center justify-center shadow-xs transition shrink-0"
          title={isPlaying ? 'Pause' : 'Play my recording'}
          aria-label={isPlaying ? 'Pause my recording' : 'Play my recording'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Progress & Wave Bar */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full h-2.5 bg-[#FDE8D7] rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#9C857D] font-medium mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Wave Animation when playing */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 h-4 shrink-0 px-1">
            <span className="w-1 h-3 bg-[#EA580C] rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-[#EA580C] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1 h-2 bg-[#EA580C] rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
      </div>
    </div>
  );
};
