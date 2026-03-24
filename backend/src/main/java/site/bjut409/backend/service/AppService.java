package site.bjut409.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.bjut409.backend.auth.AuthSupport;
import site.bjut409.backend.auth.AuthUser;
import site.bjut409.backend.common.BizException;
import site.bjut409.backend.mapper.AllergenMapper;
import site.bjut409.backend.mapper.DashboardMapper;
import site.bjut409.backend.mapper.IngredientAllergenMapper;
import site.bjut409.backend.mapper.IngredientMapper;
import site.bjut409.backend.mapper.MealIngredientMapper;
import site.bjut409.backend.mapper.MealMapper;
import site.bjut409.backend.mapper.OrderItemMapper;
import site.bjut409.backend.mapper.OrderMapper;
import site.bjut409.backend.mapper.StockMapper;
import site.bjut409.backend.mapper.TagMapper;
import site.bjut409.backend.mapper.UserAllergyMapper;
import site.bjut409.backend.mapper.UserMapper;
import site.bjut409.backend.mapper.UserPreferenceMapper;
import site.bjut409.backend.model.AllergenRecord;
import site.bjut409.backend.model.IngredientRecord;
import site.bjut409.backend.model.MealIngredientRecord;
import site.bjut409.backend.model.MealRecord;
import site.bjut409.backend.model.OrderItemRecord;
import site.bjut409.backend.model.OrderRecord;
import site.bjut409.backend.model.StockRecordRow;
import site.bjut409.backend.model.UserPreferenceRecord;
import site.bjut409.backend.model.UserRecord;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class AppService {

    private final UserMapper userMapper;
    private final UserPreferenceMapper userPreferenceMapper;
    private final AllergenMapper allergenMapper;
    private final UserAllergyMapper userAllergyMapper;
    private final IngredientMapper ingredientMapper;
    private final IngredientAllergenMapper ingredientAllergenMapper;
    private final StockMapper stockMapper;
    private final MealMapper mealMapper;
    private final MealIngredientMapper mealIngredientMapper;
    private final TagMapper tagMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final DashboardMapper dashboardMapper;
    private final AuthSupport authSupport;
    private final StockStatusHelper stockStatusHelper;

    public AppService(UserMapper userMapper,
                      UserPreferenceMapper userPreferenceMapper,
                      AllergenMapper allergenMapper,
                      UserAllergyMapper userAllergyMapper,
                      IngredientMapper ingredientMapper,
                      IngredientAllergenMapper ingredientAllergenMapper,
                      StockMapper stockMapper,
                      MealMapper mealMapper,
                      MealIngredientMapper mealIngredientMapper,
                      TagMapper tagMapper,
                      OrderMapper orderMapper,
                      OrderItemMapper orderItemMapper,
                      DashboardMapper dashboardMapper,
                      AuthSupport authSupport,
                      StockStatusHelper stockStatusHelper) {
        this.userMapper = userMapper;
        this.userPreferenceMapper = userPreferenceMapper;
        this.allergenMapper = allergenMapper;
        this.userAllergyMapper = userAllergyMapper;
        this.ingredientMapper = ingredientMapper;
        this.ingredientAllergenMapper = ingredientAllergenMapper;
        this.stockMapper = stockMapper;
        this.mealMapper = mealMapper;
        this.mealIngredientMapper = mealIngredientMapper;
        this.tagMapper = tagMapper;
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.dashboardMapper = dashboardMapper;
        this.authSupport = authSupport;
        this.stockStatusHelper = stockStatusHelper;
    }

    public Map<String, Object> login(String username, String password) {
        UserRecord user = userMapper.findByUsername(username);
        if (user == null || !Objects.equals(user.getPasswordHash(), password)) {
            throw new BizException(401, 401, "用户名或密码错误");
        }
        String token = authSupport.issueToken(user.getUserId());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", user.getUserId());
        data.put("username", user.getUsername());
        data.put("role", user.getRole());
        data.put("token", token);
        return data;
    }

    @Transactional
    public Map<String, Object> register(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new BizException(400, 400, "参数错误");
        }
        if (userMapper.findByUsername(username) != null) {
            throw new BizException(409, 409, "用户名已存在");
        }
        UserRecord user = new UserRecord();
        user.setUsername(username);
        user.setPasswordHash(password);
        user.setRole("customer");
        userMapper.insert(user);

        UserPreferenceRecord pref = new UserPreferenceRecord();
        pref.setUserId(user.getUserId());
        pref.setTargetCalories(2000);
        pref.setTargetProtein(80);
        pref.setIsVegetarian(false);
        userPreferenceMapper.insert(pref);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", user.getUserId());
        data.put("username", user.getUsername());
        data.put("role", user.getRole());
        return data;
    }

    public Map<String, Object> userInfo(AuthUser actor, Long userId) {
        authSupport.requireSelfOrRole(actor, userId, "admin", "staff");
        UserRecord user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(404, 404, "用户不存在");
        }
        UserPreferenceRecord pref = userPreferenceMapper.findByUserId(userId);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", user.getUserId());
        data.put("username", user.getUsername());
        data.put("role", user.getRole());

        Map<String, Object> prefData = new LinkedHashMap<>();
        if (pref != null) {
            prefData.put("targetCalories", pref.getTargetCalories());
            prefData.put("targetProtein", pref.getTargetProtein());
            prefData.put("isVegetarian", pref.getIsVegetarian());
        }
        prefData.put("allergens", userAllergyMapper.findAllergenNamesByUserId(userId));
        data.put("preferences", prefData);
        return data;
    }

    @Transactional
    public void updateUserProfile(AuthUser actor, Long userId, String username) {
        authSupport.requireSelfOrRole(actor, userId, "admin");
        if (username == null || username.isBlank()) {
            throw new BizException(400, 400, "参数错误");
        }
        UserRecord current = userMapper.findById(userId);
        if (current == null) {
            throw new BizException(404, 404, "用户不存在");
        }
        UserRecord existing = userMapper.findByUsername(username);
        if (existing != null && !Objects.equals(existing.getUserId(), userId)) {
            throw new BizException(409, 409, "用户名已存在");
        }
        current.setUsername(username);
        userMapper.updateUsername(current);
    }

    @Transactional
    public void updatePreference(AuthUser actor, Long userId, Integer calories, Integer protein, Boolean vegetarian,
                                 List<String> allergens) {
        authSupport.requireSelfOrRole(actor, userId, "admin");
        UserPreferenceRecord pref = userPreferenceMapper.findByUserId(userId);
        if (pref == null) {
            pref = new UserPreferenceRecord();
            pref.setUserId(userId);
            pref.setTargetCalories(calories);
            pref.setTargetProtein(protein);
            pref.setIsVegetarian(vegetarian);
            userPreferenceMapper.insert(pref);
        } else {
            pref.setTargetCalories(calories);
            pref.setTargetProtein(protein);
            pref.setIsVegetarian(vegetarian);
            userPreferenceMapper.update(pref);
        }
        if (allergens != null) {
            replaceUserAllergens(userId, allergens);
        }
    }

    public List<Map<String, Object>> listMeals(AuthUser actor) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        return mealMapper.listActive().stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mealId", m.getMealId());
            row.put("name", m.getName());
            row.put("calories", m.getCalories());
            row.put("protein", m.getProtein());
            row.put("sustainabilityScore", m.getSustainabilityScore());
            return row;
        }).toList();
    }

    public Map<String, Object> mealDetail(AuthUser actor, Long mealId) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        MealRecord meal = mealMapper.findById(mealId);
        if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
            throw new BizException(404, 404, "菜品不存在");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mealId", meal.getMealId());
        data.put("name", meal.getName());
        data.put("description", meal.getDescription());
        data.put("calories", meal.getCalories());
        data.put("protein", meal.getProtein());

        List<Map<String, Object>> ingredients = mealIngredientMapper.findByMealId(mealId).stream().map(i -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ingredientId", i.getIngredientId());
            row.put("name", i.getIngredientName());
            row.put("weight_g", i.getWeightG());
            return row;
        }).toList();
        data.put("ingredients", ingredients);
        data.put("tags", tagMapper.findTagNamesByMealId(mealId));
        return data;
    }

    @Transactional
    public Map<String, Object> createMeal(AuthUser actor, String name, String description, Integer calories, Integer protein,
                                          Integer sustainabilityScore, List<String> tags,
                                          List<Map<String, Object>> ingredients) {
        authSupport.requireRole(actor, "staff", "admin");
        MealRecord meal = new MealRecord();
        meal.setName(name);
        meal.setDescription(description);
        meal.setCalories(calories);
        meal.setProtein(protein);
        meal.setSustainabilityScore(sustainabilityScore);
        mealMapper.insert(meal);
        updateMealRelations(meal.getMealId(),
                tags == null ? List.of() : tags,
                ingredients == null ? List.of() : ingredients);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mealId", meal.getMealId());
        return data;
    }

    @Transactional
    public void updateMeal(AuthUser actor, Long mealId, String name, String description, Integer calories, Integer protein,
                           Integer sustainabilityScore, List<String> tags,
                           List<Map<String, Object>> ingredients) {
        authSupport.requireRole(actor, "staff", "admin");
        MealRecord meal = mealMapper.findById(mealId);
        if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
            throw new BizException(404, 404, "菜品不存在");
        }
        meal.setName(name);
        meal.setDescription(description);
        meal.setCalories(calories);
        meal.setProtein(protein);
        meal.setSustainabilityScore(sustainabilityScore);
        mealMapper.update(meal);
        updateMealRelations(mealId, tags, ingredients);
    }

    @Transactional
    public void deleteMeal(AuthUser actor, Long mealId) {
        authSupport.requireRole(actor, "staff", "admin");
        mealMapper.softDelete(mealId);
    }

    @Transactional
    public Map<String, Object> createIngredient(AuthUser actor, String name, Integer qty, LocalDate expiryDate,
                                                List<String> allergens) {
        authSupport.requireRole(actor, "staff", "admin");
        IngredientRecord ingredient = new IngredientRecord();
        ingredient.setName(name);
        ingredientMapper.insert(ingredient);

        StockRecordRow stock = new StockRecordRow();
        stock.setIngredientId(ingredient.getIngredientId());
        stock.setCurrentQtyG(qty);
        stock.setExpiryDate(expiryDate);
        stockMapper.insert(stock);
        replaceIngredientAllergens(ingredient.getIngredientId(), allergens);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ingredientId", ingredient.getIngredientId());
        return data;
    }

    @Transactional
    public void updateIngredient(AuthUser actor, Long ingredientId, String name, List<String> allergens) {
        authSupport.requireRole(actor, "staff", "admin");
        IngredientRecord ingredient = ingredientMapper.findById(ingredientId);
        if (ingredient == null) {
            throw new BizException(404, 404, "食材不存在");
        }
        ingredient.setName(name);
        ingredientMapper.updateName(ingredient);
        replaceIngredientAllergens(ingredientId, allergens);
    }

    @Transactional
    public Map<String, Object> updateStock(AuthUser actor, Long ingredientId, Integer currentQtyG, LocalDate expiryDate) {
        authSupport.requireRole(actor, "staff", "admin");
        if (ingredientMapper.findById(ingredientId) == null) {
            throw new BizException(404, 404, "食材不存在");
        }
        StockRecordRow latest = stockMapper.findLatestByIngredientId(ingredientId);
        if (latest == null) {
            latest = new StockRecordRow();
            latest.setIngredientId(ingredientId);
            latest.setCurrentQtyG(currentQtyG);
            latest.setExpiryDate(expiryDate);
            stockMapper.insert(latest);
        } else {
            latest.setCurrentQtyG(currentQtyG);
            latest.setExpiryDate(expiryDate);
            stockMapper.update(latest);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ingredientId", ingredientId);
        data.put("stockStatus", stockStatusHelper.calcStatus(currentQtyG, expiryDate));
        return data;
    }

    public List<Map<String, Object>> recommendations(AuthUser actor, Long userId) {
        authSupport.requireSelfOrRole(actor, userId, "admin", "staff");
        UserPreferenceRecord pref = userPreferenceMapper.findByUserId(userId);
        if (pref == null) {
            throw new BizException(404, 404, "用户偏好不存在");
        }
        Set<String> userAllergens = lowerSet(userAllergyMapper.findAllergenNamesByUserId(userId));

        List<Map<String, Object>> result = new ArrayList<>();
        for (MealRecord meal : mealMapper.listActive()) {
            List<MealIngredientRecord> ingredients = mealIngredientMapper.findByMealId(meal.getMealId());
            List<String> tags = tagMapper.findTagNamesByMealId(meal.getMealId());
            Set<String> mealAllergens = lowerSet(ingredientAllergenMapper.findAllergenNamesByMealId(meal.getMealId()));
            boolean allergenConflict = mealAllergens.stream().anyMatch(userAllergens::contains);

            double health = healthScore(pref, meal);
            double preference = preferenceScore(pref, ingredients);
            if (allergenConflict) {
                preference = 0.0;
            }
            double sustainability = meal.getSustainabilityScore() == null ? 0.0 : meal.getSustainabilityScore() / 10.0;
            double stock = stockPriorityScore(ingredients);
            double score = 0.4 * health + 0.3 * preference + 0.2 * sustainability + 0.1 * stock;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mealId", meal.getMealId());
            row.put("name", meal.getName());
            row.put("score", BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
            row.put("reason", reasonText(stock, tags, allergenConflict));
            result.add(row);
        }
        result.sort(Comparator.comparing((Map<String, Object> m) -> ((BigDecimal) m.get("score"))).reversed());
        return result;
    }

    @Transactional
    public Map<String, Object> createOrder(AuthUser actor, Long userId, List<Map<String, Object>> items) {
        authSupport.requireSelfOrRole(actor, userId, "admin", "staff");

        OrderRecord order = new OrderRecord();
        order.setUserId(userId);
        order.setStatus("pending");
        orderMapper.insert(order);

        for (Map<String, Object> item : items) {
            Long mealId = Long.valueOf(String.valueOf(item.get("mealId")));
            Integer quantity = Integer.valueOf(String.valueOf(item.get("quantity")));
            MealRecord meal = mealMapper.findById(mealId);
            if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
                throw new BizException(404, 404, "菜品不存在");
            }
            OrderItemRecord record = new OrderItemRecord();
            record.setOrderId(order.getOrderId());
            record.setMealId(mealId);
            record.setQuantity(quantity);
            orderItemMapper.insert(record);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", order.getOrderId());
        data.put("status", "pending");
        return data;
    }

    @Transactional
    public Map<String, Object> confirmOrder(AuthUser actor, Long orderId) {
        OrderRecord order = orderMapper.findById(orderId);
        if (order == null) {
            throw new BizException(404, 404, "订单不存在");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");
        if (!"pending".equals(order.getStatus())) {
            throw new BizException(409, 409, "订单状态冲突");
        }

        List<OrderItemRecord> items = orderItemMapper.findByOrderId(orderId);
        Map<Long, Integer> totalNeed = new HashMap<>();

        for (OrderItemRecord item : items) {
            List<MealIngredientRecord> mealIngredients = mealIngredientMapper.findByMealId(item.getMealId());
            for (MealIngredientRecord mealIngredient : mealIngredients) {
                int need = mealIngredient.getWeightG() * item.getQuantity();
                totalNeed.merge(mealIngredient.getIngredientId(), need, Integer::sum);
            }
        }

        for (Map.Entry<Long, Integer> entry : totalNeed.entrySet()) {
            StockRecordRow stock = stockMapper.findLatestByIngredientId(entry.getKey());
            if (stock == null || stock.getCurrentQtyG() < entry.getValue()) {
                throw new BizException(409, 409, "库存不足");
            }
        }

        for (Map.Entry<Long, Integer> entry : totalNeed.entrySet()) {
            StockRecordRow stock = stockMapper.findLatestByIngredientId(entry.getKey());
            stock.setCurrentQtyG(stock.getCurrentQtyG() - entry.getValue());
            stockMapper.update(stock);
        }

        orderMapper.updateStatus(orderId, "confirmed");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", orderId);
        data.put("status", "confirmed");
        return data;
    }

    @Transactional
    public Map<String, Object> cancelOrder(AuthUser actor, Long orderId) {
        OrderRecord order = orderMapper.findById(orderId);
        if (order == null) {
            throw new BizException(404, 404, "订单不存在");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");
        if (!"pending".equals(order.getStatus())) {
            throw new BizException(409, 409, "订单状态冲突");
        }
        orderMapper.updateStatus(orderId, "cancelled");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", orderId);
        data.put("status", "cancelled");
        return data;
    }

    public Map<String, Object> dashboard(AuthUser actor) {
        authSupport.requireRole(actor, "admin");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("topMeals", dashboardMapper.topMeals());

        List<Map<String, Object>> usage = dashboardMapper.stockUsage().stream().map(row -> {
            Integer qty = asInt(row.get("currentqty"), asInt(row.get("currentQty"), 0));
            LocalDate expiry = row.get("expirydate") instanceof LocalDate d ? d : null;
            Map<String, Object> mapped = new LinkedHashMap<>(row);
            mapped.put("stockStatus", stockStatusHelper.calcStatus(qty, expiry));
            return mapped;
        }).toList();
        data.put("stockUsage", usage);

        Map<String, Object> stat = dashboardMapper.lowCarbonStat();
        long low = asLong(stat.get("lowcount"), asLong(stat.get("lowCount"), 0L));
        long total = asLong(stat.get("totalcount"), asLong(stat.get("totalCount"), 0L));
        double ratio = total == 0 ? 0.0 : BigDecimal.valueOf((double) low / total).setScale(2, RoundingMode.HALF_UP).doubleValue();
        data.put("lowCarbonRate", ratio);

        return data;
    }

    public Map<String, Object> sustainabilityReport(AuthUser actor) {
        Map<String, Object> dashboard = dashboard(actor);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generatedAt", LocalDateTime.now().toString());
        report.put("summary", "sustainability report");
        report.put("topMeals", dashboard.get("topMeals"));
        report.put("stockUsage", dashboard.get("stockUsage"));
        report.put("lowCarbonRate", dashboard.get("lowCarbonRate"));
        return report;
    }

    private void updateMealRelations(Long mealId, List<String> tags, List<Map<String, Object>> ingredients) {
        if (ingredients != null) {
            mealIngredientMapper.deleteByMealId(mealId);
            for (Map<String, Object> item : ingredients) {
                Long ingredientId = Long.valueOf(String.valueOf(item.get("ingredientId")));
                Integer weight = Integer.valueOf(String.valueOf(item.get("weight_g")));
                if (ingredientMapper.findById(ingredientId) == null) {
                    throw new BizException(404, 404, "食材不存在");
                }
                MealIngredientRecord row = new MealIngredientRecord();
                row.setMealId(mealId);
                row.setIngredientId(ingredientId);
                row.setWeightG(weight);
                mealIngredientMapper.insert(row);
            }
        }

        if (tags != null) {
            tagMapper.deleteMealTags(mealId);
            for (String tagName : tags) {
                TagMapper.TagRow tag = tagMapper.findByName(tagName);
                if (tag == null) {
                    tag = new TagMapper.TagRow();
                    tag.setTagName(tagName);
                    tagMapper.insert(tag);
                }
                tagMapper.attachTag(mealId, tag.getTagId());
            }
        }
    }

    private double healthScore(UserPreferenceRecord pref, MealRecord meal) {
        int targetCalories = pref.getTargetCalories() == null ? 2000 : pref.getTargetCalories();
        int targetProtein = pref.getTargetProtein() == null ? 80 : pref.getTargetProtein();
        double cal = 1 - Math.min(Math.abs(meal.getCalories() - targetCalories) / (double) targetCalories, 1.0);
        double pro = 1 - Math.min(Math.abs(meal.getProtein() - targetProtein) / (double) Math.max(targetProtein, 1), 1.0);
        return (cal + pro) / 2;
    }

    private double preferenceScore(UserPreferenceRecord pref, List<MealIngredientRecord> ingredients) {
        if (!Boolean.TRUE.equals(pref.getIsVegetarian())) {
            return 1.0;
        }
        boolean hasMeat = ingredients.stream().anyMatch(i -> {
            String name = i.getIngredientName() == null ? "" : i.getIngredientName().toLowerCase();
            return name.contains("chicken") || name.contains("beef") || name.contains("pork");
        });
        return hasMeat ? 0.1 : 1.0;
    }

    private double stockPriorityScore(List<MealIngredientRecord> ingredients) {
        double score = 0.0;
        for (MealIngredientRecord ingredient : ingredients) {
            StockRecordRow stock = stockMapper.findLatestByIngredientId(ingredient.getIngredientId());
            if (stock == null) {
                continue;
            }
            String status = stockStatusHelper.calcStatus(stock.getCurrentQtyG(), stock.getExpiryDate());
            if ("high_stock".equals(status)) {
                score = Math.max(score, 1.0);
            } else if ("near_expiry".equals(status)) {
                score = Math.max(score, 0.8);
            } else {
                score = Math.max(score, 0.4);
            }
        }
        return score;
    }

    private String reasonText(double stock, List<String> tags, boolean allergenConflict) {
        if (allergenConflict) {
            return "allergen conflict";
        }
        if (stock >= 1.0) {
            return "high stock + healthy match";
        }
        if (stock >= 0.8) {
            return "near expiry + healthy match";
        }
        if (tags.contains("low-carbon")) {
            return "low carbon + healthy match";
        }
        return "healthy match";
    }

    private void replaceUserAllergens(Long userId, List<String> allergens) {
        userAllergyMapper.deleteByUserId(userId);
        for (Long allergenId : resolveAllergenIds(allergens)) {
            userAllergyMapper.attach(userId, allergenId);
        }
    }

    private void replaceIngredientAllergens(Long ingredientId, List<String> allergens) {
        if (allergens == null) {
            return;
        }
        ingredientAllergenMapper.deleteByIngredientId(ingredientId);
        for (Long allergenId : resolveAllergenIds(allergens)) {
            ingredientAllergenMapper.attach(ingredientId, allergenId);
        }
    }

    private List<Long> resolveAllergenIds(List<String> allergens) {
        if (allergens == null || allergens.isEmpty()) {
            return List.of();
        }
        Set<String> names = new LinkedHashSet<>();
        for (String allergen : allergens) {
            if (allergen != null && !allergen.isBlank()) {
                names.add(allergen.trim());
            }
        }
        List<Long> ids = new ArrayList<>();
        for (String name : names) {
            AllergenRecord row = allergenMapper.findByName(name);
            if (row == null) {
                row = new AllergenRecord();
                row.setName(name);
                allergenMapper.insert(row);
            }
            ids.add(row.getAllergenId());
        }
        return ids;
    }

    private Set<String> lowerSet(List<String> names) {
        Set<String> set = new LinkedHashSet<>();
        for (String name : names) {
            if (name != null && !name.isBlank()) {
                set.add(name.trim().toLowerCase());
            }
        }
        return set;
    }

    private Integer asInt(Object obj, Integer def) {
        if (obj == null) {
            return def;
        }
        if (obj instanceof Number n) {
            return n.intValue();
        }
        return Integer.valueOf(String.valueOf(obj));
    }

    private Long asLong(Object obj, Long def) {
        if (obj == null) {
            return def;
        }
        if (obj instanceof Number n) {
            return n.longValue();
        }
        return Long.valueOf(String.valueOf(obj));
    }
}
