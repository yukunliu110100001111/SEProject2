import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = ({ onLogout }) => {
  // 从 Auth 模块写入的存储中获取身份信息
  const userId = localStorage.getItem('greenbite_userId');
  const username = localStorage.getItem('greenbite_username') || '健康食客';

  // 1. 用户健康偏好状态 (精准对接 API 3.2 字段)
  const [preferences, setPreferences] = useState({
    targetCalories: 2000,
    targetProtein: 80,
    isVegetarian: false // 对接 API 3.2 的布尔值
  });

  // 2. 模拟从 API/订单历史计算的成就数据
  const [achievements, setAchievements] = useState({
    totalCalories: 0,
    totalProtein: 0,
    orderCount: 0
  });

  useEffect(() => {
    // 逻辑：读取订单数据来累积成就 [对应 API 6.2 历史查询]
    const savedOrders = JSON.parse(localStorage.getItem('greenbite_mock_orders')) || [];
    let cal = 0, pro = 0;
    savedOrders.forEach(o => {
      cal += Number(o.totalCalories) || 0;
      pro += Number(o.totalProtein) || 0;
    });

    setAchievements({
      totalCalories: cal,
      totalProtein: pro,
      orderCount: savedOrders.length
    });

    // 读取已保存的偏好设置，若无则使用默认值
    const savedPrefs = JSON.parse(localStorage.getItem(`prefs_${userId}`));
    if (savedPrefs) setPreferences(savedPrefs);
  }, [userId]);

  // 3. 处理偏好设置更新 (模拟 PUT /users/{id}/preferences)
  const handleUpdatePreferences = (e) => {
    e.preventDefault();
    // 模拟 API 调用逻辑
    localStorage.setItem(`prefs_${userId}`, JSON.stringify(preferences));

    // 触发一个成功的交互反馈
    const btn = e.target.querySelector('.save-btn');
    btn.innerText = '已同步至云端...';
    btn.style.background = '#1b4332';

    setTimeout(() => {
      btn.innerText = '保存并同步偏好';
      btn.style.background = '#4caf50';
      alert(`✅ 嘿 ${username}，您的健康目标已更新！\n我们将根据 ${preferences.targetCalories}kcal 的目标为您推荐菜品。`);
    }, 1000);
  };

  return (
    <div className="profile-container">
      <Navbar cartCount={0} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="profile-header">
        <div className="profile-avatar">🥗</div>
        <h1>{username} 的健康档案</h1>
        <p className="profile-uid">账户 ID: GB-{userId?.padStart(4, '0')}</p>
      </div>

      <div className="profile-content">
        {/* 左侧：数据成就看板 */}
        <div className="profile-section stats-section">
          <h2>📊 累计营养足迹</h2>
          <div className="stats-mini-grid">
            <div className="mini-card">
              <div className="mini-info">
                <span>总能量摄入</span>
                <strong>{achievements.totalCalories} <span>kcal</span></strong>
              </div>
              <div className="mini-icon">🔥</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>总蛋白质摄入</span>
                <strong>{achievements.totalProtein} <span>g</span></strong>
              </div>
              <div className="mini-icon">💪</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>已完成订单</span>
                <strong>{achievements.orderCount} <span>单</span></strong>
              </div>
              <div className="mini-icon">📦</div>
            </div>
          </div>
          <p className="stats-footer">数据基于您的订单历史自动汇总</p>
        </div>

        {/* 右侧：健康目标设置 [对应 API 3.2] */}
        <div className="profile-section settings-section">
          <h2>🎯 目标与偏好设定</h2>
          <form onSubmit={handleUpdatePreferences} className="pref-form">
            <div className="form-item">
              <label>每日热量目标 (Calories)</label>
              <input
                type="number"
                placeholder="例如: 2000"
                value={preferences.targetCalories}
                onChange={e => setPreferences({...preferences, targetCalories: e.target.value})}
                required
              />
            </div>
            <div className="form-item">
              <label>每日蛋白质目标 (Protein g)</label>
              <input
                type="number"
                placeholder="例如: 80"
                value={preferences.targetProtein}
                onChange={e => setPreferences({...preferences, targetProtein: e.target.value})}
                required
              />
            </div>
            <div className="form-item">
              <label>特殊饮食习惯</label>
              <select
                value={preferences.isVegetarian}
                onChange={e => setPreferences({...preferences, isVegetarian: e.target.value === 'true'})}
              >
                <option value="false">均衡饮食 (含肉类)</option>
                <option value="true">素食优先 (Vegetarian)</option>
              </select>
            </div>
            <div className="form-notice">
              ⚠️ 更新偏好将直接影响 <strong>5.1 推荐模块</strong> 的排序分值。
            </div>
            <button type="submit" className="save-btn">保存并同步偏好</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;