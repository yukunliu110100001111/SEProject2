import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n';
import './Navbar.css';

const Navbar = ({ cartCount = 0, onOpenCart, onLogout, auth }) => {
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const role = auth?.role;
  const username = auth?.username || t('guest');

  const isActive = (path) => (location.pathname === path ? 'active-link' : '');

  return (
    <nav className="top-navbar">
      <button className="nav-logo" type="button" onClick={() => navigate('/home')}>
        Green<span>Bite</span>
      </button>

      <ul className="nav-links">
        <li>
          <Link to="/home" className={isActive('/home')}>
            {t('discover')}
          </Link>
        </li>
        <li>
          <Link to="/orders" className={isActive('/orders')}>
            {t('orders')}
          </Link>
        </li>
        <li>
          <Link to="/customize" className={isActive('/customize')}>
            {t('customize')}
          </Link>
        </li>
        <li>
          <Link to="/profile" className={isActive('/profile')}>
            {t('profile')}
          </Link>
        </li>
        {(role === 'staff' || role === 'admin') && (
          <li>
            <Link to="/staff" className={`staff-link ${isActive('/staff')}`}>
              {t('staff')}
            </Link>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <Link to="/dashboard" className={`admin-link ${isActive('/dashboard')}`}>
              {t('dashboard')}
            </Link>
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
