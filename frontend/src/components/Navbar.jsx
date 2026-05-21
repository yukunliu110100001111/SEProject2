import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n';
import { pickPageLoadingSrc } from '../utils/loadingAnimations';
import './Navbar.css';

const Navbar = ({ cartCount = 0, onOpenCart, onLogout, auth }) => {
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const role = auth?.role;
  const username = auth?.username || t('guest');

  const isActive = (path) => (location.pathname === path ? 'active-link' : '');
  const goToPage = (path) => {
    if (location.pathname === path) {
      return;
    }
    navigate('/loading', {
      state: {
        nextPath: path,
        loadingSrc: pickPageLoadingSrc(),
      },
    });
  };

  return (
    <nav className="top-navbar">
      <button className="nav-logo" type="button" onClick={() => goToPage('/home')}>
        Green<span>Bite</span>
      </button>

      <ul className="nav-links">
        <li>
          <button
            type="button"
            className={`nav-link-button ${isActive('/home')}`}
            onClick={() => goToPage('/home')}
          >
            {t('discover')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${isActive('/orders')}`}
            onClick={() => goToPage('/orders')}
          >
            {t('orders')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${isActive('/customize')}`}
            onClick={() => goToPage('/customize')}
          >
            {t('customize')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${isActive('/profile')}`}
            onClick={() => goToPage('/profile')}
          >
            {t('profile')}
          </button>
        </li>
        {(role === 'staff' || role === 'admin') && (
          <li>
            <button
              type="button"
              className={`nav-link-button staff-link ${isActive('/staff')}`}
              onClick={() => goToPage('/staff')}
            >
              {t('staff')}
            </button>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <button
              type="button"
              className={`nav-link-button admin-link ${isActive('/dashboard')}`}
              onClick={() => goToPage('/dashboard')}
            >
              {t('dashboard')}
            </button>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        <span className="user-name-tag" title={username}>
          {role || t('user')} · {username}
        </span>
        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          title={t('language')}
          aria-label={t('language')}
        >
          <Languages size={16} />
          <span>{language === 'en' ? '中文' : 'EN'}</span>
        </button>
        <button className="cart-icon" type="button" onClick={onOpenCart} title={t('cart')}>
          <span className="icon-emoji">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button className="logout-btn" type="button" onClick={onLogout}>
          {t('signOut')}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
