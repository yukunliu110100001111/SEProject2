package site.bjut409.backend.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderRecord {
    private Long orderId;
    private Long userId;
    private String recommendationRequestId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
}
