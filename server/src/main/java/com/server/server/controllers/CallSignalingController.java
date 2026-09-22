package com.server.server.controllers;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.server.server.payload.CallSignalMessage;
import com.server.server.security.services.VoiceRoomService;

@Controller
public class CallSignalingController {

    private static final Logger log = LoggerFactory.getLogger(CallSignalingController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private VoiceRoomService voiceRoomService;

    /**
     * 1-to-1 WebRTC Signaling
     * Routes SDP offer/answer/ICE candidate to the target user.
     */
    @MessageMapping("/call/signal")
    public void handleCallSignal(@Payload CallSignalMessage signal) {
        if (signal == null || signal.getTarget() == null) {
            log.warn("[SIGNALING] Received null signal or missing target");
            return;
        }

        log.info("[SIGNALING 1-to-1] Route {} from {} to {}", signal.getType(), signal.getSender(), signal.getTarget());
        messagingTemplate.convertAndSend("/topic/call/" + signal.getTarget(), signal);
    }

    /**
     * Voice Room Mesh WebRTC Signaling
     * Relays peer-to-peer signals between participants in a voice room.
     */
    @MessageMapping("/voice/signal")
    public void handleVoiceRoomSignal(@Payload CallSignalMessage signal) {
        if (signal == null) return;
        log.info("[SIGNALING VOICE] Route {} from {} (target: {}, room: {})", signal.getType(), signal.getSender(), signal.getTarget(), signal.getChatId());

        if (signal.getTarget() != null && !signal.getTarget().isEmpty()) {
            // Direct signal to a specific peer in the room
            messagingTemplate.convertAndSend("/topic/voice/user/" + signal.getTarget(), signal);
        } else if (signal.getChatId() != null) {
            // Broadcast signal to the entire voice room
            messagingTemplate.convertAndSend("/topic/voice/" + signal.getChatId() + "/signals", signal);
        }
    }

    /**
     * Join a multi-user voice room
     */
    @MessageMapping("/voice/join")
    public void joinVoiceRoom(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        if (payload == null) return;

        Number chatIdNum = (Number) payload.get("chatId");
        String username = (String) payload.get("username");
        String sessionId = headerAccessor.getSessionId();

        if (chatIdNum != null && username != null && sessionId != null) {
            voiceRoomService.joinRoom(chatIdNum.longValue(), username, sessionId);
        }
    }

    /**
     * Leave a multi-user voice room
     */
    @MessageMapping("/voice/leave")
    public void leaveVoiceRoom(@Payload Map<String, Object> payload) {
        if (payload == null) return;

        Number chatIdNum = (Number) payload.get("chatId");
        String username = (String) payload.get("username");

        if (chatIdNum != null && username != null) {
            voiceRoomService.leaveRoom(chatIdNum.longValue(), username);
        }
    }

    /**
     * Update mute / speaking state in a voice room
     */
    @MessageMapping("/voice/state")
    public void updateVoiceState(@Payload Map<String, Object> payload) {
        if (payload == null) return;

        Number chatIdNum = (Number) payload.get("chatId");
        String username = (String) payload.get("username");
        Boolean muted = payload.get("muted") != null ? (Boolean) payload.get("muted") : null;
        Boolean speaking = payload.get("speaking") != null ? (Boolean) payload.get("speaking") : null;

        if (chatIdNum != null && username != null) {
            voiceRoomService.updateParticipantState(chatIdNum.longValue(), username, muted, speaking);
        }
    }
}
