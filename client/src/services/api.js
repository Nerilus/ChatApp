const API_BASE_URL = 'http://localhost:8080/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Identifiants invalides');
    }
    return data;
  },

  async register(username, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role: ['user'] }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Erreur lors de l'inscription");
    }
    return data;
  },

  // Users & Profile
  async getMe() {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Impossible de charger les informations du profil');
    }
    return await res.json();
  },

  async getOnlineUsers() {
    const res = await fetch(`${API_BASE_URL}/users/online`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  },

  async getActivities() {
    const res = await fetch(`${API_BASE_URL}/users/activities`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  },

  async getAllUsers() {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  },

  async getUserByUsername(username) {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  },

  // Chats
  async getChats() {
    const res = await fetch(`${API_BASE_URL}/chats`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Impossible de charger les salons de discussion');
    }
    return await res.json();
  },

  async createChat(topic, type = 'TEXT') {
    const res = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic, type }),
    });
    if (!res.ok) {
      throw new Error('Impossible de créer le salon');
    }
    return await res.json();
  },

  async getVoiceRooms() {
    const res = await fetch(`${API_BASE_URL}/chats/voice/rooms`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      return {};
    }
    return await res.json();
  },

  // Messages
  async getMessages(chatId) {
    const res = await fetch(`${API_BASE_URL}/messages/chat/${chatId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Impossible de charger les messages');
    }
    return await res.json();
  },

  async sendMessage(chatId, content) {
    const res = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ chatId, content }),
    });
    if (!res.ok) {
      throw new Error("Erreur lors de l'envoi du message");
    }
    return await res.json();
  },

  async sendAudioMessage(chatId, audioBlob, duration = 0, extension = '.webm') {
    const formData = new FormData();
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    formData.append('file', audioBlob, `voice_${Date.now()}${ext}`);
    formData.append('chatId', chatId);
    formData.append('duration', Math.round(duration));

    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/messages/audio`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Erreur lors de l'envoi de la note vocale");
    }
    return await res.json();
  },
};
