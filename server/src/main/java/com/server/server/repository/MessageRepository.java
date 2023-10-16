package com.server.server.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.server.server.models.Message;


public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatId(Long chatId);
}
