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
            throw new BizException(503, 503, "AI 助手未配置，请设置 ARK_MODEL");
        }
        List<AiChatMessage> incoming = request == null || request.messages() == null
                ? List.of()
                : request.messages().stream()
                .filter(message -> message != null && message.content() != null && !message.content().isBlank())
                .limit(20)
                .toList();
        if (incoming.isEmpty()) {
            throw new BizException(400, 400, "消息不能为空");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(systemMessage(actor));
        for (AiChatMessage message : incoming) {
            String role = normalizeRole(message.role());
            messages.add(message(role, message.content()));
        }

        List<String> toolCalls = new ArrayList<>();

        for (int step = 0; step < MAX_TOOL_STEPS; step++) {
            eventSink.status("thinking", "正在分析你的请求");
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
            if (!"tool_call".equals(type)) {
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
            eventSink.status("tool_result", toolName + " 已返回结果");

            messages.add(message("assistant", content));
            messages.add(message("system",
                    "TOOL_RESULT " + toolName + ": " + resultJson
                            + "\n请基于这个结果继续判断。若还需其他数据，再发起一次 tool_call；若信息足够，返回 final。"));
        }

        throw new BizException(502, 502, "AI 工具调用次数过多，请换个问法");
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
        String summary = command.path("summary").asText("请确认是否执行该操作。");
        AiPendingActionView pendingAction = aiPendingActionService.create(actor, actionType,
                command.path("arguments"), summary);
        eventSink.actionRequired(pendingAction);
        AiChatResponse response = new AiChatResponse(summary, model, List.copyOf(toolCalls), pendingAction);
        eventSink.done(response);
        return response;
    }

    private Map<String, String> systemMessage(AuthUser actor) {
        String prompt = """
                你是 GreenBite 项目的中文 AI 助手。
                你的职责：
                1. 帮用户解释餐食推荐、个人偏好、订单状态和库存信息。
                2. 只能通过后端工具访问数据库，绝不编造数据库结果。
                3. 面向普通用户时，优先解释当前登录用户自己的数据。
                4. 普通用户不能查看库存；只有 staff 或 admin 才能看库存摘要。

                当前登录用户：
                - userId: %d
                - username: %s
                - role: %s

                可用工具：
                - get_user_profile { "userId"?: number }
                - get_recommendations { "userId"?: number }
                - search_meals { "keyword"?: string }
                - get_meal_detail { "mealId": number }
                - get_inventory_summary {}
                - get_order_status { "orderId": number }
                - 可提议待确认写操作：
                  1. update_preferences { "targetCalories"?: number, "targetProtein"?: number, "isVegetarian"?: boolean, "allergens"?: string[] }
                  2. create_order { "items": [{"mealId": number, "quantity": number}] }

                输出规则：
                - 如果你需要查库，必须只输出 JSON，不要带 markdown，不要带解释：
                  {"type":"tool_call","tool":"工具名","arguments":{...}}
                - 如果你已经可以回答，也必须只输出 JSON：
                  {"type":"final","answer":"给用户的中文答复"}
                - 如果用户要求执行写操作，不要直接执行，先输出：
                  {"type":"propose_action","action":"操作名","arguments":{...},"summary":"给用户的确认文案"}
                - 每次最多调用一个工具。
                - 不要泄露实现细节、密钥、数据库连接信息。
                - 回答简洁、直接、中文输出。
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
        if (!normalized.startsWith("{")) {
            return null;
        }
        try {
            return objectMapper.readTree(normalized);
        } catch (Exception ex) {
            return null;
        }
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
            throw new BizException(500, 500, "AI 工具结果序列化失败");
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
