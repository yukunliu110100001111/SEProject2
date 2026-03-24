package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import site.bjut409.backend.model.MealIngredientRecord;

import java.util.List;

@Mapper
public interface MealIngredientMapper {

    @Select("""
            select mi.meal_id, mi.ingredient_id, mi.weight_g, i.name as ingredient_name
            from meal_ingredients mi
            join ingredients i on i.ingredient_id = mi.ingredient_id
            where mi.meal_id = #{mealId}
            order by mi.ingredient_id
            """)
    List<MealIngredientRecord> findByMealId(Long mealId);

    @Delete("delete from meal_ingredients where meal_id = #{mealId}")
    int deleteByMealId(Long mealId);

    @Insert("insert into meal_ingredients(meal_id, ingredient_id, weight_g) values(#{mealId}, #{ingredientId}, #{weightG})")
    int insert(MealIngredientRecord row);
}
