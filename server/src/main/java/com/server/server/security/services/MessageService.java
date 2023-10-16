package com.server.server.security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.server.server.models.Message;
import com.server.server.repository.MessageRepository;

@Service
public class MessageService {
    
   @Autowired
   public MessageRepository messageRepository;
   
   public List<Message> getallMessages(){
    return this.messageRepository.findAll();
   }

   public List<Message> getMessagesByChatId(Long chatId){
    return this.messageRepository.findByChatId(chatId);
   }

   public Message createMessage(Message message) {
    return messageRepository.save(message);
  
}

}
