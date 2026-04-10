package site.bjut409.backend.integration;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import site.bjut409.backend.auth.TokenStore;
import site.bjut409.backend.service.ArkChatClient;
import site.bjut409.backend.service.DemoDataService;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "ai.ark.model=test-model")
@AutoConfigureMockMvc
class AiAssistantIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private TokenStore tokenStore;

    @Autowired
    private StubArkChatClient stubArkChatClient;

    @BeforeEach
    void setUp() {
        demoDataService.resetAll();
        tokenStore.clear();
        stubArkChatClient.reset();
    }

    @Test
    void ai_chat_should_use_database_tool_and_return_final_answer() throws Exception {
        stubArkChatClient.enqueue("""
                {"type":"tool_call","tool":"get_recommendations","arguments":{"userId":1}}
                """);
        stubArkChatClient.enqueue("""
                {"type":"final","answer":"基于你的偏好，当前更推荐 2 号餐食。"}
                """);

        String body = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"根据我的偏好推荐菜品"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(body).get("data");
        assertEquals("基于你的偏好，当前更推荐 2 号餐食。", root.get("reply").asText());
        assertEquals("get_recommendations", root.get("toolCalls").get(0).asText());
    }

    @Test
    void ai_chat_should_require_confirmation_before_writing_preferences() throws Exception {
        stubArkChatClient.enqueue("""
                {"type":"propose_action","action":"update_preferences","arguments":{"targetCalories":1700,"targetProtein":95,"isVegetarian":true,"allergens":["nut"]},"summary":"我准备把你的目标热量改为 1700、蛋白质改为 95，并开启素食偏好。确认后我再执行。"}
                """);

        String chatBody = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"把我的热量目标改成 1700，蛋白质改成 95，并设置为素食"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode pending = objectMapper.readTree(chatBody).get("data").get("pendingAction");
        assertNotNull(pending);
        String actionId = pending.get("actionId").asText();

        String confirmBody = mockMvc.perform(post("/ai/actions/" + actionId + "/confirm")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertEquals("已按确认内容更新你的饮食偏好。",
                objectMapper.readTree(confirmBody).get("data").get("reply").asText());

        String userBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"customer1",
                                  "password":"123456"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String token = objectMapper.readTree(userBody).get("data").get("token").asText();

        String profileBody = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/users/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode preferences = objectMapper.readTree(profileBody).get("data").get("preferences");
        assertEquals(1700, preferences.get("targetCalories").asInt());
        assertEquals(95, preferences.get("targetProtein").asInt());
        assertEquals(true, preferences.get("isVegetarian").asBoolean());
    }

    private String tokenOf(String username, String password) throws Exception {
        String payload = """
                {
                  "username":"%s",
                  "password":"%s"
                }
                """.formatted(username, password);
        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(body).get("data").get("token").asText();
    }

    @TestConfiguration
    static class StubAiConfig {
        @Bean
        @Primary
        StubArkChatClient stubArkChatClient() {
            return new StubArkChatClient();
        }
    }

    static class StubArkChatClient implements ArkChatClient {

        private final Queue<String> responses = new ArrayDeque<>();

        void enqueue(String response) {
            responses.add(response);
        }

        void reset() {
            responses.clear();
        }

        @Override
        public String chat(List<Map<String, String>> messages, String model) {
            String next = responses.poll();
            if (next == null) {
                throw new IllegalStateException("No stubbed AI response left");
            }
            return next;
        }
    }
}
