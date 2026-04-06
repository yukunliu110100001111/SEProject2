import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './views/Home';
import Orders from './views/Orders';
import Profile from './views/Profile';
import Dashboard from './views/Dashboard';
import Login from './views/Login';

function App() {
  // 1. 从存储初始化 Auth 状态 [对接 API 2.1 登录成功后的结果]
  const [auth, setAuth] = useState({
    token: localStorage.getItem('greenbite_token'),
    role: localStorage.getItem('greenbite_role')
  });

  // 2. 登录成功回调：从 Login.jsx 触发
  const updateAuth = () => {
    setAuth({
      token: localStorage.getItem('greenbite_token'),
      role: localStorage.getItem('greenbite_role')
    });
  };

  // 3. 退出登录：由 Navbar 经各页面透传触发
  const clearAuth = () => {
    // 彻底清除 API 相关的所有标识符
    localStorage.removeItem('greenbite_token');
    localStorage.removeItem('greenbite_role');
    localStorage.removeItem('greenbite_userId');
    localStorage.removeItem('greenbite_username');

    // 清除状态，触发全站重定向至 /login
    setAuth({ token: null, role: null });
  };

  const isAuthenticated = !!auth.token;
  const isAdmin = auth.role === 'admin';

  return (
    <BrowserRouter>
      <Routes>
        {/* 【登录路由】 */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login onLoginSuccess={updateAuth} /> : <Navigate to="/home" replace />}
        />

        {/* 【普通用户路由】 - 包含权限拦截 */}
        <Route
          path="/home"
          element={isAuthenticated ? <Home onLogout={clearAuth} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/orders"
          element={isAuthenticated ? <Orders onLogout={clearAuth} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/profile"
          element={isAuthenticated ? <Profile onLogout={clearAuth} /> : <Navigate to="/login" replace />}
        />

        {/* 【管理员专属路由】 - 严格执行角色校验 */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated && isAdmin
              ? <Dashboard onLogout={clearAuth} />
              : <Navigate to="/home" replace />
          }
        />

        {/* 【全局分流与 404 处理】 */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;