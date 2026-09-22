import React, { useState } from 'react';
import { MessageSquare, Plus, Hash, LogOut, Search, Users, Shield, Clock, Volume2, Phone, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatUserPresenceStatus } from '../utils/dateFormatter';
import NewChatModal from './NewChatModal';
import VoiceStatusBar from './VoiceStatusBar';

export default function Sidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onlineUsers = [],
  allUsers = [],
  userActivities = [],
  onOpenProfile,
  onStartCall,
  activeVoiceRoom,
  voiceRoomsData = {},
  onJoinVoiceRoom,
  onLeaveVoiceRoom,
  isVoiceMuted,
  isSpeaking,
  onToggleVoiceMute,
}) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'users'
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredChats = chats.filter((c) =>
    (c.topic || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const textChannels = filteredChats.filter((c) => c.type !== 'VOICE');
  const voiceChannels = filteredChats.filter((c) => c.type === 'VOICE');

  // Extract online usernames (handling both string array and object array)
  const onlineUsernames = onlineUsers.map((u) => (typeof u === 'string' ? u : u.username));

  // Build the list of users with activity info
  const onlineUserList = Array.from(new Set(onlineUsernames)).map((username) => {
    const found = allUsers.find((u) => u.username === username);
    const activity = userActivities.find((a) => a.username === username);
    return {
      ...(found || { id: null, username, email: null, roles: ['ROLE_USER'] }),
      activity,
    };
  });

  const filteredOnlineUsers = onlineUserList.filter((u) =>
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userInitial = (user?.username || 'U')[0].toUpperCase();
  const userRole = (user?.roles && user.roles[0]) ? user.roles[0].replace('ROLE_', '') : 'USER';

  return (
    <aside className="chat-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-badge">
            <MessageSquare size={18} />
          </div>
          <span className="brand-title">ChatApp</span>
        </div>
      </div>

      {/* Tabs Navigation: Salons vs En ligne */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => { setActiveTab('chats'); setSearchTerm(''); }}
        >
          <Hash size={15} />
          <span>Salons ({chats.length})</span>
        </button>

        <button
          className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
        >
          <div className="online-tab-indicator">
            <Users size={15} />
            <span className="chat-pulse-dot" style={{ width: 6, height: 6 }} />
          </div>
          <span>En ligne ({onlineUsernames.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 14px 4px' }}>
        <div className="input-wrapper">
          <Search size={15} className="input-icon" style={{ left: 12 }} />
          <input
            type="text"
            className="form-input"
            style={{ padding: '7px 12px 7px 34px', fontSize: 13, borderRadius: 'var(--radius-sm)' }}
            placeholder={activeTab === 'chats' ? 'Filtrer les salons...' : 'Filtrer les membres en ligne...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content for CHATS tab */}
      {activeTab === 'chats' && (
        <div className="channels-container">
          <div className="channels-header">
            <span>Salons Textuels ({textChannels.length})</span>
            <button
              className="btn-icon"
              title="Nouveau salon"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="channels-list">
            {textChannels.map((chat) => (
              <div
                key={chat.id}
                className={`channel-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat)}
              >
                <Hash size={17} className="channel-icon" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chat.topic || `Salon #${chat.id}`}
                </span>
              </div>
            ))}
            {textChannels.length === 0 && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                Aucun salon textuel
              </div>
            )}
          </div>

          {/* Voice Channels Section (Discord Style) */}
          <div className="channels-header" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Volume2 size={15} style={{ color: '#10b981' }} />
              <span>Salons Vocaux ({voiceChannels.length})</span>
            </div>
          </div>

          <div className="channels-list">
            {voiceChannels.map((chat) => {
              const participants = voiceRoomsData[chat.id] || [];
              const isConnectedHere = activeVoiceRoom?.id === chat.id;

              return (
                <div key={chat.id} className="voice-channel-wrapper">
                  <div
                    className={`channel-item voice-channel-item ${activeChat?.id === chat.id ? 'active' : ''} ${isConnectedHere ? 'connected' : ''}`}
                    onClick={() => {
                      onSelectChat(chat);
                      if (onJoinVoiceRoom && !isConnectedHere) {
                        onJoinVoiceRoom(chat);
                      }
                    }}
                  >
                    <Volume2 size={17} className="channel-icon voice-icon" />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.topic || `Salon vocal #${chat.id}`}
                    </span>
                    {participants.length > 0 && (
                      <span className="voice-count-badge">{participants.length}</span>
                    )}
                  </div>

                  {/* Connected Voice Members List */}
                  {participants.length > 0 && (
                    <div className="voice-participants-list">
                      {participants.map((p, idx) => {
                        const isMe = p.username === user?.username;
                        const pInitial = (p.username || 'U')[0].toUpperCase();
                        const pSpeaking = isMe ? isSpeaking : p.speaking;
                        const pMuted = isMe ? isVoiceMuted : p.muted;

                        return (
                          <div
                            key={idx}
                            className={`voice-participant-item ${pSpeaking ? 'speaking' : ''}`}
                            onClick={() => onOpenProfile({ username: p.username })}
                          >
                            <div className="voice-participant-avatar">
                              {pInitial}
                            </div>
                            <span className="voice-participant-name">
                              {p.username} {isMe && '(Moi)'}
                            </span>
                            <div className="voice-participant-status">
                              {pMuted ? (
                                <MicOff size={12} style={{ color: '#ef4444' }} />
                              ) : (
                                <Mic size={12} style={{ color: '#10b981' }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {voiceChannels.length === 0 && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                Aucun salon vocal. Créez-en un avec le bouton + !
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content for ONLINE USERS tab (Teams style) */}
      {activeTab === 'users' && (
        <>
          <div className="channels-header">
            <span>Connectés ({filteredOnlineUsers.length})</span>
          </div>

          <div className="channels-list">
            {filteredOnlineUsers.map((u, idx) => {
              const isMe = u.username === user?.username;
              const uInitial = (u.username || 'U')[0].toUpperCase();
              const isAdmin = Array.isArray(u.roles) && u.roles.some(r => (typeof r === 'string' ? r : r.name) === 'ROLE_ADMIN');
              const presence = formatUserPresenceStatus(u.activity, true);

              return (
                <div
                  key={u.id || idx}
                  className="user-online-item"
                  title="Voir le profil"
                >
                  <div
                    className="user-online-avatar"
                    onClick={() => onOpenProfile({ ...u, presence })}
                  >
                    {uInitial}
                    <span
                      className="status-dot"
                      style={{ backgroundColor: presence.color }}
                    />
                  </div>
                  <div
                    className="user-online-info"
                    onClick={() => onOpenProfile({ ...u, presence })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="user-online-name">{u.username}</span>
                      {isMe && <span className="badge-me">Moi</span>}
                      {isAdmin && <Shield size={12} style={{ color: '#a855f7' }} title="Administrateur" />}
                    </div>
                    <span className="user-online-status" style={{ color: presence.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {presence.status === 'away' && <Clock size={11} />}
                      {presence.label}
                    </span>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      className="btn-call-user-quick"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartCall) onStartCall(u.username);
                      }}
                      title={`Appeler ${u.username}`}
                    >
                      <Phone size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {filteredOnlineUsers.length === 0 && (
              <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Aucun utilisateur en ligne pour l'instant
              </div>
            )}
          </div>
        </>
      )}

      {/* Voice Status Bar (Discord style when in a voice channel) */}
      <VoiceStatusBar
        activeVoiceRoom={activeVoiceRoom}
        isMuted={isVoiceMuted}
        isSpeaking={isSpeaking}
        onToggleMute={onToggleVoiceMute}
        onDisconnect={onLeaveVoiceRoom}
      />

      {/* User Profile Footer (Clickable to view own profile) */}
      <div className="sidebar-footer">
        <div
          className="user-profile clickable"
          onClick={() => onOpenProfile(user)}
          title="Cliquez pour voir votre profil"
        >
          <div className="avatar">
            {userInitial}
            <div className="status-dot" />
          </div>
          <div className="user-meta">
            <span className="user-name">{user?.username || 'Utilisateur'}</span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>

        <button
          className="btn-icon"
          onClick={logout}
          title="Se déconnecter"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={17} />
        </button>
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateChat={onNewChat}
      />
    </aside>
  );
}