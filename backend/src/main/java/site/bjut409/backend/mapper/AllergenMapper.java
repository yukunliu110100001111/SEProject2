package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import site.bjut409.backend.model.AllergenRecord;

@Mapper
public interface AllergenMapper {

    @Select("select allergen_id, name from allergens where name = #{name}")
    AllergenRecord findByName(String name);

    @Insert("insert into allergens(name) values(#{name})")
    @Options(useGeneratedKeys = true, keyProperty = "allergenId", keyColumn = "allergen_id")
    int insert(AllergenRecord record);
}
