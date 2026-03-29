package com.finguard.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.finguard.model.Transaction;
import com.finguard.service.TransactionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.CopyOnWriteArrayList;

/**
 * WebSocket handler that pushes a new scored transaction every 1.5 seconds
 * to all connected dashboard clients.
 */
@Component
public class TransactionWebSocketHandler extends TextWebSocketHandler {

    private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final TransactionService transactionService;
    private final ObjectMapper mapper;

    public TransactionWebSocketHandler(TransactionService transactionService) {
        this.transactionService = transactionService;
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Scheduled(fixedRate = 1500)
    public void broadcastTransaction() {
        if (sessions.isEmpty()) return;
        try {
            Transaction tx = transactionService.generateAndScore();
            String payload = mapper.writeValueAsString(tx);
            TextMessage message = new TextMessage(payload);
            sessions.removeIf(s -> !s.isOpen());
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
        } catch (Exception e) {
            // Log in production
        }
    }
}
