package com.server.server.security.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.server.server.payload.VoiceParticipant;

@ExtendWith(MockitoExtension.class)
class VoiceRoomServiceTest {

    private static final Logger log = LoggerFactory.getLogger(VoiceRoomServiceTest.class);

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private VoiceRoomService voiceRoomService;

    @Test
    @DisplayName("Unit Test: Connexion à un salon vocal et diffusion des participants")
    void testJoinAndLeaveVoiceRoom() {
        log.info("[TEST UNITAIRE] Test join & leave VoiceRoomService");

        voiceRoomService.joinRoom(10L, "alice", "sess-1");

        List<VoiceParticipant> participants = voiceRoomService.getParticipants(10L);
        assertEquals(1, participants.size());
        assertEquals("alice", participants.get(0).getUsername());
        assertFalse(participants.get(0).isMuted());

        // Alice updates her state (e.g. muted)
        voiceRoomService.updateParticipantState(10L, "alice", true, false);
        participants = voiceRoomService.getParticipants(10L);
        assertTrue(participants.get(0).isMuted());

        // Alice leaves room
        voiceRoomService.leaveRoom(10L, "alice");
        participants = voiceRoomService.getParticipants(10L);
        assertTrue(participants.isEmpty());

        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/voice/10/participants"), anyList());
        log.info("[TEST UNITAIRE] Alice a rejoint, muté et quitté le salon vocal avec succès");
    }
}
