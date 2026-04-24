package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface DashboardMapper {

    @Select("""
            select m.meal_id as mealId, m.name as name, count(*) as count
            from recommendation_events re
            join meals m on m.meal_id = re.meal_id
            where re.event_type = 'exposure'
              and re.created_at >= #{from}
              and re.created_at < #{to}
              and m.is_deleted = false
            group by m.meal_id, m.name
            order by count desc, m.meal_id asc
            limit 5
            """)
    List<Map<String, Object>> topRecommendedMeals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Select("""
            select m.meal_id as mealId, m.name as name, count(*) as count
            from recommendation_events re
            join meals m on m.meal_id = re.meal_id
            where re.event_type = 'selected'
              and re.created_at >= #{from}
              and re.created_at < #{to}
              and m.is_deleted = false
            group by m.meal_id, m.name
            order by count desc, m.meal_id asc
            limit 5
            """)
    List<Map<String, Object>> topSelectedMeals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Select("""
            select m.meal_id as mealId, m.name as name, count(*) as count
            from recommendation_events re
            join meals m on m.meal_id = re.meal_id
            where re.event_type = 'click'
              and re.created_at >= #{from}
              and re.created_at < #{to}
              and m.is_deleted = false
            group by m.meal_id, m.name
            order by count desc, m.meal_id asc
            limit 5
            """)
    List<Map<String, Object>> topClickedMeals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Select("""
            select m.meal_id as mealId, m.name as name, coalesce(sum(oi.quantity), 0) as count
            from meals m
            join order_items oi on oi.meal_id = m.meal_id
            join orders o on o.order_id = oi.order_id
            where m.is_deleted = false
              and o.status = 'confirmed'
              and o.confirmed_at >= #{from}
              and o.confirmed_at < #{to}
            group by m.meal_id, m.name
            order by count desc, m.meal_id asc
            limit 5
            """)
    List<Map<String, Object>> topMeals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

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
            where o.confirmed_at >= #{from}
              and o.confirmed_at < #{to}
            """)
    Map<String, Object> lowCarbonStat(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Select("""
            select i.ingredient_id as ingredientId, i.name as name,
                   sr.current_qty_g as currentQty_g,
                   sr.expiry_date as expiryDate
            from ingredients i
            join lateral (
              select s.current_qty_g, s.expiry_date
              from stock_records s
              where s.ingredient_id = i.ingredient_id
              order by s.stock_id desc limit 1
            ) sr on true
            where sr.current_qty_g >= 5000
            order by sr.current_qty_g desc, i.ingredient_id asc
            limit 10
            """)
    List<Map<String, Object>> highStockIngredients();

    @Select("""
            select i.ingredient_id as ingredientId, i.name as name,
                   sr.current_qty_g as currentQty_g,
                   sr.expiry_date as expiryDate
            from ingredients i
            join lateral (
              select s.current_qty_g, s.expiry_date
              from stock_records s
              where s.ingredient_id = i.ingredient_id
              order by s.stock_id desc limit 1
            ) sr on true
            where sr.current_qty_g > 0
              and sr.expiry_date between current_date and current_date + 7
            order by sr.expiry_date asc, i.ingredient_id asc
            limit 10
            """)
    List<Map<String, Object>> nearExpiryIngredients();

    @Select("""
            select meal_id as mealId, name, sustainability_score as sustainabilityScore
            from meals
            where is_deleted = false
            order by meal_id
            """)
    List<Map<String, Object>> mealSustainabilityStats();

    @Select("""
            select
                coalesce(sum(case when event_type = 'exposure' then 1 else 0 end), 0) as exposureCount,
                coalesce(sum(case when event_type = 'click' then 1 else 0 end), 0) as clickCount,
                coalesce(sum(case when event_type = 'selected' then 1 else 0 end), 0) as selectedCount
            from recommendation_events
            where created_at >= #{from}
              and created_at < #{to}
            """)
    Map<String, Object> recommendationSummary(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Select("""
            select
                coalesce(rank_position, 0) as rankPosition,
                coalesce(sum(case when event_type = 'exposure' then 1 else 0 end), 0) as exposureCount,
                coalesce(sum(case when event_type = 'click' then 1 else 0 end), 0) as clickCount,
                coalesce(sum(case when event_type = 'selected' then 1 else 0 end), 0) as selectedCount
            from recommendation_events
            where created_at >= #{from}
              and created_at < #{to}
            group by coalesce(rank_position, 0)
            order by rankPosition asc
            """)
    List<Map<String, Object>> recommendationPositionStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
