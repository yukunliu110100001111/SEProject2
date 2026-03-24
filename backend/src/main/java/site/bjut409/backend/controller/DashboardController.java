package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.util.Map;

@RestController
public class DashboardController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public DashboardController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@RequestHeader("Authorization") String authorization) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.dashboard(actor));
    }
}
