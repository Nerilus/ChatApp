package com.server.server.payload.response;

import java.util.Date;

public class UserActivityInfo {
    private String username;
    private String status; // "AVAILABLE", "AWAY", "OFFLINE"
    private Date lastActive;
    private Date connectedAt;

    public UserActivityInfo() {}

    public UserActivityInfo(String username, String status, Date lastActive, Date connectedAt) {
        this.username = username;
        this.status = status;
        this.lastActive = lastActive;
        this.connectedAt = connectedAt;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getLastActive() {
        return lastActive;
    }

    public void setLastActive(Date lastActive) {
        this.lastActive = lastActive;
    }

    public Date getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Date connectedAt) {
        this.connectedAt = connectedAt;
    }
}
