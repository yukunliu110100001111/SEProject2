import React from 'react';
import './MealCard.css';

const MealCard = ({ meal, onAdd, onClick }) => {
  // 兜底图片
  const fallbackImage = "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500";

  return (
    <div className="meal-card" onClick={onClick}>
      <div className="meal-image-wrapper">
        <img src={fallbackImage} alt={meal.name} className="meal-image" />
        {/* 严格匹配 4.1 响应字段: sustainabilityScore [cite: 61] */}
        <div className="carbon-tag">🌍 环保评分: {meal.sustainabilityScore}/10</div>
      </div>

      <div className="meal-info">
        <div className="meal-name">{meal.name}</div>

        {/* 【安全性修正】：判断是否存在描述，防止 4.1 接口数据导致空白  */}
        {meal.description && <div className="meal-desc">{meal.description}</div>}

        {/* 【安全性修正】：判断 tags 是否存在  */}
        {meal.tags && meal.tags.length > 0 && (
          <div className="meal-tags">
            {meal.tags.map(tag => (
              <span key={tag} className="tag-badge">#{tag}</span>
            ))}
          </div>
        )}

        <div className="meal-bottom">
          {/* 严格匹配 4.1 响应字段: calories, protein [cite: 59-60] */}
          <div className="meal-nutrition">
            <span>🔥 {meal.calories} kcal</span>
            <span>💪 {meal.protein}g 蛋白</span>
          </div>

          {/* 阻止冒泡，防止点击按钮时触发卡片的 onClick 详情跳转 */}
          <button className="add-btn" onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}>+</button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;