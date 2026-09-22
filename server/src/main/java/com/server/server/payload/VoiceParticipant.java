package com.server.server.payload;

import java.util.Date;
import java.util.Objects;

public class VoiceParticipant {
    private String username;
    private String sessionId;
    private boolean muted;
    private boolean speaking;
    private Date joinedAt;

    public VoiceParticipant() {}

    public VoiceParticipant(String username, String sessionId) {
        this.username = username;
        this.sessionId = sessionId;
        this.muted = false;
        this.speaking = false;
        this.joinedAt = new Date();
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public boolean isMuted() {
        return muted;
    }

    public void setMuted(boolean muted) {
        this.muted = muted;
    }

    public boolean isSpeaking() {
        return speaking;
    }

    public void setSpeaking(boolean speaking) {
        this.speaking = speaking;
    }

    public Date getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Date joinedAt) {
        this.joinedAt = joinedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VoiceParticipant)) return false;
        VoiceParticipant that = (VoiceParticipant) o;
        return Objects.equals(username, that.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username);
    }
}
