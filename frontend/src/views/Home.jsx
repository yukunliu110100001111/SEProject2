import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MealCard from '../components/MealCard';
import CartDrawer from '../components/CartDrawer';
import { mockMeals } from '../utils/mockData';
import './Home.css';

const Home = ({ onLogout }) => {
  const username = localStorage.getItem('greenbite_username') || '健康食客';

  // 状态管理
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [displayMeals, setDisplayMeals] = useState([]);

  // 加载初始菜品数据 [对接 API 4.1]
  useEffect(() => {
    // 优先读取模拟数据库，若无则使用 mockData
    const savedMeals = JSON.parse(localStorage.getItem('greenbite_meals')) || mockMeals;
    setDisplayMeals(savedMeals);
  }, []);

  // 购物车核心逻辑：更新数量或添加新菜品
  const handleUpdateQuantity = (mealId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.mealId === mealId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean); // 过滤掉数量为 0 的项
    });
  };

  const addToCart = (meal) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.mealId === meal.mealId);
      if (existingItem) {
        return prevCart.map(item =>
          item.mealId === meal.mealId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...meal, quantity: 1 }];
    });
    // 增加一个微小的震动反馈或提示（可选）
    console.log(`已将 ${meal.name} 加入餐盒`);
  };

  // 计算购物车总数显示在 Navbar 徽标上
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="home-container">
      {/* 动态光晕背景动画 */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <Navbar
        cartCount={totalItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onLogout={onLogout}
      />

      <section className="hero-section">
        <div className="welcome-bar">
          <div className="user-welcome">Hi, <span>{username}</span> 👋</div>
          <div className="search-wrapper">
            <input type="text" placeholder="搜索低碳美味..." />
          </div>
        </div>
        <div className="hero-title-area">
          <h1 className="hero-main-title">让美味，对<span>地球</span>更好一点</h1>
          <p className="hero-sub-title">每一口选择，都是在为你想生活的世界投票。基于 AI 的智能营养匹配，开启你的绿洲生活。</p>
        </div>
      </section>

      <section className="list-section">
        <div className="list-header">
          <h2 className="list-title">今日低碳推荐 <span>/ Optimized for you</span></h2>
        </div>

        <div className="meal-grid">
          {displayMeals.map(meal => (
            <MealCard
              key={meal.mealId}
              meal={meal}
              onAdd={() => addToCart(meal)}
            />
          ))}
        </div>
      </section>

      {/* 购物车抽屉：严格对接 POST /orders 的数据流 [cite: 99-109] */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
      />
    </div>
  );
};

export default Home;