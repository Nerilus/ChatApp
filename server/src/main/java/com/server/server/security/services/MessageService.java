package com.server.server.security.services;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.server.server.models.Message;
import com.server.server.repository.MessageRepository;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public List<Message> getallMessages() {
        return messageRepository.findAll();
    }

    public List<Message> getMessagesByChatId(Long chatId) {
        return messageRepository.findByChatId(chatId);
    }

    public Message createMessage(Message message) {
        if (message.getDate() == null) {
            message.setDate(new Date());
        }
        Message saved = messageRepository.save(message);

        // Broadcast to WebSocket subscribers on /topic/chat/{chatId}
        if (messagingTemplate != null && saved.getChat() != null && saved.getChat().getId() != null) {
            messagingTemplate.convertAndSend("/topic/chat/" + saved.getChat().getId(), saved);
        }

        return saved;
    }
}
