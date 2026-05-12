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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import site.bjut409.backend.auth.TokenStore;
import site.bjut409.backend.service.DemoDataService;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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
                .andExpect(status().isOk())
                .andExpect(result -> {
                    JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
                    assertEquals("new_user", root.get("data").get("username").asText());
                    assertEquals("customer", root.get("data").get("role").asText());
                    assertTrue(root.get("data").get("token").asText().startsWith("token-"));
                });

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
        assertTrue(first.get("mealId").asInt() != 1);
        JsonNode conflictedMeal = null;
        for (JsonNode item : recRoot) {
            if (item.get("mealId").asInt() == 1) {
                conflictedMeal = item;
                break;
            }
        }
        assertTrue(conflictedMeal != null);
        assertEquals("allergen conflict", conflictedMeal.get("reason").asText());
        assertTrue(conflictedMeal.get("allergenConflict").asBoolean());
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
        String mealsBody = mockMvc.perform(get("/meals")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode mealsRoot = objectMapper.readTree(mealsBody);
        assertTrue(mealsRoot.get("data").isArray());
        assertTrue(mealsRoot.get("data").get(0).has("imageUrl"));

        String mealBody = mockMvc.perform(get("/meals/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode mealRoot = objectMapper.readTree(mealBody);
        assertEquals(8, mealRoot.get("data").get("sustainabilityScore").asInt());
        assertTrue(mealRoot.get("data").has("imageUrl"));

        String recBody = mockMvc.perform(get("/recommendations").param("userId", "1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(recBody);
        assertTrue(root.get("data").isArray());
        assertTrue(root.get("data").get(0).has("calories"));
        assertTrue(root.get("data").get(0).has("protein"));
        assertTrue(root.get("data").get(0).has("sustainabilityScore"));
        assertTrue(root.get("data").get(0).has("imageUrl"));
        assertTrue(root.get("data").get(0).has("allergenConflict"));
        assertTrue(root.get("data").get(0).has("scoreBreakdown"));
    }

    @Test
    void orders_query_should_return_detail_and_paginated_list() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");
        String createPayload = """
                {
                  "userId":1,
                  "recommendationRequestId":"req-test-orders-0001",
                  "items":[
                    {"mealId":1,"quantity":2},
                    {"mealId":2,"quantity":1}
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

        String detailBody = mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode detail = objectMapper.readTree(detailBody).get("data");
        assertEquals(orderId, detail.get("orderId").asLong());
        assertEquals(1, detail.get("userId").asInt());
        assertEquals("pending", detail.get("status").asText());
        assertTrue(detail.get("createdAt").asText().contains("T"));
        assertTrue(detail.has("confirmedAt"));
        assertTrue(detail.has("cancelledAt"));
        assertEquals(2, detail.get("items").size());
        assertTrue(detail.get("items").get(0).has("calories"));
        assertTrue(detail.get("items").get(0).has("protein"));
        assertTrue(detail.get("items").get(0).has("sustainabilityScore"));
        assertTrue(detail.get("items").get(0).has("imageUrl"));
        assertEquals(1280, detail.get("totalCalories").asInt());
        assertEquals(80, detail.get("totalProtein").asInt());

        String listBody = mockMvc.perform(get("/orders")
                        .param("userId", "1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode list = objectMapper.readTree(listBody).get("data");
        assertEquals(1, list.get("page").asInt());
        assertEquals(20, list.get("size").asInt());
        assertEquals(1, list.get("total").asInt());
        assertEquals(orderId, list.get("items").get(0).get("orderId").asLong());

        mockMvc.perform(get("/orders")
                        .param("userId", "2")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/orders")
                        .param("userId", "1")
                        .param("status", "pending")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    void custom_order_item_should_create_order_and_consume_ingredient_stock() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String createPayload = """
                {
                  "userId":1,
                  "items":[
                    {
                      "custom":true,
                      "name":"Custom bowl",
                      "quantity":1,
                      "calories":241,
                      "protein":35,
                      "sustainabilityScore":8,
                      "ingredients":[
                        {"ingredientId":1,"name":"Chicken","weight_g":100},
                        {"ingredientId":4,"name":"Tofu","weight_g":200}
                      ]
                    }
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

        String detailBody = mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode item = objectMapper.readTree(detailBody).get("data").get("items").get(0);
        assertTrue(item.get("custom").asBoolean());
        assertEquals("Custom bowl", item.get("name").asText());
        assertEquals(241, item.get("calories").asInt());
        assertEquals(35, item.get("protein").asInt());
        assertEquals(2, item.get("ingredients").size());

        mockMvc.perform(post("/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        String chickenBody = mockMvc.perform(get("/ingredients/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(7900, objectMapper.readTree(chickenBody).get("data").get("currentQty_g").asInt());

        String tofuBody = mockMvc.perform(get("/ingredients/4")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(5000, objectMapper.readTree(tofuBody).get("data").get("currentQty_g").asInt());
    }

    @Test
    void ingredients_query_should_return_detail_and_paginated_list() throws Exception {
        String staffToken = tokenOf("staff1", "123456");
        String customerToken = tokenOf("customer1", "123456");

        String updatePayload = """
                {
                  "name":"Chicken",
                  "allergens":["nut","fish"]
                }
                """;
        mockMvc.perform(put("/ingredients/1")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk());

        String listBody = mockMvc.perform(get("/ingredients")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode list = objectMapper.readTree(listBody).get("data");
        assertEquals(1, list.get("page").asInt());
        assertEquals(20, list.get("size").asInt());
        assertTrue(list.get("total").asInt() >= 1);
        assertEquals(1, list.get("items").get(0).get("ingredientId").asInt());
        assertTrue(list.get("items").get(0).has("stockStatus"));

        String detailBody = mockMvc.perform(get("/ingredients/1")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode detail = objectMapper.readTree(detailBody).get("data");
        assertEquals("Chicken", detail.get("name").asText());
        assertEquals(8000, detail.get("currentQty_g").asInt());
        assertEquals("high_stock", detail.get("stockStatus").asText());
        assertEquals("fish", detail.get("allergens").get(0).asText());
        assertEquals("nut", detail.get("allergens").get(1).asText());

        mockMvc.perform(get("/ingredients")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/ingredients/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        String filteredBody = mockMvc.perform(get("/ingredients")
                        .param("keyword", "Chick")
                        .param("expiryBefore", LocalDate.now().plusDays(7).toString())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode filtered = objectMapper.readTree(filteredBody).get("data");
        assertEquals(1, filtered.get("items").size());
        assertEquals("Chicken", filtered.get("items").get(0).get("name").asText());
    }

    @Test
    void meals_filter_image_upload_and_dashboard_enhancements_should_work() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        String filteredMealsBody = mockMvc.perform(get("/meals")
                        .param("keyword", "Garden")
                        .param("tag", "plant-based")
                        .param("lowCarbonOnly", "true")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode filteredMeals = objectMapper.readTree(filteredMealsBody).get("data");
        assertEquals(1, filteredMeals.size());
        assertEquals("Tofu Garden Bowl", filteredMeals.get(0).get("name").asText());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cover.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake-png".getBytes(StandardCharsets.UTF_8)
        );
        String uploadBody = mockMvc.perform(multipart("/meals/1/image")
                        .file(file)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode upload = objectMapper.readTree(uploadBody).get("data");
        assertEquals(1, upload.get("mealId").asInt());
        assertTrue(upload.get("imageUrl").asText().startsWith("/uploads/meals/"));

        MockMultipartFile largerPng = new MockMultipartFile(
                "file",
                "larger-cover.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[2 * 1024 * 1024]
        );
        mockMvc.perform(multipart("/meals/1/image")
                        .file(largerPng)
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());

        String mealBody = mockMvc.perform(get("/meals/1")
                        .param("recommendationRequestId", "req-test-dashboard-0002")
                        .param("recommendationRankPosition", "3")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode meal = objectMapper.readTree(mealBody).get("data");
        assertTrue(meal.get("imageUrl").asText().startsWith("/uploads/meals/"));

        String createPayload = """
                {
                  "userId":1,
                  "recommendationRequestId":"req-test-dashboard-0002",
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

        String dashboardBody = mockMvc.perform(get("/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode dashboard = objectMapper.readTree(dashboardBody).get("data");
        assertTrue(dashboard.has("topMeals"));
        assertTrue(dashboard.has("topRecommendedMeals"));
        assertTrue(dashboard.has("topSelectedMeals"));
        assertTrue(dashboard.has("highStockIngredients"));
        assertTrue(dashboard.has("nearExpiryIngredients"));
        assertTrue(dashboard.has("mealSustainabilityStats"));
        assertTrue(dashboard.has("lowCarbonSelectionCount"));

        LocalDate reportFrom = LocalDate.now().minusDays(29);
        LocalDate reportTo = LocalDate.now();
        String reportBody = mockMvc.perform(get("/reports/sustainability")
                        .param("from", reportFrom.toString())
                        .param("to", reportTo.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode report = objectMapper.readTree(reportBody).get("data");
        assertTrue(report.has("reportId"));
        assertTrue(report.has("generatedAt"));
        assertEquals(reportFrom.toString(), report.get("rangeStart").asText());
        assertEquals(reportTo.toString(), report.get("rangeEnd").asText());
        assertTrue(report.has("topMeals"));
        assertTrue(report.has("topRecommendedMeals"));
        assertTrue(report.has("topSelectedMeals"));
        assertTrue(report.has("topClickedMeals"));
        assertTrue(report.has("highStockIngredients"));
        assertTrue(report.has("nearExpiryIngredients"));
        assertTrue(report.has("mealSustainabilityStats"));
        assertTrue(report.has("lowCarbonSelectionCount"));
        assertTrue(report.has("recommendationAnalytics"));
    }

    @Test
    void sustainability_report_history_and_recommendation_analytics_should_work() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        String recommendationBody = mockMvc.perform(get("/recommendations").param("userId", "1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode recommendations = objectMapper.readTree(recommendationBody).get("data");
        JsonNode first = recommendations.get(0);
        long mealId = first.get("mealId").asLong();
        String recommendationRequestId = first.get("recommendationRequestId").asText();
        int rankPosition = first.get("recommendationRankPosition").asInt();

        mockMvc.perform(get("/meals/" + mealId)
                        .param("recommendationRequestId", recommendationRequestId)
                        .param("recommendationRankPosition", String.valueOf(rankPosition))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        String createPayload = """
                {
                  "userId":1,
                  "recommendationRequestId":"%s",
                  "items":[
                    {"mealId":%d,"quantity":1}
                  ]
                }
                """.formatted(recommendationRequestId, mealId);
        String orderBody = mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long orderId = objectMapper.readTree(orderBody).get("data").get("orderId").asLong();
        mockMvc.perform(post("/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        LocalDate reportFrom = LocalDate.now().minusDays(29);
        LocalDate reportTo = LocalDate.now();
        String analyticsBody = mockMvc.perform(get("/reports/recommendations/analytics")
                        .param("from", reportFrom.toString())
                        .param("to", reportTo.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode analytics = objectMapper.readTree(analyticsBody).get("data");
        assertTrue(analytics.get("totalExposureCount").asInt() >= recommendations.size());
        assertTrue(analytics.get("totalClickCount").asInt() >= 1);
        assertTrue(analytics.get("totalSelectedCount").asInt() >= 1);
        assertTrue(analytics.has("topRecommendedMeals"));
        assertTrue(analytics.has("topClickedMeals"));
        assertTrue(analytics.has("topSelectedMeals"));
        assertTrue(analytics.get("positionPerformance").isArray());

        String reportBody = mockMvc.perform(get("/reports/sustainability")
                        .param("from", reportFrom.toString())
                        .param("to", reportTo.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode report = objectMapper.readTree(reportBody).get("data");
        long reportId = report.get("reportId").asLong();

        String historyBody = mockMvc.perform(get("/reports/sustainability/history")
                        .param("page", "1")
                        .param("size", "20")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode history = objectMapper.readTree(historyBody).get("data");
        assertTrue(history.get("total").asInt() >= 1);
        assertEquals(reportId, history.get("items").get(0).get("reportId").asLong());

        String detailBody = mockMvc.perform(get("/reports/sustainability/" + reportId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode detail = objectMapper.readTree(detailBody).get("data");
        assertEquals(reportId, detail.get("reportId").asLong());
        assertTrue(detail.has("recommendationAnalytics"));
        assertTrue(detail.has("topClickedMeals"));
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
                  "expiryDate":"%s"
                }
                """.formatted(LocalDate.now().plusDays(30));
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
                  "name":"Broccoli New",
                  "currentQty_g":3000,
                  "expiryDate":"%s"
                }
                """.formatted(LocalDate.now().plusDays(30));
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

    @Test
    void invalid_order_quantities_should_be_rejected() throws Exception {
        String customerToken = tokenOf("customer1", "123456");

        mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": 1,
                                  "items": [{"mealId": 1, "quantity": -1}]
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": 1,
                                  "items": []
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalid_meal_and_stock_values_should_be_rejected() throws Exception {
        String staffToken = tokenOf("staff1", "123456");

        mockMvc.perform(post("/meals")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Invalid Meal",
                                  "description": "Bad nutrition values",
                                  "calories": -10,
                                  "protein": 0,
                                  "sustainabilityScore": 11,
                                  "tags": [],
                                  "ingredients": []
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/ingredients")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Invalid Ingredient",
                                  "currentQty_g": -1,
                                  "expiryDate": "2030-01-01"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/stock/1")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentQty_g": -1,
                                  "expiryDate": "2030-01-01"
                                }
                                """))
                .andExpect(status().isBadRequest());
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
