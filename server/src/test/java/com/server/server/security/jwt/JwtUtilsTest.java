package com.server.server.security.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import com.server.server.security.services.UserDetailsImpl;

class JwtUtilsTest {

    private static final Logger log = LoggerFactory.getLogger(JwtUtilsTest.class);

    private JwtUtils jwtUtils;
    // 256-bit Base64 secret key
    private final String testSecret = "Y2hhdEFwcFN1cGVyU2VjcmV0S2V5Rm9ySldUVG9rZW5TaWduaW5nMTIzNDU2Nzg5MDEyMzQ1Ng==";
    private final int testExpirationMs = 3600000; // 1h

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", testExpirationMs);
    }

    @Test
    @DisplayName("Unit Test: Génération et validation d'un token JWT valide")
    void testGenerateAndValidateJwtToken() {
        log.info("[TEST UNITAIRE] Début du test de génération et validation de token JWT");

        UserDetailsImpl userDetails = new UserDetailsImpl(
                1L, "testuser", "test@test.com", "password", Collections.emptyList());

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);

        String token = jwtUtils.generateJwtToken(auth);
        log.debug("[TEST UNITAIRE] Token JWT généré avec succès: {}", token);

        assertNotNull(token, "Le token JWT ne doit pas être nul");
        assertTrue(jwtUtils.validateJwtToken(token), "Le token généré doit être valide");

        String username = jwtUtils.getUserNameFromJwtToken(token);
        assertEquals("testuser", username, "Le nom d'utilisateur extrait doit correspondre");
        log.info("[TEST UNITAIRE] Token validé avec succès pour l'utilisateur: {}", username);
    }

    @Test
    @DisplayName("Unit Test: Rejet d'un token JWT altéré ou invalide")
    void testInvalidJwtToken() {
        log.info("[TEST UNITAIRE] Début du test de détection de token JWT invalide");
        String fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";

        boolean isValid = jwtUtils.validateJwtToken(fakeToken);
        assertFalse(isValid, "Un token altéré doit être rejeté");
        log.info("[TEST UNITAIRE] Le token invalide a été correctement rejeté (isValid = false)");
    }
}
