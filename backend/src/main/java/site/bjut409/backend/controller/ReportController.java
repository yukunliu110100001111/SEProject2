package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.time.LocalDate;
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
    public ApiResponse<Map<String, Object>> sustainability(@RequestHeader("Authorization") String authorization,
                                                           @RequestParam(value = "from", required = false) String from,
                                                           @RequestParam(value = "to", required = false) String to) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.sustainabilityReport(actor, parseDate(from), parseDate(to)));
    }

    @GetMapping("/reports/sustainability/history")
    public ApiResponse<Map<String, Object>> sustainabilityHistory(@RequestHeader("Authorization") String authorization,
                                                                  @RequestParam(value = "page", required = false) Integer page,
                                                                  @RequestParam(value = "size", required = false) Integer size) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.listSustainabilityReports(actor, page, size));
    }

    @GetMapping("/reports/sustainability/{id}")
    public ApiResponse<Map<String, Object>> sustainabilityDetail(@RequestHeader("Authorization") String authorization,
                                                                 @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.sustainabilityReportDetail(actor, id));
    }

    @GetMapping("/reports/recommendations/analytics")
    public ApiResponse<Map<String, Object>> recommendationAnalytics(@RequestHeader("Authorization") String authorization,
                                                                    @RequestParam(value = "from", required = false) String from,
                                                                    @RequestParam(value = "to", required = false) String to) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.recommendationAnalytics(actor, parseDate(from), parseDate(to)));
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value);
    }
}
