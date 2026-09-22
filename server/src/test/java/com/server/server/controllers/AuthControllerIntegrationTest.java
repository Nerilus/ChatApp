package com.server.server.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.server.server.models.ERole;
import com.server.server.models.Role;
import com.server.server.repository.RoleRepository;
import com.server.server.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AuthControllerIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void initRoles() {
        if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
            roleRepository.save(new Role(ERole.ROLE_USER));
        }
        if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
            roleRepository.save(new Role(ERole.ROLE_ADMIN));
        }
        if (roleRepository.findByName(ERole.ROLE_MODERATOR).isEmpty()) {
            roleRepository.save(new Role(ERole.ROLE_MODERATOR));
        }
    }

    @Test
    @DisplayName("Integration Test: Inscription d'un nouvel utilisateur puis connexion avec token JWT")
    void testSignupAndSigninFlow() throws Exception {
        log.info("[TEST INTEGRATION] Début du scénario Inscription -> Connexion JWT");

        String signupJson = """
            {
                "username": "integ_user",
                "email": "integ@test.com",
                "password": "password123",
                "role": ["user"]
            }
        """;

        // 1. Signup
        log.info("[TEST INTEGRATION] Envoi POST /api/auth/signup");
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));

        log.info("[TEST INTEGRATION] Inscription validée avec succès");

        // 2. Signin
        String loginJson = """
            {
                "username": "integ_user",
                "password": "password123"
            }
        """;

        log.info("[TEST INTEGRATION] Envoi POST /api/auth/signin");
        mockMvc.perform(post("/api/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.username").value("integ_user"))
                .andExpect(jsonPath("$.email").value("integ@test.com"));

        log.info("[TEST INTEGRATION] Authentification réussie et JWT délivré !");
    }

    @Test
    @DisplayName("Integration Test: Rejet en cas de mauvais mot de passe (401 Unauthorized)")
    void testBadCredentials() throws Exception {
        log.info("[TEST INTEGRATION] Test de tentative avec mauvais identifiants");

        String badLoginJson = """
            {
                "username": "integ_user",
                "password": "wrong_password"
            }
        """;

        mockMvc.perform(post("/api/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(badLoginJson))
                .andExpect(status().isUnauthorized());

        log.info("[TEST INTEGRATION] Mauvais mot de passe correctement rejeté avec code 401");
    }
}
