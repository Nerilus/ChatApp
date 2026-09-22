import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

export default function CallModal({
  callState,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  isSpeaking,
}) {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer = null;
    if (callState.status === 'connected') {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.status]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. INCOMING CALL MODAL
  if (callState.status === 'incoming') {
    const callerName = callState.callerUser || 'Utilisateur';
    const initial = callerName[0]?.toUpperCase() || 'U';

    return (
      <div className="modal-backdrop call-modal-backdrop">
        <div className="call-dialog incoming">
          <div className="call-avatar-container">
            <div className="call-pulsing-ring ring-1" />
            <div className="call-pulsing-ring ring-2" />
            <div className="call-avatar">{initial}</div>
          </div>

          <h3 className="call-user-title">{callerName}</h3>
          <p className="call-subtitle">
            <Volume2 size={16} className="pulse-icon" /> Appel vocal entrant...
          </p>

          <div className="call-actions-row">
            <button
              type="button"
              className="btn-call-action btn-call-reject"
              onClick={onReject}
              title="Refuser l'appel"
            >
              <PhoneOff size={22} />
              <span>Refuser</span>
            </button>

            <button
              type="button"
              className="btn-call-action btn-call-accept"
              onClick={onAccept}
              title="Accepter l'appel"
            >
              <Phone size={22} />
              <span>Accepter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. OUTGOING CALL MODAL
  if (callState.status === 'calling') {
    const targetName = callState.targetUser || 'Utilisateur';
    const initial = targetName[0]?.toUpperCase() || 'U';

    return (
      <div className="modal-backdrop call-modal-backdrop">
        <div className="call-dialog outgoing">
          <div className="call-avatar-container">
            <div className="call-pulsing-ring ring-1" />
            <div className="call-avatar">{initial}</div>
          </div>

          <h3 className="call-user-title">{targetName}</h3>
          <p className="call-subtitle">Appel en cours, en attente de réponse...</p>

          <div className="call-actions-row">
            <button
              type="button"
              className="btn-call-action btn-call-reject"
              onClick={onEnd}
              title="Annuler l'appel"
            >
              <PhoneOff size={22} />
              <span>Annuler</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ACTIVE CONNECTED CALL BAR
  if (callState.status === 'connected') {
    const partnerName = callState.targetUser || callState.callerUser || 'Interlocuteur';
    const initial = partnerName[0]?.toUpperCase() || 'U';

    return (
      <div className="active-call-floating-bar">
        <div className="active-call-info">
          <div className={`active-call-avatar ${isSpeaking ? 'speaking' : ''}`}>
            {initial}
            <span className="active-call-dot" />
          </div>
          <div className="active-call-meta">
            <span className="active-call-name">{partnerName}</span>
            <span className="active-call-timer">{formatTimer(callDuration)}</span>
          </div>
        </div>

        <div className="active-call-controls">
          <button
            type="button"
            className={`btn-call-control ${callState.isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={callState.isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {callState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="button"
            className="btn-call-control btn-call-hangup"
            onClick={onEnd}
            title="Raccrocher"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
