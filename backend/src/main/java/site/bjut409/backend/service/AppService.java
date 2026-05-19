package site.bjut409.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
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
import site.bjut409.backend.mapper.RecommendationEventMapper;
import site.bjut409.backend.mapper.StockMapper;
import site.bjut409.backend.mapper.SustainabilityReportMapper;
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
import site.bjut409.backend.model.SustainabilityReportRecord;
import site.bjut409.backend.model.UserPreferenceRecord;
import site.bjut409.backend.model.UserRecord;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
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
    private final RecommendationEventMapper recommendationEventMapper;
    private final SustainabilityReportMapper sustainabilityReportMapper;
    private final AuthSupport authSupport;
    private final PasswordHasher passwordHasher;
    private final StockStatusHelper stockStatusHelper;
    private final ObjectMapper objectMapper;

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
                      RecommendationEventMapper recommendationEventMapper,
                      SustainabilityReportMapper sustainabilityReportMapper,
                      AuthSupport authSupport,
                      PasswordHasher passwordHasher,
                      StockStatusHelper stockStatusHelper,
                      ObjectMapper objectMapper) {
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
        this.recommendationEventMapper = recommendationEventMapper;
        this.sustainabilityReportMapper = sustainabilityReportMapper;
        this.authSupport = authSupport;
        this.passwordHasher = passwordHasher;
        this.stockStatusHelper = stockStatusHelper;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> login(String username, String password) {
        UserRecord user = userMapper.findByUsername(username);
        if (user == null || !passwordHasher.verify(password, user.getPasswordHash())) {
            throw new BizException(401, 401, "Invalid username or password");
        }
        if (passwordHasher.needsRehash(user.getPasswordHash())) {
            user.setPasswordHash(passwordHasher.hash(password));
            userMapper.updatePasswordHash(user);
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
            throw new BizException(400, 400, "Invalid parameters");
        }
        validatePasswordComplexity(password);
        if (userMapper.findByUsername(username) != null) {
            throw new BizException(409, 409, "Username already exists");
        }
        UserRecord user = new UserRecord();
        user.setUsername(username);
        user.setPasswordHash(passwordHasher.hash(password));
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
        data.put("token", authSupport.issueToken(user.getUserId()));
        return data;
    }

    public Map<String, Object> userInfo(AuthUser actor, Long userId) {
        authSupport.requireSelfOrRole(actor, userId, "admin", "staff");
        UserRecord user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(404, 404, "User not found");
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
            throw new BizException(400, 400, "Invalid parameters");
        }
        UserRecord current = userMapper.findById(userId);
        if (current == null) {
            throw new BizException(404, 404, "User not found");
        }
        UserRecord existing = userMapper.findByUsername(username);
        if (existing != null && !Objects.equals(existing.getUserId(), userId)) {
            throw new BizException(409, 409, "Username already exists");
        }
        current.setUsername(username);
        userMapper.updateUsername(current);
    }

    @Transactional
    public void updatePreference(AuthUser actor, Long userId, Integer calories, Integer protein, Boolean vegetarian,
                                 List<String> allergens) {
        authSupport.requireSelfOrRole(actor, userId, "admin");
        validateOptionalPositive(calories, "Target calories");
        validateOptionalPositive(protein, "Target protein");
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

    public List<Map<String, Object>> listMeals(AuthUser actor, String keyword, String tag, Boolean lowCarbonOnly) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        return mealMapper.listActive().stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mealId", m.getMealId());
            row.put("name", m.getName());
            row.put("calories", m.getCalories());
            row.put("protein", m.getProtein());
            row.put("sustainabilityScore", m.getSustainabilityScore());
            row.put("imageUrl", m.getImageUrl());
            return row;
        }).filter(row -> matchesMealFilters(row, keyword, tag, lowCarbonOnly)).toList();
    }

    public List<Map<String, Object>> listMeals(AuthUser actor) {
        return listMeals(actor, null, null, null);
    }

    public Map<String, Object> mealDetail(AuthUser actor, Long mealId, String recommendationRequestId, Integer recommendationRankPosition) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        MealRecord meal = mealMapper.findById(mealId);
        if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
            throw new BizException(404, 404, "Meal not found");
        }
        if (recommendationRequestId != null && !recommendationRequestId.isBlank()) {
            recommendationEventMapper.insert(recommendationRequestId, actor.userId(), mealId, "click", recommendationRankPosition, null);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mealId", meal.getMealId());
        data.put("name", meal.getName());
        data.put("description", meal.getDescription());
        data.put("calories", meal.getCalories());
        data.put("protein", meal.getProtein());
        data.put("sustainabilityScore", meal.getSustainabilityScore());
        data.put("imageUrl", meal.getImageUrl());

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

    public Map<String, Object> mealDetail(AuthUser actor, Long mealId) {
        return mealDetail(actor, mealId, null, null);
    }

    @Transactional
    public Map<String, Object> uploadMealImage(AuthUser actor, Long mealId, MultipartFile file) {
        authSupport.requireRole(actor, "staff", "admin");
        if (file == null || file.isEmpty()) {
            throw new BizException(400, 400, "File is empty");
        }
        String extension = imageExtension(file);
        if (extension == null) {
            throw new BizException(400, 400, "Unsupported file type");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new BizException(400, 400, "File is too large");
        }
        MealRecord meal = mealMapper.findById(mealId);
        if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
            throw new BizException(404, 404, "Meal not found");
        }
        String fileName = "meal-" + mealId + "-" + System.currentTimeMillis() + extension;
        Path uploadDir = Path.of("uploads", "meals");
        Path target = uploadDir.resolve(fileName);
        try {
            Files.createDirectories(uploadDir);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new BizException(500, 500, "Image upload failed");
        }
        meal.setImageUrl("/uploads/meals/" + fileName);
        mealMapper.update(meal);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mealId", mealId);
        data.put("imageUrl", meal.getImageUrl());
        return data;
    }

    private String imageExtension(MultipartFile file) {
        String extension = extensionFromContentType(file.getContentType());
        if (extension != null) {
            return extension;
        }
        return extensionFromFilename(file.getOriginalFilename());
    }

    private String extensionFromContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        String normalized = contentType.toLowerCase();
        int parametersStart = normalized.indexOf(';');
        if (parametersStart >= 0) {
            normalized = normalized.substring(0, parametersStart).trim();
        }
        return switch (normalized) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png", "image/x-png" -> ".png";
            case "image/webp" -> ".webp";
            default -> null;
        };
    }

    private String extensionFromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return ".jpg";
        }
        if (lower.endsWith(".png")) {
            return ".png";
        }
        if (lower.endsWith(".webp")) {
            return ".webp";
        }
        return null;
    }

    @Transactional
    public Map<String, Object> createMeal(AuthUser actor, String name, String description, Integer calories, Integer protein,
                                          Integer sustainabilityScore, List<String> tags,
                                          List<Map<String, Object>> ingredients) {
        authSupport.requireRole(actor, "staff", "admin");
        validateMealPayload(name, calories, protein, sustainabilityScore);
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
            throw new BizException(404, 404, "Meal not found");
        }
        validateMealPayload(name, calories, protein, sustainabilityScore);
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
        validateIngredientPayload(name, qty);
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
            throw new BizException(404, 404, "Ingredient not found");
        }
        if (name == null || name.isBlank()) {
            throw new BizException(400, 400, "Ingredient name is required");
        }
        ingredient.setName(name);
        ingredientMapper.updateName(ingredient);
        replaceIngredientAllergens(ingredientId, allergens);
    }

    @Transactional
    public Map<String, Object> updateStock(AuthUser actor, Long ingredientId, Integer currentQtyG, LocalDate expiryDate) {
        authSupport.requireRole(actor, "staff", "admin");
        if (ingredientMapper.findById(ingredientId) == null) {
            throw new BizException(404, 404, "Ingredient not found");
        }
        validateStockPayload(currentQtyG);
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
            throw new BizException(404, 404, "User preferences not found");
        }
        Set<String> userAllergens = lowerSet(userAllergyMapper.findAllergenNamesByUserId(userId));
        String recommendationRequestId = "req-" + userId + "-" + System.currentTimeMillis();

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
            row.put("calories", meal.getCalories());
            row.put("protein", meal.getProtein());
            row.put("sustainabilityScore", meal.getSustainabilityScore());
            row.put("imageUrl", meal.getImageUrl());
            row.put("allergenConflict", allergenConflict);
            row.put("recommendationRequestId", recommendationRequestId);
            Map<String, Object> scoreBreakdown = new LinkedHashMap<>();
            scoreBreakdown.put("healthScore", BigDecimal.valueOf(0.4 * health).setScale(2, RoundingMode.HALF_UP));
            scoreBreakdown.put("preferenceScore", BigDecimal.valueOf(0.3 * preference).setScale(2, RoundingMode.HALF_UP));
            scoreBreakdown.put("sustainabilityScorePart", BigDecimal.valueOf(0.2 * sustainability).setScale(2, RoundingMode.HALF_UP));
            scoreBreakdown.put("stockPriorityScore", BigDecimal.valueOf(0.1 * stock).setScale(2, RoundingMode.HALF_UP));
            row.put("scoreBreakdown", scoreBreakdown);
            result.add(row);
        }
        result.sort(Comparator.comparing((Map<String, Object> m) -> ((BigDecimal) m.get("score"))).reversed());
        for (int index = 0; index < result.size(); index++) {
            Map<String, Object> row = result.get(index);
            int rankPosition = index + 1;
            row.put("recommendationRankPosition", rankPosition);
            recommendationEventMapper.insert(recommendationRequestId, userId,
                    Long.valueOf(String.valueOf(row.get("mealId"))), "exposure", rankPosition, null);
        }
        return result;
    }

    public Map<String, Object> orderDetail(AuthUser actor, Long orderId) {
        OrderRecord order = orderMapper.findById(orderId);
        if (order == null) {
            throw new BizException(404, 404, "Order not found");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");
        return buildOrderView(order);
    }

    public Map<String, Object> listOrders(AuthUser actor, Long userId, String status, Integer page, Integer size) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        validateOrderStatus(status);

        List<OrderRecord> orders;
        if ("customer".equals(actor.role())) {
            Long targetUserId = userId == null ? actor.userId() : userId;
            authSupport.requireSelfOrRole(actor, targetUserId, "admin", "staff");
            orders = orderMapper.findByUserId(targetUserId);
        } else if (userId != null) {
            orders = orderMapper.findByUserId(userId);
        } else {
            orders = orderMapper.findAll();
        }
        if (status != null && !status.isBlank()) {
            orders = orders.stream().filter(order -> status.equals(order.getStatus())).toList();
        }

        return paginateOrders(orders, safePage, safeSize);
    }

    @Transactional
    public Map<String, Object> createOrder(AuthUser actor, Long userId, String recommendationRequestId, List<Map<String, Object>> items) {
        authSupport.requireSelfOrRole(actor, userId, "admin", "staff");
        if (items == null || items.isEmpty()) {
            throw new BizException(400, 400, "Order must contain at least one item");
        }

        OrderRecord order = new OrderRecord();
        order.setUserId(userId);
        order.setRecommendationRequestId(recommendationRequestId);
        order.setStatus("pending");
        orderMapper.insert(order);

        for (Map<String, Object> item : items) {
            boolean custom = Boolean.TRUE.equals(item == null ? null : item.get("custom"));
            Integer quantity = positiveInt(item == null ? null : item.get("quantity"), "Quantity");
            OrderItemRecord record = new OrderItemRecord();
            record.setOrderId(order.getOrderId());
            record.setQuantity(quantity);

            if (custom) {
                record.setMealNameSnapshot(customName(item));
                record.setCaloriesSnapshot(asInt(item.get("calories"), 0));
                record.setProteinSnapshot(asInt(item.get("protein"), 0));
                record.setSustainabilityScoreSnapshot(asInt(item.get("sustainabilityScore"), null));
                record.setImageUrlSnapshot((String) item.get("imageUrl"));
                record.setCustomIngredientsJson(toJson(customIngredients(item)));
            } else {
                Long mealId = positiveLong(item == null ? null : item.get("mealId"), "Meal ID");
                MealRecord meal = mealMapper.findById(mealId);
                if (meal == null || Boolean.TRUE.equals(meal.getIsDeleted())) {
                    throw new BizException(404, 404, "Meal not found");
                }
                record.setMealId(mealId);
            }

            orderItemMapper.insert(record);
            if (!custom && recommendationRequestId != null && !recommendationRequestId.isBlank()) {
                recommendationEventMapper.insert(recommendationRequestId, userId, record.getMealId(), "selected", null, order.getOrderId());
            }
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", order.getOrderId());
        data.put("status", "pending");
        return data;
    }

    public Map<String, Object> createOrder(AuthUser actor, Long userId, List<Map<String, Object>> items) {
        return createOrder(actor, userId, null, items);
    }

    @Transactional
    public Map<String, Object> confirmOrder(AuthUser actor, Long orderId) {
        OrderRecord order = orderMapper.findById(orderId);
        if (order == null) {
            throw new BizException(404, 404, "Order not found");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");
        if (!"pending".equals(order.getStatus())) {
            throw new BizException(409, 409, "Order status conflict");
        }

        List<OrderItemRecord> items = orderItemMapper.findByOrderId(orderId);
        Map<Long, Integer> totalNeed = new HashMap<>();

        for (OrderItemRecord item : items) {
            if (item.getMealId() == null) {
                for (Map<String, Object> customIngredient : parseJsonList(item.getCustomIngredientsJson())) {
                    Long ingredientId = positiveLong(customIngredient.get("ingredientId"), "Ingredient ID");
                    Integer weight = positiveInt(customIngredient.get("weight_g"), "Ingredient weight");
                    int need = weight * item.getQuantity();
                    totalNeed.merge(ingredientId, need, Integer::sum);
                }
            } else {
                List<MealIngredientRecord> mealIngredients = mealIngredientMapper.findByMealId(item.getMealId());
                for (MealIngredientRecord mealIngredient : mealIngredients) {
                    int need = mealIngredient.getWeightG() * item.getQuantity();
                    totalNeed.merge(mealIngredient.getIngredientId(), need, Integer::sum);
                }
            }
        }

        for (Map.Entry<Long, Integer> entry : totalNeed.entrySet()) {
            StockRecordRow stock = stockMapper.findLatestByIngredientId(entry.getKey());
            if (stock == null || stock.getCurrentQtyG() < entry.getValue()) {
                throw new BizException(409, 409, "Insufficient stock");
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
            throw new BizException(404, 404, "Order not found");
        }
        authSupport.requireSelfOrRole(actor, order.getUserId(), "admin", "staff");
        if (!"pending".equals(order.getStatus())) {
            throw new BizException(409, 409, "Order status conflict");
        }
        orderMapper.updateStatus(orderId, "cancelled");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", orderId);
        data.put("status", "cancelled");
        return data;
    }

    public Map<String, Object> dashboard(AuthUser actor) {
        authSupport.requireRole(actor, "admin");
        return dashboard(actor, defaultRangeStart(), defaultRangeEndExclusive());
    }

    public Map<String, Object> sustainabilityReport(AuthUser actor) {
        return sustainabilityReport(actor, null, null);
    }

    @Transactional
    public Map<String, Object> sustainabilityReport(AuthUser actor, LocalDate from, LocalDate to) {
        authSupport.requireRole(actor, "admin");
        LocalDate rangeStart = from == null ? LocalDate.now().minusDays(29) : from;
        LocalDate rangeEnd = to == null ? LocalDate.now() : to;
        if (rangeEnd.isBefore(rangeStart)) {
            throw new BizException(400, 400, "Invalid parameters");
        }
        LocalDateTime fromAt = rangeStart.atStartOfDay();
        LocalDateTime toExclusive = rangeEnd.plusDays(1).atStartOfDay();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generatedAt", LocalDateTime.now().toString());
        report.put("summary", buildReportSummary(fromAt, toExclusive));
        report.put("rangeStart", rangeStart.toString());
        report.put("rangeEnd", rangeEnd.toString());
        report.putAll(buildDashboardData(fromAt, toExclusive));

        SustainabilityReportRecord record = new SustainabilityReportRecord();
        record.setSummary(String.valueOf(report.get("summary")));
        record.setReportData(toJson(report));
        record.setGeneratedBy(actor.userId());
        record.setRangeStart(rangeStart);
        record.setRangeEnd(rangeEnd);
        sustainabilityReportMapper.insert(record);
        report.put("reportId", record.getReportId());
        return report;
    }

    public Map<String, Object> listSustainabilityReports(AuthUser actor, Integer page, Integer size) {
        authSupport.requireRole(actor, "admin");
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        List<Map<String, Object>> items = sustainabilityReportMapper.findAll().stream()
                .map(this::buildReportHistoryItem)
                .toList();
        return paginateItems(items, safePage, safeSize);
    }

    public Map<String, Object> sustainabilityReportDetail(AuthUser actor, Long reportId) {
        authSupport.requireRole(actor, "admin");
        SustainabilityReportRecord record = sustainabilityReportMapper.findById(reportId);
        if (record == null) {
            throw new BizException(404, 404, "Report not found");
        }
        return buildStoredReport(record);
    }

    public Map<String, Object> recommendationAnalytics(AuthUser actor, LocalDate from, LocalDate to) {
        authSupport.requireRole(actor, "admin");
        LocalDate rangeStart = from == null ? LocalDate.now().minusDays(29) : from;
        LocalDate rangeEnd = to == null ? LocalDate.now() : to;
        if (rangeEnd.isBefore(rangeStart)) {
            throw new BizException(400, 400, "Invalid parameters");
        }
        LocalDateTime fromAt = rangeStart.atStartOfDay();
        LocalDateTime toExclusive = rangeEnd.plusDays(1).atStartOfDay();
        return buildRecommendationAnalytics(fromAt, toExclusive, rangeStart, rangeEnd);
    }

    private Map<String, Object> dashboard(AuthUser actor, LocalDateTime from, LocalDateTime to) {
        authSupport.requireRole(actor, "admin");
        return buildDashboardData(from, to);
    }

    private Map<String, Object> buildDashboardData(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> data = new LinkedHashMap<>();
        List<Map<String, Object>> topMeals = dashboardMapper.topMeals(from, to);
        List<Map<String, Object>> topRecommendedMeals = dashboardMapper.topRecommendedMeals(from, to);
        List<Map<String, Object>> topSelectedMeals = dashboardMapper.topSelectedMeals(from, to);
        List<Map<String, Object>> topClickedMeals = dashboardMapper.topClickedMeals(from, to);
        data.put("topMeals", topSelectedMeals.isEmpty() ? topMeals : topSelectedMeals);
        data.put("topRecommendedMeals", topRecommendedMeals);
        data.put("topSelectedMeals", topSelectedMeals);
        data.put("topClickedMeals", topClickedMeals);

        List<Map<String, Object>> usage = dashboardMapper.stockUsage().stream().map(row -> {
            Integer qty = asInt(row.get("currentqty"), asInt(row.get("currentQty"), 0));
            LocalDate expiry = row.get("expirydate") instanceof LocalDate d ? d : null;
            Map<String, Object> mapped = new LinkedHashMap<>(row);
            mapped.put("stockStatus", stockStatusHelper.calcStatus(qty, expiry));
            return mapped;
        }).toList();
        data.put("stockUsage", usage);
        data.put("highStockIngredients", mapIngredientStats(dashboardMapper.highStockIngredients()));
        data.put("nearExpiryIngredients", mapIngredientStats(dashboardMapper.nearExpiryIngredients()));
        data.put("mealSustainabilityStats", dashboardMapper.mealSustainabilityStats());

        Map<String, Object> stat = dashboardMapper.lowCarbonStat(from, to);
        long low = asLong(stat.get("lowcount"), asLong(stat.get("lowCount"), 0L));
        long total = asLong(stat.get("totalcount"), asLong(stat.get("totalCount"), 0L));
        double ratio = total == 0 ? 0.0 : BigDecimal.valueOf((double) low / total).setScale(2, RoundingMode.HALF_UP).doubleValue();
        data.put("lowCarbonSelectionCount", low);
        data.put("lowCarbonRate", ratio);
        data.put("recommendationAnalytics", buildRecommendationAnalytics(from, to, from.toLocalDate(), to.minusDays(1).toLocalDate()));

        return data;
    }

    public Map<String, Object> listIngredients(AuthUser actor, String keyword, LocalDate expiryBefore, Integer page, Integer size) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        List<Map<String, Object>> all = ingredientMapper.findAll().stream()
                .map(this::buildIngredientView)
                .filter(item -> matchesIngredientFilters(item, keyword, expiryBefore))
                .toList();
        return paginateItems(all, safePage, safeSize);
    }

    public Map<String, Object> ingredientDetail(AuthUser actor, Long ingredientId) {
        authSupport.requireRole(actor, "customer", "staff", "admin");
        IngredientRecord ingredient = ingredientMapper.findById(ingredientId);
        if (ingredient == null) {
            throw new BizException(404, 404, "Ingredient not found");
        }
        return buildIngredientView(ingredient);
    }

    private void updateMealRelations(Long mealId, List<String> tags, List<Map<String, Object>> ingredients) {
        if (ingredients != null) {
            mealIngredientMapper.deleteByMealId(mealId);
            for (Map<String, Object> item : ingredients) {
                Long ingredientId = positiveLong(item == null ? null : item.get("ingredientId"), "Ingredient ID");
                Integer weight = positiveInt(item == null ? null : item.get("weight_g"), "Ingredient weight");
                if (ingredientMapper.findById(ingredientId) == null) {
                    throw new BizException(404, 404, "Ingredient not found");
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
                if (tagName == null || tagName.isBlank()) {
                    continue;
                }
                tagName = tagName.trim();
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

    private Integer positiveInt(Object obj, String fieldName) {
        Integer value;
        try {
            value = asInt(obj, null);
        } catch (RuntimeException ex) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
        if (value == null || value <= 0) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
        return value;
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

    private Long positiveLong(Object obj, String fieldName) {
        Long value;
        try {
            value = asLong(obj, null);
        } catch (RuntimeException ex) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
        if (value == null || value <= 0) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
        return value;
    }

    private void validateMealPayload(String name, Integer calories, Integer protein, Integer sustainabilityScore) {
        if (name == null || name.isBlank()) {
            throw new BizException(400, 400, "Meal name is required");
        }
        validatePositive(calories, "Calories");
        validatePositive(protein, "Protein");
        if (sustainabilityScore == null || sustainabilityScore < 1 || sustainabilityScore > 10) {
            throw new BizException(400, 400, "Sustainability score must be between 1 and 10");
        }
    }

    private void validateIngredientPayload(String name, Integer currentQtyG) {
        if (name == null || name.isBlank()) {
            throw new BizException(400, 400, "Ingredient name is required");
        }
        validateStockPayload(currentQtyG);
    }

    private void validateStockPayload(Integer currentQtyG) {
        if (currentQtyG == null || currentQtyG < 0) {
            throw new BizException(400, 400, "Stock quantity must be zero or greater");
        }
    }

    private void validatePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
    }

    private void validateOptionalPositive(Integer value, String fieldName) {
        if (value != null && value <= 0) {
            throw new BizException(400, 400, fieldName + " must be a positive number");
        }
    }

    private Map<String, Object> paginateOrders(List<OrderRecord> orders, int page, int size) {
        List<Map<String, Object>> mapped = orders.stream().map(this::buildOrderView).toList();
        return paginateItems(mapped, page, size);
    }

    private Map<String, Object> paginateItems(List<Map<String, Object>> items, int page, int size) {
        int fromIndex = Math.min((page - 1) * size, items.size());
        int toIndex = Math.min(fromIndex + size, items.size());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("page", page);
        data.put("size", size);
        data.put("total", items.size());
        data.put("items", items.subList(fromIndex, toIndex));
        return data;
    }

    private int normalizePage(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    private int normalizeSize(Integer size) {
        if (size == null || size < 1) {
            return 20;
        }
        return Math.min(size, 100);
    }

    private Map<String, Object> buildOrderView(OrderRecord order) {
        List<Map<String, Object>> itemViews = new ArrayList<>();
        int totalCalories = 0;
        int totalProtein = 0;
        for (OrderItemRecord item : orderItemMapper.findByOrderId(order.getOrderId())) {
            MealRecord meal = mealMapper.findById(item.getMealId());
            int mealCalories = item.getCaloriesSnapshot() != null
                    ? item.getCaloriesSnapshot()
                    : meal == null || meal.getCalories() == null ? 0 : meal.getCalories();
            int mealProtein = item.getProteinSnapshot() != null
                    ? item.getProteinSnapshot()
                    : meal == null || meal.getProtein() == null ? 0 : meal.getProtein();
            totalCalories += mealCalories * item.getQuantity();
            totalProtein += mealProtein * item.getQuantity();

            Map<String, Object> itemView = new LinkedHashMap<>();
            itemView.put("itemId", item.getItemId());
            itemView.put("mealId", item.getMealId());
            itemView.put("quantity", item.getQuantity());
            itemView.put("custom", item.getMealId() == null);
            itemView.put("name", item.getMealNameSnapshot() != null ? item.getMealNameSnapshot() : meal == null ? null : meal.getName());
            itemView.put("calories", mealCalories);
            itemView.put("protein", mealProtein);
            itemView.put("sustainabilityScore", item.getSustainabilityScoreSnapshot() != null
                    ? item.getSustainabilityScoreSnapshot()
                    : meal == null ? null : meal.getSustainabilityScore());
            itemView.put("imageUrl", item.getImageUrlSnapshot() != null ? item.getImageUrlSnapshot() : meal == null ? null : meal.getImageUrl());
            itemView.put("ingredients", parseJsonList(item.getCustomIngredientsJson()));
            itemViews.add(itemView);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderId", order.getOrderId());
        data.put("userId", order.getUserId());
        data.put("status", order.getStatus());
        data.put("createdAt", order.getCreatedAt() == null ? null : order.getCreatedAt().toString());
        data.put("confirmedAt", order.getConfirmedAt() == null ? null : order.getConfirmedAt().toString());
        data.put("cancelledAt", order.getCancelledAt() == null ? null : order.getCancelledAt().toString());
        data.put("items", itemViews);
        data.put("totalCalories", totalCalories);
        data.put("totalProtein", totalProtein);
        return data;
    }

    private Map<String, Object> buildIngredientView(IngredientRecord ingredient) {
        StockRecordRow stock = stockMapper.findLatestByIngredientId(ingredient.getIngredientId());
        Integer currentQty = stock == null ? null : stock.getCurrentQtyG();
        LocalDate expiryDate = stock == null ? null : stock.getExpiryDate();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ingredientId", ingredient.getIngredientId());
        data.put("name", ingredient.getName());
        data.put("allergens", ingredientAllergenMapper.findAllergenNamesByIngredientId(ingredient.getIngredientId()));
        data.put("currentQty_g", currentQty);
        data.put("expiryDate", expiryDate == null ? null : expiryDate.toString());
        data.put("stockStatus", stockStatusHelper.calcStatus(currentQty, expiryDate));
        return data;
    }

    private boolean matchesMealFilters(Map<String, Object> row, String keyword, String tag, Boolean lowCarbonOnly) {
        if (keyword != null && !keyword.isBlank()) {
            String name = String.valueOf(row.get("name")).toLowerCase();
            if (!name.contains(keyword.trim().toLowerCase())) {
                return false;
            }
        }
        Long mealId = Long.valueOf(String.valueOf(row.get("mealId")));
        if (tag != null && !tag.isBlank() && !tagMapper.findTagNamesByMealId(mealId).contains(tag)) {
            return false;
        }
        if (Boolean.TRUE.equals(lowCarbonOnly) && asInt(row.get("sustainabilityScore"), 0) < 8) {
            return false;
        }
        return true;
    }

    private boolean matchesIngredientFilters(Map<String, Object> item, String keyword, LocalDate expiryBefore) {
        if (keyword != null && !keyword.isBlank()) {
            String name = String.valueOf(item.get("name")).toLowerCase();
            if (!name.contains(keyword.trim().toLowerCase())) {
                return false;
            }
        }
        if (expiryBefore != null) {
            Object expiry = item.get("expiryDate");
            if (expiry == null || LocalDate.parse(String.valueOf(expiry)).isAfter(expiryBefore)) {
                return false;
            }
        }
        return true;
    }

    private void validateOrderStatus(String status) {
        if (status == null || status.isBlank()) {
            return;
        }
        if (!List.of("pending", "confirmed", "cancelled").contains(status)) {
            throw new BizException(400, 400, "Invalid parameters");
        }
    }

    private List<Map<String, Object>> mapIngredientStats(List<Map<String, Object>> rows) {
        return rows.stream().map(row -> {
            Integer qty = asInt(row.get("currentQty_g"), 0);
            LocalDate expiry = row.get("expiryDate") instanceof LocalDate d ? d : null;
            Map<String, Object> mapped = new LinkedHashMap<>(row);
            mapped.put("stockStatus", stockStatusHelper.calcStatus(qty, expiry));
            if (expiry != null) {
                mapped.put("expiryDate", expiry.toString());
            }
            return mapped;
        }).toList();
    }

    private Map<String, Object> buildRecommendationAnalytics(LocalDateTime from, LocalDateTime to, LocalDate rangeStart, LocalDate rangeEnd) {
        Map<String, Object> summary = dashboardMapper.recommendationSummary(from, to);
        long exposures = asLong(summary.get("exposurecount"), asLong(summary.get("exposureCount"), 0L));
        long clicks = asLong(summary.get("clickcount"), asLong(summary.get("clickCount"), 0L));
        long selected = asLong(summary.get("selectedcount"), asLong(summary.get("selectedCount"), 0L));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("rangeStart", rangeStart.toString());
        data.put("rangeEnd", rangeEnd.toString());
        data.put("totalExposureCount", exposures);
        data.put("totalClickCount", clicks);
        data.put("totalSelectedCount", selected);
        data.put("clickThroughRate", ratio(clicks, exposures));
        data.put("selectionRate", ratio(selected, exposures));
        data.put("clickToSelectionRate", ratio(selected, clicks));
        data.put("topRecommendedMeals", dashboardMapper.topRecommendedMeals(from, to));
        data.put("topClickedMeals", dashboardMapper.topClickedMeals(from, to));
        data.put("topSelectedMeals", dashboardMapper.topSelectedMeals(from, to));
        data.put("positionPerformance", mapPositionStats(dashboardMapper.recommendationPositionStats(from, to)));
        return data;
    }

    private List<Map<String, Object>> mapPositionStats(List<Map<String, Object>> rows) {
        return rows.stream().map(row -> {
            long exposures = asLong(row.get("exposurecount"), asLong(row.get("exposureCount"), 0L));
            long clicks = asLong(row.get("clickcount"), asLong(row.get("clickCount"), 0L));
            long selected = asLong(row.get("selectedcount"), asLong(row.get("selectedCount"), 0L));
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("rankPosition", asInt(row.get("rankposition"), asInt(row.get("rankPosition"), 0)));
            mapped.put("exposureCount", exposures);
            mapped.put("clickCount", clicks);
            mapped.put("selectedCount", selected);
            mapped.put("clickThroughRate", ratio(clicks, exposures));
            mapped.put("selectionRate", ratio(selected, exposures));
            mapped.put("clickToSelectionRate", ratio(selected, clicks));
            return mapped;
        }).toList();
    }

    private Map<String, Object> buildStoredReport(SustainabilityReportRecord record) {
        Map<String, Object> report = parseJson(record.getReportData());
        report.put("reportId", record.getReportId());
        report.put("generatedAt", record.getGeneratedAt() == null ? null : record.getGeneratedAt().toString());
        report.put("summary", record.getSummary());
        report.put("rangeStart", record.getRangeStart() == null ? null : record.getRangeStart().toString());
        report.put("rangeEnd", record.getRangeEnd() == null ? null : record.getRangeEnd().toString());
        return report;
    }

    private Map<String, Object> buildReportHistoryItem(SustainabilityReportRecord record) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("reportId", record.getReportId());
        item.put("summary", record.getSummary());
        item.put("generatedAt", record.getGeneratedAt() == null ? null : record.getGeneratedAt().toString());
        item.put("rangeStart", record.getRangeStart() == null ? null : record.getRangeStart().toString());
        item.put("rangeEnd", record.getRangeEnd() == null ? null : record.getRangeEnd().toString());
        return item;
    }

    private Map<String, Object> parseJson(String json) {
        try {
            String normalized = json;
            var root = objectMapper.readTree(normalized);
            if (root.isTextual()) {
                normalized = root.asText();
            }
            return objectMapper.readValue(normalized, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new BizException(500, 500, "Failed to parse report");
        }
    }

    private List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new BizException(500, 500, "Failed to parse order item");
        }
    }

    private String toJson(Map<String, Object> value) {
        return toJson((Object) value);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new BizException(500, 500, "Failed to serialize data");
        }
    }

    private String customName(Map<String, Object> item) {
        Object name = item == null ? null : item.get("name");
        if (name == null || String.valueOf(name).isBlank()) {
            return "Custom bowl";
        }
        return String.valueOf(name).trim();
    }

    private List<Map<String, Object>> customIngredients(Map<String, Object> item) {
        Object value = item == null ? null : item.get("ingredients");
        if (!(value instanceof List<?> rawList) || rawList.isEmpty()) {
            throw new BizException(400, 400, "Custom order item must contain ingredients");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object rawItem : rawList) {
            if (!(rawItem instanceof Map<?, ?> rawMap)) {
                throw new BizException(400, 400, "Custom ingredient is invalid");
            }
            Long ingredientId = positiveLong(rawMap.get("ingredientId"), "Ingredient ID");
            Integer weight = positiveInt(rawMap.get("weight_g"), "Ingredient weight");
            if (weight > 1000) {
                throw new BizException(400, 400, "Ingredient weight must be at most 1000g");
            }
            IngredientRecord ingredient = ingredientMapper.findById(ingredientId);
            if (ingredient == null) {
                throw new BizException(404, 404, "Ingredient not found");
            }
            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("ingredientId", ingredientId);
            normalized.put("name", rawMap.get("name") == null ? ingredient.getName() : String.valueOf(rawMap.get("name")));
            normalized.put("weight_g", weight);
            result.add(normalized);
        }
        return result;
    }

    private String buildReportSummary(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> stat = dashboardMapper.lowCarbonStat(from, to);
        long low = asLong(stat.get("lowcount"), asLong(stat.get("lowCount"), 0L));
        long total = asLong(stat.get("totalcount"), asLong(stat.get("totalCount"), 0L));
        int rate = total == 0 ? 0 : (int) Math.round((double) low * 100 / total);
        List<Map<String, Object>> highStock = mapIngredientStats(dashboardMapper.highStockIngredients());
        String focus = highStock.stream()
                .limit(2)
                .map(row -> String.valueOf(row.get("name")))
                .reduce((left, right) -> left + " and " + right)
                .orElse("no obvious high-stock ingredients");
        long days = Math.max(1, java.time.Duration.between(from, to).toDays());
        return "Over the past " + days + " days, the low-carbon meal selection rate was " + rate
                + "%, and high-stock ingredients were mainly concentrated in " + focus + ".";
    }

    private void validatePasswordComplexity(String password) {
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (password.length() < 8 || !hasLower || !hasUpper || !hasDigit) {
            throw new BizException(400, 400,
                    "Password must be at least 8 characters and include uppercase, lowercase, and a number");
        }
    }

    private double ratio(long numerator, long denominator) {
        if (denominator <= 0) {
            return 0.0;
        }
        return BigDecimal.valueOf((double) numerator / denominator).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private LocalDateTime defaultRangeStart() {
        return LocalDate.now().minusDays(29).atStartOfDay();
    }

    private LocalDateTime defaultRangeEndExclusive() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }
}
