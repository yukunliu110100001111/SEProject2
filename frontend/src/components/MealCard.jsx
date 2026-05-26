import React from 'react';
import { useI18n } from '../i18n';
import './MealCard.css';

const fallbackImage =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500';

const MealCard = ({ meal, onAdd, onClick, recommendation, disabledAdd = false }) => {
  const { t } = useI18n();
  const addDisabled = disabledAdd || !onAdd;

  return (
  <article className={`meal-card ${recommendation?.allergenConflict ? 'allergen-card' : ''}`}>
    <button className="meal-card-hitbox" type="button" onClick={onClick}>
      <div className="meal-image-wrapper">
        <img src={meal.imageUrl || fallbackImage} alt={meal.name} className="meal-image" />
        <div className="carbon-tag">{t('sustainability')} {meal.sustainabilityScore ?? '-'}/10</div>
      </div>

      <div className="meal-info">
        <div className="meal-name">{meal.name}</div>
        {meal.description && <div className="meal-desc">{meal.description}</div>}

        {meal.tags?.length > 0 && (
          <div className="meal-tags">
            {meal.tags.map((tag) => (
              <span key={tag} className="tag-badge">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {recommendation && (
          <div className="meal-reason">
            <strong>{recommendation.score}</strong>
            <span>{recommendation.reason}</span>
          </div>
        )}

        <div className="meal-bottom">
          <div className="meal-nutrition">
            <span>🔥 {meal.calories} kcal</span>
            <span>💪 {meal.protein}g</span>
          </div>
        </div>
      </div>
    </button>

    <button
      className="add-btn"
      type="button"
      onClick={onAdd}
      disabled={addDisabled}
      aria-label={t('addMeal', { name: meal.name })}
    >
      {addDisabled ? t('notRecommended') : t('addToCart')}
    </button>
  </article>
  );
};

export default MealCard;
