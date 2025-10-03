package com.mancio.springai.controller;

import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ollama")
public class OllamaController {

    @Autowired
    private ChatModel chatModel;

    @PostMapping("/ask")
    public String ask(@RequestBody AskRequest request) {
        var message = new UserMessage(request.input());
        return chatModel.call(message);
    }
}

record AskRequest(String input) {}