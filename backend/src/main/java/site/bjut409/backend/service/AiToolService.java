package site.bjut409.backend.service;

import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.BizException;
import site.bjut409.backend.mapper.DashboardMapper;
import site.bjut409.backend.mapper.OrderMapper;
import site.bjut409.backend.model.OrderRecord;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiToolService {

    private final AppService appService;
    private final DashboardMapper dashboardMapper;
    private final OrderMapper orderMapper;
    private final AuthSupport authSupport;
    private final StockStatusHelper stockStatusHelper;

    public AiToolService(AppService appService,
                         DashboardMapper dashboardMapper,
                         OrderMapper orderMapper,
                         AuthSupport authSupport,
                         StockStatusHelper stockStatusHelper) {
        this.appService = appService;
        this.dashboardMapper = dashboardMapper;
        this.orderMapper = orderMapper;
        this.authSupport = authSupport;
        this.stockStatusHelper = stockStatusHelper;
    }

    public Object execute(AuthUser actor, String toolName, JsonNode arguments) {
        return switch (toolName) {
            case "get_user_profile" -> getUserProfile(actor, arguments);
            case "get_recommendations" -> getRecommendations(actor, arguments);
            case "search_meals" -> searchMeals(actor, arguments);
            case "get_meal_detail" -> getMealDetail(actor, arguments);
            case "get_inventory_summary" -> getInventorySummary(actor);
            case "get_order_status" -> getOrderStatus(actor, arguments);
            default -> throw new BizException(400, 400, "未知 AI 工具: " + toolName);
        };
    }

    private Object getUserProfile(AuthUser actor, JsonNode arguments) {
        Long userId = longArg(arguments, "userId", actor.userId());
        return appService.userInfo(actor, userId);
    }

    private Object getRecommendations(AuthUser actor, JsonNode arguments) {
        Long userId = longArg(arguments, "userId", actor.userId());
        return appService.recommendations(actor, userId);
    }

    private Object searchMeals(AuthUser actor, JsonNode arguments) {
        String keyword = textArg(arguments, "keyword", "");
        String normalized = keyword.trim().toLowerCase();
        return appService.listMeals(actor).stream()
                .filter(meal -> normalized.isBlank()
                        || String.valueOf(meal.get("name")).toLowerCase().contains(normalized))
                .toList();
    }

    private Object getMealDetail(AuthUser actor, JsonNode arguments) {
        Long mealId = requiredLong(arguments, "mealId");
        return appService.mealDetail(actor, mealId);
    }

    private Object getInventorySummary(AuthUser actor) {
        authSupport.requireRole(actor, "staff", "admin");
        List<Map<String, Object>> rows = dashboardMapper.stockUsage().stream().map(row -> {
            Integer qty = intValue(row.get("currentQty"));
            LocalDate expiryDate = row.get("expiryDate") instanceof LocalDate date ? date : null;
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("ingredientId", row.get("ingredientId"));
            mapped.put("name", row.get("name"));
            mapped.put("currentQty", qty);
            mapped.put("expiryDate", expiryDate);
            mapped.put("stockStatus", stockStatusHelper.calcStatus(qty, expiryDate));
            return mapped;
        }).toList();

        long nearExpiryCount = rows.stream()
                .filter(row -> "near_expiry".equals(row.get("stockStatus")))
                .count();
        long highStockCount = rows.stream()
                .filter(row -> "high_stock".equals(row.get("stockStatus")))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalIngredients", rows.size());
        result.put("nearExpiryCount", nearExpiryCount);
        result.put("highStockCount", highStockCount);
        result.put("items", rows);
        return result;
    }

    private Object getOrderStatus(AuthUser actor, JsonNode arguments) {
        Long orderId = requiredLong(arguments, "orderId");
        OrderRecord order = orderMapper.findById(orderId);
        if (order == null) {
            throw new BizException(404, 404, "订单不存在");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", order.getOrderId());
        result.put("userId", order.getUserId());
        result.put("status", order.getStatus());
        result.put("createdAt", order.getCreatedAt());
        return result;
    }

    private Long longArg(JsonNode arguments, String field, Long defaultValue) {
        if (arguments == null || arguments.get(field) == null || arguments.get(field).isNull()) {
            return defaultValue;
        }
        return arguments.get(field).asLong();
    }

    private Long requiredLong(JsonNode arguments, String field) {
        if (arguments == null || arguments.get(field) == null || arguments.get(field).isNull()) {
            throw new BizException(400, 400, "AI 工具参数缺失: " + field);
        }
        return arguments.get(field).asLong();
    }

    private String textArg(JsonNode arguments, String field, String defaultValue) {
        if (arguments == null || arguments.get(field) == null || arguments.get(field).isNull()) {
            return defaultValue;
        }
        return arguments.get(field).asText(defaultValue);
    }

    private Integer intValue(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }
}
