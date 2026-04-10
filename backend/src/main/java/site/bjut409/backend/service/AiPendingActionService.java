package site.bjut409.backend.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.BizException;
import site.bjut409.backend.dto.AiChatResponse;
import site.bjut409.backend.dto.AiPendingActionView;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiPendingActionService {

    private final Map<String, PendingAction> actions = new ConcurrentHashMap<>();
    private final AppService appService;
    private final ObjectMapper objectMapper;

    public AiPendingActionService(AppService appService, ObjectMapper objectMapper) {
        this.appService = appService;
        this.objectMapper = objectMapper;
    }

    public AiPendingActionView create(AuthUser actor, String actionType, JsonNode arguments, String summary) {
        Map<String, Object> args = castMap(objectMapper.convertValue(arguments == null ? Map.of() : arguments, Map.class));
        String actionId = UUID.randomUUID().toString();
        PendingAction action = new PendingAction(actionId, actor.userId(), actionType, summary, args);
        actions.put(actionId, action);
        return toView(action);
    }

    public AiChatResponse confirm(AuthUser actor, String actionId) {
        PendingAction action = actions.remove(actionId);
        if (action == null) {
            throw new BizException(404, 404, "待确认操作不存在或已失效");
        }
        if (!actor.userId().equals(action.userId())) {
            throw new BizException(403, 403, "不能确认其他用户的操作");
        }

        String reply = switch (action.actionType()) {
            case "update_preferences" -> confirmUpdatePreferences(actor, action.arguments());
            case "create_order" -> confirmCreateOrder(actor, action.arguments());
            default -> throw new BizException(400, 400, "未知待确认操作: " + action.actionType());
        };
        return new AiChatResponse(reply, "local-action", List.of(action.actionType()), null);
    }

    private String confirmUpdatePreferences(AuthUser actor, Map<String, Object> arguments) {
        Map<String, Object> profile = appService.userInfo(actor, actor.userId());
        Map<String, Object> preferences = castMap(profile.get("preferences"));

        Integer targetCalories = intValue(arguments.get("targetCalories"),
                intValue(preferences.get("targetCalories"), null));
        Integer targetProtein = intValue(arguments.get("targetProtein"),
                intValue(preferences.get("targetProtein"), null));
        Boolean isVegetarian = boolValue(arguments.get("isVegetarian"),
                boolValue(preferences.get("isVegetarian"), null));
        List<String> allergens = stringList(arguments.get("allergens"),
                stringList(preferences.get("allergens"), List.of()));

        appService.updatePreference(actor, actor.userId(), targetCalories, targetProtein, isVegetarian, allergens);
        return "已按确认内容更新你的饮食偏好。";
    }

    private String confirmCreateOrder(AuthUser actor, Map<String, Object> arguments) {
        List<Map<String, Object>> items = castList(arguments.get("items"));
        if (items.isEmpty()) {
            throw new BizException(400, 400, "创建订单缺少 items");
        }
        Map<String, Object> result = appService.createOrder(actor, actor.userId(), items);
        return "订单已创建，订单号是 %s，当前状态为 %s。"
                .formatted(result.get("orderId"), result.get("status"));
    }

    private AiPendingActionView toView(PendingAction action) {
        return new AiPendingActionView(action.actionId(), action.actionType(), action.summary(), action.arguments());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> stringList(Object value, List<String> defaultValue) {
        if (value instanceof List<?> list) {
            return (List<String>) list;
        }
        return defaultValue;
    }

    private Integer intValue(Object value, Integer defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private Boolean boolValue(Object value, Boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private record PendingAction(String actionId,
                                 Long userId,
                                 String actionType,
                                 String summary,
                                 Map<String, Object> arguments) {
    }
}
