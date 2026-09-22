import React from 'react';
import { formatMessageDate } from '../utils/dateFormatter';
import AudioMessagePlayer from './AudioMessagePlayer';

export default function Message({ message, isOwn }) {
  const senderName = message.user?.username || (isOwn ? 'Moi' : 'Anonyme');
  const initial = senderName[0]?.toUpperCase() || 'U';
  const isAudio = message.messageType === 'AUDIO' || Boolean(message.mediaUrl);

  return (
    <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
      <div className="message-avatar">
        {initial}
      </div>
      <div className="message-content-wrapper">
        <div className="message-meta">
          <span className="message-sender">{senderName}</span>
          <span className="message-time">{formatMessageDate(message.date)}</span>
        </div>
        {isAudio ? (
          <AudioMessagePlayer
            src={message.mediaUrl}
            duration={message.duration}
            isOwn={isOwn}
          />
        ) : (
          <div className="message-text">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}