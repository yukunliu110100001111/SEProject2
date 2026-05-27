package site.bjut409.backend.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.BizException;
import site.bjut409.backend.dto.AiChatMessage;
import site.bjut409.backend.dto.AiChatRequest;
import site.bjut409.backend.dto.AiChatResponse;
import site.bjut409.backend.dto.AiPendingActionView;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiAssistantService {

    private static final int MAX_TOOL_STEPS = 6;

    private final AiToolService aiToolService;
    private final AiPendingActionService aiPendingActionService;
    private final ArkChatClient arkChatClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.ark.model}")
    private String model;

    public AiAssistantService(AiToolService aiToolService,
                              AiPendingActionService aiPendingActionService,
                              ArkChatClient arkChatClient,
                              ObjectMapper objectMapper) {
        this.aiToolService = aiToolService;
        this.aiPendingActionService = aiPendingActionService;
        this.arkChatClient = arkChatClient;
        this.objectMapper = objectMapper;
    }

    public AiChatResponse chat(AuthUser actor, AiChatRequest request) {
        return runConversation(actor, request, new NoOpEventSink());
    }

    public AiChatResponse stream(AuthUser actor, AiChatRequest request, AiEventSink eventSink) {
        return runConversation(actor, request, eventSink);
    }

    private AiChatResponse runConversation(AuthUser actor, AiChatRequest request, AiEventSink eventSink) {
        if (model == null || model.isBlank()) {
            throw new BizException(503, 503, "AI assistant is not configured. Please set AI_ARK_MODEL");
        }
        List<AiChatMessage> incoming = request == null || request.messages() == null
                ? List.of()
                : request.messages().stream()
                .filter(message -> message != null && message.content() != null && !message.content().isBlank())
                .limit(20)
                .toList();
        if (incoming.isEmpty()) {
            throw new BizException(400, 400, "Message cannot be empty");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(systemMessage(actor));
        for (AiChatMessage message : incoming) {
            String role = normalizeRole(message.role());
            messages.add(message(role, message.content()));
        }

        List<String> toolCalls = new ArrayList<>();

        for (int step = 0; step < MAX_TOOL_STEPS; step++) {
            eventSink.status("thinking", "Analyzing your request");
            String content = arkChatClient.chat(messages, model);
            JsonNode command = tryParseCommand(content);
            if (command == null) {
                return finalizeReply(content, toolCalls, eventSink);
            }

            String type = command.path("type").asText();
            if ("final".equals(type)) {
                String answer = command.path("answer").asText();
                return finalizeReply(answer.isBlank() ? content : answer, toolCalls, eventSink);
            }
            if (!isToolCall(type)) {
                if ("propose_action".equals(type)) {
                    return proposeAction(actor, command, toolCalls, eventSink);
                }
                return finalizeReply(content, toolCalls, eventSink);
            }

            String toolName = command.path("tool").asText();
            JsonNode arguments = command.path("arguments");
            eventSink.toolCall(toolName);
            Object result = aiToolService.execute(actor, toolName, arguments);
            String resultJson = writeJson(result);
            toolCalls.add(toolName);
            eventSink.status("tool_result", toolName + " returned a result");

            messages.add(message("assistant", content));
            messages.add(message("system",
                    "TOOL_RESULT " + toolName + ": " + resultJson
                            + "\nUse this result to continue. If more data is needed, request another tool_call. If the information is sufficient, return final."));
        }

        throw new BizException(502, 502, "Too many AI tool calls. Please rephrase the request");
    }

    private AiChatResponse finalizeReply(String reply, List<String> toolCalls, AiEventSink eventSink) {
        emitReply(reply, eventSink);
        AiChatResponse response = new AiChatResponse(reply, model, List.copyOf(toolCalls), null);
        eventSink.done(response);
        return response;
    }

    private AiChatResponse proposeAction(AuthUser actor,
                                         JsonNode command,
                                         List<String> toolCalls,
                                         AiEventSink eventSink) {
        String actionType = command.path("action").asText();
        String summary = command.path("summary").asText("Please confirm whether to run this action.");
        AiPendingActionView pendingAction = aiPendingActionService.create(actor, actionType,
                command.path("arguments"), summary);
        eventSink.actionRequired(pendingAction);
        AiChatResponse response = new AiChatResponse(summary, model, List.copyOf(toolCalls), pendingAction);
        eventSink.done(response);
        return response;
    }

    private Map<String, String> systemMessage(AuthUser actor) {
        String prompt = """
                You are GreenBite's English AI assistant.
                Your responsibilities:
                1. Help users understand meal recommendations, personal preferences, order status, and inventory information.
                2. Access database information only through backend tools. Never invent database results.
                3. For normal customers, prioritize the currently logged-in user's own data.
                4. Customers cannot view inventory. Only staff or admin users can view inventory summaries.

                Current logged-in user:
                - userId: %d
                - username: %s
                - role: %s

                Available tools:
                - get_user_profile { "userId"?: number }
                - get_recommendations { "userId"?: number }
                - search_meals { "keyword"?: string }
                - get_meal_detail { "mealId": number }
                - get_inventory_summary {}
                - get_order_status { "orderId": number }
                - You may propose these write actions for user confirmation:
                  1. update_preferences { "targetCalories"?: number, "targetProtein"?: number, "isVegetarian"?: boolean, "allergens"?: string[] }
                  2. create_order { "items": [{"mealId": number, "quantity": number}] }

                Output rules:
                - If you need database data, output JSON only. Do not include markdown or explanations:
                  {"type":"tool_call","tool":"tool_name","arguments":{...}}
                - If you can answer, also output JSON only:
                  {"type":"final","answer":"English answer for the user"}
                - If the user asks for a write action, do not execute it directly. First output:
                  {"type":"propose_action","action":"action_name","arguments":{...},"summary":"English confirmation text for the user"}
                - Call at most one tool each turn.
                - Do not reveal implementation details, secrets, or database connection information.
                - Always answer in concise, direct English, even if the user writes in another language.
                """.formatted(actor.userId(), actor.username(), actor.role());
        return message("system", prompt);
    }

    private JsonNode tryParseCommand(String content) {
        String normalized = content.trim();
        if (normalized.startsWith("```")) {
            normalized = normalized.replaceFirst("^```json\\s*", "")
                    .replaceFirst("^```\\s*", "")
                    .replaceFirst("\\s*```$", "");
        }
        String json = normalized.startsWith("{") ? normalized : extractJsonObject(normalized);
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception ex) {
            return null;
        }
    }

    private String extractJsonObject(String content) {
        int start = content.indexOf('{');
        while (start >= 0) {
            int end = findJsonObjectEnd(content, start);
            if (end > start) {
                String candidate = content.substring(start, end + 1);
                try {
                    objectMapper.readTree(candidate);
                    return candidate;
                } catch (Exception ignored) {
                    start = content.indexOf('{', start + 1);
                    continue;
                }
            }
            start = content.indexOf('{', start + 1);
        }
        return null;
    }

    private int findJsonObjectEnd(String content, int start) {
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int index = start; index < content.length(); index++) {
            char current = content.charAt(index);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (current == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (current == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (current == '{') {
                depth++;
            } else if (current == '}') {
                depth--;
                if (depth == 0) {
                    return index;
                }
            }
        }
        return -1;
    }

    private boolean isToolCall(String type) {
        return "tool_call".equals(type) || "tool".equals(type);
    }

    private String normalizeRole(String role) {
        if ("assistant".equals(role) || "system".equals(role)) {
            return role;
        }
        return "user";
    }

    private Map<String, String> message(String role, String content) {
        return Map.of("role", role, "content", content);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new BizException(500, 500, "Failed to serialize AI tool result");
        }
    }

    private void emitReply(String reply, AiEventSink eventSink) {
        String normalized = reply == null ? "" : reply;
        if (normalized.isBlank()) {
            return;
        }
        int chunkSize = 18;
        for (int start = 0; start < normalized.length(); start += chunkSize) {
            int end = Math.min(normalized.length(), start + chunkSize);
            eventSink.delta(normalized.substring(start, end));
        }
    }

    public interface AiEventSink {
        void status(String stage, String message);
        void toolCall(String toolName);
        void delta(String chunk);
        void actionRequired(AiPendingActionView pendingAction);
        void done(AiChatResponse response);
    }

    private static final class NoOpEventSink implements AiEventSink {

        @Override
        public void status(String stage, String message) {
        }

        @Override
        public void toolCall(String toolName) {
        }

        @Override
        public void delta(String chunk) {
        }

        @Override
        public void actionRequired(AiPendingActionView pendingAction) {
        }

        @Override
        public void done(AiChatResponse response) {
        }
    }
}
