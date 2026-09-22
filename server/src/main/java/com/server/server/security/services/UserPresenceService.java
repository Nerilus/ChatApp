package com.server.server.security.services;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
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

import com.server.server.payload.response.UserActivityInfo;

@Service
public class UserPresenceService {

    private static final Logger log = LoggerFactory.getLogger(UserPresenceService.class);

    // Maps sessionId -> username
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    // Maps username -> UserActivityInfo
    private final Map<String, UserActivityInfo> userActivityMap = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public synchronized void userConnected(String sessionId, String username) {
        if (username != null && !username.trim().isEmpty()) {
            String trimmed = username.trim();
            sessionUserMap.put(sessionId, trimmed);
            
            Date now = new Date();
            UserActivityInfo info = userActivityMap.computeIfAbsent(trimmed, u -> new UserActivityInfo(u, "AVAILABLE", now, now));
            info.setStatus("AVAILABLE");
            info.setLastActive(now);

            log.info("[PRESENCE] User online: {} (Session ID: {})", trimmed, sessionId);
            broadcastOnlineUsers();
        }
    }

    public synchronized void userDisconnected(String sessionId) {
        String username = sessionUserMap.remove(sessionId);
        if (username != null) {
            // Check if user has other active sessions (e.g. multi-tabs)
            boolean hasOtherSessions = sessionUserMap.containsValue(username);
            if (!hasOtherSessions) {
                UserActivityInfo info = userActivityMap.get(username);
                if (info != null) {
                    info.setStatus("OFFLINE");
                    info.setLastActive(new Date());
                }
                log.info("[PRESENCE] User went offline: {} (Session ID: {})", username, sessionId);
            } else {
                log.debug("[PRESENCE] User disconnected session {} but still active on another tab", sessionId);
            }
            broadcastOnlineUsers();
        }
    }

    public synchronized void updateActivity(String username, String status) {
        if (username != null) {
            UserActivityInfo info = userActivityMap.get(username.trim());
            if (info != null) {
                if (status != null) {
                    info.setStatus(status);
                }
                info.setLastActive(new Date());
                broadcastOnlineUsers();
            }
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        userDisconnected(event.getSessionId());
    }

    public Set<String> getOnlineUsers() {
        return new HashSet<>(sessionUserMap.values());
    }

    public List<UserActivityInfo> getAllActivities() {
        return new ArrayList<>(userActivityMap.values());
    }

    public UserActivityInfo getUserActivity(String username) {
        return userActivityMap.get(username);
    }

    public void broadcastOnlineUsers() {
        if (messagingTemplate != null) {
            List<UserActivityInfo> activities = getAllActivities();
            messagingTemplate.convertAndSend("/topic/online-users", activities);
            log.debug("[PRESENCE] Broadcasted {} user activities to /topic/online-users", activities.size());
        }
    }
}
