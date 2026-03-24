package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.util.Map;

@RestController
public class AuthController {

    private final AppService appService;

    public AuthController(AppService appService) {
        this.appService = appService;
    }

    @PostMapping("/auth/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, Object> req) {
        return ApiResponse.success(appService.login((String) req.get("username"), (String) req.get("password")));
    }

    @PostMapping("/auth/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody Map<String, Object> req) {
        return ApiResponse.success(appService.register((String) req.get("username"), (String) req.get("password")));
    }
}
