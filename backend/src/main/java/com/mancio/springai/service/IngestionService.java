package com.mancio.springai.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;

@Service
public class IngestionService {

    private final VectorStore vectorStore;
    private final TokenTextSplitter splitter;

    public IngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
        // chunkSize=800 token, minChunkSizeChars=350, minChunkLengthToEmbed=5, maxNumChunks=10000, keepSeparator=true
        this.splitter = new TokenTextSplitter();
    }

    public int ingest(MultipartFile file) throws IOException {
        String originalFilename = Objects.requireNonNullElse(file.getOriginalFilename(), "document");
        Path tempFile = Files.createTempFile("rag-", "-" + originalFilename);

        try {
            // Scrive il file upload su disco temporaneo
            file.transferTo(tempFile.toFile());

            // 1. READ — Apache Tika legge qualsiasi formato (PDF, DOCX, TXT, HTML, ...)
            TikaDocumentReader reader = new TikaDocumentReader(new FileSystemResource(tempFile.toFile()));
            List<Document> documents = reader.get();

            // Aggiunge metadato sorgente a ogni documento
            documents.forEach(doc -> doc.getMetadata().put("source", originalFilename));

            // 2. TRANSFORM — Suddivide in chunk con overlap
            List<Document> chunks = splitter.apply(documents);

            // 3. LOAD — Calcola gli embedding (Ollama nomic-embed-text) e salva in PGVector
            vectorStore.add(chunks);

            return chunks.size();
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }
}

