import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Dashboard.css';

// 【修改点 1】：接收 onLogout，确保管理员也能安全退出
const Dashboard = ({ onLogout }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 模拟 API: GET /dashboard [cite: 138]
    const mockDashboardData = {
      // 对应 API 8.1 topMeals
      topMeals: [
        { name: "Chicken Salad", orders: 120, trend: "+12%" },
        { name: "Vegan Tofu Bowl", orders: 98, trend: "+5%" },
        { name: "Mushroom Pasta", orders: 45, trend: "-2%" }
      ],
      // 对应 API 8.1 stockUsage
      stockUsage: [
        { ingredient: "Chicken", remaining: 15, unit: "kg", status: "low" },
        { ingredient: "Tofu", remaining: 45, unit: "kg", status: "normal" },
        { ingredient: "Organic Greens", remaining: 8, unit: "kg", status: "critical" }
      ],
      // 对应 API 8.1 lowCarbonRate
      lowCarbonRate: 85
    };

    // 模拟网络延迟
    const timer = setTimeout(() => {
      setData(mockDashboardData);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!data) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>正在同步实时运营数据...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* 【核心修改】：传入 onLogout */}
      <Navbar cartCount={0} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="dashboard-header">
        <h1>📊 运营数据中心</h1>
        <p>实时监控绿色足迹与库存效能</p>
      </div>

      <div className="dashboard-grid">
        {/* 1. 低碳率仪表盘  */}
        <div className="admin-card stats-card">
          <h2>全店低碳率 (Low Carbon Rate)</h2>
          <div className="gauge-container">
            <div className="gauge-value">{data.lowCarbonRate}%</div>
            <div className="gauge-bar">
              <div className="gauge-fill" style={{ width: `${data.lowCarbonRate}%` }}></div>
            </div>
            <p className="gauge-desc">基于最近 30 天订单计算</p>
          </div>
        </div>

        {/* 2. 热销排行  */}
        <div className="admin-card">
          <h2>热销榜 (Top Meals)</h2>
          <div className="rank-list">
            {data.topMeals.map((meal, index) => (
              <div key={index} className="rank-item">
                <span className="rank-number">0{index + 1}</span>
                <div className="rank-info">
                  <div className="rank-name">{meal.name}</div>
                  <div className="rank-count">{meal.orders} 份订单</div>
                </div>
                <span className={`rank-trend ${meal.trend.includes('+') ? 'up' : 'down'}`}>
                  {meal.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 库存监控  */}
        <div className="admin-card">
          <h2>库存监控 (Stock Usage)</h2>
          <div className="stock-list">
            {data.stockUsage.map((item, index) => (
              <div key={index} className="stock-item">
                <div className="stock-meta">
                  <span className="stock-name">{item.ingredient}</span>
                  {/* 针对 low 或 critical 状态增加预警标识 [cite: 148-149] */}
                  <span className={`stock-qty ${item.status}`}>
                    {item.remaining} {item.unit}
                    {item.status !== 'normal' && ' ⚠️'}
                  </span>
                </div>
                <div className="stock-progress-bg">
                  <div
                    className={`stock-progress-fill ${item.status}`}
                    style={{ width: `${Math.min((item.remaining / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;