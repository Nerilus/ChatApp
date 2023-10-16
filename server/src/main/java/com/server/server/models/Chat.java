package com.server.server.models;

import jakarta.persistence.*;


@Entity
@Table(name = "chats")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private long Id;

    private String topic;

    public Chat(){}


    public long getId() {
      return this.Id;
    }
    public void setId(long value) {
      this.Id = value;
    }

     public String getTopic() {
      return this.topic;
    }
    public void setTopic(String value) {
      this.topic = value;
    }

    
}

   
