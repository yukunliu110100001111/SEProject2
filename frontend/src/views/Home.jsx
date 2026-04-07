import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMealDetail, getMeals, getRecommendations } from '../api/app';
import CartDrawer from '../components/CartDrawer';
import MealCard from '../components/MealCard';
import Navbar from '../components/Navbar';
import { getMealImageMap } from '../utils/storage';
import './Home.css';

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
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
          return true;
        }
        return (
          meal.name?.toLowerCase().includes(keyword) ||
          meal.description?.toLowerCase().includes(keyword) ||
          meal.tags?.some((tag) => tag.toLowerCase().includes(keyword))
        );
      })
      .sort((a, b) => {
        const left = Number(recommendationMap.get(a.mealId)?.score || 0);
        const right = Number(recommendationMap.get(b.mealId)?.score || 0);
        return right - left;
      });
  }, [meals, recommendationMap, search]);

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

      <section className="hero-section">
        <div className="welcome-bar">
          <div className="user-welcome">
            Hi, <span>{auth.username}</span>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="搜索菜品、标签或描述"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="hero-title-area">
          <h1 className="hero-main-title">
            推荐分会随着<span>偏好和库存</span>实时变化
          </h1>
          <p className="hero-sub-title">
            当前页面同时展示推荐理由、营养信息和环保分，满足 MVP 对推荐浏览与下单的要求。
          </p>
        </div>
      </section>

      <section className="list-section">
        <div className="list-header">
          <h2 className="list-title">
            推荐列表 <span>/ from GET /recommendations</span>
          </h2>
        </div>

        {loading && <div className="page-card">正在加载推荐...</div>}
        {error && <div className="page-card error-card">{error}</div>}

        {!loading && !error && (
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
    </div>
  );
};

export default Home;
