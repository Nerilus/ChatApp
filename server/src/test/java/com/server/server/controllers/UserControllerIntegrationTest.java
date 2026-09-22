package com.server.server.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import com.server.server.security.services.UserPresenceService;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(UserControllerIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserPresenceService presenceService;

    @Test
    @DisplayName("Integration Test: Consultation des utilisateurs en ligne et des activités Teams")
    void testOnlineUsersAndActivities() throws Exception {
        log.info("[TEST INTEGRATION] Début du test UserController");

        // Simulate an online user
        presenceService.userConnected("session-integ-1", "user_teams_test");

        // 1. GET /api/users/online
        log.info("[TEST INTEGRATION] Appel GET /api/users/online");
        mockMvc.perform(get("/api/users/online"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@ == 'user_teams_test')]").exists());

        // 2. GET /api/users/activities
        log.info("[TEST INTEGRATION] Appel GET /api/users/activities");
        mockMvc.perform(get("/api/users/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.username == 'user_teams_test')].status").value("AVAILABLE"));

        log.info("[TEST INTEGRATION] Présence et statut Teams correctement validés");
    }
}
