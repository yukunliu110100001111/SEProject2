package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface DashboardMapper {

    @Select("""
            select m.meal_id as mealId, m.name as name, coalesce(sum(oi.quantity),0) as count
            from meals m
            left join order_items oi on oi.meal_id = m.meal_id
            left join orders o on o.order_id = oi.order_id and o.status = 'confirmed'
            where m.is_deleted = false
            group by m.meal_id, m.name
            order by count desc
            limit 5
            """)
    List<Map<String, Object>> topMeals();

    @Select("""
            select i.ingredient_id as ingredientId, i.name as name,
                   coalesce(sr.current_qty_g,0) as currentQty,
                   sr.expiry_date as expiryDate
            from ingredients i
            left join lateral (
              select s.current_qty_g, s.expiry_date
              from stock_records s
              where s.ingredient_id = i.ingredient_id
              order by s.stock_id desc limit 1
            ) sr on true
            order by i.ingredient_id
            """)
    List<Map<String, Object>> stockUsage();

    @Select("""
            select coalesce(sum(case when exists (
                select 1 from meal_sustainability_tags mst
                join sustainability_tags st on st.tag_id = mst.tag_id
                where mst.meal_id = oi.meal_id and st.tag_name = 'low-carbon'
            ) then oi.quantity else 0 end),0) as lowCount,
            coalesce(sum(oi.quantity),0) as totalCount
            from order_items oi
            join orders o on o.order_id = oi.order_id and o.status = 'confirmed'
            """)
    Map<String, Object> lowCarbonStat();
}
