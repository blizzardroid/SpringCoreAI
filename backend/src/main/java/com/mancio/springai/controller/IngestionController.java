package com.mancio.springai.controller;

import com.mancio.springai.service.IngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/rag")
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    /**
     * Accetta un file (PDF, DOCX, TXT, HTML, ...), lo indicizza nel vector store
     * e restituisce il numero di chunk salvati.
     *
     * curl -X POST http://localhost:8080/api/rag/ingest \
     *      -F "file=@documento.pdf"
     */
    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> ingest(@RequestParam("file") MultipartFile file) {
        try {
            int chunks = ingestionService.ingest(file);
            return ResponseEntity.ok(Map.of(
                    "status",   "success",
                    "filename", Objects.requireNonNullElse(file.getOriginalFilename(), "unknown"),
                    "chunks",   chunks
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status",  "error",
                    "message", e.getMessage()
            ));
        }
    }
}

