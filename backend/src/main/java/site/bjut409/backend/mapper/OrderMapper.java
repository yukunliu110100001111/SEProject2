package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.OrderRecord;

import java.util.List;

@Mapper
public interface OrderMapper {

    @Insert("insert into orders(user_id, recommendation_request_id, status) values(#{userId}, #{recommendationRequestId}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "orderId", keyColumn = "order_id")
    int insert(OrderRecord order);

    @Select("select order_id, user_id, recommendation_request_id, status, created_at, confirmed_at, cancelled_at from orders where order_id = #{orderId}")
    OrderRecord findById(Long orderId);

    @Select("select order_id, user_id, recommendation_request_id, status, created_at, confirmed_at, cancelled_at from orders where user_id = #{userId} order by created_at desc, order_id desc")
    List<OrderRecord> findByUserId(Long userId);

    @Select("select order_id, user_id, recommendation_request_id, status, created_at, confirmed_at, cancelled_at from orders order by created_at desc, order_id desc")
    List<OrderRecord> findAll();

    @Update("""
            update orders
            set status = #{status},
                confirmed_at = case when #{status} = 'confirmed' then current_timestamp else confirmed_at end,
                cancelled_at = case when #{status} = 'cancelled' then current_timestamp else cancelled_at end
            where order_id = #{orderId}
            """)
    int updateStatus(@Param("orderId") Long orderId, @Param("status") String status);
}
