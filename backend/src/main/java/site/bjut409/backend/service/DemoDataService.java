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

    public DemoDataService(UserMapper userMapper,
                           UserPreferenceMapper userPreferenceMapper,
                           IngredientMapper ingredientMapper,
                           StockMapper stockMapper,
                           MealMapper mealMapper,
                           MealIngredientMapper mealIngredientMapper,
                           TagMapper tagMapper,
                           JdbcTemplate jdbcTemplate) {
        this.userMapper = userMapper;
        this.userPreferenceMapper = userPreferenceMapper;
        this.ingredientMapper = ingredientMapper;
        this.stockMapper = stockMapper;
        this.mealMapper = mealMapper;
        this.mealIngredientMapper = mealIngredientMapper;
        this.tagMapper = tagMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureSeed() {
        if (userMapper.countAll() == 0) {
            seedBaseData();
        }
    }

    @Transactional
    public void resetAll() {
        jdbcTemplate.execute("truncate table order_items, orders, meal_sustainability_tags, sustainability_tags, stock_records, meal_ingredients, ingredient_allergens, meals, ingredients, user_allergies, allergens, user_preferences, users restart identity cascade");
        seedBaseData();
    }

    @Transactional
    public void seedBaseData() {
        UserRecord customer = new UserRecord();
        customer.setUsername("customer1");
        customer.setPasswordHash("123456");
        customer.setRole("customer");
        userMapper.insert(customer);

        UserRecord staff = new UserRecord();
        staff.setUsername("staff1");
        staff.setPasswordHash("123456");
        staff.setRole("staff");
        userMapper.insert(staff);

        UserRecord admin = new UserRecord();
        admin.setUsername("admin1");
        admin.setPasswordHash("123456");
        admin.setRole("admin");
        userMapper.insert(admin);

        insertPreference(customer.getUserId(), 2000, 80, false);
        insertPreference(staff.getUserId(), 2200, 90, false);
        insertPreference(admin.getUserId(), 2200, 90, false);

        IngredientRecord chicken = new IngredientRecord();
        chicken.setName("Chicken");
        ingredientMapper.insert(chicken);

        IngredientRecord lettuce = new IngredientRecord();
        lettuce.setName("Lettuce");
        ingredientMapper.insert(lettuce);

        StockRecordRow stock1 = new StockRecordRow();
        stock1.setIngredientId(chicken.getIngredientId());
        stock1.setCurrentQtyG(8000);
        stock1.setExpiryDate(LocalDate.now().plusDays(7));
        stockMapper.insert(stock1);

        StockRecordRow stock2 = new StockRecordRow();
        stock2.setIngredientId(lettuce.getIngredientId());
        stock2.setCurrentQtyG(1800);
        stock2.setExpiryDate(LocalDate.now().plusDays(2));
        stockMapper.insert(stock2);

        MealRecord meal1 = new MealRecord();
        meal1.setName("Chicken Salad");
        meal1.setDescription("classic");
        meal1.setCalories(450);
        meal1.setProtein(30);
        meal1.setSustainabilityScore(8);
        mealMapper.insert(meal1);

        MealIngredientRecord mi1 = new MealIngredientRecord();
        mi1.setMealId(meal1.getMealId());
        mi1.setIngredientId(chicken.getIngredientId());
        mi1.setWeightG(150);
        mealIngredientMapper.insert(mi1);

        MealIngredientRecord mi2 = new MealIngredientRecord();
        mi2.setMealId(meal1.getMealId());
        mi2.setIngredientId(lettuce.getIngredientId());
        mi2.setWeightG(80);
        mealIngredientMapper.insert(mi2);

        MealRecord meal2 = new MealRecord();
        meal2.setName("Veggie Bowl");
        meal2.setDescription("plant based");
        meal2.setCalories(380);
        meal2.setProtein(20);
        meal2.setSustainabilityScore(9);
        mealMapper.insert(meal2);

        MealIngredientRecord mi3 = new MealIngredientRecord();
        mi3.setMealId(meal2.getMealId());
        mi3.setIngredientId(lettuce.getIngredientId());
        mi3.setWeightG(200);
        mealIngredientMapper.insert(mi3);

        attachTag(meal1.getMealId(), "low-carbon");
        attachTag(meal1.getMealId(), "high-protein");
        attachTag(meal2.getMealId(), "plant-based");
    }

    private void insertPreference(Long userId, int calories, int protein, boolean vegetarian) {
        UserPreferenceRecord pref = new UserPreferenceRecord();
        pref.setUserId(userId);
        pref.setTargetCalories(calories);
        pref.setTargetProtein(protein);
        pref.setIsVegetarian(vegetarian);
        userPreferenceMapper.insert(pref);
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
