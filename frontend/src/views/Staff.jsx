import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createIngredient,
  createMeal,
  deleteMeal,
  getIngredientDetail,
  getIngredients,
  getMealDetail,
  getMeals,
  updateIngredient,
  updateMeal,
  updateStock,
  uploadMealImage,
} from '../api/app';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import './Staff.css';

const emptyMealForm = {
  mealId: null,
  name: '',
  description: '',
  calories: '',
  protein: '',
  sustainabilityScore: '',
  imageUrl: '',
  imageFile: null,
  tagsInput: '',
  ingredientsInput: '',
};

const emptyIngredientForm = {
  ingredientId: '',
  name: '',
  currentQty_g: '',
  expiryDate: '',
  allergensInput: '',
};

const SUPPORTED_MEAL_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/x-png', 'image/webp']);
const SUPPORTED_MEAL_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MEAL_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_MEAL_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const isSupportedMealImage = (file) => {
  const normalizedType = file.type.toLowerCase();
  if (SUPPORTED_MEAL_IMAGE_TYPES.has(normalizedType)) {
    return true;
  }
  const normalizedName = file.name.toLowerCase();
  return SUPPORTED_MEAL_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

const parseCommaList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseIngredientLinks = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((pair) => {
      const [ingredientId, weight] = pair.split(':');
      return {
        ingredientId: Number(ingredientId),
        weight_g: Number(weight),
      };
    })
    .filter((item) => item.ingredientId && item.weight_g);

const Staff = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const { t } = useI18n();
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const mealImageInputRef = useRef(null);

  const ingredientList = useMemo(() => {
    return [...ingredients].sort((a, b) => a.ingredientId - b.ingredientId);
  }, [ingredients]);

  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      const [mealList, ingredientData] = await Promise.all([
        getMeals(),
        getIngredients({ page: 1, size: 100 }),
      ]);
      const detailedMeals = await Promise.all(mealList.map((meal) => getMealDetail(meal.mealId)));
      setMeals(detailedMeals);
      setIngredients(ingredientData.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData().catch((err) => setError(err.message || t('failedLoadStaffData')));
  }, [t]);

  const handleMealImageChange = (file) => {
    if (!file) {
      setMealForm((current) => ({ ...current, imageUrl: '', imageFile: null }));
      return;
    }

    if (!isSupportedMealImage(file)) {
      setError(t('chooseMealImage'));
      return;
    }

    if (file.size > MAX_MEAL_IMAGE_SIZE_BYTES) {
      setError(t('mealImageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMealForm((current) => ({
        ...current,
        imageFile: file,
        imageUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearMealImage = () => {
    setMealForm((current) => ({ ...current, imageUrl: '', imageFile: null }));
    if (mealImageInputRef.current) {
      mealImageInputRef.current.value = '';
    }
  };

  const handleMealSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      name: mealForm.name,
      description: mealForm.description,
      calories: Number(mealForm.calories),
      protein: Number(mealForm.protein),
      sustainabilityScore: Number(mealForm.sustainabilityScore),
      tags: parseCommaList(mealForm.tagsInput),
      ingredients: parseIngredientLinks(mealForm.ingredientsInput),
    };

    try {
      let targetMealId = mealForm.mealId;
      if (mealForm.mealId) {
        await updateMeal(mealForm.mealId, payload);
        setMessage(t('mealUpdated', { id: mealForm.mealId }));
      } else {
        const created = await createMeal(payload);
        targetMealId = created.mealId;
        setMessage(t('mealCreated'));
      }
      if (targetMealId && mealForm.imageFile) {
        await uploadMealImage(targetMealId, mealForm.imageFile);
      }
      setMealForm(emptyMealForm);
      if (mealImageInputRef.current) {
        mealImageInputRef.current.value = '';
      }
      await refreshData();
    } catch (err) {
      setError(err.message || t('failedSaveMeal'));
    }
  };

  const handleEditMeal = (meal) => {
    setMealForm({
      mealId: meal.mealId,
      name: meal.name || '',
      description: meal.description || '',
      calories: meal.calories || '',
      protein: meal.protein || '',
      sustainabilityScore: meal.sustainabilityScore || '',
      imageUrl: meal.imageUrl || '',
      imageFile: null,
      tagsInput: (meal.tags || []).join(', '),
      ingredientsInput: (meal.ingredients || [])
        .map((ingredient) => `${ingredient.ingredientId}:${ingredient.weight_g}`)
        .join(', '),
    });
    if (mealImageInputRef.current) {
      mealImageInputRef.current.value = '';
    }
  };

  const handleDeleteMeal = async (mealId) => {
    setError('');
    setMessage('');
    try {
      await deleteMeal(mealId);
      setMessage(t('mealDeleted', { id: mealId }));
      await refreshData();
    } catch (err) {
      setError(err.message || t('deleteFailed'));
    }
  };

  const handleIngredientSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const allergens = parseCommaList(ingredientForm.allergensInput);

    try {
      if (ingredientForm.ingredientId) {
        await updateIngredient(Number(ingredientForm.ingredientId), {
          name: ingredientForm.name,
          allergens,
        });
        await updateStock(Number(ingredientForm.ingredientId), {
          currentQty_g: Number(ingredientForm.currentQty_g),
          expiryDate: ingredientForm.expiryDate,
        });
        setMessage(t('ingredientUpdated', { id: ingredientForm.ingredientId }));
      } else {
        await createIngredient({
          name: ingredientForm.name,
          currentQty_g: Number(ingredientForm.currentQty_g),
          expiryDate: ingredientForm.expiryDate,
          allergens,
        });
        setMessage(t('ingredientCreated'));
      }

      setIngredientForm(emptyIngredientForm);
      await refreshData();
    } catch (err) {
      setError(err.message || t('failedSaveIngredient'));
    }
  };

  return (
    <div className="staff-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="staff-shell">
        <div className="staff-header">
          <h1>{t('staffConsole')}</h1>
        </div>

        {message && <div className="staff-message staff-success">{message}</div>}
        {error && <div className="staff-message staff-error">{error}</div>}
        {loading && <div className="staff-message">{t('loadingStaffData')}</div>}

        <div className="staff-grid">
          <section className="staff-card">
            <h2>{t('mealManagement')}</h2>
            <form className="staff-form" onSubmit={handleMealSubmit}>
              <input
                type="text"
                placeholder={t('mealName')}
                value={mealForm.name}
                onChange={(e) => setMealForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <textarea
                placeholder={t('description')}
                value={mealForm.description}
                onChange={(e) => setMealForm((current) => ({ ...current, description: e.target.value }))}
                rows="3"
              ></textarea>
              <input
                type="number"
                placeholder={t('caloriesKcal')}
                value={mealForm.calories}
                onChange={(e) => setMealForm((current) => ({ ...current, calories: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder={t('proteinG')}
                value={mealForm.protein}
                onChange={(e) => setMealForm((current) => ({ ...current, protein: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder={t('sustainabilityRange')}
                value={mealForm.sustainabilityScore}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, sustainabilityScore: e.target.value }))
                }
                required
              />
              <label className="staff-file-field">
                <span>{t('uploadImage')}</span>
                <input
                  ref={mealImageInputRef}
                  type="file"
                  accept={MEAL_IMAGE_ACCEPT}
                  onChange={(e) => handleMealImageChange(e.target.files?.[0])}
                />
              </label>
              {mealForm.imageUrl && (
                <div className="staff-image-preview">
                  <img src={mealForm.imageUrl} alt={t('mealPreview')} />
                  <button
                    type="button"
                    className="staff-clear-image"
                    onClick={clearMealImage}
                  >
                    {t('clearImage')}
                  </button>
                </div>
              )}
              <input
                type="text"
                placeholder={t('tagsComma')}
                value={mealForm.tagsInput}
                onChange={(e) => setMealForm((current) => ({ ...current, tagsInput: e.target.value }))}
              />
              <input
                type="text"
                placeholder={t('ingredientsFormat')}
                value={mealForm.ingredientsInput}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, ingredientsInput: e.target.value }))
                }
              />
              <button type="submit">{mealForm.mealId ? t('updateMeal') : t('createMeal')}</button>
            </form>

            <div className="staff-list">
              {meals.map((meal) => (
                <div key={meal.mealId} className="staff-list-item">
                  <div>
                    <strong>
                      #{meal.mealId} {meal.name}
                    </strong>
                    <p>{meal.description}</p>
                    {meal.imageUrl && (
                      <p className="staff-image-hint">{t('imageConfigured')}</p>
                    )}
                  </div>
                  <div className="staff-item-actions">
                    <button type="button" onClick={() => handleEditMeal(meal)}>
                      {t('edit')}
                    </button>
                    <button type="button" onClick={() => handleDeleteMeal(meal.mealId)}>
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="staff-card">
            <h2>{t('ingredientsStock')}</h2>
            <form className="staff-form" onSubmit={handleIngredientSubmit}>
              <input
                type="number"
                placeholder={t('ingredientIdHint')}
                value={ingredientForm.ingredientId}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, ingredientId: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder={t('ingredientName')}
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder={t('stockInGrams')}
                value={ingredientForm.currentQty_g}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, currentQty_g: e.target.value }))
                }
                required
              />
              <input
                type="date"
                value={ingredientForm.expiryDate}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, expiryDate: e.target.value }))
                }
                required
              />
              <input
                type="text"
                placeholder={t('allergensComma')}
                value={ingredientForm.allergensInput}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, allergensInput: e.target.value }))
                }
              />
              <button type="submit">{ingredientForm.ingredientId ? t('updateIngredient') : t('createIngredient')}</button>
            </form>
            <div className="staff-list">
              {ingredientList.map((ingredient) => (
                <div key={ingredient.ingredientId} className="staff-list-item">
                  <div>
                    <strong>
                      #{ingredient.ingredientId} {ingredient.name}
                    </strong>
                    <p>
                      {ingredient.currentQty_g ?? 0} g · {ingredient.stockStatus || 'normal'}
                    </p>
                    <p>
                      {ingredient.expiryDate || t('noExpiry')} · {(ingredient.allergens || []).join(', ') || t('noAllergens')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const detail = await getIngredientDetail(ingredient.ingredientId);
                        setIngredientForm({
                          ingredientId: detail.ingredientId,
                          name: detail.name || '',
                          currentQty_g: detail.currentQty_g || '',
                          expiryDate: detail.expiryDate || '',
                          allergensInput: (detail.allergens || []).join(', '),
                        });
                      } catch (err) {
                        setError(err.message || t('failedLoadIngredientDetail'));
                      }
                    }}
                  >
                    {t('fillForm')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Staff;
