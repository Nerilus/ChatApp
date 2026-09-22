import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';

export default function NewChatModal({ isOpen, onClose, onCreateChat }) {
  const [topic, setTopic] = useState('');
  const [channelType, setChannelType] = useState('TEXT'); // 'TEXT' | 'VOICE'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setLoading(true);
      await onCreateChat(topic.trim(), channelType);
      setTopic('');
      setChannelType('TEXT');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Créer un salon</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Channel Type Selector */}
          <div className="form-group">
            <label className="form-label">Type de salon</label>
            <div className="channel-type-selector">
              <div
                className={`channel-type-card ${channelType === 'TEXT' ? 'active' : ''}`}
                onClick={() => setChannelType('TEXT')}
              >
                <Hash size={20} className="type-icon" />
                <div className="type-info">
                  <span className="type-title">Textuel</span>
                  <span className="type-desc">Discussions écrites, images et notes vocales</span>
                </div>
              </div>

              <div
                className={`channel-type-card ${channelType === 'VOICE' ? 'active' : ''}`}
                onClick={() => setChannelType('VOICE')}
              >
                <Volume2 size={20} className="type-icon" />
                <div className="type-info">
                  <span className="type-title">Vocal</span>
                  <span className="type-desc">Salon audio direct permanent (style Discord)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="chat-topic">Nom du salon</label>
            <div className="input-wrapper">
              {channelType === 'TEXT' ? (
                <Hash size={18} className="input-icon" />
              ) : (
                <Volume2 size={18} className="input-icon" />
              )}
              <input
                id="chat-topic"
                type="text"
                className="form-input"
                placeholder={channelType === 'TEXT' ? 'ex: général, développement, annonces' : 'ex: Salon Vocal 1, Réunion'}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} disabled={loading}>
              {loading ? 'Création...' : 'Créer le salon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
