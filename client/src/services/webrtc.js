// WebRTC service handling 1-on-1 direct voice calls & multi-user voice mesh rooms

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.audioContext = null;
    this.ringtoneOscillator = null;
    this.ringtoneInterval = null;

    // 1-to-1 Call State
    this.callPeerConnection = null;
    this.remoteAudioElement = null;
    this.activeCallTarget = null;
    this.isMuted = false;
    this.pendingIceCandidates = [];

    // Multi-user Mesh Room State
    this.meshPeers = new Map(); // username -> { pc, audio, analyser }
    this.currentRoomId = null;
    this.currentUsername = null;

    // Callbacks
    this.onRemoteStreamCallback = null;
    this.onCallEndedCallback = null;
    this.onSpeakingCallback = null;
  }

  // --- AUDIO STREAM & MIC MANAGEMENT ---

  async initLocalStream() {
    if (this.localStream && this.localStream.active) {
      return this.localStream;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this._setupAudioAnalyser();
      return this.localStream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw err;
    }
  }

  toggleMute() {
    if (!this.localStream) return this.isMuted;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
    }
    return this.isMuted;
  }

  setMute(mute) {
    if (!this.localStream) return;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !mute;
      this.isMuted = mute;
    }
  }

  _setupAudioAnalyser() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.localStream || !this.localStream.active) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeaking = average > 25 && !this.isMuted;
        if (this.onSpeakingCallback) {
          this.onSpeakingCallback(isSpeaking);
        }
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.warn('AudioAnalyser setup skipped:', e);
    }
  }

  // --- RINGTONE SYNTHESIZER (Web Audio API) ---

  playRingtone(isOutgoing = false) {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playBeep = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const freq = isOutgoing ? 440 : 520;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isOutgoing ? 0.7 : 0.4));

        osc.start();
        osc.stop(ctx.currentTime + (isOutgoing ? 0.7 : 0.4));
      };

      playBeep();
      this.ringtoneInterval = setInterval(playBeep, isOutgoing ? 2800 : 1800);
      this.ringtoneOscillator = ctx;
    } catch (err) {
      console.warn('Cannot play ringtone:', err);
    }
  }

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringtoneOscillator) {
      try {
        this.ringtoneOscillator.close();
      } catch (e) {}
      this.ringtoneOscillator = null;
    }
  }

  // --- 1-TO-1 CALL IMPLEMENTATION ---

  async startCall(targetUsername, sendSignalCallback) {
    this.activeCallTarget = targetUsername;
    const stream = await this.initLocalStream();

    this.callPeerConnection = new RTCPeerConnection(RTC_CONFIG);

    stream.getTracks().forEach((track) => {
      this.callPeerConnection.addTrack(track, stream);
    });

    this.callPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalCallback({
          type: 'ICE_CANDIDATE',
          target: targetUsername,
          data: event.candidate,
        });
      }
    };

    this.callPeerConnection.ontrack = (event) => {
      this._playRemoteAudio(event.streams[0]);
    };

    this.callPeerConnection.onconnectionstatechange = () => {
      if (this.callPeerConnection?.connectionState === 'disconnected' ||
          this.callPeerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };

    const offer = await this.callPeerConnection.createOffer();
    await this.callPeerConnection.setLocalDescription(offer);

    sendSignalCallback({
      type: 'OFFER',
      target: targetUsername,
      data: offer,
    });

    this.playRingtone(true);
  }

  async handleIncomingOffer(offer, senderUsername, sendSignalCallback) {
    this.activeCallTarget = senderUsername;
    this.stopRingtone();
    const stream = await this.initLocalStream();

    this.callPeerConnection = new RTCPeerConnection(RTC_CONFIG);

    stream.getTracks().forEach((track) => {
      this.callPeerConnection.addTrack(track, stream);
    });

    this.callPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalCallback({
          type: 'ICE_CANDIDATE',
          target: senderUsername,
          data: event.candidate,
        });
      }
    };

    this.callPeerConnection.ontrack = (event) => {
      this._playRemoteAudio(event.streams[0]);
    };

    await this.callPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Drain any queued ICE candidates that arrived before answer
    while (this.pendingIceCandidates.length > 0) {
      const cand = this.pendingIceCandidates.shift();
      try {
        await this.callPeerConnection.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn('Error adding queued ICE candidate:', e);
      }
    }

    const answer = await this.callPeerConnection.createAnswer();
    await this.callPeerConnection.setLocalDescription(answer);

    sendSignalCallback({
      type: 'ANSWER',
      target: senderUsername,
      data: answer,
    });
  }

  async handleAnswer(answer) {
    this.stopRingtone();
    if (this.callPeerConnection) {
      await this.callPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Drain queued ICE candidates
      while (this.pendingIceCandidates.length > 0) {
        const cand = this.pendingIceCandidates.shift();
        try {
          await this.callPeerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('Error adding queued ICE candidate:', e);
        }
      }
    }
  }

  async handleIceCandidate(candidate) {
    if (!candidate) return;
    if (this.callPeerConnection && this.callPeerConnection.remoteDescription) {
      try {
        await this.callPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    } else {
      this.pendingIceCandidates.push(candidate);
    }
  }

  _playRemoteAudio(stream) {
    if (!this.remoteAudioElement) {
      this.remoteAudioElement = document.createElement('audio');
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.id = 'webrtc-remote-audio';
      document.body.appendChild(this.remoteAudioElement);
    }
    this.remoteAudioElement.srcObject = stream;
    this.remoteAudioElement.play().catch((e) => console.warn('Audio autoplay failed:', e));
    if (this.onRemoteStreamCallback) {
      this.onRemoteStreamCallback(stream);
    }
  }

  endCall(sendSignalCallback = null) {
    this.stopRingtone();

    if (sendSignalCallback && this.activeCallTarget) {
      sendSignalCallback({
        type: 'END',
        target: this.activeCallTarget,
        data: null,
      });
    }

    if (this.callPeerConnection) {
      this.callPeerConnection.close();
      this.callPeerConnection = null;
    }

    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
      if (this.remoteAudioElement.parentNode) {
        this.remoteAudioElement.parentNode.removeChild(this.remoteAudioElement);
      }
      this.remoteAudioElement = null;
    }

    this.activeCallTarget = null;
    this.pendingIceCandidates = [];
    this._stopLocalStream();

    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }
  }

  // --- MULTI-USER VOICE ROOM (MESH) ---

  async joinVoiceRoom(chatId, username, sendSignalCallback) {
    this.currentRoomId = chatId;
    this.currentUsername = username;
    const stream = await this.initLocalStream();

    // Signal all peers in the room that we joined
    sendSignalCallback({
      type: 'VOICE_JOINED',
      chatId,
      sender: username,
    });
  }

  async initiateMeshConnection(targetPeerUsername, chatId, sendSignalCallback) {
    if (this.meshPeers.has(targetPeerUsername)) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);

    this.meshPeers.set(targetPeerUsername, { pc, audioEl });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignalCallback({
          type: 'VOICE_ICE',
          chatId,
          target: targetPeerUsername,
          sender: this.currentUsername,
          data: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      audioEl.play().catch(() => {});
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignalCallback({
      type: 'VOICE_OFFER',
      chatId,
      target: targetPeerUsername,
      sender: this.currentUsername,
      data: offer,
    });
  }

  async handleMeshOffer(sender, offer, chatId, sendSignalCallback) {
    let peer = this.meshPeers.get(sender);
    if (!peer) {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);

      peer = { pc, audioEl };
      this.meshPeers.set(sender, peer);

      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignalCallback({
            type: 'VOICE_ICE',
            chatId,
            target: sender,
            sender: this.currentUsername,
            data: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch(() => {});
      };
    }

    await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);

    sendSignalCallback({
      type: 'VOICE_ANSWER',
      chatId,
      target: sender,
      sender: this.currentUsername,
      data: answer,
    });
  }

  async handleMeshAnswer(sender, answer) {
    const peer = this.meshPeers.get(sender);
    if (peer && peer.pc) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleMeshIce(sender, candidate) {
    const peer = this.meshPeers.get(sender);
    if (peer && peer.pc && candidate) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Mesh ICE candidate failed:', e);
      }
    }
  }

  leaveVoiceRoom(sendSignalCallback = null) {
    if (sendSignalCallback && this.currentRoomId && this.currentUsername) {
      sendSignalCallback({
        type: 'VOICE_LEFT',
        chatId: this.currentRoomId,
        sender: this.currentUsername,
      });
    }

    this.meshPeers.forEach(({ pc, audioEl }) => {
      pc.close();
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
    });
    this.meshPeers.clear();
    this.currentRoomId = null;

    if (!this.activeCallTarget) {
      this._stopLocalStream();
    }
  }

  _stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }
}

export const webrtcService = new WebRTCService();
