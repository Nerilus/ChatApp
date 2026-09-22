package com.server.server.controllers;

import java.util.List;
import java.util.Optional;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.server.models.Chat;
import com.server.server.payload.VoiceParticipant;
import com.server.server.security.services.ChatService;
import com.server.server.security.services.VoiceRoomService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    public ChatService chatService;

    @Autowired
    private VoiceRoomService voiceRoomService;

    @GetMapping
    public ResponseEntity<List<Chat>> getAllChats() {
        List<Chat> chats = chatService.getAllchats();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chat> getChatById(@PathVariable Long id) {
        Optional<Chat> chat = chatService.getChatById(id);
        return chat.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/voice/rooms")
    public ResponseEntity<Map<Long, List<VoiceParticipant>>> getVoiceRooms() {
        return ResponseEntity.ok(voiceRoomService.getAllRooms());
    }

    @GetMapping("/voice/{id}/participants")
    public ResponseEntity<List<VoiceParticipant>> getVoiceParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(voiceRoomService.getParticipants(id));
    }

    @PostMapping
    public ResponseEntity<?> createChat(@RequestBody Chat chat) {
        if (chat.getTopic() == null || chat.getTopic().trim().isEmpty()) {
            chat.setTopic("Général");
        }
        if (chat.getType() == null || chat.getType().trim().isEmpty()) {
            chat.setType("TEXT");
        } else {
            chat.setType(chat.getType().toUpperCase().trim());
        }
        Chat createdChat = chatService.createChat(chat);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdChat);
    }
}
