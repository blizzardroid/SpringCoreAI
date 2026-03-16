package com.mancio.springai.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private static final String SYSTEM_PROMPT =
            "You are a helpful assistant. Answer ONLY based on the context documents provided. "
            + "If the answer is not present in the context, explicitly state that you do not have "
            + "enough information in the uploaded documents. Reply in the same language as the question.";

    private final ChatClient chatClient;

    public RagController(ChatClient.Builder builder, VectorStore vectorStore) {
        SearchRequest searchRequest = SearchRequest.builder()
                .topK(5)
                .similarityThreshold(0.5)
                .build();

        this.chatClient = builder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore).searchRequest(searchRequest).build())
                .build();
    }

    @PostMapping("/ask")
    public String ask(@RequestBody RagRequest request) {
        return chatClient.prompt()
                .user(request.input())
                .call()
                .content();
    }
}

record RagRequest(String input) {}

