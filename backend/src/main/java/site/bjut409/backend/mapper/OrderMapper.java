package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.OrderRecord;

@Mapper
public interface OrderMapper {

    @Insert("insert into orders(user_id, status) values(#{userId}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "orderId", keyColumn = "order_id")
    int insert(OrderRecord order);

    @Select("select order_id, user_id, status, created_at from orders where order_id = #{orderId}")
    OrderRecord findById(Long orderId);

    @Update("update orders set status = #{status} where order_id = #{orderId}")
    int updateStatus(@Param("orderId") Long orderId, @Param("status") String status);
}
