import React from 'react';
import { Volume2, PhoneOff, Mic, MicOff, Radio } from 'lucide-react';

export default function VoiceStatusBar({
  activeVoiceRoom,
  isMuted,
  isSpeaking,
  onToggleMute,
  onDisconnect,
}) {
  if (!activeVoiceRoom) return null;

  return (
    <div className="voice-status-bar">
      <div className="voice-status-info">
        <div className="voice-connected-indicator" title="Connexion vocale active (WebRTC)">
          <Radio size={14} className="voice-pulse-icon" />
          <span className="voice-status-title">Voix connectée</span>
        </div>
        <div className="voice-room-name">
          <Volume2 size={13} style={{ color: 'var(--primary-light)' }} />
          <span>{activeVoiceRoom.topic || `Salon vocal #${activeVoiceRoom.id}`}</span>
        </div>
      </div>

      <div className="voice-status-controls">
        <button
          type="button"
          className={`btn-voice-tool ${isMuted ? 'muted' : ''}`}
          onClick={onToggleMute}
          title={isMuted ? 'Activer le micro' : 'Couper le micro'}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        <button
          type="button"
          className="btn-voice-tool btn-voice-disconnect"
          onClick={onDisconnect}
          title="Déconnecter du salon vocal"
        >
          <PhoneOff size={15} />
        </button>
      </div>
    </div>
  );
}
