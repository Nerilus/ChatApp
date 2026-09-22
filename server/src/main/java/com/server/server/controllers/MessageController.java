package com.server.server.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.server.server.models.Chat;
import com.server.server.models.Message;
import com.server.server.models.User;
import com.server.server.payload.request.MessageRequest;
import com.server.server.repository.ChatRepository;
import com.server.server.repository.UserRepository;
import com.server.server.security.services.MessageService;
import com.server.server.security.services.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages() {
        List<Message> messages = messageService.getallMessages();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<Message>> getMessagesByChatId(@PathVariable Long chatId) {
        List<Message> messages = messageService.getMessagesByChatId(chatId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<?> createMessage(@Valid @RequestBody MessageRequest messageRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User sender = null;

        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            sender = userRepository.findById(userDetails.getId()).orElse(null);
        } else if (authentication != null && authentication.getName() != null) {
            sender = userRepository.findByUsername(authentication.getName()).orElse(null);
        }

        Chat chat = chatRepository.findById(messageRequest.getChatId()).orElse(null);
        if (chat == null) {
            return ResponseEntity.badRequest().body("Error: Chat room not found.");
        }

        Message message = new Message();
        message.setContent(messageRequest.getContent());
        message.setChat(chat);
        message.setUser(sender);
        message.setDate(new Date());

        Message createdMessage = messageService.createMessage(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMessage);
    }

    @PostMapping("/audio")
    public ResponseEntity<?> createAudioMessage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chatId") Long chatId,
            @RequestParam(value = "duration", required = false, defaultValue = "0") Integer duration) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Audio file is empty.");
        }

        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) {
            return ResponseEntity.badRequest().body("Error: Chat room not found.");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User sender = null;

        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            sender = userRepository.findById(userDetails.getId()).orElse(null);
        } else if (authentication != null && authentication.getName() != null) {
            sender = userRepository.findByUsername(authentication.getName()).orElse(null);
        }

        try {
            Path uploadDir = Paths.get("uploads", "audio");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalName = file.getOriginalFilename();
            String extension = ".webm";
            if (originalName != null && originalName.lastIndexOf(".") > 0) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }

            String filename = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            Message message = new Message();
            message.setMessageType("AUDIO");
            message.setMediaUrl("/uploads/audio/" + filename);
            message.setDuration(duration != null ? duration : 0);
            message.setContent("Note vocale (" + (duration != null ? duration : 0) + "s)");
            message.setChat(chat);
            message.setUser(sender);
            message.setDate(new Date());

            Message createdMessage = messageService.createMessage(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMessage);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading audio file: " + e.getMessage());
        }
    }
}
