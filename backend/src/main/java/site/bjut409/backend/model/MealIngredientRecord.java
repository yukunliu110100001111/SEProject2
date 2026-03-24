package site.bjut409.backend.model;

import lombok.Data;

@Data
public class MealIngredientRecord {
    private Long mealId;
    private Long ingredientId;
    private Integer weightG;
    private String ingredientName;
}
