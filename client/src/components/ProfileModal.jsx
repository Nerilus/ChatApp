import React from 'react';
import { X, Shield, Mail, User, Hash, LogOut, CheckCircle2, Clock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatUserPresenceStatus, formatMessageDate } from '../utils/dateFormatter';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  isOnline = true,
  activity = null,
  onStartCall = null,
}) {
  const { user: currentUser, logout } = useAuth();

  if (!isOpen || !userProfile) return null;

  const isSelf = currentUser?.id === userProfile.id || currentUser?.username === userProfile.username;
  const initial = (userProfile.username || 'U')[0].toUpperCase();

  const presence = userProfile.presence || formatUserPresenceStatus(activity || userProfile.activity, isOnline);

  const getRoleBadge = (roles) => {
    const roleList = Array.isArray(roles)
      ? roles.map(r => (typeof r === 'string' ? r : r.name))
      : ['ROLE_USER'];

    if (roleList.includes('ROLE_ADMIN')) {
      return <span className="role-badge admin"><Shield size={13} /> Administrateur</span>;
    }
    if (roleList.includes('ROLE_MODERATOR')) {
      return <span className="role-badge mod"><Shield size={13} /> Modérateur</span>;
    }
    return <span className="role-badge user"><CheckCircle2 size={13} /> Membre</span>;
  };

  const lastActiveText = activity?.lastActive ? formatMessageDate(activity.lastActive) : null;

  const handleCall = () => {
    onClose();
    if (onStartCall) {
      onStartCall(userProfile.username);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Close */}
        <div className="modal-header" style={{ marginBottom: 12 }}>
          <div className="modal-title">{isSelf ? 'Mon Profil' : 'Profil Utilisateur'}</div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Profile Hero (Teams Style) */}
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {initial}
            <div
              className="status-dot-large"
              style={{ backgroundColor: presence.color }}
              title={presence.label}
            />
          </div>
          <h3 className="profile-username">{userProfile.username}</h3>

          <div className="profile-status-text" style={{ color: presence.color }}>
            {presence.status === 'away' ? (
              <Clock size={14} />
            ) : (
              <span
                className="dot-indicator"
                style={{ backgroundColor: presence.color }}
              />
            )}
            <span>{presence.label}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            {getRoleBadge(userProfile.roles)}
          </div>
        </div>

        {/* Details List */}
        <div className="profile-details-list">
          <div className="profile-detail-item">
            <div className="profile-detail-icon"><User size={16} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Pseudo</span>
              <span className="profile-detail-value">{userProfile.username}</span>
            </div>
          </div>

          <div className="profile-detail-item">
            <div className="profile-detail-icon"><Mail size={16} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Adresse e-mail</span>
              <span className="profile-detail-value">{userProfile.email || 'Non renseigné'}</span>
            </div>
          </div>

          <div className="profile-detail-item">
            <div className="profile-detail-icon"><Hash size={16} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Identifiant unique</span>
              <span className="profile-detail-value">#{userProfile.id || 'N/A'}</span>
            </div>
          </div>

          {lastActiveText && (
            <div className="profile-detail-item">
              <div className="profile-detail-icon"><Clock size={16} /></div>
              <div className="profile-detail-content">
                <span className="profile-detail-label">Dernière activité</span>
                <span className="profile-detail-value">{lastActiveText}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions" style={{ justifyContent: isSelf ? 'space-between' : 'flex-end', marginTop: 24, gap: 10 }}>
          {isSelf ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={() => {
                onClose();
                logout();
              }}
            >
              <LogOut size={15} style={{ marginRight: 6 }} />
              Se déconnecter
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleCall}
            >
              <Phone size={15} />
              <span>Appeler</span>
            </button>
          )}

          <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
