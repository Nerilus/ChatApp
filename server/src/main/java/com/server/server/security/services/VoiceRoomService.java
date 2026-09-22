package com.server.server.security.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.server.server.payload.VoiceParticipant;

@Service
public class VoiceRoomService {

    private static final Logger log = LoggerFactory.getLogger(VoiceRoomService.class);

    // chatId -> Set of VoiceParticipant
    private final Map<Long, Set<VoiceParticipant>> roomParticipants = new ConcurrentHashMap<>();

    // sessionId -> chatId
    private final Map<String, Long> sessionRoomMap = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public synchronized void joinRoom(Long chatId, String username, String sessionId) {
        if (chatId == null || username == null || username.trim().isEmpty()) return;

        // If user is already in another voice room with this session, leave first
        Long previousRoom = sessionRoomMap.get(sessionId);
        if (previousRoom != null && !previousRoom.equals(chatId)) {
            leaveRoom(previousRoom, username);
        }

        Set<VoiceParticipant> participants = roomParticipants.computeIfAbsent(chatId, k -> ConcurrentHashMap.newKeySet());
        // Remove existing participant record if any to update with new session
        participants.removeIf(p -> p.getUsername().equalsIgnoreCase(username));

        VoiceParticipant participant = new VoiceParticipant(username, sessionId);
        participants.add(participant);
        sessionRoomMap.put(sessionId, chatId);

        log.info("[VOICE ROOM] User {} joined room {} (Session ID: {})", username, chatId, sessionId);
        broadcastRoom(chatId);
        broadcastAllRooms();
    }

    public synchronized void leaveRoom(Long chatId, String username) {
        if (chatId == null || username == null) return;

        Set<VoiceParticipant> participants = roomParticipants.get(chatId);
        if (participants != null) {
            participants.removeIf(p -> {
                boolean matches = p.getUsername().equalsIgnoreCase(username);
                if (matches && p.getSessionId() != null) {
                    sessionRoomMap.remove(p.getSessionId());
                }
                return matches;
            });
            if (participants.isEmpty()) {
                roomParticipants.remove(chatId);
            }
        }

        log.info("[VOICE ROOM] User {} left room {}", username, chatId);
        broadcastRoom(chatId);
        broadcastAllRooms();
    }

    public synchronized void updateParticipantState(Long chatId, String username, Boolean muted, Boolean speaking) {
        if (chatId == null || username == null) return;

        Set<VoiceParticipant> participants = roomParticipants.get(chatId);
        if (participants != null) {
            for (VoiceParticipant p : participants) {
                if (p.getUsername().equalsIgnoreCase(username)) {
                    if (muted != null) p.setMuted(muted);
                    if (speaking != null) p.setSpeaking(speaking);
                    break;
                }
            }
            broadcastRoom(chatId);
        }
    }

    @EventListener
    public synchronized void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        Long chatId = sessionRoomMap.remove(sessionId);
        if (chatId != null) {
            Set<VoiceParticipant> participants = roomParticipants.get(chatId);
            if (participants != null) {
                participants.removeIf(p -> sessionId.equals(p.getSessionId()));
                if (participants.isEmpty()) {
                    roomParticipants.remove(chatId);
                }
            }
            log.info("[VOICE ROOM] Session {} disconnected from room {}", sessionId, chatId);
            broadcastRoom(chatId);
            broadcastAllRooms();
        }
    }

    public List<VoiceParticipant> getParticipants(Long chatId) {
        Set<VoiceParticipant> participants = roomParticipants.get(chatId);
        if (participants == null) {
            return Collections.emptyList();
        }
        return new ArrayList<>(participants);
    }

    public Map<Long, List<VoiceParticipant>> getAllRooms() {
        Map<Long, List<VoiceParticipant>> copy = new ConcurrentHashMap<>();
        for (Map.Entry<Long, Set<VoiceParticipant>> entry : roomParticipants.entrySet()) {
            copy.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        return copy;
    }

    public void broadcastRoom(Long chatId) {
        if (messagingTemplate != null && chatId != null) {
            List<VoiceParticipant> participants = getParticipants(chatId);
            messagingTemplate.convertAndSend("/topic/voice/" + chatId + "/participants", participants);
        }
    }

    public void broadcastAllRooms() {
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/voice-rooms", getAllRooms());
        }
    }
}
