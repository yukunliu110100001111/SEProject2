package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RecommendationEventMapper {

    @Insert("""
            insert into recommendation_events(request_id, user_id, meal_id, event_type, rank_position, order_id)
            values(#{requestId}, #{userId}, #{mealId}, #{eventType}, #{rankPosition}, #{orderId})
            """)
    int insert(@Param("requestId") String requestId,
               @Param("userId") Long userId,
               @Param("mealId") Long mealId,
               @Param("eventType") String eventType,
               @Param("rankPosition") Integer rankPosition,
               @Param("orderId") Long orderId);
}
