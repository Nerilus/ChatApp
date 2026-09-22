package com.server.server.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import com.server.server.security.services.UserPresenceService;

@Controller
public class PresenceController {

    @Autowired
    private UserPresenceService presenceService;

    @MessageMapping("/user/presence")
    public void registerPresence(@Payload Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String username = payload != null ? payload.get("username") : null;
        if (username != null && sessionId != null) {
            presenceService.userConnected(sessionId, username);
        }
    }
}
