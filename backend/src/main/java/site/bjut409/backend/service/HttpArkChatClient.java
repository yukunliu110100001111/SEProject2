package site.bjut409.backend.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import site.bjut409.backend.common.BizException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class HttpArkChatClient implements ArkChatClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${ai.ark.base-url}")
    private String baseUrl;

    @Value("${ai.ark.api-key}")
    private String apiKey;

    @Value("${ai.ark.fallback-api-key:}")
    private String fallbackApiKey;

    @Value("${ai.ark.protocol:auto}")
    private String protocol;

    public HttpArkChatClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public String chat(List<Map<String, String>> messages, String model) {
        String resolvedApiKey = resolvedApiKey();
        if (resolvedApiKey.isBlank()) {
            throw new BizException(503, 503, "AI assistant is not configured. Please set AI_ARK_API_KEY");
        }
        try {
            String normalizedBaseUrl = normalizeBaseUrl(baseUrl);
            if (useChatCompletions(normalizedBaseUrl)) {
                return chatCompletions(messages, model, resolvedApiKey, normalizedBaseUrl);
            }
            return responses(messages, model, resolvedApiKey, normalizedBaseUrl);
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BizException(502, 502, "AI model request failed");
        }
    }

    private String responses(List<Map<String, String>> messages, String model, String resolvedApiKey,
                             String normalizedBaseUrl) throws IOException, InterruptedException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.2);
        payload.put("input", buildInput(messages));

        HttpRequest request = requestBuilder(normalizedBaseUrl + "/responses", resolvedApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < HttpStatus.OK.value() || response.statusCode() >= 300) {
            throw new BizException(502, 502, "AI model request failed: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String outputText = root.path("output_text").asText("");
        if (!outputText.isBlank()) {
            return outputText;
        }

        JsonNode contentNode = root.path("output");
        String content = readContent(contentNode);
        if (content.isBlank()) {
            throw new BizException(502, 502, "AI model returned empty content");
        }
        return content;
    }

    private String chatCompletions(List<Map<String, String>> messages, String model, String resolvedApiKey,
                                   String normalizedBaseUrl) throws IOException, InterruptedException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.2);
        payload.put("messages", messages);

        HttpRequest request = requestBuilder(normalizedBaseUrl + "/chat/completions", resolvedApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < HttpStatus.OK.value() || response.statusCode() >= 300) {
            throw new BizException(502, 502, "AI model request failed: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) {
            throw new BizException(502, 502, "AI model returned empty content");
        }
        return content;
    }

    private String resolvedApiKey() {
        if (apiKey != null && !apiKey.isBlank()) {
            return apiKey;
        }
        return fallbackApiKey == null ? "" : fallbackApiKey;
    }

    private HttpRequest.Builder requestBuilder(String url, String resolvedApiKey) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + resolvedApiKey);
        if (url.contains("openrouter.ai")) {
            builder.header("HTTP-Referer", "https://greenbite.local")
                    .header("X-Title", "GreenBite");
        }
        return builder;
    }

    private boolean useChatCompletions(String normalizedBaseUrl) {
        String normalizedProtocol = protocol == null ? "auto" : protocol.trim().toLowerCase();
        if ("chat".equals(normalizedProtocol) || "chat-completions".equals(normalizedProtocol)) {
            return true;
        }
        if ("responses".equals(normalizedProtocol)) {
            return false;
        }
        return normalizedBaseUrl.contains("openrouter.ai");
    }

    private List<Map<String, Object>> buildInput(List<Map<String, String>> messages) {
        return messages.stream().map(message -> Map.of(
                "role", message.getOrDefault("role", "user"),
                "content", List.of(Map.of(
                        "type", "input_text",
                        "text", message.getOrDefault("content", "")
                ))
        )).toList();
    }

    private String readContent(JsonNode contentNode) throws IOException {
        if (contentNode == null || contentNode.isMissingNode() || contentNode.isNull()) {
            return "";
        }
        if (contentNode.isTextual()) {
            return contentNode.asText();
        }
        if (contentNode.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode node : contentNode) {
                if (node.has("text")) {
                    builder.append(node.path("text").asText());
                    continue;
                }
                JsonNode content = node.path("content");
                if (content.isArray()) {
                    for (JsonNode item : content) {
                        if (item.has("text")) {
                            builder.append(item.path("text").asText());
                        }
                    }
                    continue;
                }
                if (node.has("content")) {
                    builder.append(node.path("content").asText());
                }
            }
            return builder.toString().trim();
        }
        return objectMapper.writeValueAsString(contentNode);
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "https://ark.cn-beijing.volces.com/api/v3";
        }
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
