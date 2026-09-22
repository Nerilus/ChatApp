package com.server.server.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.server.server.models.Chat;
import com.server.server.repository.ChatRepository;

@SpringBootTest
@AutoConfigureMockMvc
class MessageControllerIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(MessageControllerIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ChatRepository chatRepository;

    @Test
    @DisplayName("Integration Test: Envoi et récupération de messages pour un salon")
    void testMessageFlow() throws Exception {
        log.info("[TEST INTEGRATION] Début du test MessageController");

        // Prepare a chat room in DB
        Chat chat = chatRepository.save(new Chat("Salon Test Messages"));

        // Post a message
        String msgJson = String.format("{\"chatId\": %d, \"content\": \"Message de test d'intégration\"}", chat.getId());
        log.info("[TEST INTEGRATION] Envoi POST /api/messages: {}", msgJson);

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(msgJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.content").value("Message de test d'intégration"))
                .andExpect(jsonPath("$.date").isNotEmpty());

        // Get messages for this chat
        log.info("[TEST INTEGRATION] Récupération GET /api/messages/chat/{}", chat.getId());
        mockMvc.perform(get("/api/messages/chat/" + chat.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].content").value("Message de test d'intégration"));

        log.info("[TEST INTEGRATION] Message correctement persisté et récupéré");
    }

    @Test
    @DisplayName("Integration Test: Envoi d'une note vocale via POST /api/messages/audio")
    void testAudioMessageUpload() throws Exception {
        log.info("[TEST INTEGRATION] Début du test Upload Note Vocale");

        Chat chat = chatRepository.save(new Chat("Salon Test Audio"));

        org.springframework.mock.web.MockMultipartFile audioFile = new org.springframework.mock.web.MockMultipartFile(
                "file",
                "sample_voice.webm",
                "audio/webm",
                "fake-audio-bytes-content".getBytes()
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/messages/audio")
                .file(audioFile)
                .param("chatId", String.valueOf(chat.getId()))
                .param("duration", "7"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.messageType").value("AUDIO"))
                .andExpect(jsonPath("$.mediaUrl").isNotEmpty())
                .andExpect(jsonPath("$.duration").value(7));

        log.info("[TEST INTEGRATION] Note vocale uploadée et enregistrée avec succès");
    }
}
