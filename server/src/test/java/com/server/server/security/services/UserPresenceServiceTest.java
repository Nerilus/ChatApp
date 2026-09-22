package com.server.server.security.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.server.server.payload.response.UserActivityInfo;

@ExtendWith(MockitoExtension.class)
class UserPresenceServiceTest {

    private static final Logger log = LoggerFactory.getLogger(UserPresenceServiceTest.class);

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private UserPresenceService presenceService;

    @Test
    @DisplayName("Unit Test: Connexion utilisateur, statut AVAILABLE et diffusion présence")
    void testUserConnected() {
        log.info("[TEST UNITAIRE] Test de connexion et mise à disposition de l'utilisateur");

        presenceService.userConnected("session-123", "alice");

        Set<String> onlineUsers = presenceService.getOnlineUsers();
        assertTrue(onlineUsers.contains("alice"), "Alice doit être dans la liste des utilisateurs en ligne");

        UserActivityInfo activity = presenceService.getUserActivity("alice");
        assertNotNull(activity, "L'activité de présence doit exister");
        assertEquals("AVAILABLE", activity.getStatus(), "Le statut initial doit être AVAILABLE");
        assertNotNull(activity.getLastActive(), "Le timestamp lastActive doit être présent");

        // Verify WebSocket broadcast
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/online-users"), anyList());
        log.info("[TEST UNITAIRE] Alice est correctement en ligne avec statut AVAILABLE");
    }

    @Test
    @DisplayName("Unit Test: Déconnexion utilisateur et bascule vers statut OFFLINE")
    void testUserDisconnected() {
        log.info("[TEST UNITAIRE] Test de déconnexion utilisateur");

        presenceService.userConnected("session-456", "bob");
        assertTrue(presenceService.getOnlineUsers().contains("bob"));

        presenceService.userDisconnected("session-456");
        assertFalse(presenceService.getOnlineUsers().contains("bob"), "Bob ne doit plus être dans la liste online");

        UserActivityInfo activity = presenceService.getUserActivity("bob");
        assertNotNull(activity);
        assertEquals("OFFLINE", activity.getStatus(), "Le statut après déconnexion doit être OFFLINE");
        log.info("[TEST UNITAIRE] Bob est correctement passé en statut OFFLINE");
    }

    @Test
    @DisplayName("Unit Test: Mise à jour manuelle de l'activité (ex: AWAY / inactif)")
    void testUpdateActivity() {
        log.info("[TEST UNITAIRE] Test de passage en inactif");

        presenceService.userConnected("session-789", "charlie");
        presenceService.updateActivity("charlie", "AWAY");

        UserActivityInfo activity = presenceService.getUserActivity("charlie");
        assertEquals("AWAY", activity.getStatus(), "Le statut doit être mis à jour à AWAY");
        log.info("[TEST UNITAIRE] Charlie est passé en statut AWAY");
    }
}
