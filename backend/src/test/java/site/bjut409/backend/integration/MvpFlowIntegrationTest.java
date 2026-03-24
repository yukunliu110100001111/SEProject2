package site.bjut409.backend.integration;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import site.bjut409.backend.auth.TokenStore;
import site.bjut409.backend.service.DemoDataService;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MvpFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private TokenStore tokenStore;

    @BeforeEach
    void setUp() {
        demoDataService.resetAll();
        tokenStore.clear();
    }

    @Test
    void health_should_return_success() throws Exception {
        String body = mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(body);
        assertEquals(200, root.get("code").asInt());
    }

    @Test
    void auth_register_and_login_should_work() throws Exception {
        String registerPayload = """
                {
                  "username":"new_user",
                  "password":"123456"
                }
                """;
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk());

        String loginPayload = """
                {
                  "username":"new_user",
                  "password":"123456"
                }
                """;
        String loginBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(loginBody);
        assertTrue(root.get("data").get("token").asText().startsWith("token-"));
    }

    @Test
    void user_preferences_should_update() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String updatePayload = """
                {
                  "targetCalories":1800,
                  "targetProtein":90,
                  "isVegetarian":true
                }
                """;

        mockMvc.perform(put("/users/1/preferences")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk());

        String body = mockMvc.perform(get("/users/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(body);
        assertEquals(1800, root.get("data").get("preferences").get("targetCalories").asInt());
    }

    @Test
    void user_profile_update_should_work() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String payload = """
                {
                  "username":"customer1_new"
                }
                """;

        mockMvc.perform(put("/users/1")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        String body = mockMvc.perform(get("/users/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(body);
        assertEquals("customer1_new", root.get("data").get("username").asText());
    }

    @Test
    void user_allergens_should_affect_recommendation() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");

        String ingredientUpdate = """
                {
                  "name":"Chicken",
                  "allergens":["nut"]
                }
                """;
        mockMvc.perform(put("/ingredients/1")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ingredientUpdate))
                .andExpect(status().isOk());

        String prefUpdate = """
                {
                  "targetCalories":1800,
                  "targetProtein":90,
                  "isVegetarian":false,
                  "allergens":["nut"]
                }
                """;
        mockMvc.perform(put("/users/1/preferences")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(prefUpdate))
                .andExpect(status().isOk());

        String userBody = mockMvc.perform(get("/users/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode userRoot = objectMapper.readTree(userBody);
        assertTrue(userRoot.get("data").get("preferences").get("allergens").isArray());
        assertEquals("nut", userRoot.get("data").get("preferences").get("allergens").get(0).asText());

        String recBody = mockMvc.perform(get("/recommendations").param("userId", "1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode recRoot = objectMapper.readTree(recBody).get("data");
        JsonNode first = recRoot.get(0);
        assertEquals(2, first.get("mealId").asInt());
    }

    @Test
    void allergens_and_meal_relations_should_support_optional_fields() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");

        String setAllergen = """
                {
                  "targetCalories":1800,
                  "targetProtein":90,
                  "isVegetarian":false,
                  "allergens":["nut"]
                }
                """;
        mockMvc.perform(put("/users/1/preferences")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(setAllergen))
                .andExpect(status().isOk());

        String keepAllergen = """
                {
                  "targetCalories":1850,
                  "targetProtein":88,
                  "isVegetarian":false
                }
                """;
        mockMvc.perform(put("/users/1/preferences")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(keepAllergen))
                .andExpect(status().isOk());

        String userBody = mockMvc.perform(get("/users/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode userRoot = objectMapper.readTree(userBody);
        assertEquals("nut", userRoot.get("data").get("preferences").get("allergens").get(0).asText());

        String createMeal = """
                {
                  "name":"Simple Meal",
                  "description":"simple",
                  "calories":300,
                  "protein":10,
                  "sustainabilityScore":6
                }
                """;
        mockMvc.perform(post("/meals")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createMeal))
                .andExpect(status().isOk());
    }

    @Test
    void meals_and_recommendations_should_work() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        mockMvc.perform(get("/meals")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/meals/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        String recBody = mockMvc.perform(get("/recommendations").param("userId", "1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(recBody);
        assertTrue(root.get("data").isArray());
    }

    @Test
    void order_confirm_should_deduct_stock_and_reconfirm_conflict() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");

        String createPayload = """
                {
                  "userId":1,
                  "items":[
                    {"mealId":1,"quantity":1}
                  ]
                }
                """;
        String createBody = mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long orderId = objectMapper.readTree(createBody).get("data").get("orderId").asLong();

        mockMvc.perform(post("/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());

        String stockPayload = """
                {
                  "currentQty_g":5000,
                  "expiryDate":"2026-03-20"
                }
                """;
        mockMvc.perform(put("/stock/1")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(stockPayload))
                .andExpect(status().isOk());
    }

    @Test
    void order_cancel_should_work() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String createPayload = """
                {
                  "userId":1,
                  "items":[
                    {"mealId":1,"quantity":1}
                  ]
                }
                """;
        String createBody = mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long orderId = objectMapper.readTree(createBody).get("data").get("orderId").asLong();

        String cancelBody = mockMvc.perform(post("/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals("cancelled", objectMapper.readTree(cancelBody).get("data").get("status").asText());
    }

    @Test
    void staff_manage_meal_and_ingredient_should_work() throws Exception {
        String staffToken = tokenOf("staff1", "123456");

        String addMeal = """
                {
                  "name":"Tofu Bowl",
                  "description":"vegan",
                  "calories":320,
                  "protein":18,
                  "sustainabilityScore":9,
                  "tags":["low-carbon"],
                  "ingredients":[{"ingredientId":2,"weight_g":120}]
                }
                """;
        String createdMeal = mockMvc.perform(post("/meals")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addMeal))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long mealId = objectMapper.readTree(createdMeal).get("data").get("mealId").asLong();

        String updateMeal = """
                {
                  "name":"Tofu Bowl 2",
                  "description":"vegan2",
                  "calories":300,
                  "protein":20,
                  "sustainabilityScore":10,
                  "tags":["plant-based"],
                  "ingredients":[{"ingredientId":2,"weight_g":150}]
                }
                """;
        mockMvc.perform(put("/meals/" + mealId)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateMeal))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/meals/" + mealId)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());

        String addIng = """
                {
                  "name":"Broccoli",
                  "currentQty_g":3000,
                  "expiryDate":"2026-03-30"
                }
                """;
        String ingredientBody = mockMvc.perform(post("/ingredients")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addIng))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long ingredientId = objectMapper.readTree(ingredientBody).get("data").get("ingredientId").asLong();

        String updateIng = """
                {
                  "name":"Broccoli Fresh"
                }
                """;
        mockMvc.perform(put("/ingredients/" + ingredientId)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateIng))
                .andExpect(status().isOk());
    }

    @Test
    void dashboard_should_require_admin() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        mockMvc.perform(get("/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void sustainability_report_should_require_admin_and_return_data() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        mockMvc.perform(get("/reports/sustainability")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        String body = mockMvc.perform(get("/reports/sustainability")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(body);
        assertTrue(root.get("data").get("generatedAt").asText().length() > 0);
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
}
