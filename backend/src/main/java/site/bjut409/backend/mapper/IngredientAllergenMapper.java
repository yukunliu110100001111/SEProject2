package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface IngredientAllergenMapper {

    @Delete("delete from ingredient_allergens where ingredient_id = #{ingredientId}")
    int deleteByIngredientId(Long ingredientId);

    @Insert("insert into ingredient_allergens(ingredient_id, allergen_id) values(#{ingredientId}, #{allergenId})")
    int attach(@Param("ingredientId") Long ingredientId, @Param("allergenId") Long allergenId);

    @Select("""
            select a.name
            from ingredient_allergens ia
            join allergens a on a.allergen_id = ia.allergen_id
            where ia.ingredient_id = #{ingredientId}
            order by a.name
            """)
    List<String> findAllergenNamesByIngredientId(Long ingredientId);

    @Select("""
            select distinct a.name
            from meal_ingredients mi
            join ingredient_allergens ia on ia.ingredient_id = mi.ingredient_id
            join allergens a on a.allergen_id = ia.allergen_id
            where mi.meal_id = #{mealId}
            order by a.name
            """)
    List<String> findAllergenNamesByMealId(Long mealId);
}
