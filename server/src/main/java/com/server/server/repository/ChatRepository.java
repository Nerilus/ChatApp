package com.server.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.server.server.models.Chat;

public interface ChatRepository  extends  JpaRepository<Chat, Long>{
    
}
