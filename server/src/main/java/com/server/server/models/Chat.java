package com.server.server.models;

import jakarta.persistence.*;

@Entity
@Table(name = "chats")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String topic;

    private String type = "TEXT";

    public Chat() {}

    public Chat(String topic) {
        this.topic = topic;
        this.type = "TEXT";
    }

    public Chat(String topic, String type) {
        this.topic = topic;
        this.type = (type != null && !type.trim().isEmpty()) ? type : "TEXT";
    }

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTopic() {
        return this.topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
