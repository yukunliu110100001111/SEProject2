package site.bjut409.backend.integration;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import site.bjut409.backend.auth.TokenStore;
import site.bjut409.backend.service.DemoDataService;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendComprehensiveIntegrationTest {

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
    void auth_failures_and_duplicate_registration_should_return_expected_errors() throws Exception {
        expectApiError(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"customer1",
                                  "password":"wrong-password"
                                }
                                """),
                401, 401);

        expectApiError(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"",
                                  "password":"123456"
                                }
                                """),
                400, 400);

        expectApiError(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"customer1",
                                  "password":"Strong123"
                                }
                                """),
                409, 409);
    }

    @Test
    void protected_endpoints_should_reject_invalid_tokens() throws Exception {
        expectApiError(get("/meals").header("Authorization", "Bearer invalid-token"), 401, 401);
        expectApiError(get("/orders").header("Authorization", "Bearer invalid-token"), 401, 401);
        expectApiError(get("/dashboard").header("Authorization", "Bearer invalid-token"), 401, 401);
    }

    @Test
    void customer_should_be_blocked_from_other_users_and_staff_or_admin_operations() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        JsonNode secondCustomer = register("customer2", "Strong123");
        long secondCustomerId = secondCustomer.get("userId").asLong();

        expectApiError(get("/users/" + secondCustomerId)
                        .header("Authorization", bearer(customerToken)),
                403, 403);

        expectApiError(put("/users/" + secondCustomerId)
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"stolen_name"
                                }
                                """),
                403, 403);

        expectApiError(post("/meals")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validMealPayload()),
                403, 403);

        expectApiError(post("/ingredients")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Forbidden Ingredient",
                                  "currentQty_g":1000,
                                  "expiryDate":"%s"
                                }
                                """.formatted(LocalDate.now().plusDays(20))),
                403, 403);

        expectApiError(put("/stock/1")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentQty_g":1000,
                                  "expiryDate":"%s"
                                }
                                """.formatted(LocalDate.now().plusDays(20))),
                403, 403);

        expectApiError(get("/dashboard").header("Authorization", bearer(customerToken)), 403, 403);
        expectApiError(get("/reports/sustainability").header("Authorization", bearer(customerToken)), 403, 403);
    }

    @Test
    void staff_should_read_user_data_but_not_use_admin_reports() throws Exception {
        String staffToken = tokenOf("staff1", "123456");

        mockMvc.perform(get("/users/1").header("Authorization", bearer(staffToken)))
                .andExpect(status().isOk());

        expectApiError(get("/dashboard").header("Authorization", bearer(staffToken)), 403, 403);
        expectApiError(get("/reports/sustainability/history").header("Authorization", bearer(staffToken)), 403, 403);
        expectApiError(get("/reports/recommendations/analytics").header("Authorization", bearer(staffToken)), 403, 403);
    }

    @Test
    void missing_resources_should_return_not_found() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        expectApiError(get("/meals/99999").header("Authorization", bearer(customerToken)), 404, 404);
        expectApiError(get("/ingredients/99999").header("Authorization", bearer(customerToken)), 404, 404);
        expectApiError(get("/orders/99999").header("Authorization", bearer(customerToken)), 404, 404);
        expectApiError(get("/reports/sustainability/99999").header("Authorization", bearer(adminToken)), 404, 404);
    }

    @Test
    void meal_management_should_validate_payloads_and_related_ingredients() throws Exception {
        String staffToken = tokenOf("staff1", "123456");

        expectApiError(post("/meals")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"",
                                  "description":"invalid",
                                  "calories":300,
                                  "protein":20,
                                  "sustainabilityScore":8
                                }
                                """),
                400, 400);

        expectApiError(post("/meals")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Broken Meal",
                                  "description":"unknown ingredient",
                                  "calories":300,
                                  "protein":20,
                                  "sustainabilityScore":8,
                                  "ingredients":[{"ingredientId":99999,"weight_g":100}]
                                }
                                """),
                404, 404);

        expectApiError(put("/meals/99999")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validMealPayload()),
                404, 404);
    }

    @Test
    void meal_image_upload_should_validate_role_file_type_and_meal_existence() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        String staffToken = tokenOf("staff1", "123456");
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "cover.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not an image".getBytes(StandardCharsets.UTF_8)
        );

        expectApiError(multipart("/meals/1/image")
                        .file(textFile)
                        .header("Authorization", bearer(customerToken)),
                403, 403);

        expectApiError(multipart("/meals/1/image")
                        .file(textFile)
                        .header("Authorization", bearer(staffToken)),
                400, 400);

        MockMultipartFile pngFile = new MockMultipartFile(
                "file",
                "cover.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake-png".getBytes(StandardCharsets.UTF_8)
        );
        expectApiError(multipart("/meals/99999/image")
                        .file(pngFile)
                        .header("Authorization", bearer(staffToken)),
                404, 404);
    }

    @Test
    void order_security_validation_and_status_conflicts_should_be_enforced() throws Exception {
        String customerToken = tokenOf("customer1", "123456");
        JsonNode secondCustomer = register("customer2", "Strong123");
        long secondCustomerId = secondCustomer.get("userId").asLong();

        expectApiError(post("/orders")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId":%d,
                                  "items":[{"mealId":1,"quantity":1}]
                                }
                                """.formatted(secondCustomerId)),
                403, 403);

        expectApiError(get("/orders")
                        .param("status", "paid")
                        .header("Authorization", bearer(customerToken)),
                400, 400);

        expectApiError(post("/orders")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId":1,
                                  "items":[{"custom":true,"name":"No Ingredients","quantity":1}]
                                }
                                """),
                400, 400);

        String createBody = mockMvc.perform(post("/orders")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId":1,
                                  "items":[{"mealId":1,"quantity":1}]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        long orderId = objectMapper.readTree(createBody).get("data").get("orderId").asLong();

        mockMvc.perform(post("/orders/" + orderId + "/cancel")
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk());

        expectApiError(post("/orders/" + orderId + "/confirm")
                        .header("Authorization", bearer(customerToken)),
                409, 409);
    }

    @Test
    void stock_and_report_inputs_should_be_validated() throws Exception {
        String staffToken = tokenOf("staff1", "123456");
        String adminToken = tokenOf("admin1", "123456");

        expectApiError(put("/stock/99999")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentQty_g":1000,
                                  "expiryDate":"%s"
                                }
                                """.formatted(LocalDate.now().plusDays(20))),
                404, 404);

        expectApiError(put("/ingredients/99999")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Unknown"
                                }
                                """),
                404, 404);

        expectApiError(get("/reports/sustainability")
                        .param("from", LocalDate.now().toString())
                        .param("to", LocalDate.now().minusDays(1).toString())
                        .header("Authorization", bearer(adminToken)),
                400, 400);
    }

    @Test
    void ai_endpoint_should_validate_empty_messages_and_unknown_pending_actions() throws Exception {
        String customerToken = tokenOf("customer1", "123456");

        expectApiError(post("/ai/chat")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "messages":[]
                                }
                                """),
                400, 400);

        expectApiError(post("/ai/actions/not-a-real-action/confirm")
                        .header("Authorization", bearer(customerToken)),
                404, 404);
    }

    private JsonNode register(String username, String password) throws Exception {
        String body = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"%s",
                                  "password":"%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(body).get("data");
    }

    private String tokenOf(String username, String password) throws Exception {
        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"%s",
                                  "password":"%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(body).get("data").get("token").asText();
    }

    private void expectApiError(org.springframework.test.web.servlet.RequestBuilder request,
                                int expectedHttpStatus,
                                int expectedCode) throws Exception {
        String body = mockMvc.perform(request)
                .andExpect(status().is(expectedHttpStatus))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode root = objectMapper.readTree(body);
        assertEquals(expectedCode, root.get("code").asInt());
        assertTrue(root.get("message").asText().length() > 0);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String validMealPayload() {
        return """
                {
                  "name":"Valid Staff Meal",
                  "description":"created during comprehensive testing",
                  "calories":450,
                  "protein":35,
                  "sustainabilityScore":8,
                  "tags":["test"],
                  "ingredients":[{"ingredientId":1,"weight_g":100}]
                }
                """;
    }
}
