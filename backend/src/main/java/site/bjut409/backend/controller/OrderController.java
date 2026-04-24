package site.bjut409.backend.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.ApiResponse;
import site.bjut409.backend.service.AppService;

import java.util.List;
import java.util.Map;

@RestController
public class OrderController {

    private final AuthSupport authSupport;
    private final AppService appService;

    public OrderController(AuthSupport authSupport, AppService appService) {
        this.authSupport = authSupport;
        this.appService = appService;
    }

    @PostMapping("/orders")
    public ApiResponse<Map<String, Object>> createOrder(@RequestHeader("Authorization") String authorization,
                                                         @RequestBody Map<String, Object> req) {
        AuthUser actor = authSupport.requireUser(authorization);
        Long userId = Long.valueOf(String.valueOf(req.get("userId")));
        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("items");
        return ApiResponse.success(appService.createOrder(actor, userId, (String) req.get("recommendationRequestId"), items));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<Map<String, Object>> orderDetail(@RequestHeader("Authorization") String authorization,
                                                        @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.orderDetail(actor, id));
    }

    @GetMapping("/orders")
    public ApiResponse<Map<String, Object>> listOrders(@RequestHeader("Authorization") String authorization,
                                                       @RequestParam(value = "userId", required = false) Long userId,
                                                       @RequestParam(value = "status", required = false) String status,
                                                       @RequestParam(value = "page", defaultValue = "1") Integer page,
                                                       @RequestParam(value = "size", defaultValue = "20") Integer size) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.listOrders(actor, userId, status, page, size));
    }

    @PostMapping("/orders/{id}/cancel")
    public ApiResponse<Map<String, Object>> cancelOrder(@RequestHeader("Authorization") String authorization,
                                                         @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.cancelOrder(actor, id));
    }

    @PostMapping("/orders/{id}/confirm")
    public ApiResponse<Map<String, Object>> confirmOrder(@RequestHeader("Authorization") String authorization,
                                                          @PathVariable("id") Long id) {
        AuthUser actor = authSupport.requireUser(authorization);
        return ApiResponse.success(appService.confirmOrder(actor, id));
    }
}
