package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class UserController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public UserController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @GetMapping("/users/{id}")
    public ApiResponse<Map<String, Object>> getUser(@RequestHeader("Authorization") String authorization,
                                                     @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.userInfo(actor, id));
    }

    @PutMapping("/users/{id}")
    public ApiResponse<Void> updateUser(@RequestHeader("Authorization") String authorization,
                                        @PathVariable("id") Long id,
                                        @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        appService.updateUserProfile(actor, id, (String) req.get("username"));
        return ApiResponse.success();
    }

    @PutMapping("/users/{id}/preferences")
    public ApiResponse<Void> updatePref(@RequestHeader("Authorization") String authorization,
                                        @PathVariable("id") Long id,
                                        @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        appService.updatePreference(actor, id,
                asInt(req.get("targetCalories")),
                asInt(req.get("targetProtein")),
                (Boolean) req.get("isVegetarian"),
                asStringList(req.get("allergens")));
        return ApiResponse.success();
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
