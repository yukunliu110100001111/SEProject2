package site.bjut409.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.bjut409.backend.mapper.IngredientMapper;
import site.bjut409.backend.mapper.MealIngredientMapper;
import site.bjut409.backend.mapper.MealMapper;
import site.bjut409.backend.mapper.StockMapper;
import site.bjut409.backend.mapper.TagMapper;
import site.bjut409.backend.mapper.UserMapper;
import site.bjut409.backend.mapper.UserPreferenceMapper;
import site.bjut409.backend.model.IngredientRecord;
import site.bjut409.backend.model.MealIngredientRecord;
import site.bjut409.backend.model.MealRecord;
import site.bjut409.backend.model.StockRecordRow;
import site.bjut409.backend.model.UserPreferenceRecord;
import site.bjut409.backend.model.UserRecord;

import java.time.LocalDate;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DemoDataService {

    private final UserMapper userMapper;
    private final UserPreferenceMapper userPreferenceMapper;
    private final IngredientMapper ingredientMapper;
    private final StockMapper stockMapper;
    private final MealMapper mealMapper;
    private final MealIngredientMapper mealIngredientMapper;
    private final TagMapper tagMapper;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordHasher passwordHasher;

    public DemoDataService(UserMapper userMapper,
                           UserPreferenceMapper userPreferenceMapper,
                           IngredientMapper ingredientMapper,
                           StockMapper stockMapper,
                           MealMapper mealMapper,
                           MealIngredientMapper mealIngredientMapper,
                           TagMapper tagMapper,
                           JdbcTemplate jdbcTemplate,
                           PasswordHasher passwordHasher) {
        this.userMapper = userMapper;
        this.userPreferenceMapper = userPreferenceMapper;
        this.ingredientMapper = ingredientMapper;
        this.stockMapper = stockMapper;
        this.mealMapper = mealMapper;
        this.mealIngredientMapper = mealIngredientMapper;
        this.tagMapper = tagMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordHasher = passwordHasher;
    }

    @PostConstruct
    public void ensureSeed() {
        ensureSchemaCompatibility();
        if (userMapper.countAll() == 0) {
            seedBaseData();
            return;
        }
        ensureCatalogData();
    }

    @Transactional
    public void resetAll() {
        ensureSchemaCompatibility();
        if (isH2()) {
            resetAllForH2();
        } else {
            jdbcTemplate.execute("truncate table auth_sessions, recommendation_events, sustainability_reports, order_items, orders, meal_sustainability_tags, sustainability_tags, stock_records, meal_ingredients, ingredient_allergens, meals, ingredients, user_allergies, allergens, user_preferences, users restart identity cascade");
        }
        seedBaseData();
    }

    private boolean isH2() {
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            return "H2".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName());
        } catch (SQLException ex) {
            return false;
        }
    }

    private void resetAllForH2() {
        jdbcTemplate.execute("set referential_integrity false");
        for (String table : List.of(
                "auth_sessions",
                "recommendation_events",
                "sustainability_reports",
                "order_items",
                "orders",
                "meal_sustainability_tags",
                "sustainability_tags",
                "stock_records",
                "meal_ingredients",
                "ingredient_allergens",
                "meals",
                "ingredients",
                "user_allergies",
                "allergens",
                "user_preferences",
                "users")) {
            jdbcTemplate.execute("truncate table " + table);
        }
        for (String statement : List.of(
                "alter table users alter column user_id restart with 1",
                "alter table allergens alter column allergen_id restart with 1",
                "alter table meals alter column meal_id restart with 1",
                "alter table ingredients alter column ingredient_id restart with 1",
                "alter table stock_records alter column stock_id restart with 1",
                "alter table sustainability_tags alter column tag_id restart with 1",
                "alter table orders alter column order_id restart with 1",
                "alter table recommendation_events alter column event_id restart with 1",
                "alter table auth_sessions alter column session_id restart with 1",
                "alter table sustainability_reports alter column report_id restart with 1")) {
            jdbcTemplate.execute(statement);
        }
        jdbcTemplate.execute("set referential_integrity true");
    }

    private void ensureSchemaCompatibility() {
        jdbcTemplate.execute("alter table if exists meals add column if not exists image_url varchar(500)");
        jdbcTemplate.execute("alter table if exists orders add column if not exists recommendation_request_id varchar(64)");
        jdbcTemplate.execute("alter table if exists orders add column if not exists confirmed_at timestamp");
        jdbcTemplate.execute("alter table if exists orders add column if not exists cancelled_at timestamp");
        jdbcTemplate.execute("alter table if exists order_items add column if not exists meal_name_snapshot varchar(150)");
        jdbcTemplate.execute("alter table if exists order_items add column if not exists calories_snapshot int");
        jdbcTemplate.execute("alter table if exists order_items add column if not exists protein_snapshot int");
        jdbcTemplate.execute("alter table if exists order_items add column if not exists sustainability_score_snapshot int");
        jdbcTemplate.execute("alter table if exists order_items add column if not exists image_url_snapshot varchar(500)");
        jdbcTemplate.execute("""
                create table if not exists recommendation_events (
                    event_id bigint generated by default as identity primary key,
                    request_id varchar(64) not null,
                    user_id bigint not null references users(user_id) on delete cascade,
                    meal_id bigint not null references meals(meal_id) on delete restrict,
                    event_type varchar(20) not null,
                    rank_position int,
                    order_id bigint references orders(order_id) on delete restrict,
                    created_at timestamp not null default current_timestamp
                )
                """);
        jdbcTemplate.execute("""
                create table if not exists auth_sessions (
                    session_id bigint generated by default as identity primary key,
                    user_id bigint not null references users(user_id) on delete cascade,
                    token_hash varchar(255) not null unique,
                    issued_at timestamp not null default current_timestamp,
                    expires_at timestamp not null,
                    revoked_at timestamp
                )
                """);
        jdbcTemplate.execute("""
                create table if not exists sustainability_reports (
                    report_id bigint generated by default as identity primary key,
                    summary text not null,
                    report_data jsonb not null default '{}'::jsonb,
                    generated_by bigint,
                    range_start date,
                    range_end date,
                    generated_at timestamp not null default current_timestamp
                )
                """);
    }

    @Transactional
    public void seedBaseData() {
        UserRecord customer = new UserRecord();
        customer.setUsername("customer1");
        customer.setPasswordHash(passwordHasher.hash("123456"));
        customer.setRole("customer");
        userMapper.insert(customer);

        UserRecord staff = new UserRecord();
        staff.setUsername("staff1");
        staff.setPasswordHash(passwordHasher.hash("123456"));
        staff.setRole("staff");
        userMapper.insert(staff);

        UserRecord admin = new UserRecord();
        admin.setUsername("admin1");
        admin.setPasswordHash(passwordHasher.hash("123456"));
        admin.setRole("admin");
        userMapper.insert(admin);

        insertPreference(customer.getUserId(), 2000, 80, false);
        insertPreference(staff.getUserId(), 2200, 90, false);
        insertPreference(admin.getUserId(), 2200, 90, false);

        ensureCatalogData();
    }

    @Transactional
    public void ensureCatalogData() {
        Map<String, IngredientRecord> ingredientsByName = new LinkedHashMap<>();
        for (IngredientRecord ingredient : ingredientMapper.findAll()) {
            ingredientsByName.put(ingredient.getName(), ingredient);
        }

        IngredientRecord chicken = ensureIngredient(ingredientsByName, "Chicken", 8000, 7);
        IngredientRecord lettuce = ensureIngredient(ingredientsByName, "Lettuce", 1800, 2);
        IngredientRecord salmon = ensureIngredient(ingredientsByName, "Salmon", 4200, 4);
        IngredientRecord tofu = ensureIngredient(ingredientsByName, "Tofu", 5200, 5);
        IngredientRecord quinoa = ensureIngredient(ingredientsByName, "Quinoa", 6400, 30);
        IngredientRecord brownRice = ensureIngredient(ingredientsByName, "Brown Rice", 7200, 40);
        IngredientRecord avocado = ensureIngredient(ingredientsByName, "Avocado", 2600, 5);
        IngredientRecord broccoli = ensureIngredient(ingredientsByName, "Broccoli", 3600, 4);
        IngredientRecord shrimp = ensureIngredient(ingredientsByName, "Shrimp", 4600, 3);
        IngredientRecord sweetPotato = ensureIngredient(ingredientsByName, "Sweet Potato", 5400, 18);
        IngredientRecord tomato = ensureIngredient(ingredientsByName, "Tomato", 3200, 6);
        IngredientRecord mushroom = ensureIngredient(ingredientsByName, "Mushroom", 2800, 4);
        IngredientRecord cucumber = ensureIngredient(ingredientsByName, "Cucumber", 2400, 4);
        IngredientRecord egg = ensureIngredient(ingredientsByName, "Egg", 2600, 8);
        IngredientRecord beef = ensureIngredient(ingredientsByName, "Beef", 5000, 6);

        Map<String, MealRecord> mealsByName = new LinkedHashMap<>();
        for (MealRecord meal : mealMapper.listActive()) {
            mealsByName.put(meal.getName(), meal);
        }

        ensureMeal(
                mealsByName,
                "Chicken Salad",
                "classic",
                450,
                30,
                8,
                List.of("low-carbon", "high-protein"),
                ingredientWeights(
                        chicken, 150,
                        lettuce, 80,
                        tomato, 60
                )
        );

        ensureMeal(
                mealsByName,
                "Veggie Bowl",
                "plant based",
                380,
                20,
                9,
                List.of("plant-based", "low-carbon"),
                ingredientWeights(
                        lettuce, 120,
                        quinoa, 130,
                        avocado, 70,
                        tomato, 60
                )
        );

        ensureMeal(
                mealsByName,
                "Salmon Power Bowl",
                "clean fuel",
                520,
                34,
                8,
                List.of("high-protein"),
                ingredientWeights(
                        salmon, 160,
                        brownRice, 120,
                        broccoli, 90,
                        avocado, 40
                )
        );

        ensureMeal(
                mealsByName,
                "Tofu Garden Bowl",
                "green and crisp",
                410,
                24,
                9,
                List.of("plant-based", "low-carbon"),
                ingredientWeights(
                        tofu, 180,
                        lettuce, 90,
                        cucumber, 80,
                        quinoa, 100
                )
        );

        ensureMeal(
                mealsByName,
                "Shrimp Sweet Potato Plate",
                "sweet savory",
                460,
                31,
                7,
                List.of("high-protein"),
                ingredientWeights(
                        shrimp, 150,
                        sweetPotato, 170,
                        broccoli, 80
                )
        );

        ensureMeal(
                mealsByName,
                "Mushroom Quinoa Cup",
                "light and warm",
                330,
                18,
                9,
                List.of("plant-based", "low-carbon"),
                ingredientWeights(
                        mushroom, 110,
                        quinoa, 120,
                        tomato, 50,
                        lettuce, 60
                )
        );

        ensureMeal(
                mealsByName,
                "Beef Energy Box",
                "bold protein",
                590,
                38,
                6,
                List.of("high-protein"),
                ingredientWeights(
                        beef, 180,
                        brownRice, 130,
                        broccoli, 70
                )
        );

        ensureMeal(
                mealsByName,
                "Avocado Egg Toast Bowl",
                "brunch style",
                420,
                22,
                8,
                List.of("light"),
                ingredientWeights(
                        avocado, 70,
                        egg, 120,
                        tomato, 60,
                        lettuce, 70
                )
        );

        ensureMeal(
                mealsByName,
                "Green Crunch Salad",
                "fresh bite",
                290,
                16,
                9,
                List.of("light", "low-carbon", "plant-based"),
                ingredientWeights(
                        lettuce, 130,
                        cucumber, 90,
                        avocado, 40,
                        tomato, 70
                )
        );

        ensureMeal(
                mealsByName,
                "Teriyaki Chicken Rice",
                "balanced comfort",
                540,
                35,
                7,
                List.of("high-protein"),
                ingredientWeights(
                        chicken, 170,
                        brownRice, 130,
                        broccoli, 70
                )
        );
    }

    private void insertPreference(Long userId, int calories, int protein, boolean vegetarian) {
        UserPreferenceRecord pref = new UserPreferenceRecord();
        pref.setUserId(userId);
        pref.setTargetCalories(calories);
        pref.setTargetProtein(protein);
        pref.setIsVegetarian(vegetarian);
        userPreferenceMapper.insert(pref);
    }

    private IngredientRecord ensureIngredient(Map<String, IngredientRecord> ingredientsByName,
                                              String name,
                                              int currentQtyG,
                                              int expiryAfterDays) {
        IngredientRecord existing = ingredientsByName.get(name);
        if (existing == null) {
            existing = new IngredientRecord();
            existing.setName(name);
            ingredientMapper.insert(existing);
            ingredientsByName.put(name, existing);
        }

        if (stockMapper.findLatestByIngredientId(existing.getIngredientId()) == null) {
            StockRecordRow stock = new StockRecordRow();
            stock.setIngredientId(existing.getIngredientId());
            stock.setCurrentQtyG(currentQtyG);
            stock.setExpiryDate(LocalDate.now().plusDays(expiryAfterDays));
            stockMapper.insert(stock);
        }
        return existing;
    }

    private void ensureMeal(Map<String, MealRecord> mealsByName,
                            String name,
                            String description,
                            int calories,
                            int protein,
                            int sustainabilityScore,
                            List<String> tags,
                            Map<IngredientRecord, Integer> ingredients) {
        if (mealsByName.containsKey(name)) {
            return;
        }

        MealRecord meal = new MealRecord();
        meal.setName(name);
        meal.setDescription(description);
        meal.setCalories(calories);
        meal.setProtein(protein);
        meal.setSustainabilityScore(sustainabilityScore);
        mealMapper.insert(meal);
        mealsByName.put(name, meal);

        for (Map.Entry<IngredientRecord, Integer> entry : ingredients.entrySet()) {
            MealIngredientRecord row = new MealIngredientRecord();
            row.setMealId(meal.getMealId());
            row.setIngredientId(entry.getKey().getIngredientId());
            row.setWeightG(entry.getValue());
            mealIngredientMapper.insert(row);
        }

        for (String tag : tags) {
            attachTag(meal.getMealId(), tag);
        }
    }

    private Map<IngredientRecord, Integer> ingredientWeights(Object... values) {
        Map<IngredientRecord, Integer> result = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            result.put((IngredientRecord) values[index], (Integer) values[index + 1]);
        }
        return result;
    }

    private void attachTag(Long mealId, String tagName) {
        TagMapper.TagRow row = tagMapper.findByName(tagName);
        if (row == null) {
            row = new TagMapper.TagRow();
            row.setTagName(tagName);
            tagMapper.insert(row);
        }
        tagMapper.attachTag(mealId, row.getTagId());
    }
}
