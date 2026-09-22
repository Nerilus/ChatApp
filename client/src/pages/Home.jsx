import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import ProfileModal from '../components/ProfileModal';
import CallModal from '../components/CallModal';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { webrtcService } from '../services/webrtc';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1-to-1 Call State
  const [callState, setCallState] = useState({
    status: 'idle', // 'idle' | 'calling' | 'incoming' | 'connected'
    targetUser: null,
    callerUser: null,
    isMuted: false,
  });
  const incomingOfferRef = useRef(null);

  // Multi-user Voice Room State
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);
  const [voiceRoomsData, setVoiceRoomsData] = useState({});
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Active voice room ref for callbacks
  const activeVoiceRoomRef = useRef(null);
  useEffect(() => {
    activeVoiceRoomRef.current = activeVoiceRoom;
  }, [activeVoiceRoom]);

  // Speaking state listener from audio analyser
  useEffect(() => {
    webrtcService.onSpeakingCallback = (speaking) => {
      setIsSpeaking(speaking);
      if (activeVoiceRoomRef.current && user?.username) {
        wsService.updateVoiceState(activeVoiceRoomRef.current.id, user.username, isVoiceMuted, speaking);
      }
    };

    webrtcService.onCallEndedCallback = () => {
      setCallState({
        status: 'idle',
        targetUser: null,
        callerUser: null,
        isMuted: false,
      });
    };

    return () => {
      webrtcService.onSpeakingCallback = null;
      webrtcService.onCallEndedCallback = null;
    };
  }, [isVoiceMuted, user?.username]);

  // Initialize WebSocket connection, online presence, and voice channels
  useEffect(() => {
    if (!user?.username) return;

    wsService.connect((connected) => {
      setIsWsConnected(connected);
      if (connected) {
        wsService.sendPresence(user.username);
      }
    }, user.username);

    // Subscribe to online users updates
    wsService.subscribeToOnlineUsers((payload) => {
      if (Array.isArray(payload)) {
        if (payload.length > 0 && typeof payload[0] === 'object') {
          setUserActivities(payload);
          const onlineNames = payload
            .filter((a) => a.status === 'AVAILABLE' || a.status === 'AWAY')
            .map((a) => a.username);
          setOnlineUsers(onlineNames);
        } else {
          setOnlineUsers(payload);
        }
      }
    });

    // Subscribe to 1-to-1 WebRTC call signals
    wsService.subscribeToCallSignals(user.username, async (signal) => {
      if (!signal) return;

      if (signal.type === 'OFFER') {
        incomingOfferRef.current = signal.data;
        setCallState({
          status: 'incoming',
          targetUser: null,
          callerUser: signal.sender,
          isMuted: false,
        });
        webrtcService.playRingtone(false);
      } else if (signal.type === 'ANSWER') {
        await webrtcService.handleAnswer(signal.data);
        setCallState((prev) => ({
          ...prev,
          status: 'connected',
        }));
      } else if (signal.type === 'ICE_CANDIDATE') {
        await webrtcService.handleIceCandidate(signal.data);
      } else if (signal.type === 'REJECT') {
        webrtcService.stopRingtone();
        setCallState({
          status: 'idle',
          targetUser: null,
          callerUser: null,
          isMuted: false,
        });
        alert(`${signal.sender} a refusé l'appel.`);
      } else if (signal.type === 'END') {
        webrtcService.endCall();
        setCallState({
          status: 'idle',
          targetUser: null,
          callerUser: null,
          isMuted: false,
        });
      }
    });

    // Subscribe to global voice rooms summary (who is connected in voice channels)
    wsService.subscribeToAllVoiceRooms((roomsMap) => {
      if (roomsMap && typeof roomsMap === 'object') {
        setVoiceRoomsData(roomsMap);
      }
    });

    return () => {
      wsService.disconnect();
      webrtcService.endCall();
      webrtcService.leaveVoiceRoom();
    };
  }, [user?.username]);

  // Fetch initial chats, online users, activities and voice rooms
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [chatsData, onlineData, activitiesData, usersData, voiceRooms] = await Promise.all([
        api.getChats().catch(() => []),
        api.getOnlineUsers().catch(() => []),
        api.getActivities().catch(() => []),
        api.getAllUsers().catch(() => []),
        api.getVoiceRooms().catch(() => ({})),
      ]);

      setChats(chatsData);
      setOnlineUsers(onlineData);
      setUserActivities(activitiesData);
      setAllUsers(usersData);
      setVoiceRoomsData(voiceRooms);

      if (chatsData.length > 0 && !activeChat) {
        setActiveChat(chatsData[0]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données initiales:', err);
    } finally {
      setLoading(false);
    }
  }, [activeChat]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // When activeChat changes, load messages and subscribe to chat topic
  useEffect(() => {
    if (!activeChat) return;

    let isSubscribed = true;

    const loadMessages = async () => {
      try {
        const msgs = await api.getMessages(activeChat.id);
        if (isSubscribed) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des messages:', err);
      }
    };

    loadMessages();

    // Subscribe to WebSocket for real-time messages in this chat
    wsService.subscribeToChat(activeChat.id, (incomingMsg) => {
      if (!isSubscribed) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) {
          return prev;
        }
        return [...prev, incomingMsg];
      });
    });

    return () => {
      isSubscribed = false;
      wsService.unsubscribeFromChat(activeChat.id);
    };
  }, [activeChat?.id]);

  // --- 1. RECORDED VOICE NOTES ---

  const handleSendMessage = async (content) => {
    if (!activeChat) return;
    try {
      const createdMessage = await api.sendMessage(activeChat.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMessage.id)) return prev;
        return [...prev, createdMessage];
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
    }
  };

  const handleSendAudio = async (audioBlob, duration, extension) => {
    if (!activeChat) return;
    try {
      const createdMessage = await api.sendAudioMessage(activeChat.id, audioBlob, duration, extension);
      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMessage.id)) return prev;
        return [...prev, createdMessage];
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi de la note vocale:", err);
      alert("Erreur lors de l'envoi de la note vocale.");
    }
  };

  // --- 2. 1-TO-1 WEBRTC CALLS ---

  const handleStartCall = async (targetUsername) => {
    if (!user?.username || targetUsername === user.username) return;
    try {
      setCallState({
        status: 'calling',
        targetUser: targetUsername,
        callerUser: user.username,
        isMuted: false,
      });

      await webrtcService.startCall(targetUsername, (signal) => {
        wsService.sendCallSignal({
          ...signal,
          sender: user.username,
        });
      });
    } catch (err) {
      console.error("Impossible d'initier l'appel vocal:", err);
      setCallState({ status: 'idle', targetUser: null, callerUser: null, isMuted: false });
    }
  };

  const handleAcceptCall = async () => {
    const offer = incomingOfferRef.current;
    const caller = callState.callerUser;
    if (!offer || !caller) return;

    try {
      setCallState((prev) => ({
        ...prev,
        status: 'connected',
      }));

      await webrtcService.handleIncomingOffer(offer, caller, (signal) => {
        wsService.sendCallSignal({
          ...signal,
          sender: user.username,
        });
      });
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'appel:", err);
      handleRejectCall();
    }
  };

  const handleRejectCall = () => {
    if (callState.callerUser) {
      wsService.sendCallSignal({
        type: 'REJECT',
        sender: user.username,
        target: callState.callerUser,
      });
    }
    webrtcService.stopRingtone();
    setCallState({ status: 'idle', targetUser: null, callerUser: null, isMuted: false });
  };

  const handleEndCall = () => {
    webrtcService.endCall((signal) => {
      wsService.sendCallSignal({
        ...signal,
        sender: user.username,
      });
    });
    setCallState({ status: 'idle', targetUser: null, callerUser: null, isMuted: false });
  };

  const handleToggleCallMute = () => {
    const newMuted = webrtcService.toggleMute();
    setCallState((prev) => ({ ...prev, isMuted: newMuted }));
  };

  // --- 3. MULTI-USER VOICE ROOMS (DISCORD STYLE) ---

  const handleJoinVoiceRoom = async (chat) => {
    if (activeVoiceRoom?.id === chat.id) return;

    // If already in another voice room, leave first
    if (activeVoiceRoom) {
      handleLeaveVoiceRoom();
    }

    try {
      setActiveVoiceRoom(chat);
      setIsVoiceMuted(false);

      // Join via STOMP presence
      wsService.joinVoiceRoom(chat.id, user.username);

      // Join via WebRTC mesh
      await webrtcService.joinVoiceRoom(chat.id, user.username, (signal) => {
        wsService.sendVoiceSignal(signal);
      });

      // Subscribe to room participants and mesh signals
      wsService.subscribeToVoiceRoom(
        chat.id,
        (participants) => {
          setVoiceRoomsData((prev) => ({ ...prev, [chat.id]: participants }));
        },
        async (signal) => {
          if (!signal || signal.sender === user.username) return;

          if (signal.type === 'VOICE_JOINED') {
            // A new peer joined the room, initiate WebRTC mesh offer
            await webrtcService.initiateMeshConnection(signal.sender, chat.id, (sig) => {
              wsService.sendVoiceSignal(sig);
            });
          } else if (signal.type === 'VOICE_OFFER' && signal.target === user.username) {
            await webrtcService.handleMeshOffer(signal.sender, signal.data, chat.id, (sig) => {
              wsService.sendVoiceSignal(sig);
            });
          } else if (signal.type === 'VOICE_ANSWER' && signal.target === user.username) {
            await webrtcService.handleMeshAnswer(signal.sender, signal.data);
          } else if (signal.type === 'VOICE_ICE' && signal.target === user.username) {
            await webrtcService.handleMeshIce(signal.sender, signal.data);
          }
        },
        user.username
      );
    } catch (err) {
      console.error("Erreur de connexion au salon vocal:", err);
      setActiveVoiceRoom(null);
    }
  };

  const handleLeaveVoiceRoom = () => {
    if (!activeVoiceRoom) return;

    wsService.leaveVoiceRoom(activeVoiceRoom.id, user.username);
    wsService.unsubscribeFromVoiceRoom(activeVoiceRoom.id);
    webrtcService.leaveVoiceRoom((signal) => {
      wsService.sendVoiceSignal(signal);
    });

    setActiveVoiceRoom(null);
    setIsVoiceMuted(false);
  };

  const handleToggleVoiceMute = () => {
    const newMuted = webrtcService.toggleMute();
    setIsVoiceMuted(newMuted);
    if (activeVoiceRoom) {
      wsService.updateVoiceState(activeVoiceRoom.id, user.username, newMuted, false);
    }
  };

  // --- GENERAL ACTIONS ---

  const handleNewChat = async (topic, type = 'TEXT') => {
    try {
      const newChat = await api.createChat(topic, type);
      setChats((prev) => [...prev, newChat]);
      setActiveChat(newChat);
      if (type === 'VOICE') {
        handleJoinVoiceRoom(newChat);
      }
    } catch (err) {
      console.error('Erreur lors de la création du salon:', err);
    }
  };

  const handleOpenProfile = (profileUser) => {
    setSelectedProfileUser(profileUser);
    setIsProfileOpen(true);
  };

  if (loading && chats.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Connexion aux salons de discussion...</p>
      </div>
    );
  }

  const selectedActivity = selectedProfileUser
    ? userActivities.find((a) => a.username === selectedProfileUser.username)
    : null;

  const isSelectedUserOnline = selectedProfileUser
    ? onlineUsers.includes(selectedProfileUser.username)
    : false;

  const isVoiceConnected = activeVoiceRoom?.id === activeChat?.id;

  return (
    <div className="chat-app-layout">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
        onNewChat={handleNewChat}
        onlineUsers={onlineUsers}
        allUsers={allUsers}
        userActivities={userActivities}
        onOpenProfile={handleOpenProfile}
        onStartCall={handleStartCall}
        activeVoiceRoom={activeVoiceRoom}
        voiceRoomsData={voiceRoomsData}
        onJoinVoiceRoom={handleJoinVoiceRoom}
        onLeaveVoiceRoom={handleLeaveVoiceRoom}
        isVoiceMuted={isVoiceMuted}
        isSpeaking={isSpeaking}
        onToggleVoiceMute={handleToggleVoiceMute}
      />

      <Chat
        activeChat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendAudio={handleSendAudio}
        isWsConnected={isWsConnected}
        isVoiceConnected={isVoiceConnected}
        onJoinVoice={handleJoinVoiceRoom}
      />

      {/* 1-to-1 WebRTC Call Modal / Overlay */}
      <CallModal
        callState={callState}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onToggleMute={handleToggleCallMute}
        isSpeaking={isSpeaking}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={selectedProfileUser}
        isOnline={isSelectedUserOnline}
        activity={selectedActivity}
        onStartCall={handleStartCall}
      />
    </div>
  );
}