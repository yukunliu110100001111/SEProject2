import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ cartCount = 0, onOpenCart, onLogout, auth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = auth?.role;
  const username = auth?.username || '访客';

  const isActive = (path) => (location.pathname === path ? 'active-link' : '');

  return (
    <nav className="top-navbar">
      <button className="nav-logo" type="button" onClick={() => navigate('/home')}>
        Green<span>Bite</span>
      </button>

      <ul className="nav-links">
        <li>
          <Link to="/home" className={isActive('/home')}>
            推荐餐食
          </Link>
        </li>
        <li>
          <Link to="/assistant" className={isActive('/assistant')}>
            AI 助手
          </Link>
        </li>
        <li>
          <Link to="/orders" className={isActive('/orders')}>
            我的订单
          </Link>
        </li>
        <li>
          <Link to="/profile" className={isActive('/profile')}>
            偏好档案
          </Link>
        </li>
        {(role === 'staff' || role === 'admin') && (
          <li>
            <Link to="/staff" className={`staff-link ${isActive('/staff')}`}>
              员工管理
            </Link>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <Link to="/dashboard" className={`admin-link ${isActive('/dashboard')}`}>
              管理仪表盘
            </Link>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        <span className="user-name-tag" title={username}>
          {role || 'user'} · {username}
        </span>
        <button className="cart-icon" type="button" onClick={onOpenCart} title="购物车">
          <span className="icon-emoji">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button className="logout-btn" type="button" onClick={onLogout}>
          退出
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
