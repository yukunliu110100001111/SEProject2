import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/app';
import { InteractiveMonsters } from '../components/monsters/InteractiveMonsters';
import PasswordField from '../components/PasswordField';
import { saveSession } from '../utils/storage';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: 'customer1',
    password: '123456',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const blurTimeoutRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFormFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsFormFocused(false);
    }, 100);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(form);
      saveSession(data);
      onLoginSuccess?.();
      navigate(data.role === 'admin' ? '/dashboard' : data.role === 'staff' ? '/staff' : '/home');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-blob"></div>
      <div className="login-shell">
        <div className="monster-panel">
          <div className="monster-stage">
            <InteractiveMonsters
              isFormFocused={isFormFocused}
              isPasswordVisible={showPassword}
            />
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-bubbles" aria-hidden="true">
            <span className="login-card-bubble bubble-a">AI</span>
            <span className="login-card-bubble bubble-b">Fresh</span>
            <span className="login-card-bubble bubble-c">Low Carbon</span>
          </div>
          <div className="login-card-glow login-card-glow-top" aria-hidden="true"></div>
          <div className="login-card-glow login-card-glow-bottom" aria-hidden="true"></div>

          <div className="login-card-head">
            <div className="brand-logo">🍃</div>
            <div className="login-heading-group">
              <span className="login-eyebrow">Member Access</span>
              <h2>GreenBite</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <span className="input-label">用户名</span>
              <input
                type="text"
                placeholder="用户名"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>
            <div className="input-group">
              <span className="input-label">密码</span>
              <PasswordField
                placeholder="密码"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                visible={showPassword}
                inputRef={passwordInputRef}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onToggle={() => {
                  setShowPassword((current) => !current);
                  const input = passwordInputRef.current;
                  if (input) {
                    input.focus();
                    setTimeout(() => {
                      input.setSelectionRange(input.value.length, input.value.length);
                    }, 0);
                  }
                }}
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/register" className="register-link">
              还没有账号？点我注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
