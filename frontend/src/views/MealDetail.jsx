import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMealDetail, getMeals, getRecommendations } from '../api/app';
import Navbar from '../components/Navbar';
import './MealDetail.css';

const fallbackImage =
  'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1000';

const MealDetail = ({ auth, cartCount, onLogout, onAddToCart }) => {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [mealData, mealList, recommendationList] = await Promise.all([
          getMealDetail(mealId),
          getMeals(),
          getRecommendations(auth.userId),
        ]);
        if (!active) {
          return;
        }
        const mealSummary =
          mealList.find((item) => String(item.mealId) === String(mealId)) || {};
        setMeal({
          ...mealSummary,
          ...mealData,
          sustainabilityScore:
            mealData.sustainabilityScore ?? mealSummary.sustainabilityScore,
        });
        setRecommendation(recommendationList.find((item) => String(item.mealId) === String(mealId)) || null);
      } catch (err) {
        if (active) {
          setError(err.message || '详情加载失败');
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [auth.userId, mealId]);

  return (
    <div className="detail-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="detail-shell">
        <button type="button" className="back-link" onClick={() => navigate('/home')}>
          返回推荐页
        </button>

        {error && <div className="detail-error">{error}</div>}

        {meal && (
          <div className="detail-card">
            <img src={fallbackImage} alt={meal.name} className="detail-image" />
            <div className="detail-content">
              <h1>{meal.name}</h1>
              <p className="detail-description">{meal.description || '暂无描述'}</p>
              <div className="detail-stats">
                <span>🔥 {meal.calories} kcal</span>
                <span>💪 {meal.protein}g</span>
                <span>🌍 环保分 {meal.sustainabilityScore ?? '-'}/10</span>
                {recommendation && <span>⭐ 推荐分 {recommendation.score}</span>}
              </div>
              {recommendation && <p className="detail-reason">推荐理由：{recommendation.reason}</p>}

              <div className="detail-block">
                <h2>食材列表</h2>
                <ul>
                  {meal.ingredients?.map((ingredient) => (
                    <li key={ingredient.ingredientId}>
                      {ingredient.name} · {ingredient.weight_g}g
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h2>可持续标签</h2>
                <div className="detail-tags">
                  {meal.tags?.map((tag) => (
                    <span key={tag} className="detail-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button type="button" className="detail-add-btn" onClick={() => onAddToCart(meal)}>
                加入购物车
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealDetail;
