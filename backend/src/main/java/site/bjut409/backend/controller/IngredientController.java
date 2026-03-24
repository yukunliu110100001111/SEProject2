package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class IngredientController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public IngredientController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @PostMapping("/ingredients")
    public ApiResponse<Map<String, Object>> createIngredient(@RequestHeader("Authorization") String authorization,
                                                              @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.createIngredient(actor,
                (String) req.get("name"),
                asInt(req.get("currentQty_g")),
                parseDate((String) req.get("expiryDate")),
                asStringList(req.get("allergens"))));
    }

    @PutMapping("/ingredients/{id}")
    public ApiResponse<Void> updateIngredient(@RequestHeader("Authorization") String authorization,
                                              @PathVariable("id") Long id,
        @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        appService.updateIngredient(actor, id, (String) req.get("name"), asStringList(req.get("allergens")));
        return ApiResponse.success();
    }

    @PutMapping("/stock/{ingredientId}")
    public ApiResponse<Map<String, Object>> updateStock(@RequestHeader("Authorization") String authorization,
                                                         @PathVariable("ingredientId") Long ingredientId,
                                                         @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.updateStock(actor, ingredientId,
                asInt(req.get("currentQty_g")),
                parseDate((String) req.get("expiryDate"))));
    }

    private Integer asInt(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof Number n) {
            return n.intValue();
        }
        return Integer.valueOf(String.valueOf(o));
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return LocalDate.parse(s);
    }

    private List<String> asStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return null;
        }
        List<String> result = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                result.add(String.valueOf(item));
            }
        }
        return result;
    }
}
