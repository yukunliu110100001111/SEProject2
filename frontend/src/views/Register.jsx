import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/app';
import { InteractiveMonsters } from '../components/monsters/InteractiveMonsters';
import PasswordField from '../components/PasswordField';
import { saveSession } from '../utils/storage';
import './Login.css';

const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const blurTimeoutRef = useRef(null);
  const passwordInputRef = useRef(null);

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
      await register(form);
      const session = await login(form);
      saveSession(session);
      onRegisterSuccess?.();
      navigate('/home');
    } catch (err) {
      setError(err.message || '注册失败');
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
            <span className="login-card-bubble bubble-b">Profile</span>
            <span className="login-card-bubble bubble-c">Smart Picks</span>
          </div>
          <div className="brand-logo">🪴</div>
          <h2>注册账号</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="用户名"
                value={form.username}
                onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>
            <div className="input-group">
              <PasswordField
                placeholder="密码"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
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
              {loading ? '注册中...' : '完成注册'}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/login" className="register-link">
              登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
