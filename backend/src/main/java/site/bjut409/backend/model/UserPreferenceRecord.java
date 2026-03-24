package site.bjut409.backend.model;

import lombok.Data;

@Data
public class UserPreferenceRecord {
    private Long userId;
    private Integer targetCalories;
    private Integer targetProtein;
    private Boolean isVegetarian;
}
