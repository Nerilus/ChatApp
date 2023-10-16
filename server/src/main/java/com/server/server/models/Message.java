package com.server.server.models;

import java.util.Date;

import jakarta.persistence.*;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "chat_id")
    private Chat chat;

    private Date date;
    private String content;
    
    public Message() {}

    public Long getId() {
      return this.id;
    }
    public void setId(Long value) {
      this.id = value;
    }

    public User getUser() {
      return this.user;
    }
    public void setUser(User value) {
      this.user = value;
    }

    public Chat getChat() {
      return this.chat;
    }
    public void setChat(Chat value) {
      this.chat = value;
    }

    public Date getDate() {
      return this.date;
    }
    public void setDate(Date value) {
      this.date = value;
    }

    public String getContent() {
      return this.content;
    }
    public void setContent(String value) {
      this.content = value;
    }
}
