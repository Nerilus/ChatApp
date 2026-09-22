import React, { useEffect, useRef } from 'react';
import { MessageSquareDashed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Message from './Message';

export default function Messages({ messages, activeChat }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-messages">
        <div className="messages-empty">
          <div className="messages-empty-icon">
            <MessageSquareDashed size={28} />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Aucun message pour l'instant</p>
          <p style={{ fontSize: 13, maxWidth: 300 }}>
            Soyez le premier à envoyer un message dans le salon #{activeChat?.topic || 'ce salon'} !
          </p>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((msg, index) => {
        const isOwn = (msg.user?.id && user?.id && msg.user.id === user.id) ||
                      (msg.user?.username && user?.username && msg.user.username === user.username);
        return (
          <Message
            key={msg.id || index}
            message={msg}
            isOwn={isOwn}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}