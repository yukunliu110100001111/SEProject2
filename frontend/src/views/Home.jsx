import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMealDetail, getMeals, getRecommendations } from '../api/app';
import AiAssistantBubble from '../components/AiAssistantBubble';
import CartDrawer from '../components/CartDrawer';
import MealCard from '../components/MealCard';
import Navbar from '../components/Navbar';
import { getMealImageMap } from '../utils/storage';
import './Home.css';

const categories = [
  '全部',
  '低碳优先',
  '高蛋白',
  '植物基',
  '轻食',
  '库存优先',
];

const hasTag = (meal, expectedTags) =>
  expectedTags.some((expectedTag) =>
    meal.tags?.some((tag) => tag?.toLowerCase() === expectedTag)
  );

const matchesCategory = (meal, category, recommendation) => {
  if (category === '全部') {
    return true;
  }

  if (category === '低碳优先') {
    return hasTag(meal, ['low-carbon']) || Number(meal.sustainabilityScore || 0) >= 8;
  }

  if (category === '高蛋白') {
    return hasTag(meal, ['high-protein']) || Number(meal.protein || 0) >= 25;
  }

  if (category === '植物基') {
    return hasTag(meal, ['plant-based', 'vegetarian', 'vegan']);
  }

  if (category === '轻食') {
    return Number(meal.calories || 0) > 0 && Number(meal.calories || 0) <= 450;
  }

  if (category === '库存优先') {
    return /stock|expiry/i.test(recommendation?.reason || '');
  }

  return true;
};

const matchesCategories = (meal, activeCategories, recommendation) => {
  if (
    activeCategories.length === 0 ||
    activeCategories.includes('全部')
  ) {
    return true;
  }

  return activeCategories.every((category) =>
    matchesCategory(meal, category, recommendation)
  );
};

const Home = ({
  auth,
  cart,
  cartCount,
  onLogout,
  onAddToCart,
  onUpdateCartQuantity,
  onClearCart,
}) => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState(['全部']);
  const [meals, setMeals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [mealList, recommendationList] = await Promise.all([
          getMeals(),
          getRecommendations(auth.userId),
        ]);

        const detailList = await Promise.all(
          mealList.map(async (meal) => {
            try {
              const detail = await getMealDetail(meal.mealId);
              return {
                ...meal,
                ...detail,
                sustainabilityScore:
                  detail.sustainabilityScore ?? meal.sustainabilityScore,
              };
            } catch {
              return meal;
            }
          })
        );

        if (!active) {
          return;
        }

        const imageMap = getMealImageMap();
        setMeals(
          detailList.map((meal) => ({
            ...meal,
            imageUrl: imageMap[String(meal.mealId)] || meal.imageUrl,
          }))
        );
        setRecommendations(recommendationList);
      } catch (err) {
        if (active) {
          setError(err.message || '推荐加载失败');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [auth.userId]);

  const recommendationMap = useMemo(() => {
    const map = new Map();
    recommendations.forEach((item) => {
      map.set(item.mealId, item);
    });
    return map;
  }, [recommendations]);

  const filteredMeals = useMemo(() => {
    return meals
      .filter((meal) => {
        const recommendation = recommendationMap.get(meal.mealId);
        const keyword = search.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          meal.name?.toLowerCase().includes(keyword) ||
          meal.description?.toLowerCase().includes(keyword) ||
          meal.tags?.some((tag) => tag.toLowerCase().includes(keyword));

        if (!matchesKeyword) {
          return false;
        }

        return matchesCategories(meal, activeCategories, recommendation);
      })
      .sort((a, b) => {
        const left = Number(recommendationMap.get(a.mealId)?.score || 0);
        const right = Number(recommendationMap.get(b.mealId)?.score || 0);
        return right - left;
      });
  }, [activeCategories, meals, recommendationMap, search]);

  const handleCategoryToggle = (category) => {
    setActiveCategories((current) => {
      if (category === '全部') {
        return ['全部'];
      }

      const next = current.filter((item) => item !== '全部');
      if (next.includes(category)) {
        const reduced = next.filter((item) => item !== category);
        return reduced.length > 0 ? reduced : ['全部'];
      }

      return [...next, category];
    });
  };

  return (
    <div className="home-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <Navbar
        auth={auth}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onLogout={onLogout}
      />

      <section className="banner-intro">
        <div className="hero-width-shell">
          <div className="hero-stack-shell">
            <div className="banner-panel">
              <div className="banner-glow banner-glow-left"></div>
              <div className="banner-glow banner-glow-right"></div>
            <div className="banner-category-row" aria-label="菜品分类">
              {categories.map((category, index) => (
                <button
                  key={category}
                  type="button"
                  className={`category-pill ${activeCategories.includes(category) ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="banner-search-wrapper">
              <input
                type="text"
                placeholder="搜索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="banner-copy">
              <span className="banner-kicker">GreenBite</span>
              <h1>今日推荐</h1>
                <div className="banner-actions">
                  <button type="button" className="banner-btn primary" onClick={() => window.scrollTo({ top: 720, behavior: 'smooth' })}>
                    浏览
                  </button>
                  <button type="button" className="banner-btn secondary" onClick={() => setIsCartOpen(true)}>
                    餐车
                  </button>
                </div>
              </div>
            </div>
            {!loading && !error && filteredMeals.length > 0 && (
              <section className="top-showcase-section" aria-label="菜品展示带">
                <div className="showcase-track-shell">
                  <div className="showcase-marquee">
                    {[0, 1].map((groupIndex) => (
                      <div className="showcase-track" key={groupIndex}>
                        {filteredMeals.map((meal) => (
                          <button
                            key={`${groupIndex}-${meal.mealId}`}
                            type="button"
                            className="showcase-card"
                            onClick={() => navigate(`/meals/${meal.mealId}`)}
                          >
                            <img
                              src={meal.imageUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500'}
                              alt={meal.name}
                              className="showcase-image"
                            />
                            <div className="showcase-overlay">
                              <strong>{meal.name}</strong>
                              <span>环保分 {meal.sustainabilityScore ?? '-'}/10</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      <section className="hero-section">
        <div className="welcome-bar">
          <div className="user-welcome">
            Hi, <span>{auth.username}</span>
          </div>
        </div>
        <div className="hero-title-area">
          <h1 className="hero-main-title">
            为你推荐
          </h1>
        </div>
      </section>

      <section className="list-section">
        <div className="list-header">
          <h2 className="list-title">推荐</h2>
        </div>

        {loading && <div className="page-card">正在加载推荐...</div>}
        {error && <div className="page-card error-card">{error}</div>}

        {!loading && !error && (
          filteredMeals.length > 0 ? (
            <div className="meal-grid">
              {filteredMeals.map((meal) => (
                <MealCard
                  key={meal.mealId}
                  meal={meal}
                  recommendation={recommendationMap.get(meal.mealId)}
                  onAdd={() => onAddToCart(meal)}
                  onClick={() => navigate(`/meals/${meal.mealId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="page-card">没有符合当前筛选条件的菜品</div>
          )
        )}
      </section>

      <CartDrawer
        auth={auth}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={onUpdateCartQuantity}
        onClearCart={onClearCart}
      />
      <AiAssistantBubble auth={auth} />
    </div>
  );
};

export default Home;
