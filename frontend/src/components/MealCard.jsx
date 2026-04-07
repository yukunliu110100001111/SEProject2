import React from 'react';
import './MealCard.css';

const fallbackImage =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500';

const MealCard = ({ meal, onAdd, onClick, recommendation }) => (
  <article className="meal-card">
    <button className="meal-card-hitbox" type="button" onClick={onClick}>
      <div className="meal-image-wrapper">
        <img src={fallbackImage} alt={meal.name} className="meal-image" />
        <div className="carbon-tag">环保分 {meal.sustainabilityScore ?? '-'}/10</div>
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
            <strong>推荐分 {recommendation.score}</strong>
            <span>{recommendation.reason}</span>
          </div>
        )}

        <div className="meal-bottom">
          <div className="meal-nutrition">
            <span>🔥 {meal.calories} kcal</span>
            <span>💪 {meal.protein}g 蛋白</span>
          </div>
        </div>
      </div>
    </button>

    <button
      className="add-btn"
      type="button"
      onClick={onAdd}
      aria-label={`加入 ${meal.name}`}
    >
      加入餐车
    </button>
  </article>
);

export default MealCard;
