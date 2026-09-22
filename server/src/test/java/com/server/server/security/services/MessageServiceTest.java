package com.server.server.security.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Collections;
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

import com.server.server.models.Chat;
import com.server.server.models.Message;
import com.server.server.models.User;
import com.server.server.repository.MessageRepository;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    private static final Logger log = LoggerFactory.getLogger(MessageServiceTest.class);

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageService messageService;

    @Test
    @DisplayName("Unit Test: Création de message avec date automatique et diffusion STOMP")
    void testCreateMessageAndBroadcast() {
        log.info("[TEST UNITAIRE] Début du test de création et diffusion d'un message");

        Chat chat = new Chat("Général");
        chat.setId(1L);

        User user = new User("herby", "herby@test.com", "secret");
        user.setId(4L);

        Message message = new Message();
        message.setContent("Hello testing world!");
        message.setChat(chat);
        message.setUser(user);

        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
            Message m = invocation.getArgument(0);
            m.setId(100L);
            return m;
        });

        Message saved = messageService.createMessage(message);

        assertNotNull(saved, "Le message sauvegardé ne doit pas être nul");
        assertEquals(100L, saved.getId());
        assertNotNull(saved.getDate(), "La date doit être automatiquement initialisée");
        assertEquals("Hello testing world!", saved.getContent());

        // Verify WebSocket broadcast
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/chat/1"), eq(saved));
        log.info("[TEST UNITAIRE] Message sauvegardé avec ID {} et diffusé avec succès sur /topic/chat/1", saved.getId());
    }

    @Test
    @DisplayName("Unit Test: Récupération des messages par salon chatId")
    void testGetMessagesByChatId() {
        log.info("[TEST UNITAIRE] Récupération des messages par salon");
        Message msg = new Message();
        msg.setContent("Test content");

        when(messageRepository.findByChatId(1L)).thenReturn(List.of(msg));

        List<Message> results = messageService.getMessagesByChatId(1L);
        assertEquals(1, results.size());
        assertEquals("Test content", results.get(0).getContent());
        log.info("[TEST UNITAIRE] 1 message trouvé pour le salon 1");
    }
}
