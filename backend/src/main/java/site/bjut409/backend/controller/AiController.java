package site.bjut409.backend.controller;

import tools.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.dto.AiChatRequest;
import site.bjut409.backend.dto.AiChatResponse;
import site.bjut409.backend.dto.AiPendingActionView;
import site.bjut409.backend.service.AiAssistantService;
import site.bjut409.backend.service.AiPendingActionService;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
public class AiController {

    private final AuthSupport authSupport;
    private final AiAssistantService aiAssistantService;
    private final AiPendingActionService aiPendingActionService;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor();

    public AiController(AuthSupport authSupport,
                        AiAssistantService aiAssistantService,
                        AiPendingActionService aiPendingActionService,
                        ObjectMapper objectMapper) {
        this.authSupport = authSupport;
        this.aiAssistantService = aiAssistantService;
        this.aiPendingActionService = aiPendingActionService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/ai/chat")
    public ApiResponse<AiChatResponse> chat(@RequestHeader("Authorization") String authorization,
                                            @RequestBody AiChatRequest request) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(aiAssistantService.chat(actor, request));
    }

    @PostMapping(path = "/ai/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestHeader("Authorization") String authorization,
                             @RequestBody AiChatRequest request) {
        AuthUser actor = authSupport.requireUser(authorization);
        SseEmitter emitter = new SseEmitter(0L);
        executorService.execute(() -> {
            try {
                aiAssistantService.stream(actor, request, new SseSink(emitter, objectMapper));
            } catch (Exception ex) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data(Map.of("message", ex.getMessage())));
                } catch (IOException ignored) {
                }
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }

    @PostMapping("/ai/actions/{actionId}/confirm")
    public ApiResponse<AiChatResponse> confirm(@RequestHeader("Authorization") String authorization,
                                               @PathVariable("actionId") String actionId) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(aiPendingActionService.confirm(actor, actionId));
    }

    private static final class SseSink implements AiAssistantService.AiEventSink {

        private final SseEmitter emitter;
        private final ObjectMapper objectMapper;

        private SseSink(SseEmitter emitter, ObjectMapper objectMapper) {
            this.emitter = emitter;
            this.objectMapper = objectMapper;
        }

        @Override
        public void status(String stage, String message) {
            send("status", Map.of("stage", stage, "message", message));
        }

        @Override
        public void toolCall(String toolName) {
            send("tool_call", Map.of("tool", toolName));
        }

        @Override
        public void delta(String chunk) {
            send("delta", Map.of("content", chunk));
        }

        @Override
        public void actionRequired(AiPendingActionView pendingAction) {
            send("action_required", pendingAction);
        }

        @Override
        public void done(AiChatResponse response) {
            send("done", response);
            emitter.complete();
        }

        private void send(String event, Object data) {
            try {
                Object payload = data instanceof String ? data : objectMapper.writeValueAsString(data);
                emitter.send(SseEmitter.event().name(event).data(payload));
            } catch (IOException ex) {
                throw new IllegalStateException(ex);
            }
        }
    }
}
