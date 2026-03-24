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
public class ReportController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public ReportController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @GetMapping("/reports/sustainability")
    public ApiResponse<Map<String, Object>> sustainability(@RequestHeader("Authorization") String authorization) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.sustainabilityReport(actor));
    }
}
