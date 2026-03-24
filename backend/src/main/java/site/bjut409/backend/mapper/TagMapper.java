package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TagMapper {

    class TagRow {
        private Long tagId;
        private String tagName;

        public Long getTagId() { return tagId; }
        public void setTagId(Long tagId) { this.tagId = tagId; }
        public String getTagName() { return tagName; }
        public void setTagName(String tagName) { this.tagName = tagName; }
    }

    @Select("select tag_id, tag_name from sustainability_tags where tag_name = #{tagName}")
    TagRow findByName(String tagName);

    @Insert("insert into sustainability_tags(tag_name, score_weight) values(#{tagName}, 1)")
    @Options(useGeneratedKeys = true, keyProperty = "tagId", keyColumn = "tag_id")
    int insert(TagRow row);

    @Delete("delete from meal_sustainability_tags where meal_id = #{mealId}")
    int deleteMealTags(Long mealId);

    @Insert("insert into meal_sustainability_tags(meal_id, tag_id) values(#{mealId}, #{tagId})")
    int attachTag(@Param("mealId") Long mealId, @Param("tagId") Long tagId);

    @Select("""
            select st.tag_name
            from meal_sustainability_tags mst
            join sustainability_tags st on st.tag_id = mst.tag_id
            where mst.meal_id = #{mealId}
            order by st.tag_name
            """)
    List<String> findTagNamesByMealId(Long mealId);
}
