import React from 'react';
import { Hash, Volume2 } from 'lucide-react';
import Messages from './Messages';
import Input from './Input';

export default function Chat({
  activeChat,
  messages,
  onSendMessage,
  onSendAudio,
  isWsConnected,
  isVoiceConnected,
  onJoinVoice,
}) {
  if (!activeChat) {
    return (
      <main className="chat-main" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="messages-empty">
          <Hash size={48} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ color: 'var(--text-primary)' }}>Aucun salon sélectionné</h3>
          <p style={{ fontSize: 14 }}>Sélectionnez un salon dans la barre latérale pour démarrer la discussion.</p>
        </div>
      </main>
    );
  }

  const isVoiceChannel = activeChat.type === 'VOICE';

  return (
    <main className="chat-main">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          {isVoiceChannel ? (
            <Volume2 size={21} style={{ color: '#10b981' }} />
          ) : (
            <Hash size={20} style={{ color: 'var(--primary)' }} />
          )}
          <span className="chat-header-title">{activeChat.topic || 'Salon'}</span>
          {isVoiceChannel && (
            <span className="badge-voice-channel">Salon Vocal</span>
          )}
        </div>

        <div className="chat-header-actions">
          {isVoiceChannel && !isVoiceConnected && (
            <button
              type="button"
              className="btn-join-voice-header"
              onClick={() => onJoinVoice && onJoinVoice(activeChat)}
              title="Rejoindre la voix de ce salon"
            >
              <Volume2 size={16} />
              <span>Rejoindre la voix</span>
            </button>
          )}

          <div className="chat-header-badge" title={isWsConnected ? 'Connecté en temps réel (WebSocket)' : 'Mode synchronisation REST'}>
            <div className="chat-pulse-dot" style={{ backgroundColor: isWsConnected ? '#10b981' : '#f59e0b' }} />
            <span>{isWsConnected ? 'Temps réel' : 'Connecté'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Messages messages={messages} activeChat={activeChat} />

      {/* Input with Voice Recording */}
      <Input
        activeChat={activeChat}
        onSendMessage={onSendMessage}
        onSendAudio={onSendAudio}
      />
    </main>
  );
}