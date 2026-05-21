import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getIngredients } from '../api/app';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import { getIngredientVisual } from '../utils/ingredientVisuals';
import { pickPageLoadingSrc } from '../utils/loadingAnimations';
import './Customize.css';

const DEFAULT_GRAMS = 100;
const MIN_GRAMS = 10;
const MAX_GRAMS = 1000;

const nutritionProfiles = [
  { keys: ['chicken'], calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { keys: ['lettuce', 'greens'], calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { keys: ['salmon'], calories: 208, protein: 20, carbs: 0, fat: 13 },
  { keys: ['tofu'], calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { keys: ['quinoa'], calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  { keys: ['brown rice', 'rice'], calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { keys: ['avocado'], calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { keys: ['broccoli'], calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { keys: ['shrimp'], calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { keys: ['sweet potato'], calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { keys: ['tomato'], calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { keys: ['mushroom'], calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { keys: ['cucumber'], calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { keys: ['egg'], calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { keys: ['beef'], calories: 250, protein: 26, carbs: 0, fat: 15 },
  { keys: ['pasta'], calories: 131, protein: 5, carbs: 25, fat: 1.1 },
];

const fallbackNutrition = { calories: 80, protein: 3, carbs: 12, fat: 2 };

const bowlPlacements = [
  { left: 29, top: 24, size: 44, rotate: -13 },
  { left: 53, top: 24, size: 45, rotate: 8 },
  { left: 38, top: 41, size: 46, rotate: 18 },
  { left: 60, top: 42, size: 43, rotate: -8 },
  { left: 24, top: 49, size: 42, rotate: 12 },
  { left: 45, top: 57, size: 44, rotate: -18 },
  { left: 63, top: 59, size: 38, rotate: 16 },
  { left: 20, top: 61, size: 37, rotate: 6 },
  { left: 42, top: 17, size: 36, rotate: -5 },
  { left: 69, top: 35, size: 35, rotate: -12 },
  { left: 19, top: 33, size: 35, rotate: 20 },
  { left: 53, top: 50, size: 36, rotate: -22 },
];

const getNutritionForIngredient = (ingredient) => {
  const name = ingredient.name?.toLowerCase() || '';
  const profile = nutritionProfiles.find((item) =>
    item.keys.some((key) => name.includes(key))
  );
  return profile || fallbackNutrition;
};

const roundMetric = (value) => Math.round(value * 10) / 10;

const metricForWeight = (per100g, grams) => roundMetric((per100g * grams) / 100);

const IngredientModel = ({ model }) => {
  if (model === 'grain') {
    return (
      <span className="food-model model-grain">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} />
        ))}
      </span>
    );
  }

  if (model === 'broccoli') {
    return (
      <span className="food-model model-broccoli">
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (model === 'noodle') {
    return (
      <span className="food-model model-noodle">
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (model === 'shrimp') {
    return (
      <span className="food-model model-shrimp">
        <span />
      </span>
    );
  }

  if (model === 'mushroom') {
    return (
      <span className="food-model model-mushroom">
        <span />
      </span>
    );
  }

  if (model === 'avocado') {
    return (
      <span className="food-model model-avocado">
        <span />
      </span>
    );
  }

  return <span className={`food-model model-${model}`} />;
};

const Customize = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadIngredients = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getIngredients({ page: 1, size: 200 });
        if (!active) {
          return;
        }
        setIngredients((data.items || []).map((ingredient) => {
          const visual = getIngredientVisual(ingredient);
          return {
            ...ingredient,
            nutrition: getNutritionForIngredient(ingredient),
            imageUrl: visual.image,
            accent: visual.accent,
            model: visual.model,
          };
        }));
      } catch (err) {
        if (active) {
          setError(err.message || t('failedLoadIngredients'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadIngredients();
    return () => {
      active = false;
    };
  }, [t]);

  const filteredIngredients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return ingredients
      .filter((ingredient) => {
        if (!keyword) {
          return true;
        }
        return (
          ingredient.name?.toLowerCase().includes(keyword) ||
          ingredient.allergens?.some((allergen) =>
            allergen.toLowerCase().includes(keyword)
          )
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients, search]);

  const totals = useMemo(() => {
    return selectedIngredients.reduce(
      (sum, ingredient) => {
        sum.calories += metricForWeight(ingredient.nutrition.calories, ingredient.grams);
        sum.protein += metricForWeight(ingredient.nutrition.protein, ingredient.grams);
        sum.carbs += metricForWeight(ingredient.nutrition.carbs, ingredient.grams);
        sum.fat += metricForWeight(ingredient.nutrition.fat, ingredient.grams);
        sum.weight += ingredient.grams;
        return sum;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 }
    );
  }, [selectedIngredients]);

  const selectedIds = useMemo(
    () => new Set(selectedIngredients.map((ingredient) => ingredient.ingredientId)),
    [selectedIngredients]
  );

  const bowlIngredientModels = useMemo(() => {
    return selectedIngredients.flatMap((ingredient) => {
      const portionCount = Math.max(1, Math.floor(ingredient.grams / DEFAULT_GRAMS));
      return Array.from({ length: portionCount }, (_, portionIndex) => ({
        ...ingredient,
        portionIndex,
      }));
    });
  }, [selectedIngredients]);

  const addIngredient = (ingredient) => {
    setSelectedIngredients((current) => {
      const existing = current.find((item) => item.ingredientId === ingredient.ingredientId);
      if (existing) {
        return current.map((item) =>
          item.ingredientId === ingredient.ingredientId
            ? { ...item, grams: Math.min(MAX_GRAMS, item.grams + 50) }
            : item
        );
      }
      return [...current, { ...ingredient, grams: DEFAULT_GRAMS }];
    });
  };

  const updateIngredientWeight = (ingredientId, grams) => {
    const nextGrams = Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, Number(grams) || MIN_GRAMS));
    setSelectedIngredients((current) =>
      current.map((ingredient) =>
        ingredient.ingredientId === ingredientId
          ? { ...ingredient, grams: nextGrams }
          : ingredient
      )
    );
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients((current) =>
      current.filter((ingredient) => ingredient.ingredientId !== ingredientId)
    );
  };

  const handleSubmitOrder = async () => {
    if (selectedIngredients.length === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      if (selectedIngredients.some((ingredient) => ingredient.grams > MAX_GRAMS)) {
        setSubmitError(t('maxIngredient', { grams: MAX_GRAMS }));
        return;
      }
      const response = await createOrder({
        userId: Number(auth.userId),
        items: [
          {
            custom: true,
            name: t('customBowlName'),
            quantity: 1,
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein),
            sustainabilityScore: 8,
            ingredients: selectedIngredients.map((ingredient) => ({
              ingredientId: ingredient.ingredientId,
              name: ingredient.name,
              weight_g: ingredient.grams,
            })),
          },
        ],
      });
      setSelectedIngredients([]);
      navigate('/loading', {
        state: {
          nextPath: '/orders',
          loadingSrc: pickPageLoadingSrc(),
          routeState: { createdOrderId: response.orderId },
        },
      });
    } catch (err) {
      setSubmitError(err.message || t('failedSubmitCustomOrder'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customize-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <main className="customize-shell">
        <section className="customize-header">
          <div>
            <span className="customize-kicker">{t('personalizedMeal')}</span>
            <h1>{t('buildYourPlate')}</h1>
          </div>
          <button
            type="button"
            className="reset-custom-meal"
            onClick={() => setSelectedIngredients([])}
            disabled={selectedIngredients.length === 0}
          >
            <RotateCcw size={18} />
            {t('reset')}
          </button>
        </section>

        <section className="customize-layout">
          <div className="ingredient-picker">
            <div className="picker-toolbar">
              <h2>{t('ingredients')}</h2>
              <label className="ingredient-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={t('searchIngredients')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            {loading && <div className="customize-message">{t('loadingIngredients')}</div>}
            {error && <div className="customize-message error">{error}</div>}

            {!loading && !error && (
              <div className="ingredient-list">
                {filteredIngredients.map((ingredient) => {
                  const nutrition = ingredient.nutrition;
                  const isSelected = selectedIds.has(ingredient.ingredientId);

                  return (
                    <button
                      type="button"
                      className={isSelected ? 'ingredient-row selected' : 'ingredient-row'}
                      key={ingredient.ingredientId}
                      onClick={() => addIngredient(ingredient)}
                      style={{ '--ingredient-accent': ingredient.accent }}
                    >
                      <span className="ingredient-row-thumb">
                        <img src={ingredient.imageUrl} alt="" />
                      </span>
                      <span className="ingredient-row-main">
                        <strong>{ingredient.name}</strong>
                        <span>{nutrition.calories} kcal · {nutrition.protein}g {t('proteinShort')}</span>
                      </span>
                      <span className="ingredient-row-meta">
                        {ingredient.currentQty_g ?? 0}g
                      </span>
                      <span className="ingredient-row-action">
                        <Plus size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <section className="ingredient-display" aria-label={t('ingredientBowlDisplay')}>
            <div className="display-header">
              <div>
                <span>{t('displayArea')}</span>
                <h2>{t('customBowl')}</h2>
              </div>
            </div>

            <div className={selectedIngredients.length > 0 ? 'bowl-stage filled' : 'bowl-stage'}>
              <div className="bowl-shadow"></div>
              <div className="bowl-back"></div>
              <div className="bowl-food-area" aria-hidden="true">
                {bowlIngredientModels.map((ingredient, index) => {
                  const placement = bowlPlacements[index % bowlPlacements.length];
                  return (
                    <div
                      className="bowl-ingredient"
                      key={`${ingredient.ingredientId}-${ingredient.portionIndex}`}
                      style={{
                        left: `${placement.left}%`,
                        top: `${placement.top}%`,
                        width: `${placement.size}%`,
                        transform: `rotate(${placement.rotate}deg)`,
                        '--ingredient-accent': ingredient.accent,
                        zIndex: index + 2,
                      }}
                      title={`${ingredient.name} ${ingredient.grams}g`}
                    >
                      <IngredientModel model={ingredient.model} />
                    </div>
                  );
                })}
              </div>
              <div className="bowl-front"></div>
              <div className="bowl-rim"></div>
              {selectedIngredients.length === 0 && (
                <div className="bowl-empty-note">{t('addIngredientsToFill')}</div>
              )}
            </div>

            {selectedIngredients.length > 0 && (
              <div className="bowl-chip-row">
                {selectedIngredients.map((ingredient) => (
                  <span key={ingredient.ingredientId}>
                    {ingredient.name}
                    <strong>{ingredient.grams}g</strong>
                  </span>
                ))}
              </div>
            )}
          </section>

          <aside className="custom-meal-panel" aria-label={t('selectedIngredientNutrition')}>
            <div className="custom-meal-header">
              <div>
                <span>{t('currentDish')}</span>
                <h2>{t('ingredientsCount', { count: selectedIngredients.length })}</h2>
              </div>
            </div>

            <div className="selected-list">
              {selectedIngredients.length === 0 ? (
                <div className="empty-selection">
                  {t('nutritionUpdates')}
                </div>
              ) : (
                selectedIngredients.map((ingredient) => (
                  <div className="selected-ingredient" key={ingredient.ingredientId}>
                    <div className="selected-info">
                      <strong>{ingredient.name}</strong>
                      <span>
                        {metricForWeight(ingredient.nutrition.calories, ingredient.grams)} kcal ·{' '}
                        {metricForWeight(ingredient.nutrition.protein, ingredient.grams)}g {t('proteinShort')}
                      </span>
                    </div>
                    <div className="weight-controls">
                      <button
                        type="button"
                        onClick={() => updateIngredientWeight(ingredient.ingredientId, ingredient.grams - 10)}
                        aria-label={t('reduceName', { name: ingredient.name })}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={MIN_GRAMS}
                        max={MAX_GRAMS}
                        step="10"
                        value={ingredient.grams}
                        onChange={(event) =>
                          updateIngredientWeight(ingredient.ingredientId, event.target.value)
                        }
                        aria-label={t('nameGrams', { name: ingredient.name })}
                      />
                      <span>g</span>
                      <button
                        type="button"
                        onClick={() => updateIngredientWeight(ingredient.ingredientId, ingredient.grams + 10)}
                        aria-label={t('increaseName', { name: ingredient.name })}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        className="remove-selected"
                        onClick={() => removeIngredient(ingredient.ingredientId)}
                        aria-label={t('removeName', { name: ingredient.name })}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="nutrition-summary">
              <div className="summary-row featured">
                <span>{t('totalCalories')}</span>
                <strong>{roundMetric(totals.calories)} kcal</strong>
              </div>
              <div className="summary-grid">
                <div>
                  <span>{t('proteinShort')}</span>
                  <strong>{roundMetric(totals.protein)}g</strong>
                </div>
                <div>
                  <span>{t('carbs')}</span>
                  <strong>{roundMetric(totals.carbs)}g</strong>
                </div>
                <div>
                  <span>{t('fat')}</span>
                  <strong>{roundMetric(totals.fat)}g</strong>
                </div>
                <div>
                  <span>{t('weight')}</span>
                  <strong>{roundMetric(totals.weight)}g</strong>
                </div>
              </div>
              {submitError && <p className="custom-order-error">{submitError}</p>}
              <button
                type="button"
                className="submit-custom-order"
                disabled={selectedIngredients.length === 0 || submitting}
                onClick={handleSubmitOrder}
              >
                {submitting ? t('submitting') : t('submitOrder')}
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Customize;
