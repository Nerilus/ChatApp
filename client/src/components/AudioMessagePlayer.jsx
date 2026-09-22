import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function AudioMessagePlayer({ src, duration = 0, isOwn = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  // Ensure absolute URL if relative
  const audioUrl = src?.startsWith('http') ? src : `http://localhost:8080${src}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else if (duration) {
        setAudioDuration(duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = 1.0;
    audio.defaultPlaybackRate = 1.0;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const progress = Math.max(0, Math.min(1, clickX / width));
    const effectiveDuration = audioDuration || duration || 1;
    const newTime = progress * effectiveDuration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = audioDuration || duration || 1;
  const progressRatio = Math.min(1, currentTime / effectiveDuration);

  // Generate 20 static wave bar heights
  const bars = [35, 55, 75, 40, 90, 65, 80, 45, 100, 70, 85, 50, 60, 95, 40, 75, 60, 85, 50, 30];

  return (
    <div className={`audio-message-player ${isOwn ? 'own' : ''}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        type="button"
        className="btn-audio-play"
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Écouter'}
      >
        {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 2 }} />}
      </button>

      <div className="audio-wave-container" onClick={handleSeek}>
        <div className="audio-wave-bars">
          {bars.map((height, i) => {
            const barRatio = i / bars.length;
            const isFilled = barRatio <= progressRatio;
            return (
              <span
                key={i}
                className={`audio-wave-bar ${isFilled ? 'filled' : ''}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="audio-timeline">
          <span className="audio-time-label">
            {isPlaying ? formatSeconds(currentTime) : formatSeconds(effectiveDuration)}
          </span>
          <span className="audio-type-badge">
            <Volume2 size={11} />
            Note vocale
          </span>
        </div>
      </div>
    </div>
  );
}
