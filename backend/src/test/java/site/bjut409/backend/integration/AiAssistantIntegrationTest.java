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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import site.bjut409.backend.auth.TokenStore;
import site.bjut409.backend.service.ArkChatClient;
import site.bjut409.backend.service.DemoDataService;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "ai.ark.model=test-model")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiAssistantIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final DemoDataService demoDataService;
    private final TokenStore tokenStore;
    private final StubArkChatClient stubArkChatClient;

    @Autowired
    AiAssistantIntegrationTest(MockMvc mockMvc,
                               ObjectMapper objectMapper,
                               DemoDataService demoDataService,
                               TokenStore tokenStore,
                               StubArkChatClient stubArkChatClient) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.demoDataService = demoDataService;
        this.tokenStore = tokenStore;
        this.stubArkChatClient = stubArkChatClient;
    }

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
                {"type":"final","answer":"Based on your preferences, meal 2 is the best current recommendation."}
                """);

        String body = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"Recommend meals based on my preferences."}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(body).get("data");
        assertEquals("Based on your preferences, meal 2 is the best current recommendation.", root.get("reply").asString());
        assertEquals("get_recommendations", root.get("toolCalls").get(0).asString());
    }

    @Test
    void ai_chat_should_accept_tool_type_alias() throws Exception {
        stubArkChatClient.enqueue("""
                {"type":"tool","tool":"get_recommendations","arguments":{"userId":1}}
                """);
        stubArkChatClient.enqueue("""
                {"type":"final","answer":"Chicken Salad is first because it best matches your current preferences."}
                """);

        String body = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"Why is the top result first?"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(body).get("data");
        assertEquals("Chicken Salad is first because it best matches your current preferences.", root.get("reply").asString());
        assertEquals("get_recommendations", root.get("toolCalls").get(0).asString());
    }

    @Test
    void ai_chat_should_extract_json_command_from_mixed_model_text() throws Exception {
        stubArkChatClient.enqueue("""
                Let me check the meal details to make sure none contain salmon.

                {"type":"tool_call","tool":"get_meal_detail","arguments":{"mealId":1}}
                """);
        stubArkChatClient.enqueue("""
                {"type":"final","answer":"Meal 1 does not contain salmon based on its ingredient list."}
                """);

        String body = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"Check whether meal 1 contains salmon."}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(body).get("data");
        assertEquals("Meal 1 does not contain salmon based on its ingredient list.", root.get("reply").asString());
        assertEquals("get_meal_detail", root.get("toolCalls").get(0).asString());
    }

    @Test
    void ai_chat_high_protein_keyword_should_return_matching_meals_to_model() throws Exception {
        stubArkChatClient.enqueue("""
                {"type":"tool_call","tool":"search_meals","arguments":{"keyword":"high-protein"}}
                """);
        stubArkChatClient.enqueue("""
                {"type":"final","answer":"Chicken Salad is a high-protein option."}
                """);

        String body = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"Find me a high-protein meal."}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(body).get("data");
        assertEquals("Chicken Salad is a high-protein option.", root.get("reply").asString());
        assertEquals("search_meals", root.get("toolCalls").get(0).asString());
        assertTrue(stubArkChatClient.calls.get(1).stream()
                .anyMatch(message -> message.get("content").contains("Chicken Salad")));
    }


    @Test
    void ai_chat_should_require_confirmation_before_writing_preferences() throws Exception {
        stubArkChatClient.enqueue("""
                {"type":"propose_action","action":"update_preferences","arguments":{"targetCalories":1700,"targetProtein":95,"isVegetarian":true,"allergens":["nut"]},"summary":"I will update your calorie target to 1700, protein target to 95, and enable vegetarian preference after you confirm."}
                """);

        String chatBody = mockMvc.perform(post("/ai/chat")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[
                                    {"role":"user","content":"Set my calorie target to 1700, protein target to 95, and make me vegetarian."}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode pending = objectMapper.readTree(chatBody).get("data").get("pendingAction");
        assertNotNull(pending);
        String actionId = pending.get("actionId").asString();

        String confirmBody = mockMvc.perform(post("/ai/actions/" + actionId + "/confirm")
                        .header("Authorization", "Bearer " + tokenOf("customer1", "123456")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertEquals("Your dietary preferences have been updated.",
                objectMapper.readTree(confirmBody).get("data").get("reply").asString());

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
        String token = objectMapper.readTree(userBody).get("data").get("token").asString();

        String profileBody = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/users/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode preferences = objectMapper.readTree(profileBody).get("data").get("preferences");
        assertEquals(1700, preferences.get("targetCalories").asInt());
        assertEquals(95, preferences.get("targetProtein").asInt());
        assertTrue(preferences.get("isVegetarian").asBoolean());
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
        return objectMapper.readTree(body).get("data").get("token").asString();
    }

    @TestConfiguration
    @SuppressWarnings("unused")
    static class StubAiConfig {
        @Bean
        @Primary
        StubArkChatClient stubArkChatClient() {
            return new StubArkChatClient();
        }
    }

    static class StubArkChatClient implements ArkChatClient {

        private final Queue<String> responses = new ArrayDeque<>();
        private final List<List<Map<String, String>>> calls = new ArrayList<>();

        void enqueue(String response) {
            responses.add(response);
        }

        void reset() {
            responses.clear();
            calls.clear();
        }

        @Override
        public String chat(List<Map<String, String>> messages, String model) {
            assertNotNull(messages);
            assertNotNull(model);
            calls.add(List.copyOf(messages));
            String next = responses.poll();
            if (next == null) {
                throw new IllegalStateException("No stubbed AI response left");
            }
            return next;
        }
    }
}
