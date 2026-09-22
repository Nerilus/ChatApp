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

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(ChatControllerIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Integration Test: Création et consultation des salons de discussion")
    void testCreateAndGetChats() throws Exception {
        log.info("[TEST INTEGRATION] Début du test ChatController (GET & POST /api/chats)");

        // 1. Create a chat room
        String chatJson = "{\"topic\": \"Salon Integration Test\"}";
        log.info("[TEST INTEGRATION] Création d'un salon: {}", chatJson);

        mockMvc.perform(post("/api/chats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.topic").value("Salon Integration Test"));

        // 2. Fetch all chats
        log.info("[TEST INTEGRATION] Récupération de la liste des salons");
        mockMvc.perform(get("/api/chats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        log.info("[TEST INTEGRATION] Salons récupérés avec succès");
    }
}
