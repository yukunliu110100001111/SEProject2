package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.UserPreferenceRecord;

@Mapper
public interface UserPreferenceMapper {

    @Select("select user_id, target_calories, target_protein, is_vegetarian from user_preferences where user_id = #{userId}")
    UserPreferenceRecord findByUserId(Long userId);

    @Insert("insert into user_preferences(user_id, target_calories, target_protein, is_vegetarian) values(#{userId}, #{targetCalories}, #{targetProtein}, #{isVegetarian})")
    int insert(UserPreferenceRecord record);

    @Update("update user_preferences set target_calories=#{targetCalories}, target_protein=#{targetProtein}, is_vegetarian=#{isVegetarian} where user_id=#{userId}")
    int update(UserPreferenceRecord record);
}
