import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatWebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.pendingSubscriptions = [];
    this.activeSubscriptions = new Map();
    this.currentUsername = null;
    this.onlineUsersCallback = null;
    this.callSignalHandler = null;
    this.allVoiceRoomsCallback = null;
  }

  connect(onStatusChange, username = null) {
    if (username) {
      this.currentUsername = username;
    }

    if (this.client && this.client.active) {
      if (this.connected && this.currentUsername) {
        this.sendPresence(this.currentUsername);
      }
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        if (onStatusChange) onStatusChange(true);

        // Send user presence notification
        if (this.currentUsername) {
          this.sendPresence(this.currentUsername);
        }

        // Subscribe to online users topic if registered
        if (this.onlineUsersCallback) {
          this._subscribeOnlineUsers(this.onlineUsersCallback);
        }

        // Subscribe to call signals if registered
        if (this.callSignalHandler) {
          this._subscribeCallSignals(this.callSignalHandler.username, this.callSignalHandler.callback);
        }

        // Subscribe to all voice rooms if registered
        if (this.allVoiceRoomsCallback) {
          this._subscribeAllVoiceRooms(this.allVoiceRoomsCallback);
        }

        // Process any queued subscriptions
        this.pendingSubscriptions.forEach(({ chatId, callback }) => {
          this._subscribe(chatId, callback);
        });
        this.pendingSubscriptions = [];
      },
      onDisconnect: () => {
        this.connected = false;
        if (onStatusChange) onStatusChange(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP broker error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  sendPresence(username) {
    this.currentUsername = username;
    if (!this.connected || !this.client) return;

    try {
      this.client.publish({
        destination: '/app/user/presence',
        body: JSON.stringify({ username }),
      });
    } catch (err) {
      console.warn('Failed to publish presence', err);
    }
  }

  subscribeToOnlineUsers(callback) {
    this.onlineUsersCallback = callback;
    if (this.connected && this.client) {
      this._subscribeOnlineUsers(callback);
    }
  }

  _subscribeOnlineUsers(callback) {
    if (this.activeSubscriptions.has('online-users')) {
      this.activeSubscriptions.get('online-users').unsubscribe();
      this.activeSubscriptions.delete('online-users');
    }

    try {
      const sub = this.client.subscribe('/topic/online-users', (message) => {
        try {
          const payload = JSON.parse(message.body);
          // Convert to array if Set is returned as array or set
          const usersList = Array.isArray(payload) ? payload : Object.values(payload);
          callback(usersList);
        } catch (e) {
          console.error('Failed to parse online users payload', e);
        }
      });
      this.activeSubscriptions.set('online-users', sub);
    } catch (e) {
      console.warn('Subscription error for online users', e);
    }
  }

  subscribeToChat(chatId, callback) {
    if (!chatId) return;

    if (!this.connected || !this.client) {
      this.pendingSubscriptions.push({ chatId, callback });
      return;
    }

    this._subscribe(chatId, callback);
  }

  _subscribe(chatId, callback) {
    if (this.activeSubscriptions.has(chatId)) {
      this.activeSubscriptions.get(chatId).unsubscribe();
      this.activeSubscriptions.delete(chatId);
    }

    try {
      const sub = this.client.subscribe(`/topic/chat/${chatId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (e) {
          console.error('Failed to parse WebSocket message payload', e);
        }
      });
      this.activeSubscriptions.set(chatId, sub);
    } catch (e) {
      console.warn('Subscription error', e);
    }
  }

  unsubscribeFromChat(chatId) {
    if (this.activeSubscriptions.has(chatId)) {
      this.activeSubscriptions.get(chatId).unsubscribe();
      this.activeSubscriptions.delete(chatId);
    }
  }

  // --- 1-TO-1 CALL SIGNALING ---

  sendCallSignal(signal) {
    if (!this.connected || !this.client) return;
    try {
      this.client.publish({
        destination: '/app/call/signal',
        body: JSON.stringify(signal),
      });
    } catch (err) {
      console.warn('Failed to send call signal', err);
    }
  }

  subscribeToCallSignals(username, callback) {
    if (!username) return;
    this.callSignalHandler = { username, callback };
    if (this.connected && this.client) {
      this._subscribeCallSignals(username, callback);
    }
  }

  _subscribeCallSignals(username, callback) {
    const topic = `/topic/call/${username}`;

    if (this.activeSubscriptions.has('call-signals')) {
      this.activeSubscriptions.get('call-signals').unsubscribe();
      this.activeSubscriptions.delete('call-signals');
    }

    try {
      const sub = this.client.subscribe(topic, (msg) => {
        try {
          const signal = JSON.parse(msg.body);
          callback(signal);
        } catch (e) {
          console.error('Failed to parse call signal', e);
        }
      });
      this.activeSubscriptions.set('call-signals', sub);
    } catch (e) {
      console.warn('Call signaling subscription error', e);
    }
  }

  // --- MULTI-USER VOICE ROOMS ---

  joinVoiceRoom(chatId, username) {
    if (!this.connected || !this.client) return;
    try {
      this.client.publish({
        destination: '/app/voice/join',
        body: JSON.stringify({ chatId, username }),
      });
    } catch (e) {
      console.warn('Error publishing voice join', e);
    }
  }

  leaveVoiceRoom(chatId, username) {
    if (!this.connected || !this.client) return;
    try {
      this.client.publish({
        destination: '/app/voice/leave',
        body: JSON.stringify({ chatId, username }),
      });
    } catch (e) {
      console.warn('Error publishing voice leave', e);
    }
  }

  updateVoiceState(chatId, username, muted, speaking) {
    if (!this.connected || !this.client) return;
    try {
      this.client.publish({
        destination: '/app/voice/state',
        body: JSON.stringify({ chatId, username, muted, speaking }),
      });
    } catch (e) {
      console.warn('Error updating voice state', e);
    }
  }

  sendVoiceSignal(signal) {
    if (!this.connected || !this.client) return;
    try {
      this.client.publish({
        destination: '/app/voice/signal',
        body: JSON.stringify(signal),
      });
    } catch (e) {
      console.warn('Error publishing voice signal', e);
    }
  }

  subscribeToVoiceRoom(chatId, onParticipants, onSignal, myUsername) {
    this.unsubscribeFromVoiceRoom(chatId);
    if (!this.connected || !this.client) return;

    try {
      // Subscribe to participants list
      const partSub = this.client.subscribe(`/topic/voice/${chatId}/participants`, (msg) => {
        try {
          onParticipants(JSON.parse(msg.body));
        } catch (e) {
          console.error('Error parsing voice participants', e);
        }
      });
      this.activeSubscriptions.set(`voice-part-${chatId}`, partSub);

      // Subscribe to room-wide signals
      const sigSub = this.client.subscribe(`/topic/voice/${chatId}/signals`, (msg) => {
        try {
          onSignal(JSON.parse(msg.body));
        } catch (e) {
          console.error('Error parsing voice signal', e);
        }
      });
      this.activeSubscriptions.set(`voice-sig-${chatId}`, sigSub);

      // Subscribe to direct user signals if username is provided
      if (myUsername) {
        const userSigSub = this.client.subscribe(`/topic/voice/user/${myUsername}`, (msg) => {
          try {
            onSignal(JSON.parse(msg.body));
          } catch (e) {
            console.error('Error parsing direct voice signal', e);
          }
        });
        this.activeSubscriptions.set(`voice-user-sig-${myUsername}`, userSigSub);
      }
    } catch (e) {
      console.warn('Voice room subscription error', e);
    }
  }

  unsubscribeFromVoiceRoom(chatId) {
    if (this.activeSubscriptions.has(`voice-part-${chatId}`)) {
      this.activeSubscriptions.get(`voice-part-${chatId}`).unsubscribe();
      this.activeSubscriptions.delete(`voice-part-${chatId}`);
    }
    if (this.activeSubscriptions.has(`voice-sig-${chatId}`)) {
      this.activeSubscriptions.get(`voice-sig-${chatId}`).unsubscribe();
      this.activeSubscriptions.delete(`voice-sig-${chatId}`);
    }
  }

  subscribeToAllVoiceRooms(callback) {
    this.allVoiceRoomsCallback = callback;
    if (this.connected && this.client) {
      this._subscribeAllVoiceRooms(callback);
    }
  }

  _subscribeAllVoiceRooms(callback) {
    if (this.activeSubscriptions.has('all-voice-rooms')) {
      this.activeSubscriptions.get('all-voice-rooms').unsubscribe();
      this.activeSubscriptions.delete('all-voice-rooms');
    }

    try {
      const sub = this.client.subscribe('/topic/voice-rooms', (msg) => {
        try {
          callback(JSON.parse(msg.body));
        } catch (e) {
          console.error('Error parsing all voice rooms', e);
        }
      });
      this.activeSubscriptions.set('all-voice-rooms', sub);
    } catch (e) {
      console.warn('Subscription error for all voice rooms', e);
    }
  }

  disconnect() {
    if (this.client) {
      this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
      this.activeSubscriptions.clear();
      this.pendingSubscriptions = [];
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const wsService = new ChatWebSocketService();
