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

const Staff = ({ auth, cartCount, onLogout }) => {
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
    refreshData().catch((err) => setError(err.message || '员工数据加载失败'));
  }, []);

  const handleMealImageChange = (file) => {
    if (!file) {
      setMealForm((current) => ({ ...current, imageUrl: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
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
        setMessage(`菜品 #${mealForm.mealId} 已更新`);
      } else {
        const created = await createMeal(payload);
        saveMealImage(created.mealId, mealForm.imageUrl.trim());
        setMessage('新菜品已创建');
      }
      setMealForm(emptyMealForm);
      await refreshData();
    } catch (err) {
      setError(err.message || '菜品保存失败');
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
      setMessage(`菜品 #${mealId} 已删除`);
      await refreshData();
    } catch (err) {
      setError(err.message || '删除失败');
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
        setMessage(`食材 #${ingredientForm.ingredientId} 已更新`);
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
        setMessage(`新食材 #${created.ingredientId} 已创建`);
      }

      setIngredientForm(emptyIngredientForm);
      await refreshData();
    } catch (err) {
      setError(err.message || '食材保存失败');
    }
  };

  return (
    <div className="staff-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="staff-shell">
        <div className="staff-header">
          <h1>员工管理台</h1>
        </div>

        {message && <div className="staff-message staff-success">{message}</div>}
        {error && <div className="staff-message staff-error">{error}</div>}

        <div className="staff-grid">
          <section className="staff-card">
            <h2>菜品管理</h2>
            <form className="staff-form" onSubmit={handleMealSubmit}>
              <input
                type="text"
                placeholder="菜品名称"
                value={mealForm.name}
                onChange={(e) => setMealForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <textarea
                placeholder="菜品描述"
                value={mealForm.description}
                onChange={(e) => setMealForm((current) => ({ ...current, description: e.target.value }))}
                rows="3"
              ></textarea>
              <input
                type="number"
                placeholder="热量 kcal"
                value={mealForm.calories}
                onChange={(e) => setMealForm((current) => ({ ...current, calories: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="蛋白质 g"
                value={mealForm.protein}
                onChange={(e) => setMealForm((current) => ({ ...current, protein: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="环保评分 1-10"
                value={mealForm.sustainabilityScore}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, sustainabilityScore: e.target.value }))
                }
                required
              />
              <label className="staff-file-field">
                <span>选择展示图片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMealImageChange(e.target.files?.[0])}
                />
              </label>
              {mealForm.imageUrl && (
                <div className="staff-image-preview">
                  <img src={mealForm.imageUrl} alt="菜品预览" />
                  <button
                    type="button"
                    className="staff-clear-image"
                    onClick={() => setMealForm((current) => ({ ...current, imageUrl: '' }))}
                  >
                    清除图片
                  </button>
                </div>
              )}
              <input
                type="text"
                placeholder="标签，逗号分隔"
                value={mealForm.tagsInput}
                onChange={(e) => setMealForm((current) => ({ ...current, tagsInput: e.target.value }))}
              />
              <input
                type="text"
                placeholder="食材关系，格式: 1:150, 2:80"
                value={mealForm.ingredientsInput}
                onChange={(e) =>
                  setMealForm((current) => ({ ...current, ingredientsInput: e.target.value }))
                }
              />
              <button type="submit">{mealForm.mealId ? '更新菜品' : '创建菜品'}</button>
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
                      <p className="staff-image-hint">已配置展示图片</p>
                    )}
                  </div>
                  <div className="staff-item-actions">
                    <button type="button" onClick={() => handleEditMeal(meal)}>
                      编辑
                    </button>
                    <button type="button" onClick={() => handleDeleteMeal(meal.mealId)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="staff-card">
            <h2>食材与库存</h2>
            <form className="staff-form" onSubmit={handleIngredientSubmit}>
              <input
                type="number"
                placeholder="食材 ID，留空表示新增"
                value={ingredientForm.ingredientId}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, ingredientId: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="食材名称"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm((current) => ({ ...current, name: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="库存克数"
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
                placeholder="过敏原，逗号分隔"
                value={ingredientForm.allergensInput}
                onChange={(e) =>
                  setIngredientForm((current) => ({ ...current, allergensInput: e.target.value }))
                }
              />
              <button type="submit">{ingredientForm.ingredientId ? '更新食材' : '新增食材'}</button>
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
                    填入表单
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
