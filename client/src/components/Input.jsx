import React, { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

export default function Input({ onSendMessage, onSendAudio, activeChat, disabled }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleAudioSend = (blob, duration, extension) => {
    setIsRecording(false);
    if (onSendAudio) {
      onSendAudio(blob, duration, extension);
    }
  };

  if (isRecording) {
    return (
      <div className="chat-input-container">
        <AudioRecorder
          onSend={handleAudioSend}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    );
  }

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input-field"
          placeholder={`Envoyer un message dans #${activeChat?.topic || 'ce salon'}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          autoFocus
        />

        <button
          type="button"
          className="btn-mic"
          onClick={() => setIsRecording(true)}
          disabled={disabled}
          title="Enregistrer une note vocale"
        >
          <Mic size={17} />
        </button>

        <button
          type="submit"
          className="btn-send"
          disabled={!text.trim() || disabled}
          title="Envoyer (Entrée)"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}