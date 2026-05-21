import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMealDetail, getMeals, getRecommendations } from '../api/app';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import { pickPageLoadingSrc } from '../utils/loadingAnimations';
import './MealDetail.css';

const fallbackImage =
  'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1000';

const MealDetail = ({ auth, cartCount, onOpenCart, onLogout, onAddToCart }) => {
  const { t } = useI18n();
  const { mealId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [mealData, mealList, recommendationList] = await Promise.all([
          getMealDetail(mealId, {
            recommendationRequestId: location.state?.recommendationRequestId,
            recommendationRankPosition: location.state?.recommendationRankPosition,
          }),
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
          imageUrl: mealData.imageUrl || mealSummary.imageUrl,
          sustainabilityScore:
            mealData.sustainabilityScore ?? mealSummary.sustainabilityScore,
        });
        setRecommendation(recommendationList.find((item) => String(item.mealId) === String(mealId)) || null);
      } catch (err) {
        if (active) {
          setError(err.message || t('failedLoadDetails'));
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [auth.userId, location.state, mealId, t]);

  return (
    <div className="detail-page">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="detail-shell">
        <button
          type="button"
          className="back-link"
          onClick={() =>
            navigate('/loading', {
              state: {
                nextPath: '/home',
                loadingSrc: pickPageLoadingSrc(),
              },
            })
          }
        >
          {t('back')}
        </button>

        {error && <div className="detail-error">{error}</div>}

        {meal && (
          <div className="detail-card">
            <img src={meal.imageUrl || fallbackImage} alt={meal.name} className="detail-image" />
            <div className="detail-content">
              <h1>{meal.name}</h1>
              <p className="detail-description">{meal.description || t('noDescription')}</p>
              <div className="detail-stats">
                <span>🔥 {meal.calories} kcal</span>
                <span>💪 {meal.protein}g</span>
                <span>🌍 {t('sustainability')} {meal.sustainabilityScore ?? '-'}/10</span>
                {recommendation && <span>⭐ {t('score')} {recommendation.score}</span>}
              </div>
              {recommendation && <p className="detail-reason">{recommendation.reason}</p>}

              <div className="detail-block">
                <h2>{t('ingredients')}</h2>
                <ul>
                  {meal.ingredients?.map((ingredient) => (
                    <li key={ingredient.ingredientId}>
                      {ingredient.name} · {ingredient.weight_g}g
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-block">
                <h2>{t('tags')}</h2>
                <div className="detail-tags">
                  {meal.tags?.map((tag) => (
                    <span key={tag} className="detail-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="detail-add-btn"
                onClick={() =>
                  onAddToCart({
                    ...meal,
                    recommendationRequestId: recommendation?.recommendationRequestId || null,
                  })
                }
              >
                {t('addToCart')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealDetail;
