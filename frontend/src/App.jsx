import React, { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './views/Dashboard';
import Home from './views/Home';
import Login from './views/Login';
import MealDetail from './views/MealDetail';
import Orders from './views/Orders';
import Profile from './views/Profile';
import Register from './views/Register';
import Staff from './views/Staff';
import {
  clearSession,
  getCart,
  getSession,
  saveCart,
} from './utils/storage';

function App() {
  const [auth, setAuth] = useState(getSession());
  const [cart, setCart] = useState(getCart());

  const isAuthenticated = Boolean(auth.token);
  const role = auth.role;

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleLogin = () => {
    setAuth(getSession());
  };

  const handleLogout = () => {
    clearSession();
    saveCart([]);
    setCart([]);
    setAuth({ token: null, role: null, userId: null, username: null });
  };

  const updateCart = (updater) => {
    setCart((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveCart(next);
      return next;
    });
  };

  const addToCart = (meal, quantity = 1) => {
    updateCart((current) => {
      const existing = current.find((item) => item.mealId === meal.mealId);
      if (existing) {
        return current.map((item) =>
          item.mealId === meal.mealId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { ...meal, quantity }];
    });
  };

  const updateCartQuantity = (mealId, delta) => {
    updateCart((current) =>
      current
        .map((item) =>
          item.mealId === mealId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => updateCart([]);

  const sharedProps = {
    auth,
    cart,
    cartCount,
    onAuthRefresh: handleLogin,
    onLogout: handleLogout,
    onAddToCart: addToCart,
    onUpdateCartQuantity: updateCartQuantity,
    onClearCart: clearCart,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Login onLoginSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Register onRegisterSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/home"
          element={
            isAuthenticated ? <Home {...sharedProps} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/meals/:mealId"
          element={
            isAuthenticated ? (
              <MealDetail {...sharedProps} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/orders"
          element={
            isAuthenticated ? <Orders {...sharedProps} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <Profile {...sharedProps} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/staff"
          element={
            isAuthenticated && (role === 'staff' || role === 'admin') ? (
              <Staff {...sharedProps} />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && role === 'admin' ? (
              <Dashboard {...sharedProps} />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
