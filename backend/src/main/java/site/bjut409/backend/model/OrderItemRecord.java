package site.bjut409.backend.model;

import lombok.Data;

@Data
public class OrderItemRecord {
    private Long orderId;
    private Long mealId;
    private Integer quantity;
}
