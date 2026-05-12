package site.bjut409.backend.model;

import lombok.Data;

@Data
public class OrderItemRecord {
    private Long itemId;
    private Long orderId;
    private Long mealId;
    private Integer quantity;
    private String mealNameSnapshot;
    private Integer caloriesSnapshot;
    private Integer proteinSnapshot;
    private Integer sustainabilityScoreSnapshot;
    private String imageUrlSnapshot;
    private String customIngredientsJson;
}
