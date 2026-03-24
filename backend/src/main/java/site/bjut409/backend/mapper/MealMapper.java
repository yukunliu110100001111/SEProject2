package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.MealRecord;

import java.util.List;

@Mapper
public interface MealMapper {

    @Select("select meal_id, name, description, calories, protein, sustainability_score, is_deleted from meals where is_deleted = false order by meal_id")
    List<MealRecord> listActive();

    @Select("select meal_id, name, description, calories, protein, sustainability_score, is_deleted from meals where meal_id = #{mealId}")
    MealRecord findById(Long mealId);

    @Insert("insert into meals(name, description, calories, protein, sustainability_score, is_deleted) values(#{name}, #{description}, #{calories}, #{protein}, #{sustainabilityScore}, false)")
    @Options(useGeneratedKeys = true, keyProperty = "mealId", keyColumn = "meal_id")
    int insert(MealRecord meal);

    @Update("update meals set name=#{name}, description=#{description}, calories=#{calories}, protein=#{protein}, sustainability_score=#{sustainabilityScore} where meal_id=#{mealId}")
    int update(MealRecord meal);

    @Update("update meals set is_deleted = true where meal_id = #{mealId}")
    int softDelete(Long mealId);

    @Select("select count(*) from meals")
    long countAll();
}
