package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserAllergyMapper {

    @Delete("delete from user_allergies where user_id = #{userId}")
    int deleteByUserId(Long userId);

    @Insert("insert into user_allergies(user_id, allergen_id) values(#{userId}, #{allergenId})")
    int attach(@Param("userId") Long userId, @Param("allergenId") Long allergenId);

    @Select("""
            select a.name
            from user_allergies ua
            join allergens a on a.allergen_id = ua.allergen_id
            where ua.user_id = #{userId}
            order by a.name
            """)
    List<String> findAllergenNamesByUserId(Long userId);
}
