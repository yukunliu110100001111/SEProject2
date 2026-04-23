import React, { useEffect, useMemo, useState } from 'react';
import {
  createIngredient,
  createMeal,
  deleteMeal,
  getMealDetail,
  getMeals,
  updateIngredient,
  updateMeal,
  updateStock,
} from '../api/app';
import Navbar from '../components/Navbar';
import {
  getMealImageMap,
  removeMealImage,
  saveMealImage,
  getStaffIngredientCache,
  saveStaffIngredientCache,
} from '../utils/storage';
import './Staff.css';

const emptyMealForm = {
  mealId: null,
  name: '',
  description: '',
  calories: '',
  protein: '',
  sustainabilityScore: '',
  imageUrl: '',
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
  const [meals, setMeals] = useState([]);
  const [derivedIngredients, setDerivedIngredients] = useState([]);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const ingredientList = useMemo(() => {
    const merged = new Map();
    [...derivedIngredients, ...getStaffIngredientCache()].forEach((item) => {
      merged.set(item.ingredientId, item);
    });
    return Array.from(merged.values()).sort((a, b) => a.ingredientId - b.ingredientId);
  }, [derivedIngredients]);

  const refreshData = async () => {
    setError('');
    const mealList = await getMeals();
    const detailedMeals = await Promise.all(mealList.map((meal) => getMealDetail(meal.mealId)));
    const imageMap = getMealImageMap();
    setMeals(
      detailedMeals.map((meal) => ({
        ...meal,
        imageUrl: imageMap[String(meal.mealId)] || meal.imageUrl || '',
      }))
    );

    const dedup = new Map();
    detailedMeals.forEach((meal) => {
      meal.ingredients?.forEach((ingredient) => {
        dedup.set(ingredient.ingredientId, {
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          currentQty_g: '',
          expiryDate: '',
          allergensInput: '',
        });
      });
    });
    setDerivedIngredients(Array.from(dedup.values()));
  };

  useEffect(() => {
    refreshData().catch((err) => setError(err.message || 'Failed to load staff data.'));
  }, []);

  const handleMealImageChange = (file) => {
    if (!file) {
      setMealForm((current) => ({ ...current, imageUrl: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMealForm((current) => ({
        ...current,
        imageUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
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
      if (mealForm.mealId) {
        await updateMeal(mealForm.mealId, payload);
        saveMealImage(mealForm.mealId, mealForm.imageUrl.trim());
        setMessage(`Meal #${mealForm.mealId} updated.`);
      } else {
        const created = await createMeal(payload);
        saveMealImage(created.mealId, mealForm.imageUrl.trim());
        setMessage('Meal created.');
      }
      setMealForm(emptyMealForm);
      await refreshData();
    } catch (err) {
      setError(err.message || 'Failed to save meal.');
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
      tagsInput: (meal.tags || []).join(', '),
      ingredientsInput: (meal.ingredients || [])
        .map((ingredient) => `${ingredient.ingredientId}:${ingredient.weight_g}`)
        .join(', '),
    });
  };

  const handleDeleteMeal = async (mealId) => {
    setError('');
    setMessage('');
    try {
      await deleteMeal(mealId);
      removeMealImage(mealId);
      setMessage(`Meal #${mealId} deleted.`);
      await refreshData();
    } catch (err) {
      setError(err.message || 'Delete failed.');
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
        setMessage(`Ingredient #${ingredientForm.ingredientId} updated.`);
      } else {
        const created = await createIngredient({
          name: ingredientForm.name,
          currentQty_g: Number(ingredientForm.currentQty_g),
          expiryDate: ingredientForm.expiryDate,
          allergens,
        });
        const nextCache = [
          ...getStaffIngredientCache().filter((item) => item.ingredientId !== created.ingredientId),
          {
            ingredientId: created.ingredientId,
            name: ingredientForm.name,
            currentQty_g: ingredientForm.currentQty_g,
            expiryDate: ingredientForm.expiryDate,
            allergensInput: ingredientForm.allergensInput,
          },
        ];
        saveStaffIngredientCache(nextCache);
        setMessage(`Ingredient #${created.ingredientId} created.`);
      }

      setIngredientForm(emptyIngredientForm);
      await refreshData();
    } catch (err) {
      setError(err.message || 'Failed to save ingredient.');
    }
  };

  return (
    <div className="staff-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="staff-shell">
        <div className="staff-header">
          <h1>Staff console</h1>
        </div>

        {message && <div className="staff-message staff-success">{message}</div>}
        {error && <div className="staff-message staff-error">{error}</div>}

        <div className="staff-grid">
          <section className="staff-card">
            <h2>Meal management</h2>
            <form className="staff-form" onSubmit={handleMealSubmit}>
              <input
                type="text"
                placeholder="Meal name"
                value={mealForm.name}
                onChange={(e) => setMealForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <textarea
                placeholder="Description"
                value={mealForm.description}
                onChange={(e) => setMealForm((current) => ({ ...current, description: e.target.value }))}
                rows="3"
              ></textarea>
              <input
                type="number"
                placeholder="Calories kcal"
                value={mealForm.calories}
                onChange={(e) => setMealForm((current) => ({ ...current, calories: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="Protein g"
                value={mealForm.protein}
                onChange={(e) => setMealForm((current) => ({ ...current, protein: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="Sustainability 1-10"
                value={mealForm.sustainabilityScore}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, sustainabilityScore: e.target.value }))
                }
                required
              />
              <label className="staff-file-field">
                <span>Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMealImageChange(e.target.files?.[0])}
                />
              </label>
              {mealForm.imageUrl && (
                <div className="staff-image-preview">
                  <img src={mealForm.imageUrl} alt="Meal preview" />
                  <button
                    type="button"
                    className="staff-clear-image"
                    onClick={() => setMealForm((current) => ({ ...current, imageUrl: '' }))}
                  >
                    Clear image
                  </button>
                </div>
              )}
              <input
                type="text"
                placeholder="Tags, comma separated"
                value={mealForm.tagsInput}
                onChange={(e) => setMealForm((current) => ({ ...current, tagsInput: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Ingredients, format: 1:150, 2:80"
                value={mealForm.ingredientsInput}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, ingredientsInput: e.target.value }))
                }
              />
              <button type="submit">{mealForm.mealId ? 'Update meal' : 'Create meal'}</button>
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
                      <p className="staff-image-hint">Image configured</p>
                    )}
                  </div>
                  <div className="staff-item-actions">
                    <button type="button" onClick={() => handleEditMeal(meal)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteMeal(meal.mealId)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="staff-card">
            <h2>Ingredients & stock</h2>
            <form className="staff-form" onSubmit={handleIngredientSubmit}>
              <input
                type="number"
                placeholder="Ingredient ID, leave empty to create"
                value={ingredientForm.ingredientId}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, ingredientId: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="Stock in grams"
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
                placeholder="Allergens, comma separated"
                value={ingredientForm.allergensInput}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, allergensInput: e.target.value }))
                }
              />
              <button type="submit">{ingredientForm.ingredientId ? 'Update ingredient' : 'Create ingredient'}</button>
            </form>
            <div className="staff-list">
              {ingredientList.map((ingredient) => (
                <div key={ingredient.ingredientId} className="staff-list-item">
                  <div>
                    <strong>
                      #{ingredient.ingredientId} {ingredient.name}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setIngredientForm({
                        ingredientId: ingredient.ingredientId,
                        name: ingredient.name || '',
                        currentQty_g: ingredient.currentQty_g || '',
                        expiryDate: ingredient.expiryDate || '',
                        allergensInput: ingredient.allergensInput || '',
                      })
                    }
                  >
                    Fill form
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
