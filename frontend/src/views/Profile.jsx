import React, { useEffect, useMemo, useState } from 'react';
import { getUser, updatePreferences, updateUser } from '../api/app';
import Navbar from '../components/Navbar';
import { getOrderCache } from '../utils/storage';
import './Profile.css';

const parseAllergens = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const Profile = ({ auth, cartCount, onLogout, onAuthRefresh }) => {
  const [profile, setProfile] = useState({
    username: auth.username || '',
    targetCalories: 2000,
    targetProtein: 80,
    isVegetarian: false,
    allergensInput: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const achievements = useMemo(() => {
    const orders = getOrderCache();
    return orders.reduce(
      (sum, order) => ({
        orderCount: sum.orderCount + 1,
        totalCalories: sum.totalCalories + Number(order.totalCalories || 0),
        totalProtein: sum.totalProtein + Number(order.totalProtein || 0),
      }),
      {
        orderCount: 0,
        totalCalories: 0,
        totalProtein: 0,
      }
    );
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const data = await getUser(auth.userId);
        if (!active) {
          return;
        }
        setProfile({
          username: data.username || '',
          targetCalories: data.preferences?.targetCalories ?? 2000,
          targetProtein: data.preferences?.targetProtein ?? 80,
          isVegetarian: Boolean(data.preferences?.isVegetarian),
          allergensInput: (data.preferences?.allergens || []).join(', '),
        });
      } catch (err) {
        if (active) {
          setError(err.message || '资料加载失败');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [auth.userId]);

  const handleChange = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateUser(auth.userId, { username: profile.username });
      await updatePreferences(auth.userId, {
        targetCalories: Number(profile.targetCalories),
        targetProtein: Number(profile.targetProtein),
        isVegetarian: profile.isVegetarian,
        allergens: parseAllergens(profile.allergensInput),
      });
      localStorage.setItem('greenbite_username', profile.username);
      onAuthRefresh?.();
      setMessage('个人信息与饮食偏好已更新。');
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="profile-header">
        <div className="profile-avatar">🥗</div>
        <h1>{profile.username || auth.username}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-section stats-section">
          <h2>概览</h2>
          <div className="stats-mini-grid">
            <div className="mini-card">
              <div className="mini-info">
                <span>总能量摄入</span>
                <strong>
                  {achievements.totalCalories} <span>kcal</span>
                </strong>
              </div>
              <div className="mini-icon">🔥</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>总蛋白质摄入</span>
                <strong>
                  {achievements.totalProtein} <span>g</span>
                </strong>
              </div>
              <div className="mini-icon">💪</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>已提交订单</span>
                <strong>
                  {achievements.orderCount} <span>单</span>
                </strong>
              </div>
              <div className="mini-icon">📦</div>
            </div>
          </div>
        </div>

        <div className="profile-section settings-section">
          <h2>偏好</h2>
          {loading ? (
            <div className="message-box">正在加载资料...</div>
          ) : (
            <form onSubmit={handleSubmit} className="pref-form">
              <div className="form-item">
                <label>用户名</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>每日热量目标</label>
                <input
                  type="number"
                  value={profile.targetCalories}
                  onChange={(e) => handleChange('targetCalories', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>每日蛋白质目标</label>
                <input
                  type="number"
                  value={profile.targetProtein}
                  onChange={(e) => handleChange('targetProtein', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>特殊饮食习惯</label>
                <select
                  value={String(profile.isVegetarian)}
                  onChange={(e) => handleChange('isVegetarian', e.target.value === 'true')}
                >
                  <option value="false">均衡饮食</option>
                  <option value="true">素食优先</option>
                </select>
              </div>
              <div className="form-item">
                <label>过敏原限制</label>
                <input
                  type="text"
                  placeholder="nut, fish, soy"
                  value={profile.allergensInput}
                  onChange={(e) => handleChange('allergensInput', e.target.value)}
                />
              </div>
              {message && <div className="message-box success-box">{message}</div>}
              {error && <div className="message-box error-box">{error}</div>}
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? '保存中...' : '保存偏好'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
