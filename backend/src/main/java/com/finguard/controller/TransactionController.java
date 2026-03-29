package com.finguard.controller;

import com.finguard.model.Transaction;
import com.finguard.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * GET /api/transactions/history?limit=50
     * Returns recent transaction history
     */
    @GetMapping("/history")
    public ResponseEntity<List<Transaction>> getHistory(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(transactionService.getHistory(limit));
    }

    /**
     * POST /api/transactions/score
     * Submit a transaction for real-time fraud scoring
     * Special backend feature: multi-factor ML scoring returns in < 5ms
     */
    @PostMapping("/score")
    public ResponseEntity<Transaction> scoreTransaction(@RequestBody Transaction tx) {
        Transaction scored = transactionService.scoreIncoming(tx);
        return ResponseEntity.ok(scored);
    }

    /**
     * GET /api/transactions/stats
     * System-wide fraud statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(transactionService.getStats());
    }

    /**
     * POST /api/transactions/generate
     * Manually trigger a synthetic transaction (for demo/testing)
     */
    @PostMapping("/generate")
    public ResponseEntity<Transaction> generate() {
        return ResponseEntity.ok(transactionService.generateAndScore());
    }
}
