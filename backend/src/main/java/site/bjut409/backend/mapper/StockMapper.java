package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.StockRecordRow;

@Mapper
public interface StockMapper {

    @Select("""
            select stock_id, ingredient_id, current_qty_g, expiry_date
            from stock_records
            where ingredient_id = #{ingredientId}
            order by stock_id desc
            limit 1
            """)
    StockRecordRow findLatestByIngredientId(Long ingredientId);

    @Insert("insert into stock_records(ingredient_id, current_qty_g, expiry_date) values(#{ingredientId}, #{currentQtyG}, #{expiryDate})")
    int insert(StockRecordRow row);

    @Update("update stock_records set current_qty_g = #{currentQtyG}, expiry_date = #{expiryDate} where stock_id = #{stockId}")
    int update(StockRecordRow row);
}
