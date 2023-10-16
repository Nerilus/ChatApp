package com.server.server.security.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.server.server.models.Chat;
import com.server.server.repository.ChatRepository;

@Service
public class ChatService {
    
    @Autowired
    private ChatRepository chatRepository;

    public List<Chat> getAllchats(){
        return chatRepository.findAll();
    }

    public Chat createChat(Chat chat){
        return chatRepository.save(chat);
    }
    public Optional<Chat> getChatById(Long id) {
        return chatRepository.findById(id);
    }

}
