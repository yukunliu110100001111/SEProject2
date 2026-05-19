package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import site.bjut409.backend.model.OrderItemRecord;

import java.util.List;

@Mapper
public interface OrderItemMapper {

    @Insert("""
            insert into order_items(
                order_id,
                meal_id,
                quantity,
                meal_name_snapshot,
                calories_snapshot,
                protein_snapshot,
                sustainability_score_snapshot,
                image_url_snapshot,
                custom_ingredients_json
            ) values (
                #{orderId},
                #{mealId},
                #{quantity},
                #{mealNameSnapshot},
                #{caloriesSnapshot},
                #{proteinSnapshot},
                #{sustainabilityScoreSnapshot},
                #{imageUrlSnapshot},
                #{customIngredientsJson}
            )
            """)
    @Options(useGeneratedKeys = true, keyProperty = "itemId", keyColumn = "item_id")
    int insert(OrderItemRecord item);

    @Select("""
            select item_id,
                   order_id,
                   meal_id,
                   quantity,
                   meal_name_snapshot,
                   calories_snapshot,
                   protein_snapshot,
                   sustainability_score_snapshot,
                   image_url_snapshot,
                   custom_ingredients_json
            from order_items
            where order_id = #{orderId}
            order by item_id
            """)
    List<OrderItemRecord> findByOrderId(Long orderId);
}
