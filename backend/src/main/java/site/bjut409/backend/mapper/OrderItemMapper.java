package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import site.bjut409.backend.model.OrderItemRecord;

import java.util.List;

@Mapper
public interface OrderItemMapper {

    @Insert("insert into order_items(order_id, meal_id, quantity) values(#{orderId}, #{mealId}, #{quantity})")
    int insert(OrderItemRecord item);

    @Select("select order_id, meal_id, quantity from order_items where order_id = #{orderId}")
    List<OrderItemRecord> findByOrderId(Long orderId);
}
