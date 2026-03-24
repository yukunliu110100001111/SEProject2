package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.IngredientRecord;

import java.util.List;

@Mapper
public interface IngredientMapper {

    @Select("select ingredient_id, name from ingredients where ingredient_id = #{id}")
    IngredientRecord findById(Long id);

    @Select("select ingredient_id, name from ingredients order by ingredient_id")
    List<IngredientRecord> findAll();

    @Insert("insert into ingredients(name) values(#{name})")
    @Options(useGeneratedKeys = true, keyProperty = "ingredientId", keyColumn = "ingredient_id")
    int insert(IngredientRecord ingredient);

    @Update("update ingredients set name = #{name} where ingredient_id = #{ingredientId}")
    int updateName(IngredientRecord ingredient);

    @Select("select count(*) from ingredients")
    long countAll();
}
