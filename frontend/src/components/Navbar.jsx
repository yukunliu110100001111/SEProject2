import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ cartCount = 0, onOpenCart, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 【新增】用于判断当前活跃路由

  // 严格从存储中读取 API 返回的真实信息 [cite: 33-34]
  const role = localStorage.getItem('greenbite_role');
  const username = localStorage.getItem('greenbite_username') || '访客';

  const handleLogout = () => {
    // 调用由 App.jsx 传下来的全局清空逻辑
    if (onLogout) {
      onLogout();
    }
    // 强制重定向至登录页
    navigate('/login', { replace: true });
  };

  // 辅助函数：判断链接是否处于激活状态
  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <nav className="top-navbar">
      {/* Logo 点击返回首页 [对应 API 4.1] */}
      <div className="nav-logo" onClick={() => navigate('/home')}>
        Green<span>Bite</span>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/home" className={isActive('/home')}>发现美食</Link>
        </li>
        <li>
          <Link to="/orders" className={isActive('/orders')}>我的订单</Link>
        </li>
        <li>
          {/* 个人中心通往 3.2 偏好设置 [cite: 43-44] */}
          <Link to="/profile" className={isActive('/profile')}>个人中心</Link>
        </li>

        {/* 严格权限控制：只有 API 返回 role 为 admin 时显示后台入口 [cite: 34, 136] */}
        {role === 'admin' && (
          <li>
            <Link to="/dashboard" className={`admin-link ${isActive('/dashboard')}`}>
              📊 商家后台
            </Link>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        {/* 显示当前登录的用户名  */}
        <span className="user-name-tag" title={username}>Hi, {username}</span>

        {/* 购物车触发器 */}
        <div className="cart-icon" onClick={onOpenCart} title="我的餐盒">
          <span className="icon-emoji">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>

        {/* 退出按钮：执行清除所有 Auth 字段的逻辑 [cite: 19] */}
        <button onClick={handleLogout} className="logout-btn">退出</button>
      </div>
    </nav>
  );
};

export default Navbar;