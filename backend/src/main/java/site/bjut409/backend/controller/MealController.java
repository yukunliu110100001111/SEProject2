package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.util.List;
import java.util.Map;

@RestController
public class MealController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public MealController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @GetMapping("/meals")
    public ApiResponse<List<Map<String, Object>>> meals(@RequestHeader("Authorization") String authorization) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.listMeals(actor));
    }

    @GetMapping("/meals/{id}")
    public ApiResponse<Map<String, Object>> meal(@RequestHeader("Authorization") String authorization,
                                                  @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.mealDetail(actor, id));
    }

    @PostMapping("/meals")
    public ApiResponse<Map<String, Object>> createMeal(@RequestHeader("Authorization") String authorization,
                                                        @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.createMeal(actor,
                (String) req.get("name"),
                (String) req.get("description"),
                asInt(req.get("calories")),
                asInt(req.get("protein")),
                asInt(req.get("sustainabilityScore")),
                (List<String>) req.get("tags"),
                (List<Map<String, Object>>) req.get("ingredients")));
    }

    @PutMapping("/meals/{id}")
    public ApiResponse<Void> updateMeal(@RequestHeader("Authorization") String authorization,
                                        @PathVariable("id") Long id,
                                        @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        appService.updateMeal(actor, id,
                (String) req.get("name"),
                (String) req.get("description"),
                asInt(req.get("calories")),
                asInt(req.get("protein")),
                asInt(req.get("sustainabilityScore")),
                (List<String>) req.get("tags"),
                (List<Map<String, Object>>) req.get("ingredients"));
        return ApiResponse.success();
    }

    @DeleteMapping("/meals/{id}")
    public ApiResponse<Void> deleteMeal(@RequestHeader("Authorization") String authorization,
                                        @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        appService.deleteMeal(actor, id);
        return ApiResponse.success();
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<Map<String, Object>>> recommendations(@RequestHeader("Authorization") String authorization,
                                                                   @RequestParam("userId") Long userId) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.recommendations(actor, userId));
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
}
