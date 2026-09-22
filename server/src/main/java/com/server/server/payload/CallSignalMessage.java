package com.server.server.payload;

public class CallSignalMessage {
    private String type;
    private String sender;
    private String target;
    private Object data;
    private Long chatId;

    public CallSignalMessage() {}

    public CallSignalMessage(String type, String sender, String target, Object data, Long chatId) {
        this.type = type;
        this.sender = sender;
        this.target = target;
        this.data = data;
        this.chatId = chatId;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSender() {
        return this.sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getTarget() {
        return this.target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public Object getData() {
        return this.data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public Long getChatId() {
        return this.chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }
}
