import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

export default function AudioRecorder({ onSend, onCancel }) {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const getBestAudioMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return '';
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const selectedMime = getBestAudioMimeType();
      const options = selectedMime ? { mimeType: selectedMime, audioBitsPerSecond: 64000 } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording without timeslice to prevent broken WebM cluster timestamps
      mediaRecorder.start();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err);
      alert("Impossible d'accéder au microphone. Veuillez vérifier les autorisations de votre navigateur.");
      onCancel();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    onCancel();
  };

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const actualMime = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        stopTracks();
        if (audioBlob.size > 0) {
          let extension = '.webm';
          if (actualMime.includes('mp4') || actualMime.includes('aac')) {
            extension = '.mp4';
          } else if (actualMime.includes('ogg')) {
            extension = '.ogg';
          }
          onSend(audioBlob, Math.max(1, recordingTime), extension);
        } else {
          onCancel();
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      stopTracks();
      onCancel();
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="audio-recorder-bar">
      <div className="recorder-indicator">
        <span className="recorder-pulse-dot" />
        <span className="recorder-timer">{formatTimer(recordingTime)}</span>
      </div>

      <div className="recorder-wave-preview">
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
      </div>

      <div className="recorder-actions">
        <button
          type="button"
          className="btn-recorder-cancel"
          onClick={handleCancel}
          title="Annuler l'enregistrement"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          className="btn-recorder-send"
          onClick={handleFinish}
          title="Envoyer la note vocale"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
