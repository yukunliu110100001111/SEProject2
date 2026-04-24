package site.bjut409.backend.model;

import lombok.Data;

@Data
public class MealRecord {
    private Long mealId;
    private String name;
    private String description;
    private Integer calories;
    private Integer protein;
    private Integer sustainabilityScore;
    private String imageUrl;
    private Boolean isDeleted;
}
