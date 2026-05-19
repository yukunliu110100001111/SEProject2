import React, { useEffect, useMemo, useState } from 'react';
import { getOrders, getUser, updatePreferences, updateUser } from '../api/app';
import Navbar from '../components/Navbar';
import './Profile.css';

const parseAllergens = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const Profile = ({ auth, cartCount, onOpenCart, onLogout, onAuthRefresh }) => {
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
  const [orders, setOrders] = useState([]);

  const achievements = useMemo(() => {
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
  }, [orders]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const [data, orderData] = await Promise.all([
          getUser(auth.userId),
          getOrders({ userId: auth.userId, page: 1, size: 100 }),
        ]);
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
        setOrders(orderData.items || []);
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load profile.');
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
      setMessage('Profile and dietary preferences updated.');
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="profile-header">
        <div className="profile-avatar">🥗</div>
        <h1>{profile.username || auth.username}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-section stats-section">
          <h2>Overview</h2>
          <div className="stats-mini-grid">
            <div className="mini-card">
              <div className="mini-info">
                <span>Total calories</span>
                <strong>
                  {achievements.totalCalories} <span>kcal</span>
                </strong>
              </div>
              <div className="mini-icon">🔥</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>Total protein</span>
                <strong>
                  {achievements.totalProtein} <span>g</span>
                </strong>
              </div>
              <div className="mini-icon">💪</div>
            </div>
            <div className="mini-card">
              <div className="mini-info">
                <span>Orders placed</span>
                <strong>
                  {achievements.orderCount} <span>orders</span>
                </strong>
              </div>
              <div className="mini-icon">📦</div>
            </div>
          </div>
        </div>

        <div className="profile-section settings-section">
          <h2>Preferences</h2>
          {loading ? (
            <div className="message-box">Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit} className="pref-form">
              <div className="form-item">
                <label>Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>Daily calorie target</label>
                <input
                  type="number"
                  value={profile.targetCalories}
                  onChange={(e) => handleChange('targetCalories', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>Daily protein target</label>
                <input
                  type="number"
                  value={profile.targetProtein}
                  onChange={(e) => handleChange('targetProtein', e.target.value)}
                  required
                />
              </div>
              <div className="form-item">
                <label>Diet preference</label>
                <select
                  value={String(profile.isVegetarian)}
                  onChange={(e) => handleChange('isVegetarian', e.target.value === 'true')}
                >
                  <option value="false">Balanced</option>
                  <option value="true">Vegetarian first</option>
                </select>
              </div>
              <div className="form-item">
                <label>Allergen restrictions</label>
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
                {saving ? 'Saving...' : 'Save preferences'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
